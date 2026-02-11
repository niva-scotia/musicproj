
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { socialApi, playlistsApi } from '../lib/api';
import { Star, Music, Search, Users, Loader2 } from 'lucide-react';

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

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
      />
    ))}
  </div>
);

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

const FeedCard = ({ item }: { item: FeedItem }) => {
  const avatar = item.user.profilePictureUrl || null;
  const initial = item.user.displayName?.[0] || item.user.username[0];

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex gap-3">
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
          <div className="flex items-center gap-2 text-sm mb-1">
            <Link to={`/profile/${item.user.id}`} className="font-medium text-white hover:underline">
              {item.user.displayName || item.user.username}
            </Link>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">{timeAgo(item.createdAt)}</span>
          </div>

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
                    <Music className="w-6 h-6 text-gray-500" />
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.displayName || user?.username}
        </h1>
        <p className="text-gray-400">Here's what's happening in your music world</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
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
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Your feed is empty</h3>
              <p className="text-gray-400 mb-4">Follow other users to see their activity here</p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
                Find people to follow
              </Link>
            </div>
          ) : (
            feed.map((item) => <FeedCard key={item.id} item={item} />)
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/search"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
              >
                <Search className="w-5 h-5 text-indigo-400" />
                Search songs
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
              >
                <Star className="w-5 h-5 text-green-400" />
                My reviews
              </Link>
            </div>
          </div>

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
                      <Music className="w-5 h-5 text-white" />
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