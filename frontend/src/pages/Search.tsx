
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { songsApi, usersApi } from '../lib/api';

interface Song {
  id: string;
  spotifyId: string;
  name: string;
  artistName: string;
  albumName?: string;
  imageUrl?: string;
  durationMs: number;
  previewUrl?: string;
}

interface User {
  id: string;
  username: string;
  displayName?: string;
  profilePictureUrl?: string;
}

type SearchType = 'songs' | 'users';

const formatDuration = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as SearchType) || 'songs';

  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>(initialType);
  const [songs, setSongs] = useState<Song[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async (q: string, type: SearchType) => {
    if (!q.trim()) {
      setSongs([]);
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      if (type === 'songs') {
        const res = await songsApi.search(q, 30);
        setSongs(res.data.songs || []);
      } else {
        const res = await usersApi.search(q);
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery, searchType);
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery, type: searchType });
    } else {
      setSearchParams({});
    }
  }, [debouncedQuery, searchType, performSearch, setSearchParams]);

  // Handle audio preview
  const togglePreview = (previewUrl: string, songId: string) => {
    if (playingPreview === songId) {
      audio?.pause();
      setPlayingPreview(null);
      setAudio(null);
    } else {
      audio?.pause();
      const newAudio = new Audio(previewUrl);
      newAudio.volume = 0.5;
      newAudio.play();
      newAudio.onended = () => {
        setPlayingPreview(null);
        setAudio(null);
      };
      setAudio(newAudio);
      setPlayingPreview(songId);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audio?.pause();
    };
  }, [audio]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Search</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchType === 'songs' ? 'Search for songs, artists, or albums...' : 'Search for users...'}
          className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search type tabs */}
      <div className="flex gap-2 mb-6">
        {(['songs', 'users'] as SearchType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSearchType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              searchType === type
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {type === 'songs' ? '🎵 Songs' : '👤 Users'}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}

      {/* Results */}
      {!isLoading && hasSearched && (
        <>
          {searchType === 'songs' && (
            <>
              {songs.length === 0 ? (
                <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                  <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400">No songs found for "{query}"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 mb-4">{songs.length} results</p>
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-3 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors group"
                    >
                      {/* Album art */}
                      <div className="relative shrink-0">
                        {song.imageUrl ? (
                          <img src={song.imageUrl} alt="" className="w-14 h-14 rounded object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded bg-gray-800 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                        {/* Preview button overlay */}
                        {song.previewUrl && (
                          <button
                            onClick={() => togglePreview(song.previewUrl!, song.id)}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                          >
                            {playingPreview === song.id ? (
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Song info */}
                      <Link to={`/song/${song.id}`} className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate hover:underline">{song.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{song.artistName}</p>
                        {song.albumName && (
                          <p className="text-xs text-gray-500 truncate">{song.albumName}</p>
                        )}
                      </Link>

                      {/* Duration */}
                      <span className="text-sm text-gray-500 shrink-0">
                        {formatDuration(song.durationMs)}
                      </span>

                      {/* Action buttons */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/song/${song.id}`}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                          title="View details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {searchType === 'users' && (
            <>
              {users.length === 0 ? (
                <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                  <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-400">No users found for "{query}"</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <p className="col-span-full text-sm text-gray-400 mb-2">{users.length} results</p>
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.id}`}
                      className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      {user.profilePictureUrl ? (
                        <img src={user.profilePictureUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-lg">
                          {(user.displayName?.[0] || user.username[0]).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-white">{user.displayName || user.username}</h3>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && !hasSearched && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-white mb-2">Search for music</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Find songs, artists, albums, or other users to connect with
          </p>
        </div>
      )}
    </div>
  );
}