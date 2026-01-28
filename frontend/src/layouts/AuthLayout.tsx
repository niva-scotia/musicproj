
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950 flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-indigo-600 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">MusicBox</h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover, review, and share your favorite music with friends.
          </p>
          
          {/* Feature highlights */}
          <div className="space-y-4 text-left">
            {[
              { icon: '🎵', text: 'Search millions of songs via Spotify' },
              { icon: '⭐', text: 'Write and read honest reviews' },
              { icon: '📝', text: 'Create and share playlists' },
              { icon: '🤖', text: 'Get AI-powered recommendations' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <span className="text-2xl">{feature.icon}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">MusicBox</h1>
          </div>

          {/* Auth form container */}
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}