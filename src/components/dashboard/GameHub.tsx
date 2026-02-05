import React from 'react';
import { useNavigate } from 'react-router-dom';

interface GameCard {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  route: string;
}

const games: GameCard[] = [
  {
    id: 'listening',
    title: 'Listening Game',
    icon: '🎧',
    description: 'Dengar audio dan pilih jawaban yang benar. 35 soal, target 60% benar.',
    color: 'from-blue-500 to-blue-600',
    route: '/games/listening'
  },
  {
    id: 'speaking',
    title: 'Speaking Game',
    icon: '🎤',
    description: 'Hafal 4 template, ulang 40-45 detik. Copy-paste + ubah 3 kata.',
    color: 'from-purple-500 to-purple-600',
    route: '/games/speaking'
  },
  {
    id: 'reading',
    title: 'Reading Game',
    icon: '📖',
    description: 'Scan keyword, eliminasi jawaban salah. 20 soal, target 50% benar.',
    color: 'from-green-500 to-green-600',
    route: '/games/reading'
  },
  {
    id: 'writing',
    title: 'Writing Game',
    icon: '✍️',
    description: 'Copy template 100%, ubah 5 kata. Email 7-9 menit, Diskusi 10-12 menit.',
    color: 'from-orange-500 to-orange-600',
    route: '/games/writing'
  }
];

export const GameHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎮 Game Hub</h1>
        <p className="text-gray-600">Pilih game untuk mulai berlatih</p>
      </div>

      {/* Daily Challenge Banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90 mb-1">🎯 Daily Challenge</div>
            <h2 className="text-2xl font-bold mb-2">Mainkan 4 Game Hari Ini!</h2>
            <p className="text-sm opacity-90">Bonus +50 points jika selesaikan semua game.</p>
          </div>
          <div className="text-6xl">🏆</div>
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => navigate(game.route)}
            className="text-left bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:scale-105"
          >
            {/* Card Header */}
            <div className={`bg-gradient-to-r ${game.color} p-6 text-white`}>
              <div className="text-6xl mb-3">{game.icon}</div>
              <h3 className="text-2xl font-bold">{game.title}</h3>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">{game.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-bold">Target:</span> Band 2.0–2.5
                </div>
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold">
                  Play Now →
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-3">💡 Tips Bermain:</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="mr-2">✅</span>
            <span>Mulai dari <strong>Tutorial</strong> untuk belajar teknik dasar</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✅</span>
            <span>Mainkan <strong>Practice Mode</strong> dulu sebelum Challenge</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✅</span>
            <span>Fokus pada <strong>Template</strong> dan <strong>Pattern</strong>, bukan grammar</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✅</span>
            <span>Main setiap hari untuk <strong>Streak Bonus</strong> 🔥</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GameHub;