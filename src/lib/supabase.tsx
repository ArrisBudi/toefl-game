import { createClient } from '@supabase/supabase-js';
import React, { createContext, useContext, ReactNode } from 'react';
import { GameSession, GameMistake } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

const SupabaseContext = createContext(supabase);

export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

// Helper Functions
export const createGameSession = async (
  userId: string,
  gameMode: 'listening' | 'speaking' | 'reading' | 'writing',
  maxScore: number,
  levelAtStart: number
): Promise<GameSession> => {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      user_id: userId,
      game_mode: gameMode,
      max_score: maxScore,
      level_at_start: levelAtStart,
      is_completed: false
    })
    .select()
    .single();

  if (error) throw error;
  return data as GameSession;
};

export const completeGameSession = async (
  sessionId: string,
  score: number,
  pointsEarned: number,
  mistakes: GameMistake[],
  sessionData: any = {}
): Promise<GameSession> => {
  const { data: sessionDataFromDb, error: fetchError } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (fetchError) throw fetchError;

  const accuracyPercentage = (score / sessionDataFromDb.max_score) * 100;

  const { data, error } = await supabase
    .from('game_sessions')
    .update({
      score,
      points_earned: pointsEarned,
      mistakes,
      session_data: sessionData,
      accuracy_percentage: accuracyPercentage,
      is_completed: true,
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;

  // Update User Total Points
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', sessionDataFromDb.user_id)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        total_points: (profile.total_points || 0) + pointsEarned
      })
      .eq('id', sessionDataFromDb.user_id);
  }

  return data as GameSession;
};
