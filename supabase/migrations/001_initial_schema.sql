-- ============================================================================
-- TOEFL GAMIFICATION DATABASE SCHEMA
-- Supabase PostgreSQL Migration
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
    avatar_url TEXT,
    class_code TEXT,
    level INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX profiles_class_code_idx ON profiles(class_code);
CREATE INDEX profiles_level_idx ON profiles(level);

-- ============================================================================
-- 2. TEMPLATES TABLE (4 Speaking + 2 Writing)
-- ============================================================================
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_type TEXT NOT NULL CHECK (template_type IN ('speaking', 'writing')),
    template_number INTEGER NOT NULL,
    template_name TEXT NOT NULL,
    color_code TEXT NOT NULL, -- 'blue', 'green', 'yellow', 'red'
    template_text TEXT NOT NULL,
    template_text_indonesian TEXT NOT NULL,
    keywords TEXT[], -- trigger words untuk decision tree
    audio_url TEXT,
    example_questions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial templates
INSERT INTO templates (template_type, template_number, template_name, color_code, template_text, template_text_indonesian, keywords, example_questions) VALUES
-- Speaking Templates
('speaking', 1, 'Memory/Experience', 'blue', 
 'I remember when I was in high school. It was my favorite time. I studied with my friends. We learned many subjects together. It was really fun. I enjoyed that experience very much.',
 'Template untuk pertanyaan tentang masa lalu atau pengalaman',
 ARRAY['remember', 'experienced', 'did', 'was', 'past', 'ago'],
 ARRAY['Tell me about a memorable experience.', 'What did you do last summer?']
),
('speaking', 2, 'Preference/Feeling', 'green',
 'I prefer studying at the library. It is quiet there. I can focus on my work. The library has many books. I like the environment. It helps me study better.',
 'Template untuk pertanyaan tentang kesukaan atau preferensi',
 ARRAY['prefer', 'favorite', 'like', 'enjoy', 'best', 'choose'],
 ARRAY['What is your favorite place to study?', 'Do you prefer online or offline classes?']
),
('speaking', 3, 'Opinion/Agreement', 'yellow',
 'I agree with this idea. It is important for students. This helps them learn better. Many people support this. I think it is a good solution. We should do this.',
 'Template untuk pertanyaan tentang pendapat atau persetujuan',
 ARRAY['agree', 'disagree', 'think', 'opinion', 'believe', 'feel about'],
 ARRAY['Do you agree that homework is important?', 'What is your opinion about uniforms?']
),
('speaking', 4, 'Problem & Solution', 'red',
 'I think we should reduce homework. Students have too much work. This causes stress. If we reduce homework, students can rest more. This is a better solution. Schools should do this.',
 'Template untuk pertanyaan tentang masalah dan solusi',
 ARRAY['should', 'problem', 'solution', 'solve', 'fix', 'improve'],
 ARRAY['What should schools do to reduce stress?', 'How can we solve this problem?']
),
-- Writing Templates
('writing', 5, 'Email Template', 'purple',
 'Dear [NAME], I am writing about [TOPIC]. I want to ask for [REQUEST]. I have [REASON]. Can you help me? Please let me know if [SPECIFIC REQUEST]. Thank you. Best regards, [YOUR NAME].',
 'Template untuk menulis email formal',
 ARRAY['email', 'letter', 'request', 'ask'],
 ARRAY['Write an email to your professor about an extension.']
),
('writing', 6, 'Discussion Template', 'orange',
 'I [AGREE/DISAGREE] with this idea. [TOPIC] is important because [REASON]. For example, [EXAMPLE]. In my experience, [PERSONAL EXAMPLE]. This is why I [SUPPORT/DO NOT SUPPORT] this.',
 'Template untuk diskusi akademik',
 ARRAY['discussion', 'forum', 'respond', 'opinion'],
 ARRAY['Respond to the discussion about learning foreign languages.']
);

-- ============================================================================
-- 3. WORD FAMILIES TABLE (50 families)
-- ============================================================================
CREATE TABLE word_families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    root_word TEXT NOT NULL,
    family_members TEXT[] NOT NULL,
    visual_pattern TEXT, -- e.g., "ST_D_"
    example_sentence TEXT,
    frequency_rank INTEGER, -- 1-50 most common
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for search
CREATE INDEX word_families_root_idx ON word_families(root_word);

-- Insert top 20 word families (sample)
INSERT INTO word_families (root_word, family_members, visual_pattern, frequency_rank) VALUES
('study', ARRAY['study', 'studies', 'studying', 'studied', 'student', 'students'], 'ST_D_', 1),
('learn', ARRAY['learn', 'learns', 'learning', 'learned', 'learner'], 'L__RN', 2),
('work', ARRAY['work', 'works', 'working', 'worked', 'worker'], 'W_RK', 3),
('think', ARRAY['think', 'thinks', 'thinking', 'thought'], 'TH_NK', 4),
('important', ARRAY['important', 'importance', 'importantly'], '_MP_RT_NT', 5),
('agree', ARRAY['agree', 'agrees', 'agreeing', 'agreed', 'agreement'], '_GR__', 6),
('prefer', ARRAY['prefer', 'prefers', 'preferring', 'preferred', 'preference'], 'PR_F_R', 7),
('experience', ARRAY['experience', 'experiences', 'experiencing', 'experienced'], '_XP_R__NC_', 8),
('benefit', ARRAY['benefit', 'benefits', 'beneficial'], 'B_N_F_T', 9),
('problem', ARRAY['problem', 'problems', 'problematic'], 'PR_BL_M', 10);
-- (Add 40 more in production)

-- ============================================================================
-- 4. GAME SESSIONS TABLE
-- ============================================================================
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    game_mode TEXT NOT NULL CHECK (game_mode IN ('listening', 'speaking', 'reading', 'writing')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    score INTEGER DEFAULT 0,
    max_score INTEGER NOT NULL,
    accuracy_percentage DECIMAL(5,2),
    points_earned INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    level_at_start INTEGER,
    mistakes JSONB, -- detailed error tracking
    session_data JSONB, -- game-specific data
    is_completed BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX game_sessions_user_idx ON game_sessions(user_id);
CREATE INDEX game_sessions_mode_idx ON game_sessions(game_mode);
CREATE INDEX game_sessions_completed_idx ON game_sessions(completed_at);

-- ============================================================================
-- 5. PROGRESS TABLE (skill-based tracking)
-- ============================================================================
CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_type TEXT NOT NULL CHECK (skill_type IN ('listening', 'speaking', 'reading', 'writing', 'vocabulary')),
    current_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    mastery_percentage DECIMAL(5,2) DEFAULT 0,
    templates_mastered INTEGER DEFAULT 0,
    total_templates INTEGER NOT NULL,
    last_practiced_at TIMESTAMPTZ,
    practice_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_type)
);

-- Indexes
CREATE INDEX progress_user_skill_idx ON progress(user_id, skill_type);

-- ============================================================================
-- 6. BADGES TABLE (achievements)
-- ============================================================================
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_name TEXT UNIQUE NOT NULL,
    badge_description TEXT NOT NULL,
    badge_icon TEXT, -- emoji or icon name
    badge_category TEXT NOT NULL CHECK (badge_category IN ('milestone', 'streak', 'mastery', 'social', 'special')),
    unlock_condition JSONB NOT NULL, -- e.g., {"type": "streak", "value": 7}
    points_reward INTEGER DEFAULT 0,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial badges
INSERT INTO badges (badge_name, badge_description, badge_icon, badge_category, unlock_condition, points_reward, rarity, order_index) VALUES
('First Steps', 'Selesaikan game pertama kamu', '👶', 'milestone', '{"type": "games_completed", "value": 1}', 50, 'common', 1),
('7 Day Warrior', 'Login 7 hari berturut-turut', '🔥', 'streak', '{"type": "streak", "value": 7}', 200, 'rare', 2),
('Template Master', 'Kuasai semua 4 template speaking', '🎯', 'mastery', '{"type": "speaking_templates", "value": 4}', 500, 'epic', 3),
('Speed Writer', 'Tulis 100 kata dalam 7 menit', '⚡', 'mastery', '{"type": "writing_speed", "words": 100, "time": 420}', 300, 'rare', 4),
('Echo Champion', '100 perfect echo dalam listening', '🎧', 'mastery', '{"type": "perfect_echoes", "value": 100}', 400, 'epic', 5),
('Keyword Master', 'Scan 50 keywords dengan benar', '🔍', 'mastery', '{"type": "keyword_scans", "value": 50}', 300, 'rare', 6),
('Level 10', 'Capai level 10', '🌟', 'milestone', '{"type": "level", "value": 10}', 1000, 'epic', 7),
('Consistent Learner', 'Latihan 30 hari berturut-turut', '📅', 'streak', '{"type": "streak", "value": 30}', 1500, 'legendary', 8),
('Word Family Expert', 'Kuasai 50 word families', '📚', 'mastery', '{"type": "word_families", "value": 50}', 800, 'epic', 9),
('Social Butterfly', 'Mainkan 10 multiplayer games', '🦋', 'social', '{"type": "multiplayer_games", "value": 10}', 250, 'rare', 10);

-- ============================================================================
-- 7. USER BADGES TABLE (junction table)
-- ============================================================================
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT true,
    UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX user_badges_user_idx ON user_badges(user_id);
CREATE INDEX user_badges_earned_idx ON user_badges(earned_at);

-- ============================================================================
-- 8. LEADERBOARD TABLE (materialized view for performance)
-- ============================================================================
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    class_code TEXT,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges_count INTEGER DEFAULT 0,
    games_completed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    rank INTEGER,
    rank_change INTEGER DEFAULT 0, -- +/- from yesterday
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX leaderboard_points_idx ON leaderboard(total_points DESC);
CREATE INDEX leaderboard_class_idx ON leaderboard(class_code);
CREATE INDEX leaderboard_rank_idx ON leaderboard(rank);

-- ============================================================================
-- 9. DAILY CHALLENGES TABLE
-- ============================================================================
CREATE TABLE daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('listening', 'speaking', 'reading', 'writing', 'mixed')),
    challenge_description TEXT NOT NULL,
    challenge_data JSONB NOT NULL, -- specific challenge parameters
    points_reward INTEGER DEFAULT 100,
    bonus_points INTEGER DEFAULT 50, -- for perfect completion
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX daily_challenges_date_idx ON daily_challenges(challenge_date DESC);

-- ============================================================================
-- 10. USER DAILY CHALLENGES TABLE (tracking)
-- ============================================================================
CREATE TABLE user_daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    score INTEGER,
    points_earned INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    UNIQUE(user_id, challenge_id)
);

-- Indexes
CREATE INDEX user_daily_challenges_user_idx ON user_daily_challenges(user_id);
CREATE INDEX user_daily_challenges_completed_idx ON user_daily_challenges(is_completed);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update streak on login
CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_login_date IS NULL OR NEW.last_login_date < CURRENT_DATE - INTERVAL '1 day' THEN
        -- Reset streak if more than 1 day gap
        IF NEW.last_login_date < CURRENT_DATE - INTERVAL '1 day' THEN
            NEW.current_streak = 1;
        -- Increment streak if consecutive day
        ELSIF NEW.last_login_date = CURRENT_DATE - INTERVAL '1 day' THEN
            NEW.current_streak = OLD.current_streak + 1;
            IF NEW.current_streak > OLD.longest_streak THEN
                NEW.longest_streak = NEW.current_streak;
            END IF;
        END IF;
    END IF;
    NEW.last_login_date = CURRENT_DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update streak on profile update
CREATE TRIGGER update_streak_on_login BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.last_login_date IS DISTINCT FROM NEW.last_login_date)
    EXECUTE FUNCTION update_login_streak();

-- Function: Calculate level from points
CREATE OR REPLACE FUNCTION calculate_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Level 1-5: 0-1000 (200 per level)
    -- Level 6-10: 1001-5000 (1000 per level)
    -- Level 11-15: 5001-10000 (1000 per level)
    -- Level 16-20: 10001+ (2000 per level)
    IF points <= 1000 THEN
        RETURN (points / 200) + 1;
    ELSIF points <= 5000 THEN
        RETURN 5 + ((points - 1000) / 1000);
    ELSIF points <= 10000 THEN
        RETURN 10 + ((points - 5000) / 1000);
    ELSE
        RETURN LEAST(15 + ((points - 10000) / 2000), 20);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-update level when points change
CREATE OR REPLACE FUNCTION update_level_from_points()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level = calculate_level(NEW.total_points);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update level when points change
CREATE TRIGGER auto_update_level BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
    EXECUTE FUNCTION update_level_from_points();

-- Function: Refresh leaderboard (call periodically)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
    -- Backup old ranks for rank_change calculation
    CREATE TEMP TABLE old_ranks AS
    SELECT user_id, rank FROM leaderboard;

    -- Clear and rebuild leaderboard
    TRUNCATE leaderboard;
    
    INSERT INTO leaderboard (user_id, username, avatar_url, class_code, total_points, level, badges_count, games_completed, current_streak)
    SELECT 
        p.id,
        p.username,
        p.avatar_url,
        p.class_code,
        p.total_points,
        p.level,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = p.id),
        (SELECT COUNT(*) FROM game_sessions WHERE user_id = p.id AND is_completed = true),
        p.current_streak
    FROM profiles p
    WHERE p.role = 'student';
    
    -- Assign ranks
    WITH ranked AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY total_points DESC, level DESC, badges_count DESC) as new_rank
        FROM leaderboard
    )
    UPDATE leaderboard l
    SET 
        rank = r.new_rank,
        rank_change = COALESCE(old.rank - r.new_rank, 0)
    FROM ranked r
    LEFT JOIN old_ranks old ON old.user_id = l.user_id
    WHERE l.id = r.id;
    
    DROP TABLE old_ranks;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view classmates" ON profiles FOR SELECT USING (
    class_code IN (SELECT class_code FROM profiles WHERE id = auth.uid())
);

-- Game sessions policies
CREATE POLICY "Users can view own sessions" ON game_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own sessions" ON game_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sessions" ON game_sessions FOR UPDATE USING (user_id = auth.uid());

-- Progress policies
CREATE POLICY "Users can view own progress" ON progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own progress" ON progress FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own progress" ON progress FOR INSERT WITH CHECK (user_id = auth.uid());

-- User badges policies
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view others' badges" ON user_badges FOR SELECT USING (true); -- public badges

-- Leaderboard policies
CREATE POLICY "Everyone can view leaderboard" ON leaderboard FOR SELECT USING (true);

-- User daily challenges policies
CREATE POLICY "Users can view own challenges" ON user_daily_challenges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own challenges" ON user_daily_challenges FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own challenges" ON user_daily_challenges FOR UPDATE USING (user_id = auth.uid());

-- Public read access for reference tables
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates" ON templates FOR SELECT USING (true);
CREATE POLICY "Anyone can read word families" ON word_families FOR SELECT USING (true);
CREATE POLICY "Anyone can read badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Anyone can read daily challenges" ON daily_challenges FOR SELECT USING (true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional indexes for common queries
CREATE INDEX game_sessions_user_completed_idx ON game_sessions(user_id, is_completed, completed_at DESC);
CREATE INDEX progress_user_updated_idx ON progress(user_id, updated_at DESC);
CREATE INDEX user_badges_user_earned_idx ON user_badges(user_id, earned_at DESC);

-- ============================================================================
-- VIEWS (Optional: for easier queries)
-- ============================================================================

-- View: User stats summary
CREATE VIEW user_stats AS
SELECT 
    p.id,
    p.username,
    p.total_points,
    p.level,
    p.current_streak,
    p.longest_streak,
    (SELECT COUNT(*) FROM user_badges WHERE user_id = p.id) as badges_earned,
    (SELECT COUNT(*) FROM game_sessions WHERE user_id = p.id AND is_completed = true) as games_completed,
    (SELECT AVG(accuracy_percentage) FROM game_sessions WHERE user_id = p.id AND is_completed = true) as avg_accuracy,
    (SELECT COUNT(DISTINCT DATE(completed_at)) FROM game_sessions WHERE user_id = p.id AND completed_at IS NOT NULL) as days_active
FROM profiles p
WHERE p.role = 'student';

-- ============================================================================
-- SEED DATA (for testing)
-- ============================================================================

-- Will be in separate seed.sql file

-- ============================================================================
-- NOTES
-- ============================================================================

-- To apply this migration:
-- 1. Create Supabase project
-- 2. Run: supabase db push
-- 3. Or manually paste in SQL Editor

-- To test locally:
-- supabase start
-- supabase db reset

-- To add more word families, templates, badges:
-- Use INSERT statements or Supabase dashboard
