import { query } from '../config/db';
import spotifyService from './spotify';

// Ensure song exists in DB, create if not
export async function ensureSongExists(spotifyId: string) {
  const existing = await query('SELECT * FROM songs WHERE spotify_id = $1', [spotifyId]);
  if (existing.rows[0]) return existing.rows[0];

  const trackData = await spotifyService.getTrack(spotifyId);
  
  // Ensure artist exists
  const artist = await ensureArtistExists(trackData.artist.spotifyId);
  
  // Ensure album exists
  let album = null;
  if (trackData.album) {
    album = await ensureAlbumExists(trackData.album.spotifyId, artist.id);
  }

  const result = await query(
    `INSERT INTO songs (spotify_id, name, artist_id, album_id, duration_ms, preview_url, popularity)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [spotifyId, trackData.name, artist.id, album?.id, trackData.durationMs, trackData.previewUrl, trackData.popularity]
  );
  
  return result.rows[0];
}

export async function ensureArtistExists(spotifyId: string) {
  const existing = await query('SELECT * FROM artists WHERE spotify_id = $1', [spotifyId]);
  if (existing.rows[0]) return existing.rows[0];

  const artistData = await spotifyService.getArtist(spotifyId);
  
  const result = await query(
    `INSERT INTO artists (spotify_id, name, image_url, genres)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [spotifyId, artistData.name, artistData.imageUrl, artistData.genres]
  );
  
  return result.rows[0];
}

export async function ensureAlbumExists(spotifyId: string, artistId: string) {
  const existing = await query('SELECT * FROM albums WHERE spotify_id = $1', [spotifyId]);
  if (existing.rows[0]) return existing.rows[0];

  const albumData = await spotifyService.getAlbum(spotifyId);
  
  const result = await query(
    `INSERT INTO albums (spotify_id, name, artist_id, release_date, image_url, total_tracks)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [spotifyId, albumData.name, artistId, albumData.releaseDate, albumData.imageUrl, albumData.totalTracks]
  );
  
  return result.rows[0];
}