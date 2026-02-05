// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  avatar_url?: string;
  class_code?: string;
  level: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_login_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  template_type: 'speaking' | 'writing';
  template_number: number;
  template_name: string;
  color_code: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  template_text: string;
  template_text_indonesian: string;
  keywords: string[];
  audio_url?: string;
  example_questions: string[];
  created_at: string;
}

export interface WordFamily {
  id: string;
  root_word: string;
  family_members: string[];
  visual_pattern?: string;
  example_sentence?: string;
  frequency_rank: number;
  created_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_mode: 'listening' | 'speaking' | 'reading' | 'writing';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  score: number;
  max_score: number;
  accuracy_percentage?: number;
  points_earned: number;
  bonus_points: number;
  level_at_start: number;
  mistakes?: GameMistake[];
  session_data?: Record<string, any>;
  is_completed: boolean;
}

export interface GameMistake {
  question_number: number;
  expected_answer: string;
  user_answer: string;
  mistake_type: string;
}

export interface Progress {
  id: string;
  user_id: string;
  skill_type: 'listening' | 'speaking' | 'reading' | 'writing' | 'vocabulary';
  current_level: number;
  experience_points: number;
  mastery_percentage: number;
  templates_mastered: number;
  total_templates: number;
  last_practiced_at?: string;
  practice_count: number;
  updated_at: string;
}

export interface Badge {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_category: 'milestone' | 'streak' | 'mastery' | 'social' | 'special';
  unlock_condition: Record<string, any>;
  points_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  order_index: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge?: Badge;
  earned_at: string;
  is_displayed: boolean;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  class_code?: string;
  total_points: number;
  level: number;
  badges_count: number;
  games_completed: number;
  current_streak: number;
  rank: number;
  rank_change: number;
  updated_at: string;
}

export interface DailyChallenge {
  id: string;
  challenge_date: string;
  challenge_type: 'listening' | 'speaking' | 'reading' | 'writing' | 'mixed';
  challenge_description: string;
  challenge_data: Record<string, any>;
  points_reward: number;
  bonus_points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface UserDailyChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  challenge?: DailyChallenge;
  is_completed: boolean;
  completed_at?: string;
  score?: number;
  points_earned: number;
  attempts: number;
}

// ============================================================================
// GAME-SPECIFIC TYPES
// ============================================================================

export interface ListeningQuestion {
  id: string;
  audio_url: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration_seconds: number;
  expected_words: string[];
}

export interface SpeakingQuestion {
  id: string;
  question_text: string;
  template_id: string;
  template: Template;
  time_limit_seconds: number;
  keywords_to_detect: string[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  word_count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: ReadingQuestion[];
}

export interface ReadingQuestion {
  id: string;
  question_text: string;
  keywords: string[];
  correct_answer: string;
  options: string[];
  explanation?: string;
}

export interface WritingPrompt {
  id: string;
  prompt_type: 'email' | 'discussion';
  prompt_text: string;
  template_id: string;
  template: Template;
  min_words: number;
  max_words: number;
  time_limit_seconds: number;
  required_elements: string[];
}

// ============================================================================
// GAME STATE TYPES
// ============================================================================

export interface GameState {
  mode: 'listening' | 'speaking' | 'reading' | 'writing' | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  timeRemaining: number;
  mistakes: GameMistake[];
}

export interface ListeningGameState extends GameState {
  mode: 'listening';
  currentAudio?: HTMLAudioElement;
  userRecording?: Blob;
  isRecording: boolean;
  questions: ListeningQuestion[];
}

export interface SpeakingGameState extends GameState {
  mode: 'speaking';
  selectedTemplate?: Template;
  userRecording?: Blob;
  isRecording: boolean;
  questions: SpeakingQuestion[];
  recordingDuration: number;
}

export interface ReadingGameState extends GameState {
  mode: 'reading';
  passage?: ReadingPassage;
  highlightedKeywords: string[];
  foundKeywords: Set<string>;
}

export interface WritingGameState extends GameState {
  mode: 'writing';
  prompt?: WritingPrompt;
  userText: string;
  wordCount: number;
  selectedTemplate?: Template;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseGameResult {
  gameState: GameState;
  startGame: () => Promise<void>;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => Promise<void>;
  submitAnswer: (answer: any) => Promise<void>;
  nextQuestion: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface UseProgressResult {
  progress: Progress[];
  isLoading: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
  updateProgress: (skillType: Progress['skill_type'], xp: number) => Promise<void>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ColorCode = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';

export type GameMode = 'listening' | 'speaking' | 'reading' | 'writing';

export type SkillType = 'listening' | 'speaking' | 'reading' | 'writing' | 'vocabulary';

export type BadgeCategory = 'milestone' | 'streak' | 'mastery' | 'social' | 'special';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type Difficulty = 'easy' | 'medium' | 'hard';

// ============================================================================
// CONSTANTS
// ============================================================================

export const COLOR_MAP: Record<ColorCode, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-500' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500' },
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: 'text-gray-500',
  rare: 'text-blue-500',
  epic: 'text-purple-500',
  legendary: 'text-yellow-500',
};

export const POINTS_PER_LEVEL: Record<string, number> = {
  '1-5': 200,
  '6-10': 1000,
  '11-15': 1000,
  '16-20': 2000,
};

export const GAME_POINTS: Record<GameMode, number> = {
  listening: 10,
  speaking: 50,
  reading: 15,
  writing: 100,
};
