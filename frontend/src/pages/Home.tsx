
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth'
import { socialApi, playlistsApi } from '../lib/api'; // TODO: songsAPI

interface FeedItem {
  id: string;
  type: 'review' | 'playlist_add' | 'follow';
  user: { id: string; username: string; displayName?: string; profilePictureUrl?: string };
  song?: { id: string; name: string; artistName: string; imageUrl?: string };
  playlist?: { id: string; name: string };
  review?: { rating: number; content: string };
  targetUser?: { id: string; username: string };
  createdAt: string;
}

interface Playlist {
  id: string;
  name: string;
  songCount: number;
  imageUrl?: string;
}

// Star rating display
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

// Time ago formatter
const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];
  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count}${label} ago`;
  }
  return 'just now';
};

// Feed item component
const FeedCard = ({ item }: { item: FeedItem }) => {
  const avatar = item.user.profilePictureUrl || null;
  const initial = item.user.displayName?.[0] || item.user.username[0];

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link to={`/profile/${item.user.id}`} className="shrink-0">
          {avatar ? (
            <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
              {initial.toUpperCase()}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm mb-1">
            <Link to={`/profile/${item.user.id}`} className="font-medium text-white hover:underline">
              {item.user.displayName || item.user.username}
            </Link>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">{timeAgo(item.createdAt)}</span>
          </div>

          {/* Content based on type */}
          {item.type === 'review' && item.song && item.review && (
            <>
              <p className="text-gray-400 text-sm mb-2">reviewed a song</p>
              <Link
                to={`/song/${item.song.id}`}
                className="flex gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {item.song.imageUrl ? (
                  <img src={item.song.imageUrl} alt="" className="w-14 h-14 rounded object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{item.song.name}</p>
                  <p className="text-sm text-gray-400 truncate">{item.song.artistName}</p>
                  <Stars rating={item.review.rating} />
                </div>
              </Link>
              {item.review.content && (
                <p className="mt-2 text-gray-300 text-sm line-clamp-3">{item.review.content}</p>
              )}
            </>
          )}

          {item.type === 'playlist_add' && item.song && item.playlist && (
            <>
              <p className="text-gray-400 text-sm mb-2">
                added a song to{' '}
                <Link to={`/playlist/${item.playlist.id}`} className="text-indigo-400 hover:underline">
                  {item.playlist.name}
                </Link>
              </p>
              <Link
                to={`/song/${item.song.id}`}
                className="flex gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {item.song.imageUrl ? (
                  <img src={item.song.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-700" />
                )}
                <div>
                  <p className="font-medium text-white">{item.song.name}</p>
                  <p className="text-sm text-gray-400">{item.song.artistName}</p>
                </div>
              </Link>
            </>
          )}

          {item.type === 'follow' && item.targetUser && (
            <p className="text-gray-300">
              started following{' '}
              <Link to={`/profile/${item.targetUser.id}`} className="text-indigo-400 hover:underline">
                {item.targetUser.username}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedRes, playlistsRes] = await Promise.all([
          socialApi.getFeed(20, 0),
          playlistsApi.getAll(),
        ]);
        setFeed(feedRes.data.feed || []);
        setPlaylists(playlistsRes.data.playlists || []);
      } catch {
        setError('Failed to load feed');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.displayName || user?.username}
        </h1>
        <p className="text-gray-400">Here's what's happening in your music world</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Activity Feed</h2>
            <Link to="/search" className="text-indigo-400 hover:text-indigo-300 text-sm">
              Discover music →
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {feed.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Your feed is empty</h3>
              <p className="text-gray-400 mb-4">Follow other users to see their activity here</p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find people to follow
              </Link>
            </div>
          ) : (
            feed.map((item) => <FeedCard key={item.id} item={item} />)
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/search"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
              >
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search songs
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
              >
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                My reviews
              </Link>
            </div>
          </div>

          {/* Your playlists */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Your Playlists</h3>
              <button className="text-indigo-400 hover:text-indigo-300 text-sm">+ New</button>
            </div>
            {playlists.length === 0 ? (
              <p className="text-gray-500 text-sm">No playlists yet</p>
            ) : (
              <div className="space-y-2">
                {playlists.slice(0, 5).map((playlist) => (
                  <Link
                    key={playlist.id}
                    to={`/playlist/${playlist.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{playlist.name}</p>
                      <p className="text-xs text-gray-500">{playlist.songCount} songs</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}