
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor - attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and we haven't retried yet, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// Auth API
// ============================================
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// ============================================
// Songs API
// ============================================
export const songsApi = {
  search: (query: string, limit = 20) =>
    api.get('/songs/search', { params: { q: query, limit } }),
  
  getById: (id: string) => api.get(`/songs/${id}`),
  
  getRecommendations: (songId: string) =>
    api.get(`/songs/${songId}/recommendations`),
};

// ============================================
// Reviews API
// ============================================
export const reviewsApi = {
  getBySong: (songId: string) => api.get(`/songs/${songId}/reviews`),
  
  create: (songId: string, data: { rating: number; content: string }) =>
    api.post(`/songs/${songId}/reviews`, data),
  
  update: (reviewId: string, data: { rating?: number; content?: string }) =>
    api.put(`/reviews/${reviewId}`, data),
  
  delete: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
  
  getByUser: (userId: string) => api.get(`/users/${userId}/reviews`),
};

// ============================================
// Playlists API
// ============================================
export const playlistsApi = {
  getAll: () => api.get('/playlists'),
  
  getById: (id: string) => api.get(`/playlists/${id}`),
  
  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    api.post('/playlists', data),
  
  update: (id: string, data: { name?: string; description?: string; isPublic?: boolean }) =>
    api.put(`/playlists/${id}`, data),
  
  delete: (id: string) => api.delete(`/playlists/${id}`),
  
  addSong: (playlistId: string, songId: string) =>
    api.post(`/playlists/${playlistId}/songs`, { songId }),
  
  removeSong: (playlistId: string, songId: string) =>
    api.delete(`/playlists/${playlistId}/songs/${songId}`),
};

// ============================================
// Social API
// ============================================
export const socialApi = {
  follow: (userId: string) => api.post(`/users/${userId}/follow`),
  
  unfollow: (userId: string) => api.delete(`/users/${userId}/follow`),
  
  getFollowers: (userId: string) => api.get(`/users/${userId}/followers`),
  
  getFollowing: (userId: string) => api.get(`/users/${userId}/following`),
  
  getFeed: (limit = 20, offset = 0) =>
    api.get('/feed', { params: { limit, offset } }),
};

// ============================================
// Users API
// ============================================
export const usersApi = {
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  
  updateProfile: (data: { displayName?: string; bio?: string; profilePictureUrl?: string }) =>
    api.put('/users/profile', data),
  
  search: (query: string) => api.get('/users/search', { params: { q: query } }),
  
  deleteAccount: () => api.delete('/users/account'),
};

export default api;