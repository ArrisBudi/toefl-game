# 🎮 TOEFL Gamification Web App

Complete gamified TOEFL iBT 2026 learning platform with 4 interactive games (Listening, Speaking, Reading, Writing), progress tracking, badges, and leaderboard.

## 🌟 Features

### 4 Game Modes
- **🎧 Listening Game**: Audio comprehension with symbol note-taking
- **🎤 Speaking Game**: Template memorization with voice recording
- **📖 Reading Game**: Keyword scanning and elimination strategy
- **✍️ Writing Game**: Copy-paste templates with minimal editing

### Gamification System
- **Points & Levels**: Earn XP and level up
- **20+ Badges**: Achievements for milestones
- **Leaderboard**: Global rankings with top 100
- **Streak System**: Daily login rewards (🔥 Streak Bonus)
- **Daily Challenges**: Complete all 4 games for bonus points

### Progress Tracking
- Personal dashboard with stats
- Per-skill analytics (accuracy, games played)
- Recent sessions history
- Today's progress checklist

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))

### Installation

1. **Clone & Install**
```bash
npm install
```

2. **Setup Supabase**

Create a new Supabase project and run the SQL migration:

```bash
# Copy the SQL from supabase/migrations/001_initial_schema.sql
# Paste into Supabase SQL Editor and execute
```

3. **Configure Environment**

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
toefl-game/
├── src/
│   ├── components/
│   │   ├── auth/          # Login & Signup
│   │   ├── dashboard/     # Dashboard, Leaderboard, GameHub
│   │   ├── games/         # 4 Game Components
│   │   ├── layout/        # Navigation
│   │   └── ui/            # Reusable UI components
│   ├── lib/
│   │   └── supabase.ts    # Supabase client
│   ├── types/
│   │   └── supabase.ts    # Database types
│   ├── App.tsx            # Main app with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🗄️ Database Schema

### Tables
- **profiles**: User profiles and settings
- **templates**: TOEFL templates for speaking/writing
- **word_families**: 50 word family cards for reading
- **game_sessions**: Individual game records
- **progress**: User learning progress per skill
- **badges**: Achievement definitions
- **user_badges**: Badges earned by users
- **leaderboard**: Global rankings (auto-updated)
- **daily_challenges**: Daily tasks
- **user_daily_challenges**: User challenge completion

### Auto Functions
- `calculate_level(points)`: Auto-calculate level from points
- `update_streak()`: Update streak on daily login
- `award_badge()`: Auto-award badges
- `refresh_leaderboard()`: Real-time leaderboard updates

## 🎯 Game Mechanics

### Listening Game
- 🎧 5 audio prompts
- Symbol-based note-taking (🔵 = person, ⏰ = time, etc.)
- Multiple-choice questions
- **Scoring**: 20 points per correct answer
- **Target**: 60% accuracy for Band 2.0-2.5

### Speaking Game
- 🎤 4 templates (Memory, Preference, Opinion, Problem)
- Voice recording with playback
- Template matching check
- **Scoring**: 25 points per template
- **Target**: 40-45 seconds per response

### Reading Game
- 📖 5 practice + 5 challenge passages
- Keyword highlighting tool
- Answer elimination strategy
- **Scoring**: 20-30 points per correct answer
- **Target**: 50% accuracy

### Writing Game
- ✍️ Email & Discussion templates
- Copy-paste + edit 5 words
- Real-time word counter
- **Scoring**: Word count (30), Template usage (40), Time (30)
- **Target**: 70-100 words in 7-9 minutes

## 🏆 Badge System

Badges auto-awarded on achievements:
- 🎯 **First Steps**: Complete first game
- 🔥 **Streak Master**: 7-day streak
- 🏅 **Gold Tier**: Reach level 10
- 🎓 **TOEFL Ready**: 500+ total points
- ⚡ **Speed Demon**: Finish game in record time

*(Total 20+ badges - see database schema)*

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Build for Production
```bash
npm run build
```

Output in `dist/` folder.

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Supabase anon key safe for client-side use
- JWT-based authentication

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router v6
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Build**: Vite
- **Deployment**: Vercel (or any static host)

## 📚 TOEFL Method Integration

Based on **Zero Grammar Method** for TOEFL iBT 2026:
- ✅ Template memorization (no grammar explanation)
- ✅ Pattern recognition (keyword scan, symbol notes)
- ✅ Mimicry learning (copy-paste + minimal edits)
- ✅ Repetition-based (daily practice, streak rewards)
- ✅ Target Band 2.0-2.5 (50% accuracy across all sections)

## 🎓 For Teachers

### Features
- Track student progress via leaderboard
- Monitor daily challenge completion
- View individual game sessions
- Assign daily targets (4 games/day)

### Customization
- Add more templates via Supabase dashboard
- Create custom badges
- Adjust scoring formulas in game components

## 🐛 Troubleshooting

### Database Connection Error
- Verify `.env` credentials
- Check Supabase project is active
- Ensure RLS policies are enabled

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Type Errors
Regenerate Supabase types:
```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

## 📝 License

MIT License - Free to use and modify

## 👥 Support

For issues or questions:
- Check Supabase dashboard logs
- Review browser console errors
- Verify all migrations ran successfully

## 🎉 Acknowledgments

Built for Indonesian students targeting TOEFL iBT Band 2.0-2.5 with zero English knowledge using gamification and template-based learning.

---

**Ready to deploy?** Follow the Quick Start guide above! 🚀