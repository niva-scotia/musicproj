
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './components/RouteGuards';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Main Pages
import Home from './pages/Home';
import Search from './pages/Search';
import SongDetail from './pages/SongDetail';
import Profile from './pages/Profile';
import Playlist from './pages/Playlist';
import Settings from './pages/Settings';

export const router = createBrowserRouter([
  // Auth routes (guest only)
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/register', element: <Register /> },
          { path: '/forgot-password', element: <ForgotPassword /> },
          { path: '/reset-password', element: <ResetPassword /> },
        ],
      },
    ],
  },

  // Protected routes (authenticated users only)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/search', element: <Search /> },
          { path: '/song/:id', element: <SongDetail /> },
          { path: '/profile/:userId?', element: <Profile /> },
          { path: '/playlist/:id', element: <Playlist /> },
          { path: '/settings', element: <Settings /> },
        ],
      },
    ],
  },

  // Catch-all redirect
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;