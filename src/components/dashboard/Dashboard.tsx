import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../lib/supabase';

interface DashboardStats {
  totalScore: number;
  level: number;
  currentPoints: number;
  pointsToNextLevel: number;
  gamesPlayed: number;
  badges: any[];
  rank: number;
  todayProgress: {
    listening: boolean;
    speaking: boolean;
    reading: boolean;
    writing: boolean;
  };
  streak: number;
}

interface RecentSession {
  id: string;
  game_type: string;
  score: number;
  accuracy: number;
  created_at: string;
}

export const Dashboard: React.FC = () => {
  const supabase = useSupabase();
  const [stats, setStats] = useState<DashboardStats>({
    totalScore: 0,
    level: 1,
    currentPoints: 0,
    pointsToNextLevel: 100,
    gamesPlayed: 0,
    badges: [],
    rank: 0,
    todayProgress: {
      listening: false,
      speaking: false,
      reading: false,
      writing: false
    },
    streak: 0
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load progress
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Load recent sessions
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Load badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badges(*)')
      .eq('user_id', user.id);

    // Load rank
    const { data: leaderboard } = await supabase
      .from('leaderboard')
      .select('rank')
      .eq('user_id', user.id)
      .single();

    // Check today's progress
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions?.filter(s => 
      s.created_at.startsWith(today)
    ) || [];

    const todayProgress = {
      listening: todaySessions.some(s => s.game_type === 'listening'),
      speaking: todaySessions.some(s => s.game_type === 'speaking'),
      reading: todaySessions.some(s => s.game_type === 'reading'),
      writing: todaySessions.some(s => s.game_type === 'writing')
    };

    if (progress) {
      setStats({
        totalScore: progress.total_points,
        level: progress.level,
        currentPoints: progress.total_points % 100,
        pointsToNextLevel: 100 - (progress.total_points % 100),
        gamesPlayed: sessions?.length || 0,
        badges: userBadges?.map(ub => ub.badges) || [],
        rank: leaderboard?.rank || 0,
        todayProgress,
        streak: progress.streak_days
      });
      setRecentSessions(sessions || []);
    }

    setLoading(false);
  };

  const gameIcons: Record<string, string> = {
    listening: '🎧',
    speaking: '🎤',
    reading: '📖',
    writing: '✍️'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Halo! Selamat datang kembali 🎉</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="text-sm opacity-80 mb-2">Level</div>
          <div className="text-4xl font-bold mb-2">{stats.level}</div>
          <div className="text-xs opacity-80">{stats.pointsToNextLevel} points to next level</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="text-sm opacity-80 mb-2">Total Points</div>
          <div className="text-4xl font-bold mb-2">{stats.totalScore}</div>
          <div className="text-xs opacity-80">{stats.gamesPlayed} games played</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <div className="text-sm opacity-80 mb-2">Streak</div>
          <div className="text-4xl font-bold mb-2">🔥 {stats.streak}</div>
          <div className="text-xs opacity-80">days in a row</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="text-sm opacity-80 mb-2">Global Rank</div>
          <div className="text-4xl font-bold mb-2">#{stats.rank || '—'}</div>
          <div className="text-xs opacity-80">on leaderboard</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">Level {stats.level} Progress</span>
          <span className="text-sm text-gray-600">{stats.currentPoints} / 100 XP</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${stats.currentPoints}%` }}
          />
        </div>
      </div>

      {/* Today's Progress */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Today's Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.todayProgress).map(([skill, completed]) => (
            <div 
              key={skill}
              className={`p-6 rounded-lg border-2 transition-all ${
                completed 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="text-4xl mb-2">{gameIcons[skill]}</div>
              <div className="font-bold capitalize mb-1">{skill}</div>
              <div className="text-sm text-gray-600">
                {completed ? '✅ Completed' : '⏳ Not Started'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {stats.badges.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Badges 🏅</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.badges.slice(0, 8).map((badge: any) => (
              <div 
                key={badge.id}
                className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-4 text-center shadow-md"
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <div className="font-bold text-sm">{badge.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Games</h2>
        {recentSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-6xl mb-4">🎮</div>
            <p>Belum ada game yang dimainkan.</p>
            <p className="text-sm">Mulai mainkan game pertamamu!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div 
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{gameIcons[session.game_type]}</div>
                  <div>
                    <div className="font-bold capitalize">{session.game_type} Game</div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">+{session.score}</div>
                  <div className="text-sm text-gray-600">{session.accuracy}% accuracy</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;