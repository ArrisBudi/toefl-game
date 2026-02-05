export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string
                    full_name: string
                    role: string
                    avatar_url: string | null
                    class_code: string | null
                    level: number
                    total_points: number
                    current_streak: number
                    longest_streak: number
                    last_login_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username: string
                    full_name: string
                    role?: string
                    avatar_url?: string | null
                    class_code?: string | null
                    level?: number
                    total_points?: number
                    current_streak?: number
                    longest_streak?: number
                    last_login_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    full_name?: string
                    role?: string
                    avatar_url?: string | null
                    class_code?: string | null
                    level?: number
                    total_points?: number
                    current_streak?: number
                    longest_streak?: number
                    last_login_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            templates: {
                Row: {
                    id: string
                    template_type: string
                    template_number: number
                    template_name: string
                    color_code: string
                    template_text: string
                    template_text_indonesian: string
                    keywords: string[] | null
                    audio_url: string | null
                    example_questions: string[] | null
                    created_at: string
                }
            }
            word_families: {
                Row: {
                    id: string
                    root_word: string
                    family_members: string[]
                    visual_pattern: string | null
                    example_sentence: string | null
                    frequency_rank: number | null
                    created_at: string
                }
            }
            game_sessions: {
                Row: {
                    id: string
                    user_id: string
                    game_mode: string
                    started_at: string
                    completed_at: string | null
                    duration_seconds: number | null
                    score: number
                    max_score: number
                    accuracy_percentage: number | null
                    points_earned: number
                    bonus_points: number
                    level_at_start: number | null
                    mistakes: Json | null
                    session_data: Json | null
                    is_completed: boolean
                }
            }
        }
    }
}
