
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth'
import { songsApi, reviewsApi, playlistsApi } from '../lib/api';

interface Song {
  id: string;
  spotifyId: string;
  name: string;
  artistName: string;
  albumName?: string;
  imageUrl?: string;
  durationMs: number;
  previewUrl?: string;
  releaseDate?: string;
  genres?: string[];
}

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: { id: string; username: string; displayName?: string; profilePictureUrl?: string };
}

interface Playlist {
  id: string;
  name: string;
  songCount: number;
}

const formatDuration = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Interactive star rating
const StarRating = ({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-transform ${!readonly && 'hover:scale-110'}`}
        >
          <svg
            className={`w-6 h-6 ${(hover || rating) >= star ? 'text-yellow-400' : 'text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default function SongDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [song, setSong] = useState<Song | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Playlist modal
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);

  // Audio preview
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [songRes, reviewsRes, playlistsRes] = await Promise.all([
          songsApi.getById(id),
          reviewsApi.getBySong(id),
          playlistsApi.getAll(),
        ]);
        setSong(songRes.data.song);
        setReviews(reviewsRes.data.reviews || []);
        setPlaylists(playlistsRes.data.playlists || []);

        // Check if user has already reviewed
        const existing = (reviewsRes.data.reviews || []).find((r: Review) => r.user.id === user?.id);
        if (existing) {
          setUserReview(existing);
          setReviewRating(existing.rating);
          setReviewContent(existing.content);
        }

        // Fetch recommendations
        try {
          const recRes = await songsApi.getRecommendations(id);
          setRecommendations(recRes.data.recommendations || []);
        } catch {
          // Recommendations are optional
        }
      } catch {
        setError('Failed to load song details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, user?.id]);

  const togglePlayback = () => {
    if (!song?.previewUrl) return;
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const newAudio = new Audio(song.previewUrl);
      newAudio.volume = 0.5;
      newAudio.play();
      newAudio.onended = () => setIsPlaying(false);
      setAudio(newAudio);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => { audio?.pause(); };
  }, [audio]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || reviewRating === 0) return;

    setIsSubmittingReview(true);
    try {
      if (userReview) {
        await reviewsApi.update(userReview.id, { rating: reviewRating, content: reviewContent });
        setReviews(reviews.map(r => r.id === userReview.id ? { ...r, rating: reviewRating, content: reviewContent } : r));
      } else {
        const res = await reviewsApi.create(id, { rating: reviewRating, content: reviewContent });
        setReviews([res.data.review, ...reviews]);
        setUserReview(res.data.review);
      }
      setShowReviewForm(false);
    } catch {
      console.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    try {
      await reviewsApi.delete(userReview.id);
      setReviews(reviews.filter(r => r.id !== userReview.id));
      setUserReview(null);
      setReviewRating(0);
      setReviewContent('');
    } catch {
      console.error('Failed to delete review');
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!id) return;
    setAddingToPlaylist(playlistId);
    try {
      await playlistsApi.addSong(playlistId, id);
      setShowPlaylistModal(false);
    } catch {
      console.error('Failed to add to playlist');
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error || 'Song not found'}</p>
        <Link to="/search" className="text-indigo-400 hover:underline">Back to search</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Song header */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Album art */}
          <div className="relative shrink-0 group">
            {song.imageUrl ? (
              <img src={song.imageUrl} alt={song.name} className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-cover shadow-2xl" />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl bg-gray-700 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
            {song.previewUrl && (
              <button
                onClick={togglePlayback}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
              >
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <p className="text-sm text-indigo-400 font-medium mb-1">SONG</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{song.name}</h1>
            <p className="text-xl text-gray-300 mb-4">{song.artistName}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
              {song.albumName && <span>{song.albumName}</span>}
              {song.releaseDate && <span>{new Date(song.releaseDate).getFullYear()}</span>}
              <span>{formatDuration(song.durationMs)}</span>
            </div>

            {avgRating && (
              <div className="flex items-center gap-2 mb-6">
                <StarRating rating={Math.round(parseFloat(avgRating))} readonly />
                <span className="text-white font-medium">{avgRating}</span>
                <span className="text-gray-400">({reviews.length} reviews)</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {userReview ? 'Edit Review' : 'Write Review'}
              </button>
              <button
                onClick={() => setShowPlaylistModal(true)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add to Playlist
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Reviews */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Reviews ({reviews.length})</h2>
          
          {reviews.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
              <p className="text-gray-400 mb-4">No reviews yet. Be the first!</p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Write a review →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${review.user.id}`}>
                      {review.user.profilePictureUrl ? (
                        <img src={review.user.profilePictureUrl} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                          {(review.user.displayName?.[0] || review.user.username[0]).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/profile/${review.user.id}`} className="font-medium text-white hover:underline">
                          {review.user.displayName || review.user.username}
                        </Link>
                        <StarRating rating={review.rating} readonly />
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{formatDate(review.createdAt)}</p>
                      {review.content && <p className="text-gray-300">{review.content}</p>}
                    </div>
                    {review.user.id === user?.id && (
                      <button onClick={handleDeleteReview} className="text-gray-500 hover:text-red-400 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Similar Songs</h2>
          {recommendations.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
              <p className="text-gray-500 text-sm">No recommendations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recommendations.slice(0, 6).map((rec) => (
                <Link
                  key={rec.id}
                  to={`/song/${rec.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  {rec.imageUrl ? (
                    <img src={rec.imageUrl} alt="" className="w-10 h-10 rounded" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-800" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{rec.name}</p>
                    <p className="text-xs text-gray-400 truncate">{rec.artistName}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowReviewForm(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-white mb-4">{userReview ? 'Edit Review' : 'Write a Review'}</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Your Rating</label>
                <StarRating rating={reviewRating} onChange={setReviewRating} />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Your Review (optional)</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="What did you think of this song?"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReviewForm(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={reviewRating === 0 || isSubmittingReview} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg">
                  {isSubmittingReview ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowPlaylistModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-white mb-4">Add to Playlist</h3>
            {playlists.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No playlists yet. Create one first!</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={addingToPlaylist === playlist.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{playlist.name}</p>
                      <p className="text-xs text-gray-500">{playlist.songCount} songs</p>
                    </div>
                    {addingToPlaylist === playlist.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowPlaylistModal(false)} className="w-full mt-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}