import React, { useState } from 'react';
import { useSupabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthProps {
  mode: 'login' | 'signup';
}

export const Auth: React.FC<AuthProps> = ({ mode: initialMode }) => {
  const supabase = useSupabase();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Create profile
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: name,
            email: email
          });

          setMessage('Akun berhasil dibuat! Silakan login.');
          setMode('login');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold mb-2">TOEFL Game</h1>
          <p className="text-gray-600">
            {mode === 'login' ? 'Selamat datang kembali!' : 'Buat akun baru'}
          </p>
        </div>

        {/* Error/Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-lg mb-4">
            ❌ {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 border-2 border-green-500 text-green-700 p-4 rounded-lg mb-4">
            ✅ {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-bold mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Loading...' : mode === 'login' ? '🔐 Login' : '🎉 Sign Up'}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
              setMessage('');
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            {mode === 'login' 
              ? '🆕 Belum punya akun? Sign up di sini' 
              : '🔙 Sudah punya akun? Login di sini'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;