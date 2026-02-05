import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseProvider, useSupabase } from './lib/supabase';

// Components
import { Auth } from './components/auth/Auth';
import { Navigation } from './components/layout/Navigation';
import { Dashboard } from './components/dashboard/Dashboard';
import { GameHub } from './components/dashboard/GameHub';
import { Leaderboard } from './components/dashboard/Leaderboard';
import { ListeningGame } from './components/games/ListeningGame';
import { SpeakingGame } from './components/games/SpeakingGame';
import { ReadingGame } from './components/games/ReadingGame';
import { WritingGame } from './components/games/WritingGame';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = useSupabase();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>{children}</main>
    </div>
  );
};

// App Component
function App() {
  return (
    <SupabaseProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <Layout>
                  <GameHub />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/listening"
            element={
              <ProtectedRoute>
                <Layout>
                  <ListeningGame />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/speaking"
            element={
              <ProtectedRoute>
                <Layout>
                  <SpeakingGame />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReadingGame />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/writing"
            element={
              <ProtectedRoute>
                <Layout>
                  <WritingGame />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Leaderboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </SupabaseProvider>
  );
}

export default App;