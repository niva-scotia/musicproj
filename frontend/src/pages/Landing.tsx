
import { Link } from 'react-router-dom';
import { 
  Music, 
  Search, 
  Star, 
  FolderOpen, 
  Zap, 
  Users, 
  PlayCircle,
  ArrowRight 
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Search,
      title: 'Search Millions of Songs',
      description: 'Powered by Spotify, find any song, artist, or album in seconds.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Star,
      title: 'Write & Read Reviews',
      description: 'Share your thoughts and discover what others think about your favorite tracks.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: FolderOpen,
      title: 'Create Playlists',
      description: 'Organize your music into custom playlists and share them with friends.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Zap,
      title: 'AI Recommendations',
      description: 'Get personalized song suggestions powered by OpenAI based on your taste.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Users,
      title: 'Follow Friends',
      description: 'Connect with others, see their reviews, and discover music through your network.',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: PlayCircle,
      title: 'Preview Tracks',
      description: 'Listen to 30-second previews before you commit to adding songs to your collection.',
      color: 'from-red-500 to-rose-500',
    },
  ];

  const steps = [
    { step: '01', title: 'Create Account', desc: 'Sign up for free in seconds with just your email.' },
    { step: '02', title: 'Discover Music', desc: 'Search for songs, read reviews, and explore recommendations.' },
    { step: '03', title: 'Share & Connect', desc: 'Write reviews, build playlists, and follow friends.' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MusicBox</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Discover, Review &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Share Music
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Your personal music companion. Search millions of songs, write reviews, 
              create playlists, and get AI-powered recommendations tailored just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg transition-all border border-gray-700"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10" />
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-800 p-4 shadow-2xl max-w-5xl mx-auto">
              <div className="bg-gray-950 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600" />
                  <div>
                    <div className="h-4 w-48 bg-gray-800 rounded mb-2" />
                    <div className="h-3 w-32 bg-gray-800 rounded" />
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-800 rounded" />
                <div className="h-3 w-3/4 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need for your music journey
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              MusicBox brings together discovery, reviews, and social features in one beautiful app.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Get started in minutes
            </h2>
            <p className="text-gray-400 text-lg">
              Three simple steps to your personalized music experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-bold text-gray-800 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to start your music journey?
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of music lovers who use MusicBox to discover, review, and share their favorite songs.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-indigo-600 rounded-xl font-semibold text-lg transition-all hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MusicBox</span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} MusicBox. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}