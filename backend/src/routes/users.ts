import { Router, Response } from 'express';
import { query } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// FR-11: View own profile
router.get('/me/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Basic user info
    const user = await query(
      `SELECT id, email, username, display_name, bio, profile_picture_url, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    // Stats
    const stats = await query(
      `SELECT 
        (SELECT COUNT(*) FROM song_ratings WHERE user_id = $1) as total_ratings,
        (SELECT AVG(rating)::DECIMAL(2,1) FROM song_ratings WHERE user_id = $1) as avg_rating,
        (SELECT COUNT(*) FROM song_favorites WHERE user_id = $1) as total_favorites,
        (SELECT COUNT(*) FROM song_comments WHERE user_id = $1) as total_comments`,
      [userId]
    );

    // Top rated songs
    const topSongs = await query(
      `SELECT s.id, s.name, s.spotify_id, a.name as artist_name, 
              al.image_url as album_image, sr.rating
       FROM song_ratings sr
       JOIN songs s ON sr.song_id = s.id
       LEFT JOIN artists a ON s.artist_id = a.id
       LEFT JOIN albums al ON s.album_id = al.id
       WHERE sr.user_id = $1
       ORDER BY sr.rating DESC, sr.updated_at DESC
       LIMIT 10`,
      [userId]
    );

    // Top genres (from rated songs)
    const topGenres = await query(
      `SELECT UNNEST(a.genres) as genre, COUNT(*) as count
       FROM song_ratings sr
       JOIN songs s ON sr.song_id = s.id
       JOIN artists a ON s.artist_id = a.id
       WHERE sr.user_id = $1 AND a.genres IS NOT NULL
       GROUP BY genre
       ORDER BY count DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      user: user.rows[0],
      stats: stats.rows[0],
      topSongs: topSongs.rows,
      topGenres: topGenres.rows,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// FR-12: Edit profile
router.patch('/me/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { displayName, bio, profilePictureUrl } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(displayName);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (profilePictureUrl !== undefined) {
      updates.push(`profile_picture_url = $${paramCount++}`);
      values.push(profilePictureUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, email, username, display_name, bio, profile_picture_url`,
      values
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// FR-13: Music catalog
router.get('/me/catalog', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { 
      page = 1, 
      limit = 20, 
      sort = 'recent', // recent, rating, name
      filter = 'all', // all, rated, favorited, commented
      order = 'desc' 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';

    let sortColumn = 'MAX(GREATEST(sr.updated_at, sf.created_at, sc.updated_at))';
    if (sort === 'rating') sortColumn = 'MAX(sr.rating)';
    if (sort === 'name') sortColumn = 's.name';

    let filterClause = '';
    if (filter === 'rated') filterClause = 'AND sr.id IS NOT NULL';
    if (filter === 'favorited') filterClause = 'AND sf.id IS NOT NULL';
    if (filter === 'commented') filterClause = 'AND sc.id IS NOT NULL';

    const songs = await query(
      `SELECT DISTINCT ON (s.id)
        s.id, s.spotify_id, s.name, a.name as artist_name, 
        al.name as album_name, al.image_url as album_image,
        sr.rating, sf.id IS NOT NULL as favorited, 
        sc.content as comment,
        GREATEST(sr.updated_at, sf.created_at, sc.updated_at) as last_interaction
       FROM songs s
       LEFT JOIN artists a ON s.artist_id = a.id
       LEFT JOIN albums al ON s.album_id = al.id
       LEFT JOIN song_ratings sr ON s.id = sr.song_id AND sr.user_id = $1
       LEFT JOIN song_favorites sf ON s.id = sf.song_id AND sf.user_id = $1
       LEFT JOIN song_comments sc ON s.id = sc.song_id AND sc.user_id = $1
       WHERE (sr.id IS NOT NULL OR sf.id IS NOT NULL OR sc.id IS NOT NULL)
       ${filterClause}
       ORDER BY s.id, last_interaction DESC
       LIMIT $2 OFFSET $3`,
      [userId, Number(limit), offset]
    );

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(DISTINCT s.id) as total
       FROM songs s
       LEFT JOIN song_ratings sr ON s.id = sr.song_id AND sr.user_id = $1
       LEFT JOIN song_favorites sf ON s.id = sf.song_id AND sf.user_id = $1
       LEFT JOIN song_comments sc ON s.id = sc.song_id AND sc.user_id = $1
       WHERE (sr.id IS NOT NULL OR sf.id IS NOT NULL OR sc.id IS NOT NULL)
       ${filterClause}`,
      [userId]
    );

    res.json({
      songs: songs.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Catalog error:', err);
    res.status(500).json({ error: 'Failed to get catalog' });
  }
});

// View another user's profile (for friends - FR-18)
router.get('/:userId/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user!.id;

    // Check if they're friends
    const friendship = await query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [currentUserId, targetUserId]
    );

    const isFriend = friendship.rows.length > 0;

    // Basic user info (public)
    const user = await query(
      `SELECT id, username, display_name, bio, profile_picture_url, created_at
       FROM users WHERE id = $1`,
      [targetUserId]
    );

    if (!user.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If friends, include more details
    if (isFriend) {
      const stats = await query(
        `SELECT 
          (SELECT COUNT(*) FROM song_ratings WHERE user_id = $1) as total_ratings,
          (SELECT AVG(rating)::DECIMAL(2,1) FROM song_ratings WHERE user_id = $1) as avg_rating,
          (SELECT COUNT(*) FROM song_favorites WHERE user_id = $1) as total_favorites`,
        [targetUserId]
      );

      const topSongs = await query(
        `SELECT s.id, s.name, s.spotify_id, a.name as artist_name, sr.rating
         FROM song_ratings sr
         JOIN songs s ON sr.song_id = s.id
         LEFT JOIN artists a ON s.artist_id = a.id
         WHERE sr.user_id = $1
         ORDER BY sr.rating DESC
         LIMIT 10`,
        [targetUserId]
      );

      return res.json({
        user: user.rows[0],
        isFriend: true,
        stats: stats.rows[0],
        topSongs: topSongs.rows,
      });
    }

    res.json({
      user: user.rows[0],
      isFriend: false,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;