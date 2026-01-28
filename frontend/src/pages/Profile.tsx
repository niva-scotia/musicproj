
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth'
import { usersApi, reviewsApi, playlistsApi, socialApi } from '../lib/api';

interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string;
  createdAt: string;
  stats: { reviews: number; playlists: number; followers: number; following: number };
  isFollowing?: boolean;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  song: { id: string; name: string; artistName: string; imageUrl?: string };
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  songCount: number;
  createdAt: string;
}

type Tab = 'reviews' | 'playlists' | 'followers' | 'following';

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const profileId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('reviews');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileId) return;
    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [profileRes, reviewsRes, playlistsRes] = await Promise.all([
          usersApi.getProfile(profileId),
          reviewsApi.getByUser(profileId),
          playlistsApi.getAll(), // TODO: Add getByUser endpoint
        ]);
        setProfile(profileRes.data.user);
        setReviews(reviewsRes.data.reviews || []);
        setPlaylists(
          (playlistsRes.data.playlists || []).filter(
            (p: Playlist) => isOwnProfile || p.isPublic
          )
        );
      } catch {
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [profileId, isOwnProfile]);

  const fetchConnections = async (type: 'followers' | 'following') => {
    if (!profileId) return;
    try {
      const res = type === 'followers'
        ? await socialApi.getFollowers(profileId)
        : await socialApi.getFollowing(profileId);
        if (type === 'followers') {
        setFollowers(res.data.followers);
        } else {
        setFollowing(res.data.following);
        }
    } catch {
      console.error(`Failed to load ${type}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'followers') fetchConnections('followers');
    if (activeTab === 'following') fetchConnections('following');
  }, [activeTab, profileId]);

  const handleFollow = async () => {
    if (!profile) return;
    setIsFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await socialApi.unfollow(profile.id);
        setProfile({ ...profile, isFollowing: false, stats: { ...profile.stats, followers: profile.stats.followers - 1 } });
      } else {
        await socialApi.follow(profile.id);
        setProfile({ ...profile, isFollowing: true, stats: { ...profile.stats, followers: profile.stats.followers + 1 } });
      }
    } catch {
      console.error('Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error || 'User not found'}</p>
        <Link to="/" className="text-indigo-400 hover:underline">Go back home</Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'reviews', label: 'Reviews', count: profile.stats.reviews },
    { key: 'playlists', label: 'Playlists', count: profile.stats.playlists },
    { key: 'followers', label: 'Followers', count: profile.stats.followers },
    { key: 'following', label: 'Following', count: profile.stats.following },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile header */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.username}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-800"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-800">
                {(profile.displayName?.[0] || profile.username[0]).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile.displayName || profile.username}
                </h1>
                <p className="text-gray-400">@{profile.username}</p>
                {profile.bio && <p className="text-gray-300 mt-2 max-w-md">{profile.bio}</p>}
                <p className="text-sm text-gray-500 mt-2">
                  Joined {formatDate(profile.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Link
                    to="/settings"
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profile
                  </Link>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      profile.isFollowing
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isFollowLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : profile.isFollowing ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Following
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <p className="text-xl font-bold text-white">{tab.count}</p>
                  <p className="text-sm text-gray-400">{tab.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === tab.key ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
              <p className="text-gray-400">No reviews yet</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <Link to={`/song/${review.song.id}`} className="flex gap-4">
                  {review.song.imageUrl ? (
                    <img src={review.song.imageUrl} alt="" className="w-16 h-16 rounded object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-white hover:underline">{review.song.name}</h3>
                    <p className="text-sm text-gray-400">{review.song.artistName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Stars rating={review.rating} />
                      <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </Link>
                {review.content && <p className="text-gray-300 mt-3 text-sm">{review.content}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'playlists' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {playlists.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
              <p className="text-gray-400">No playlists yet</p>
            </div>
          ) : (
            playlists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{playlist.name}</h3>
                    <p className="text-sm text-gray-400">{playlist.songCount} songs</p>
                    {!playlist.isPublic && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {(activeTab === 'followers' || activeTab === 'following') && (
        <div className="space-y-3">
          {(activeTab === 'followers' ? followers : following).length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
              <p className="text-gray-400">
                {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            (activeTab === 'followers' ? followers : following).map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.id}`}
                className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
              >
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                    {(user.displayName?.[0] || user.username[0]).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{user.displayName || user.username}</p>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}