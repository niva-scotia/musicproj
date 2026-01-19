import { Router, Response } from 'express';
import { query } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import spotifyService from '../services/spotify';
import { ensureSongExists } from '../services/song';

const router = Router();

// FR-5: Search songs
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    const songs = await spotifyService.searchSongs(
      q as string,
      Number(limit),
      Number(offset)
    );
    
    res.json({ songs, query: q, limit, offset });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// FR-10: Get song details
router.get< {spotifyId : string}>('/:spotifyId', authenticate, async (req: AuthRequest & { params: { spotifyId: string } }, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const userId = req.user!.id;

    // Ensure song exists in our DB
    const song = await ensureSongExists(spotifyId);

    // Get song with artist and album info
    const songDetails = await query(
      `SELECT s.*, a.name as artist_name, a.image_url as artist_image,
              al.name as album_name, al.image_url as album_image
       FROM songs s
       LEFT JOIN artists a ON s.artist_id = a.id
       LEFT JOIN albums al ON s.album_id = al.id
       WHERE s.id = $1`,
      [song.id]
    );

    // Get average rating and count
    const stats = await query(
      `SELECT AVG(rating)::DECIMAL(2,1) as avg_rating, COUNT(*) as total_ratings
       FROM song_ratings WHERE song_id = $1`,
      [song.id]
    );

    // Get user's interaction
    const userRating = await query(
      'SELECT rating FROM song_ratings WHERE user_id = $1 AND song_id = $2',
      [userId, song.id]
    );
    const userFavorite = await query(
      'SELECT id FROM song_favorites WHERE user_id = $1 AND song_id = $2',
      [userId, song.id]
    );
    const userComment = await query(
      'SELECT content, updated_at FROM song_comments WHERE user_id = $1 AND song_id = $2',
      [userId, song.id]
    );

    res.json({
      song: songDetails.rows[0],
      stats: {
        avgRating: stats.rows[0].avg_rating || null,
        totalRatings: parseInt(stats.rows[0].total_ratings),
      },
      userInteraction: {
        rating: userRating.rows[0]?.rating || null,
        favorited: !!userFavorite.rows[0],
        comment: userComment.rows[0] || null,
      },
    });
  } catch (err) {
    console.error('Get song error:', err);
    res.status(500).json({ error: 'Failed to get song' });
  }
});

// FR-7: Rate a song
router.post<{spotifyId:string}>('/:spotifyId/rate', authenticate, async (req: AuthRequest & { params : {spotifyId: string}}, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const { rating } = req.body;
    const userId = req.user!.id;

    if (!rating || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
      return res.status(400).json({ error: 'Rating must be 0.5-5.0 in half increments' });
    }

    const song = await ensureSongExists(spotifyId);

    const result = await query(
      `INSERT INTO song_ratings (user_id, song_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, song_id)
       DO UPDATE SET rating = $3, updated_at = NOW()
       RETURNING *`,
      [userId, song.id, rating]
    );

    res.json({ rating: result.rows[0] });
  } catch (err) {
    console.error('Rate error:', err);
    res.status(500).json({ error: 'Failed to rate song' });
  }
});

// FR-7: Remove rating
router.delete('/:spotifyId/rate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const userId = req.user!.id;

    const song = await query('SELECT id FROM songs WHERE spotify_id = $1', [spotifyId]);
    if (!song.rows[0]) return res.status(404).json({ error: 'Song not found' });

    await query(
      'DELETE FROM song_ratings WHERE user_id = $1 AND song_id = $2',
      [userId, song.rows[0].id]
    );

    res.json({ message: 'Rating removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove rating' });
  }
});

// FR-8: Toggle favorite
router.post<{spotifyId:string}>('/:spotifyId/favorite', authenticate, async (req: AuthRequest & {params: {spotifyId: string}}, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const userId = req.user!.id;

    const song = await ensureSongExists(spotifyId);

    const existing = await query(
      'SELECT id FROM song_favorites WHERE user_id = $1 AND song_id = $2',
      [userId, song.id]
    );

    if (existing.rows[0]) {
      await query('DELETE FROM song_favorites WHERE id = $1', [existing.rows[0].id]);
      res.json({ favorited: false });
    } else {
      await query(
        'INSERT INTO song_favorites (user_id, song_id) VALUES ($1, $2)',
        [userId, song.id]
      );
      res.json({ favorited: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// FR-9: Add/update comment
router.post<{spotifyId:string}>('/:spotifyId/comment', authenticate, async (req: AuthRequest & {params:{spotifyId:string}}, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Comment content required' });
    }

    const song = await ensureSongExists(spotifyId);

    const result = await query(
      `INSERT INTO song_comments (user_id, song_id, content)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, song_id)
       DO UPDATE SET content = $3, updated_at = NOW()
       RETURNING *`,
      [userId, song.id, content.trim()]
    );

    res.json({ comment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

// FR-9: Delete comment
router.delete('/:spotifyId/comment', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const userId = req.user!.id;

    const song = await query('SELECT id FROM songs WHERE spotify_id = $1', [spotifyId]);
    if (!song.rows[0]) return res.status(404).json({ error: 'Song not found' });

    await query(
      'DELETE FROM song_comments WHERE user_id = $1 AND song_id = $2',
      [userId, song.rows[0].id]
    );

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;