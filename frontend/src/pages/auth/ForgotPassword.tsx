
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../lib/api';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-gray-400 mb-6">
          If an account exists for <span className="text-white">{email}</span>, we've sent password reset instructions.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Didn't receive the email? Check your spam folder or try again.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setIsSubmitted(false)}
            className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Try another email
          </button>
          <Link
            to="/login"
            className="block w-full py-3 px-4 text-indigo-400 hover:text-indigo-300 font-medium text-center"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-2">Forgot password?</h2>
      <p className="text-gray-400 mb-6">
        No worries, we'll send you reset instructions.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>

      <p className="mt-6 text-center">
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </p>
    </>
  );
}