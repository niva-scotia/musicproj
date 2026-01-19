import { Router, Response } from 'express';
import { query } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import spotifyService from '../services/spotify';
import { ensureArtistExists, ensureAlbumExists } from '../services/song';

const router = Router();

// FR-19: Search albums
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    const albums = await spotifyService.searchAlbums(
      q as string,
      Number(limit),
      Number(offset)
    );
    
    res.json({ albums });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get album details
router.get<{ spotifyId: string }>( '/:spotifyId', authenticate,
  async (req: AuthRequest & { params: { spotifyId: string } }, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const userId = req.user!.id;

    // Get from Spotify and ensure in DB
    const albumData = await spotifyService.getAlbum(spotifyId);
    const artist = await ensureArtistExists(albumData.artist.spotifyId);
    const album = await ensureAlbumExists(spotifyId, artist.id);

    // Get stats
    const stats = await query(
      `SELECT AVG(rating)::DECIMAL(2,1) as avg_rating, COUNT(*) as total_ratings
       FROM album_ratings WHERE album_id = $1`,
      [album.id]
    );

    // User interaction
    const userRating = await query(
      'SELECT rating FROM album_ratings WHERE user_id = $1 AND album_id = $2',
      [userId, album.id]
    );
    const userFavorite = await query(
      'SELECT id FROM album_favorites WHERE user_id = $1 AND album_id = $2',
      [userId, album.id]
    );

    res.json({
      album: { ...album, artist, tracks: albumData.tracks },
      stats: stats.rows[0],
      userInteraction: {
        rating: userRating.rows[0]?.rating || null,
        favorited: !!userFavorite.rows[0],
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get album' });
  }
});

// FR-20: Rate album
router.post('/:spotifyId/rate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const { rating } = req.body;
    const userId = req.user!.id;

    if (!rating || rating < 0.5 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }

    const album = await query('SELECT id FROM albums WHERE spotify_id = $1', [spotifyId]);
    if (!album.rows[0]) return res.status(404).json({ error: 'Album not found' });

    const result = await query(
      `INSERT INTO album_ratings (user_id, album_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, album_id)
       DO UPDATE SET rating = $3, updated_at = NOW()
       RETURNING *`,
      [userId, album.rows[0].id, rating]
    );

    res.json({ rating: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to rate album' });
  }
});

// FR-20: Favorite album
router.post('/:spotifyId/favorite', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const userId = req.user!.id;

    const album = await query('SELECT id FROM albums WHERE spotify_id = $1', [spotifyId]);
    if (!album.rows[0]) return res.status(404).json({ error: 'Album not found' });

    const existing = await query(
      'SELECT id FROM album_favorites WHERE user_id = $1 AND album_id = $2',
      [userId, album.rows[0].id]
    );

    if (existing.rows[0]) {
      await query('DELETE FROM album_favorites WHERE id = $1', [existing.rows[0].id]);
      res.json({ favorited: false });
    } else {
      await query(
        'INSERT INTO album_favorites (user_id, album_id) VALUES ($1, $2)',
        [userId, album.rows[0].id]
      );
      res.json({ favorited: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

export default router;