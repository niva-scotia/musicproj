import { Router, Response } from 'express';
import { query } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// FR-17: Get friends list
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const friends = await query(
      `SELECT u.id, u.username, u.display_name, u.profile_picture_url,
              f.created_at as friends_since
       FROM friendships f
       JOIN users u ON (
         CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END
       ) = u.id
       WHERE (f.user_id = $1 OR f.friend_id = $1)
       AND f.status = 'accepted'
       ORDER BY u.username`,
      [userId]
    );

    res.json({ friends: friends.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Get pending friend requests (received)
router.get('/requests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const requests = await query(
      `SELECT f.id as request_id, u.id, u.username, u.display_name, 
              u.profile_picture_url, f.created_at
       FROM friendships f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ requests: requests.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get requests' });
  }
});

// Get sent friend requests
router.get('/requests/sent', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const requests = await query(
      `SELECT f.id as request_id, u.id, u.username, u.display_name, 
              u.profile_picture_url, f.created_at
       FROM friendships f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ requests: requests.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get sent requests' });
  }
});

// FR-14: Send friend request
router.post('/request/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if user exists
    const targetUser = await query('SELECT id FROM users WHERE id = $1', [targetUserId]);
    if (!targetUser.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for existing friendship or request
    const existing = await query(
      `SELECT * FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) 
       OR (user_id = $2 AND friend_id = $1)`,
      [currentUserId, targetUserId]
    );

    if (existing.rows[0]) {
      const status = existing.rows[0].status;
      if (status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
      if (status === 'pending') {
        return res.status(400).json({ error: 'Friend request already pending' });
      }
    }

    const result = await query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [currentUserId, targetUserId]
    );

    res.status(201).json({ request: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// FR-15: Accept friend request
router.post('/accept/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const requesterId = req.params.userId;

    const result = await query(
      `UPDATE friendships 
       SET status = 'accepted', updated_at = NOW()
       WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
       RETURNING *`,
      [requesterId, currentUserId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({ friendship: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// FR-15: Reject friend request
router.post('/reject/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const requesterId = req.params.userId;

    const result = await query(
      `UPDATE friendships 
       SET status = 'rejected', updated_at = NOW()
       WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
       RETURNING *`,
      [requesterId, currentUserId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({ message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// FR-16: Remove friend
router.delete('/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const friendId = req.params.userId;

    const result = await query(
      `DELETE FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'
       RETURNING *`,
      [currentUserId, friendId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Search users (to find friends)
router.get('/search', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await query(
      `SELECT u.id, u.username, u.display_name, u.profile_picture_url,
              CASE 
                WHEN f.status = 'accepted' THEN 'friend'
                WHEN f.user_id = $1 AND f.status = 'pending' THEN 'request_sent'
                WHEN f.friend_id = $1 AND f.status = 'pending' THEN 'request_received'
                ELSE 'none'
              END as friendship_status
       FROM users u
       LEFT JOIN friendships f ON (
         (f.user_id = $1 AND f.friend_id = u.id) OR
         (f.friend_id = $1 AND f.user_id = u.id)
       )
       WHERE u.id != $1 
       AND (u.username ILIKE $2 OR u.display_name ILIKE $2)
       LIMIT 20`,
      [userId, `%${q}%`]
    );

    res.json({ users: users.rows });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;