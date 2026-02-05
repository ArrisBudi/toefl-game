import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../lib/supabase';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  total_points: number;
  level: number;
  games_played: number;
}

export const Leaderboard: React.FC = () => {
  const supabase = useSupabase();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    setLoading(true);

    // Load top 100
    const { data: leaderboard } = await supabase
      .from('leaderboard')
      .select(`
        rank,
        user_id,
        total_points,
        level,
        games_played,
        profiles!inner(full_name)
      `)
      .order('rank', { ascending: true })
      .limit(100);

    // Load my rank
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: myData } = await supabase
        .from('leaderboard')
        .select(`
          rank,
          user_id,
          total_points,
          level,
          games_played,
          profiles!inner(full_name)
        `)
        .eq('user_id', user.id)
        .single();

      if (myData) {
        setMyRank({
          rank: myData.rank,
          user_id: myData.user_id,
          full_name: (myData.profiles as any).full_name,
          total_points: myData.total_points,
          level: myData.level,
          games_played: myData.games_played
        });
      }
    }

    if (leaderboard) {
      setEntries(leaderboard.map((entry: any) => ({
        rank: entry.rank,
        user_id: entry.user_id,
        full_name: entry.profiles.full_name,
        total_points: entry.total_points,
        level: entry.level,
        games_played: entry.games_played
      })));
    }

    setLoading(false);
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🏆 Leaderboard</h1>
        <p className="text-gray-600">Top players worldwide</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            All Time
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${filter === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${filter === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* My Rank */}
      {myRank && myRank.rank > 10 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80 mb-1">Your Rank</div>
              <div className="text-3xl font-bold">#{myRank.rank}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{myRank.total_points} pts</div>
              <div className="text-sm opacity-80">Level {myRank.level}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {entries.slice(0, 3).map((entry, index) => (
          <div
            key={entry.user_id}
            className={`rounded-lg shadow-lg p-6 text-center transform transition-all hover:scale-105 ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                  'bg-gradient-to-br from-orange-400 to-orange-500'
              }`}
          >
            <div className="text-6xl mb-4">{getMedalEmoji(entry.rank)}</div>
            <div className="font-bold text-xl mb-2">{entry.full_name}</div>
            <div className="text-3xl font-bold mb-2">{entry.total_points}</div>
            <div className="text-sm opacity-80">Level {entry.level} • {entry.games_played} games</div>
          </div>
        ))}
      </div>

      {/* Rest of Leaderboard */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left font-bold">Rank</th>
              <th className="px-6 py-4 text-left font-bold">Player</th>
              <th className="px-6 py-4 text-right font-bold">Level</th>
              <th className="px-6 py-4 text-right font-bold">Points</th>
              <th className="px-6 py-4 text-right font-bold">Games</th>
            </tr>
          </thead>
          <tbody>
            {entries.slice(3).map((entry, index) => (
              <tr
                key={entry.user_id}
                className={`border-b ${myRank && entry.user_id === myRank.user_id
                    ? 'bg-purple-50 font-bold'
                    : 'hover:bg-gray-50'
                  }`}
              >
                <td className="px-6 py-4">#{entry.rank}</td>
                <td className="px-6 py-4">
                  {entry.full_name}
                  {myRank && entry.user_id === myRank.user_id && (
                    <span className="ml-2 text-purple-600">(You)</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">{entry.level}</td>
                <td className="px-6 py-4 text-right font-bold text-blue-600">
                  {entry.total_points}
                </td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {entry.games_played}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;