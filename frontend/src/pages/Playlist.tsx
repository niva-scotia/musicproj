
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { playlistsApi } from '../lib/api';
import { Music, Lock, Edit, Trash2, Play, Pause, X, Loader2 } from 'lucide-react';

interface Song {
  id: string;
  name: string;
  artistName: string;
  albumName?: string;
  imageUrl?: string;
  durationMs: number;
  previewUrl?: string;
  addedAt: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: { id: string; username: string; displayName?: string };
  songs: Song[];
}

const formatDuration = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const totalDuration = (songs: Song[]) => {
  const total = songs.reduce((sum, s) => sum + s.durationMs, 0);
  const hours = Math.floor(total / 3600000);
  const mins = Math.floor((total % 3600000) / 60000);
  return hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;
};

export default function Playlist() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner = playlist?.user.id === user?.id;

  useEffect(() => {
    if (!id) return;
    const fetchPlaylist = async () => {
      setIsLoading(true);
      try {
        const res = await playlistsApi.getById(id);
        setPlaylist(res.data.playlist);
        setEditName(res.data.playlist.name);
        setEditDescription(res.data.playlist.description || '');
        setEditIsPublic(res.data.playlist.isPublic);
      } catch {
        setError('Failed to load playlist');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaylist();
  }, [id]);

  useEffect(() => {
    return () => { audio?.pause(); };
  }, [audio]);

  const togglePreview = (previewUrl: string, songId: string) => {
    if (playingId === songId) {
      audio?.pause();
      setPlayingId(null);
      setAudio(null);
    } else {
      audio?.pause();
      const newAudio = new Audio(previewUrl);
      newAudio.volume = 0.5;
      newAudio.play();
      newAudio.onended = () => { setPlayingId(null); setAudio(null); };
      setAudio(newAudio);
      setPlayingId(songId);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editName.trim()) return;
    setIsSaving(true);
    try {
      await playlistsApi.update(id, { name: editName, description: editDescription, isPublic: editIsPublic });
      setPlaylist(prev => prev ? { ...prev, name: editName, description: editDescription, isPublic: editIsPublic } : null);
      setShowEditModal(false);
    } catch {
      console.error('Failed to update playlist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await playlistsApi.delete(id);
      navigate('/profile');
    } catch {
      console.error('Failed to delete playlist');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!id) return;
    setRemovingId(songId);
    try {
      await playlistsApi.removeSong(id, songId);
      setPlaylist(prev => prev ? { ...prev, songs: prev.songs.filter(s => s.id !== songId) } : null);
    } catch {
      console.error('Failed to remove song');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error || 'Playlist not found'}</p>
        <Link to="/profile" className="text-indigo-400 hover:underline">Back to profile</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-b from-indigo-900/50 to-gray-900 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="shrink-0">
            <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
              {playlist.songs.length > 0 && playlist.songs[0].imageUrl ? (
                <img src={playlist.songs[0].imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <Music className="w-20 h-20 text-white/80" />
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-indigo-400 font-medium">PLAYLIST</p>
              {!playlist.isPublic && (
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  <Lock className="w-3 h-3" />
                  Private
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{playlist.name}</h1>
            {playlist.description && <p className="text-gray-400 mb-3">{playlist.description}</p>}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link to={`/profile/${playlist.user.id}`} className="text-white hover:underline">
                {playlist.user.displayName || playlist.user.username}
              </Link>
              <span>•</span>
              <span>{playlist.songs.length} songs</span>
              <span>•</span>
              <span>{totalDuration(playlist.songs)}</span>
            </div>

            {isOwner && (
              <div className="flex gap-3">
                <button onClick={() => setShowEditModal(true)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="px-5 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {playlist.songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-4">This playlist is empty</p>
            <Link to="/search" className="text-indigo-400 hover:text-indigo-300">Search for songs to add →</Link>
          </div>
        ) : (
          <div>
            <div className="hidden sm:grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <div className="w-10">#</div>
              <div>Title</div>
              <div>Album</div>
              <div className="w-16 text-right">Duration</div>
              <div className="w-10"></div>
            </div>

            {playlist.songs.map((song, index) => (
              <div key={song.id} className="group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-3 hover:bg-gray-800/50 transition-colors items-center">
                <div className="w-10 text-center">
                  {song.previewUrl ? (
                    <button onClick={() => togglePreview(song.previewUrl!, song.id)} className="w-8 h-8 flex items-center justify-center">
                      <span className="group-hover:hidden text-gray-400">{index + 1}</span>
                      <span className="hidden group-hover:block">
                        {playingId === song.id ? <Pause className="w-4 h-4 text-indigo-400" /> : <Play className="w-4 h-4 text-white" />}
                      </span>
                    </button>
                  ) : (
                    <span className="text-gray-400">{index + 1}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  {song.imageUrl ? (
                    <img src={song.imageUrl} alt="" className="w-10 h-10 rounded shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-800 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Link to={`/song/${song.id}`} className="font-medium text-white hover:underline truncate block">{song.name}</Link>
                    <p className="text-sm text-gray-400 truncate">{song.artistName}</p>
                  </div>
                </div>

                <div className="hidden sm:block text-gray-400 text-sm truncate">{song.albumName || '—'}</div>
                <div className="w-16 text-right text-sm text-gray-400">{formatDuration(song.durationMs)}</div>

                {isOwner && (
                  <div className="w-10">
                    <button
                      onClick={() => handleRemoveSong(song.id)}
                      disabled={removingId === song.id}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all"
                      title="Remove from playlist"
                    >
                      {removingId === song.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-white mb-4">Edit Playlist</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Description (optional)</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={editIsPublic} onChange={e => setEditIsPublic(e.target.checked)} className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-gray-300">Make playlist public</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">Cancel</button>
                <button type="submit" disabled={isSaving || !editName.trim()} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-white mb-2">Delete Playlist?</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to delete "{playlist.name}"? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg flex items-center justify-center gap-2">
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}