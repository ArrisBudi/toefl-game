import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

type ReadingTemplate = Database['public']['Tables']['templates']['Row'];
type WordFamily = Database['public']['Tables']['word_families']['Row'];

interface Question {
  id: string;
  text: string;
  passage: string;
  keywords: string[];
  options: { id: string; text: string; isCorrect: boolean }[];
}

interface GameState {
  phase: 'tutorial' | 'practice' | 'challenge' | 'results';
  currentQuestion: number;
  score: number;
  lives: number;
  streak: number;
  startTime: number;
  answers: boolean[];
  highlightedKeywords: string[];
  selectedAnswer: string | null;
  feedbackVisible: boolean;
}

const TUTORIAL_STEPS = [
  {
    title: "🎯 Cara Bermain Reading Game",
    content: "Kamu akan membaca paragraf pendek dan menjawab pertanyaan. Tidak perlu mengerti semua kata!",
    instruction: "Tekan 'Mulai Tutorial' untuk belajar teknik keyword scan."
  },
  {
    title: "🔍 Step 1: Baca Pertanyaan Dulu",
    content: "Selalu baca pertanyaan sebelum membaca teks. Cari kata kunci (keyword).",
    example: "Pertanyaan: 'What is the main benefit of online learning?'\nKeyword: online learning, benefit"
  },
  {
    title: "📝 Step 2: Scan Teks",
    content: "Jangan baca seluruh teks! Cari kata yang SAMA atau MIRIP dengan keyword.",
    example: "Di teks: '...online learning offers flexibility...'\nKata 'online learning' cocok dengan keyword!"
  },
  {
    title: "✅ Step 3: Eliminasi Jawaban Salah",
    content: "Pilih jawaban yang mengandung kata dari teks. Buang jawaban yang jelas salah.",
    example: "✅ 'Online learning offers flexibility.' → Ada kata sama!\n❌ 'Students must attend physical classes.' → Bertentangan!"
  }
];

const PRACTICE_QUESTIONS: Question[] = [
  {
    id: 'p1',
    text: 'What is the main advantage of studying in a library?',
    passage: 'The university library provides a quiet environment for students to focus on their studies. Many students prefer the library because it has fewer distractions than their dormitory rooms. The library also offers free Wi-Fi and comfortable seating areas.',
    keywords: ['library', 'advantage', 'benefit'],
    options: [
      { id: 'a', text: 'It provides a quiet environment', isCorrect: true },
      { id: 'b', text: 'It has the most books on campus', isCorrect: false },
      { id: 'c', text: 'It is open 24 hours every day', isCorrect: false },
      { id: 'd', text: 'It requires a membership fee', isCorrect: false }
    ]
  },
  {
    id: 'p2',
    text: 'According to the passage, why do students take notes?',
    passage: 'Taking notes during lectures is an essential study skill. Students should write down key points because it helps them remember important information. Research shows that handwriting notes improves memory retention more than typing on a laptop.',
    keywords: ['notes', 'why', 'reason'],
    options: [
      { id: 'a', text: 'To share with classmates after class', isCorrect: false },
      { id: 'b', text: 'To help them remember important information', isCorrect: true },
      { id: 'c', text: 'Because professors require it', isCorrect: false },
      { id: 'd', text: 'To practice their handwriting skills', isCorrect: false }
    ]
  },
  {
    id: 'p3',
    text: 'What does the passage suggest about online courses?',
    passage: 'Online courses have become increasingly popular among working professionals. These courses allow students to study at their own pace and access materials anytime. However, online learning requires strong self-discipline and time management skills to succeed.',
    keywords: ['online courses', 'suggest', 'require'],
    options: [
      { id: 'a', text: 'They are easier than traditional classes', isCorrect: false },
      { id: 'b', text: 'They require self-discipline and time management', isCorrect: true },
      { id: 'c', text: 'They are only for working professionals', isCorrect: false },
      { id: 'd', text: 'They do not provide certificates', isCorrect: false }
    ]
  },
  {
    id: 'p4',
    text: 'What is mentioned about group study sessions?',
    passage: 'Group study sessions can be very effective for learning difficult subjects. When students work together, they can explain concepts to each other and share different perspectives. However, group study only works well when all members are focused and prepared.',
    keywords: ['group study', 'mentioned', 'effective'],
    options: [
      { id: 'a', text: 'They are always better than studying alone', isCorrect: false },
      { id: 'b', text: 'They help students explain concepts to each other', isCorrect: true },
      { id: 'c', text: 'They are required for all university courses', isCorrect: false },
      { id: 'd', text: 'They should last at least 3 hours', isCorrect: false }
    ]
  },
  {
    id: 'p5',
    text: 'According to the text, what should students do before exams?',
    passage: 'Preparing for exams requires a systematic approach. Students should review their notes regularly throughout the semester rather than cramming the night before. Creating a study schedule and practicing with past exam questions can significantly improve performance.',
    keywords: ['before exams', 'should', 'prepare'],
    options: [
      { id: 'a', text: 'Study intensively the night before', isCorrect: false },
      { id: 'b', text: 'Ask professors for the exam answers', isCorrect: false },
      { id: 'c', text: 'Review notes regularly throughout the semester', isCorrect: true },
      { id: 'd', text: 'Only memorize the textbook definitions', isCorrect: false }
    ]
  }
];

const CHALLENGE_QUESTIONS: Question[] = [
  {
    id: 'c1',
    text: 'What is the primary purpose of the campus writing center?',
    passage: 'The campus writing center offers free tutoring services to help students improve their academic writing skills. Trained tutors provide one-on-one consultations where they review drafts, suggest improvements, and teach strategies for organizing essays. The center does not write papers for students but helps them become better writers through guidance and feedback.',
    keywords: ['writing center', 'purpose', 'primary'],
    options: [
      { id: 'a', text: 'To write papers for students who need help', isCorrect: false },
      { id: 'b', text: 'To help students improve their writing skills', isCorrect: true },
      { id: 'c', text: 'To grade all student assignments', isCorrect: false },
      { id: 'd', text: 'To sell writing textbooks and materials', isCorrect: false }
    ]
  },
  {
    id: 'c2',
    text: 'What challenge does the passage identify with digital textbooks?',
    passage: 'Digital textbooks are becoming more common in universities because they are often cheaper than printed versions and easier to carry. Students can search for specific terms instantly and highlight text digitally. Despite these advantages, some students complain that reading on screens for long periods causes eye strain and reduces their ability to concentrate.',
    keywords: ['digital textbooks', 'challenge', 'problem'],
    options: [
      { id: 'a', text: 'They are more expensive than printed books', isCorrect: false },
      { id: 'b', text: 'They are too heavy to carry around', isCorrect: false },
      { id: 'c', text: 'They cause eye strain and concentration problems', isCorrect: true },
      { id: 'd', text: 'They cannot be highlighted or searched', isCorrect: false }
    ]
  },
  {
    id: 'c3',
    text: 'According to the passage, what distinguishes successful language learners?',
    passage: 'Research on language acquisition shows that successful language learners share several common characteristics. They practice consistently every day, even if only for 15-20 minutes. They are not afraid to make mistakes and actively seek opportunities to use the language. Most importantly, they maintain a positive attitude and believe in their ability to improve over time.',
    keywords: ['successful language learners', 'distinguishes', 'characteristics'],
    options: [
      { id: 'a', text: 'They study grammar rules for many hours daily', isCorrect: false },
      { id: 'b', text: 'They have natural talent for languages', isCorrect: false },
      { id: 'c', text: 'They practice consistently and maintain a positive attitude', isCorrect: true },
      { id: 'd', text: 'They avoid making any mistakes when speaking', isCorrect: false }
    ]
  },
  {
    id: 'c4',
    text: 'What does the author imply about time management?',
    passage: 'Effective time management is crucial for academic success. Students who plan their weekly schedules tend to complete assignments on time and experience less stress. Using tools like calendars and to-do lists helps prioritize tasks. However, time management is a skill that must be developed through practice; it does not come naturally to most people.',
    keywords: ['time management', 'imply', 'skill'],
    options: [
      { id: 'a', text: 'It is a natural ability everyone is born with', isCorrect: false },
      { id: 'b', text: 'It must be developed through practice', isCorrect: true },
      { id: 'c', text: 'It is only important for graduate students', isCorrect: false },
      { id: 'd', text: 'It guarantees perfect grades in all courses', isCorrect: false }
    ]
  },
  {
    id: 'c5',
    text: 'What benefit of peer review is mentioned in the passage?',
    passage: 'Peer review is a valuable learning activity in which students evaluate each other\'s work. When students read their classmates\' essays, they gain new perspectives on how to approach writing assignments. Providing constructive feedback helps reviewers develop critical thinking skills. Additionally, receiving feedback from peers often feels less intimidating than receiving it from professors.',
    keywords: ['peer review', 'benefit', 'advantage'],
    options: [
      { id: 'a', text: 'It replaces the need for professor feedback', isCorrect: false },
      { id: 'b', text: 'It helps develop critical thinking skills', isCorrect: true },
      { id: 'c', text: 'It guarantees higher grades on assignments', isCorrect: false },
      { id: 'd', text: 'It is required in every university course', isCorrect: false }
    ]
  }
];

export const ReadingGame: React.FC = () => {
  const supabase = useSupabase();
  const [gameState, setGameState] = useState<GameState>({
    phase: 'tutorial',
    currentQuestion: 0,
    score: 0,
    lives: 3,
    streak: 0,
    startTime: Date.now(),
    answers: [],
    highlightedKeywords: [],
    selectedAnswer: null,
    feedbackVisible: false
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [wordFamilies, setWordFamilies] = useState<WordFamily[]>([]);
  const [showKeywords, setShowKeywords] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes per question

  useEffect(() => {
    loadWordFamilies();
  }, []);

  useEffect(() => {
    if (gameState.phase === 'practice' || gameState.phase === 'challenge') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 180;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState.phase, gameState.currentQuestion]);

  const loadWordFamilies = async () => {
    const { data } = await supabase
      .from('word_families')
      .select('*')
      .limit(50);
    if (data) setWordFamilies(data);
  };

  const handleTimeout = () => {
    setGameState(prev => ({
      ...prev,
      lives: prev.lives - 1,
      answers: [...prev.answers, false],
      currentQuestion: prev.currentQuestion + 1,
      streak: 0,
      feedbackVisible: false
    }));
    
    if (gameState.lives <= 1) {
      endGame();
    }
  };

  const startTutorial = () => {
    setTutorialStep(0);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setGameState(prev => ({ ...prev, phase: 'practice' }));
      setTimeLeft(180);
    }
  };

  const startChallenge = () => {
    setGameState({
      phase: 'challenge',
      currentQuestion: 0,
      score: 0,
      lives: 3,
      streak: 0,
      startTime: Date.now(),
      answers: [],
      highlightedKeywords: [],
      selectedAnswer: null,
      feedbackVisible: false
    });
    setTimeLeft(180);
  };

  const highlightKeywords = () => {
    const question = gameState.phase === 'practice' 
      ? PRACTICE_QUESTIONS[gameState.currentQuestion]
      : CHALLENGE_QUESTIONS[gameState.currentQuestion];
    setGameState(prev => ({ ...prev, highlightedKeywords: question.keywords }));
    setShowKeywords(true);
  };

  const selectAnswer = (answerId: string) => {
    setGameState(prev => ({ ...prev, selectedAnswer: answerId }));
  };

  const submitAnswer = () => {
    const question = gameState.phase === 'practice'
      ? PRACTICE_QUESTIONS[gameState.currentQuestion]
      : CHALLENGE_QUESTIONS[gameState.currentQuestion];
    
    const selectedOption = question.options.find(opt => opt.id === gameState.selectedAnswer);
    const isCorrect = selectedOption?.isCorrect || false;

    const points = isCorrect ? (gameState.phase === 'challenge' ? 30 : 20) : 0;
    const bonusPoints = isCorrect && gameState.streak >= 2 ? 10 : 0;

    setGameState(prev => ({
      ...prev,
      score: prev.score + points + bonusPoints,
      lives: isCorrect ? prev.lives : prev.lives - 1,
      streak: isCorrect ? prev.streak + 1 : 0,
      answers: [...prev.answers, isCorrect],
      feedbackVisible: true
    }));

    setTimeout(() => {
      if (gameState.lives <= 1 && !isCorrect) {
        endGame();
      } else {
        nextQuestion();
      }
    }, 2000);
  };

  const nextQuestion = () => {
    const maxQuestions = gameState.phase === 'practice' 
      ? PRACTICE_QUESTIONS.length 
      : CHALLENGE_QUESTIONS.length;

    if (gameState.currentQuestion >= maxQuestions - 1) {
      endGame();
    } else {
      setGameState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        selectedAnswer: null,
        feedbackVisible: false,
        highlightedKeywords: []
      }));
      setShowKeywords(false);
      setTimeLeft(180);
    }
  };

  const endGame = async () => {
    const duration = Math.floor((Date.now() - gameState.startTime) / 1000);
    const accuracy = gameState.answers.length > 0
      ? (gameState.answers.filter(a => a).length / gameState.answers.length) * 100
      : 0;

    setGameState(prev => ({ ...prev, phase: 'results' }));

    // Save to database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('game_sessions').insert({
        user_id: user.id,
        game_type: 'reading',
        score: gameState.score,
        accuracy: Math.round(accuracy),
        duration_seconds: duration,
        questions_attempted: gameState.answers.length,
        questions_correct: gameState.answers.filter(a => a).length
      });

      // Update progress
      await supabase.rpc('update_progress', {
        p_user_id: user.id,
        p_skill_type: 'reading',
        p_points: gameState.score,
        p_accuracy: Math.round(accuracy)
      });
    }
  };

  const restart = () => {
    setGameState({
      phase: 'tutorial',
      currentQuestion: 0,
      score: 0,
      lives: 3,
      streak: 0,
      startTime: Date.now(),
      answers: [],
      highlightedKeywords: [],
      selectedAnswer: null,
      feedbackVisible: false
    });
    setTutorialStep(0);
    setShowKeywords(false);
  };

  // Render functions
  const renderTutorial = () => {
    const step = TUTORIAL_STEPS[tutorialStep];
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}</span>
            <span className="text-2xl">{step.title.split(' ')[0]}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
        <p className="text-lg mb-4">{step.content}</p>
        
        {step.example && (
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="font-mono text-sm whitespace-pre-line">{step.example}</p>
          </div>
        )}

        {step.instruction && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-blue-700">{step.instruction}</p>
          </div>
        )}

        <button
          onClick={nextTutorialStep}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
        >
          {tutorialStep === TUTORIAL_STEPS.length - 1 ? '🎮 Mulai Latihan!' : 'Lanjut →'}
        </button>
      </div>
    );
  };

  const renderGame = () => {
    const questions = gameState.phase === 'practice' ? PRACTICE_QUESTIONS : CHALLENGE_QUESTIONS;
    const question = questions[gameState.currentQuestion];

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-2xl">📖</span>
              <div>
                <div className="text-sm text-gray-500">
                  {gameState.phase === 'practice' ? 'Latihan' : 'Challenge Mode'}
                </div>
                <div className="font-bold">
                  Soal {gameState.currentQuestion + 1} / {questions.length}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-sm text-gray-500">Score</div>
                <div className="text-2xl font-bold text-blue-600">{gameState.score}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Streak</div>
                <div className="text-xl font-bold text-orange-500">
                  {gameState.streak > 0 ? `🔥 ${gameState.streak}` : '—'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Lives</div>
                <div className="text-2xl">
                  {Array.from({ length: gameState.lives }, (_, i) => '❤️').join('')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Time</div>
                <div className={`text-xl font-bold ${timeLeft < 30 ? 'text-red-500' : 'text-green-600'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="mb-4">
            <button
              onClick={highlightKeywords}
              disabled={showKeywords}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600 disabled:bg-gray-300 transition-colors"
            >
              {showKeywords ? '✅ Keywords Highlighted' : '🔍 Highlight Keywords'}
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2">❓ Pertanyaan:</h3>
            <p className="text-xl">{question.text}</p>
            {showKeywords && (
              <div className="mt-2 flex flex-wrap gap-2">
                {question.keywords.map((kw, i) => (
                  <span key={i} className="bg-yellow-200 px-3 py-1 rounded-full text-sm font-semibold">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-2">📄 Teks:</h3>
            <p className="text-base leading-relaxed">
              {question.passage.split(' ').map((word, i) => {
                const isHighlighted = showKeywords && question.keywords.some(kw => 
                  word.toLowerCase().includes(kw.toLowerCase())
                );
                return (
                  <span
                    key={i}
                    className={isHighlighted ? 'bg-yellow-200 font-bold' : ''}
                  >
                    {word}{' '}
                  </span>
                );
              })}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold">✏️ Pilih Jawaban:</h3>
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => selectAnswer(option.id)}
                disabled={gameState.feedbackVisible}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  gameState.selectedAnswer === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                } ${
                  gameState.feedbackVisible && option.isCorrect
                    ? 'border-green-500 bg-green-50'
                    : ''
                } ${
                  gameState.feedbackVisible && gameState.selectedAnswer === option.id && !option.isCorrect
                    ? 'border-red-500 bg-red-50'
                    : ''
                } disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold mr-2">{option.id.toUpperCase()})</span>
                  <span className="flex-1">{option.text}</span>
                  {gameState.feedbackVisible && option.isCorrect && <span className="text-2xl">✅</span>}
                  {gameState.feedbackVisible && gameState.selectedAnswer === option.id && !option.isCorrect && <span className="text-2xl">❌</span>}
                </div>
              </button>
            ))}
          </div>

          {gameState.feedbackVisible && (
            <div className={`mt-4 p-4 rounded-lg ${
              gameState.answers[gameState.answers.length - 1]
                ? 'bg-green-50 border-2 border-green-500'
                : 'bg-red-50 border-2 border-red-500'
            }`}>
              <p className="font-bold text-lg">
                {gameState.answers[gameState.answers.length - 1]
                  ? '🎉 Benar! +' + (gameState.phase === 'challenge' ? 30 : 20) + ' poin'
                  : '❌ Salah! Coba lagi di soal berikutnya.'}
              </p>
            </div>
          )}

          {!gameState.feedbackVisible && (
            <button
              onClick={submitAnswer}
              disabled={!gameState.selectedAnswer}
              className="w-full mt-6 bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Submit Jawaban
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const totalQuestions = gameState.answers.length;
    const correctAnswers = gameState.answers.filter(a => a).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">
            {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '💪'}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {accuracy >= 80 ? 'Luar Biasa!' : accuracy >= 60 ? 'Bagus!' : 'Terus Berlatih!'}
          </h2>
          <p className="text-gray-600">Hasil Reading Game</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Score</div>
            <div className="text-3xl font-bold text-blue-600">{gameState.score}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Benar</div>
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Salah</div>
              <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Akurasi</div>
            <div className="text-2xl font-bold text-purple-600">{accuracy.toFixed(1)}%</div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Streak Terbaik</div>
            <div className="text-2xl font-bold text-orange-600">🔥 {Math.max(...gameState.answers.map((_, i) => {
              let streak = 0;
              for (let j = i; j >= 0 && gameState.answers[j]; j--) streak++;
              return streak;
            }))}</div>
          </div>
        </div>

        <div className="space-y-3">
          {gameState.phase === 'practice' && (
            <button
              onClick={startChallenge}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors"
            >
              🚀 Challenge Mode
            </button>
          )}
          <button
            onClick={restart}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
          >
            🔄 Main Lagi
          </button>
        </div>
      </div>
    );
  };

  // Main render
  if (gameState.phase === 'tutorial') {
    return renderTutorial();
  } else if (gameState.phase === 'results') {
    return renderResults();
  } else {
    return renderGame();
  }
};

export default ReadingGame;