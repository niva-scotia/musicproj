
import SpotifyWebApi from 'spotify-web-api-node';
import { redisDb } from '../config';

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

let tokenExpiry = 0;

// Ensure we have a valid access token
async function ensureToken() {
  if (Date.now() < tokenExpiry - 60000) return; // 1 min buffer
  
  const cached = await redisDb.get('spotify:access_token');
  if (cached) {
    const { token, expiry } = JSON.parse(cached);
    if (Date.now() < expiry - 60000) {
      spotify.setAccessToken(token);
      tokenExpiry = expiry;
      return;
    }
  }

  const data = await spotify.clientCredentialsGrant();
  const token = data.body.access_token;
  const expiry = Date.now() + data.body.expires_in * 1000;
  
  spotify.setAccessToken(token);
  tokenExpiry = expiry;
  
  await redisDb.set(
    'spotify:access_token',
    JSON.stringify({ token, expiry }),
    data.body.expires_in - 60
  );
}

// Search for songs
export async function searchSongs(query: string, limit = 20, offset = 0) {
  await ensureToken();
  
  const cacheKey = `spotify:search:songs:${query}:${limit}:${offset}`;
  const cached = await redisDb.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await spotify.searchTracks(query, { limit, offset });
  const tracks = result.body.tracks?.items.map(formatTrack) || [];
  
  await redisDb.set(cacheKey, JSON.stringify(tracks), 3600); // 1 hour cache
  return tracks;
}

// Search for albums
export async function searchAlbums(query: string, limit = 20, offset = 0) {
  await ensureToken();
  
  const cacheKey = `spotify:search:albums:${query}:${limit}:${offset}`;
  const cached = await redisDb.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await spotify.searchAlbums(query, { limit, offset });
  const albums = result.body.albums?.items.map(formatAlbum) || [];
  
  await redisDb.set(cacheKey, JSON.stringify(albums), 3600);
  return albums;
}

// Get track by Spotify ID
export async function getTrack(spotifyId: string) {
  await ensureToken();
  
  const cacheKey = `spotify:track:${spotifyId}`;
  const cached = await redisDb.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await spotify.getTrack(spotifyId);
  const track = formatTrack(result.body);
  
  await redisDb.set(cacheKey, JSON.stringify(track), 86400); // 24 hour cache
  return track;
}

// Get album by Spotify ID
export async function getAlbum(spotifyId: string) {
  await ensureToken();
  
  const cacheKey = `spotify:album:${spotifyId}`;
  const cached = await redisDb.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await spotify.getAlbum(spotifyId);
  const album = formatAlbumFull(result.body);
  
  await redisDb.set(cacheKey, JSON.stringify(album), 86400);
  return album;
}

// Get artist by Spotify ID
export async function getArtist(spotifyId: string) {
  await ensureToken();
  
  const cacheKey = `spotify:artist:${spotifyId}`;
  const cached = await redisDb.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await spotify.getArtist(spotifyId);
  const artist = formatArtist(result.body);
  
  await redisDb.set(cacheKey, JSON.stringify(artist), 86400);
  return artist;
}

// TODO: Implement this properly
export async function getRecommendations() {
  await ensureToken();

  const result = "TEMP";
  return result;
}

function formatTrack(track: SpotifyApi.TrackObjectFull) {
  return {
    spotifyId: track.id,
    name: track.name,
    durationMs: track.duration_ms,
    previewUrl: track.preview_url ?? null,
    popularity: track.popularity,

    artist: {
      spotifyId: track.artists[0]?.id ?? null,
      name: track.artists[0]?.name ?? null,
    },

    album: {
      spotifyId: track.album.id,
      name: track.album.name,
      imageUrl: track.album.images[0]?.url ?? null,
      releaseDate: track.album.release_date,
    },
  };
}

function formatAlbum(album: SpotifyApi.AlbumObjectSimplified) {
  return {
    spotifyId: album.id,
    name: album.name,
    imageUrl: album.images[0]?.url,
    releaseDate: album.release_date,
    totalTracks: album.total_tracks,
    artist: {
      spotifyId: album.artists[0]?.id,
      name: album.artists[0]?.name,
    },
  };
}

function formatAlbumFull(album: SpotifyApi.AlbumObjectFull) {
  return {
    ...formatAlbum(album),
    tracks: album.tracks.items.map(t => ({
      spotifyId: t.id,
      name: t.name,
      durationMs: t.duration_ms,
      trackNumber: t.track_number,
    })),
    genres: album.genres,
  };
}

function formatArtist(artist: SpotifyApi.ArtistObjectFull) {
  return {
    spotifyId: artist.id,
    name: artist.name,
    imageUrl: artist.images[0]?.url,
    genres: artist.genres,
    popularity: artist.popularity,
  };
}

export default {
  searchSongs,
  searchAlbums,
  getTrack,
  getAlbum,
  getArtist,
  getRecommendations,
};