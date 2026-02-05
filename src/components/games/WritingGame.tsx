import React, { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

type WritingTemplate = Database['public']['Tables']['templates']['Row'];

interface GameState {
  phase: 'tutorial' | 'practice_email' | 'practice_discussion' | 'challenge' | 'results';
  currentTask: number;
  score: number;
  startTime: number;
  userText: string;
  wordCount: number;
  timeElapsed: number;
  templateType: 'email' | 'discussion';
  showTemplate: boolean;
  submitted: boolean;
  feedback: {
    wordCountScore: number;
    templateUsageScore: number;
    timeScore: number;
    totalScore: number;
    message: string;
  } | null;
}

const TUTORIAL_STEPS = [
  {
    title: "📧 Cara Bermain Writing Game",
    content: "Kamu akan menulis email dan diskusi. JANGAN BIKIN SENDIRI! Copy template 100%, ubah HANYA 5 kata.",
    instruction: "Tekan 'Mulai Tutorial' untuk belajar teknik copy-paste + edit minimal."
  },
  {
    title: "📋 Step 1: Copy Template 100%",
    content: "Template sudah SEMPURNA. Kamu hanya perlu copy-paste 100% tanpa ubah struktur.",
    example: "Template:\nDear Professor [NAME],\nI am writing to request [TOPIC]...\n\n✅ Jangan ubah 'Dear Professor' atau 'I am writing to request'"
  },
  {
    title: "✏️ Step 2: Ubah HANYA 5 Kata",
    content: "Cari 5 kata yang ada [TANDA KURUNG]. Ganti dengan kata kamu sendiri.",
    example: "[NAME] → Smith\n[TOPIC] → an extension for my essay\n[REASON] → I have been sick\n[DAY] → Friday\n[YOUR NAME] → Maria"
  },
  {
    title: "⏱️ Step 3: Target Waktu 7-9 Menit",
    content: "Email: 7-9 menit, 70-100 kata. Discussion: 10-12 menit, 100-120 kata. Jangan lebih lama!",
    example: "⏰ Terlalu cepat (<5 min) = kemungkinan kurang lengkap\n⏰ Terlalu lama (>12 min) = terlalu perfeksionis"
  }
];

const EMAIL_TEMPLATE = `Dear Professor [NAME],

I am writing to request [TOPIC]. I understand that the original deadline is [DAY], but I would like to ask for [REQUEST].

The reason for my request is that [REASON]. I have been working on this assignment and I believe that [BENEFIT].

I would be very grateful if you could consider my request. Please let me know if you need any additional information.

Thank you very much for your time and understanding.

Sincerely,
[YOUR NAME]`;

const DISCUSSION_TEMPLATE = `I believe that [TOPIC] is very important because [REASON_1].

First, [POINT_1]. For example, [EXAMPLE_1]. This shows that [CONCLUSION_1].

Second, [POINT_2]. Many people think that [OPINION], but I disagree because [REASON_2].

In conclusion, I strongly believe that [FINAL_STATEMENT]. This is why [TOPIC] matters to everyone.`;

interface TaskPrompt {
  id: string;
  type: 'email' | 'discussion';
  prompt: string;
  keywords: string[];
  minWords: number;
  maxWords: number;
  targetTime: number; // in seconds
}

const PRACTICE_TASKS: TaskPrompt[] = [
  {
    id: 'email1',
    type: 'email',
    prompt: 'Write an email to Professor Johnson requesting an extension for your research paper. Explain that you have been sick and need 3 more days until Friday.',
    keywords: ['Johnson', 'extension', 'research paper', 'sick', 'Friday'],
    minWords: 70,
    maxWords: 100,
    targetTime: 540 // 9 minutes
  },
  {
    id: 'email2',
    type: 'email',
    prompt: 'Write an email to Professor Martinez asking for clarification about the final exam format. Mention that you want to prepare properly and need to know the exam structure.',
    keywords: ['Martinez', 'clarification', 'final exam', 'prepare', 'exam structure'],
    minWords: 70,
    maxWords: 100,
    targetTime: 540
  },
  {
    id: 'discussion1',
    type: 'discussion',
    prompt: 'Do you agree or disagree: "Online learning is better than traditional classroom learning." Give reasons and examples to support your opinion.',
    keywords: ['online learning', 'traditional classroom', 'flexibility', 'self-discipline', 'interaction'],
    minWords: 100,
    maxWords: 120,
    targetTime: 720 // 12 minutes
  }
];

const CHALLENGE_TASKS: TaskPrompt[] = [
  {
    id: 'challenge_email',
    type: 'email',
    prompt: 'Write an email to Professor Anderson requesting permission to attend the lecture remotely next week. Explain that you have a family emergency and will return the following week.',
    keywords: ['Anderson', 'permission', 'remotely', 'family emergency', 'next week'],
    minWords: 70,
    maxWords: 100,
    targetTime: 480 // 8 minutes
  },
  {
    id: 'challenge_discussion',
    type: 'discussion',
    prompt: 'Do you agree or disagree: "Students should be required to participate in group projects." Give reasons and examples to support your opinion.',
    keywords: ['group projects', 'required', 'collaboration', 'individual work', 'teamwork'],
    minWords: 100,
    maxWords: 120,
    targetTime: 660 // 11 minutes
  }
];

export const WritingGame: React.FC = () => {
  const supabase = useSupabase();
  const [gameState, setGameState] = useState<GameState>({
    phase: 'tutorial',
    currentTask: 0,
    score: 0,
    startTime: Date.now(),
    userText: '',
    wordCount: 0,
    timeElapsed: 0,
    templateType: 'email',
    showTemplate: true,
    submitted: false,
    feedback: null
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [timer, setTimer] = useState<number>(0);

  useEffect(() => {
    if (gameState.phase !== 'tutorial' && gameState.phase !== 'results' && !gameState.submitted) {
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
        setGameState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState.phase, gameState.submitted]);

  useEffect(() => {
    const words = gameState.userText.trim().split(/\s+/).filter(w => w.length > 0);
    setGameState(prev => ({ ...prev, wordCount: words.length }));
  }, [gameState.userText]);

  const nextTutorialStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setGameState(prev => ({ 
        ...prev, 
        phase: 'practice_email',
        startTime: Date.now(),
        timeElapsed: 0
      }));
      setTimer(0);
    }
  };

  const copyTemplate = () => {
    const template = gameState.templateType === 'email' ? EMAIL_TEMPLATE : DISCUSSION_TEMPLATE;
    setGameState(prev => ({ ...prev, userText: template }));
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const toggleTemplate = () => {
    setGameState(prev => ({ ...prev, showTemplate: !prev.showTemplate }));
  };

  const submitWriting = () => {
    const task = gameState.phase === 'challenge' 
      ? CHALLENGE_TASKS[gameState.currentTask]
      : PRACTICE_TASKS[gameState.currentTask];

    // Calculate scores
    const wordCountScore = calculateWordCountScore(gameState.wordCount, task.minWords, task.maxWords);
    const templateUsageScore = calculateTemplateUsageScore(gameState.userText, task.type);
    const timeScore = calculateTimeScore(gameState.timeElapsed, task.targetTime);
    const totalScore = wordCountScore + templateUsageScore + timeScore;

    const feedback = {
      wordCountScore,
      templateUsageScore,
      timeScore,
      totalScore,
      message: generateFeedbackMessage(wordCountScore, templateUsageScore, timeScore)
    };

    setGameState(prev => ({
      ...prev,
      submitted: true,
      feedback,
      score: prev.score + totalScore
    }));
  };

  const calculateWordCountScore = (count: number, min: number, max: number): number => {
    if (count < min) {
      const ratio = count / min;
      return Math.round(ratio * 30); // Max 30 points
    } else if (count > max) {
      const excess = count - max;
      return Math.max(0, 30 - excess); // Penalti untuk terlalu panjang
    } else {
      return 30; // Perfect!
    }
  };

  const calculateTemplateUsageScore = (text: string, type: 'email' | 'discussion'): number => {
    const template = type === 'email' ? EMAIL_TEMPLATE : DISCUSSION_TEMPLATE;
    const templateWords = template.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const userWords = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    let matchCount = 0;
    templateWords.forEach(tw => {
      if (userWords.includes(tw)) matchCount++;
    });

    const matchRatio = matchCount / templateWords.length;
    return Math.round(matchRatio * 40); // Max 40 points
  };

  const calculateTimeScore = (elapsed: number, target: number): number => {
    if (elapsed <= target) {
      return 30; // Perfect timing
    } else {
      const overtime = elapsed - target;
      const penaltyPerMinute = 5;
      const penalty = Math.floor(overtime / 60) * penaltyPerMinute;
      return Math.max(0, 30 - penalty);
    }
  };

  const generateFeedbackMessage = (wc: number, tu: number, ts: number): string => {
    const total = wc + tu + ts;
    if (total >= 90) return '🏆 SEMPURNA! Kamu master copy-paste + edit!';
    if (total >= 75) return '🎉 Bagus Sekali! Terus pertahankan!';
    if (total >= 60) return '👍 Lumayan! Perlu latihan lagi dikit.';
    return '💪 Terus Berlatih! Fokus copy template 100% dulu.';
  };

  const nextTask = () => {
    const maxTasks = gameState.phase === 'challenge' ? CHALLENGE_TASKS.length : PRACTICE_TASKS.length;
    
    if (gameState.currentTask >= maxTasks - 1) {
      endGame();
    } else {
      const nextTaskData = gameState.phase === 'challenge' 
        ? CHALLENGE_TASKS[gameState.currentTask + 1]
        : PRACTICE_TASKS[gameState.currentTask + 1];

      setGameState(prev => ({
        ...prev,
        currentTask: prev.currentTask + 1,
        userText: '',
        wordCount: 0,
        timeElapsed: 0,
        startTime: Date.now(),
        templateType: nextTaskData.type,
        submitted: false,
        feedback: null,
        showTemplate: true
      }));
      setTimer(0);
    }
  };

  const startChallenge = () => {
    setGameState({
      phase: 'challenge',
      currentTask: 0,
      score: 0,
      startTime: Date.now(),
      userText: '',
      wordCount: 0,
      timeElapsed: 0,
      templateType: CHALLENGE_TASKS[0].type,
      showTemplate: true,
      submitted: false,
      feedback: null
    });
    setTimer(0);
  };

  const endGame = async () => {
    setGameState(prev => ({ ...prev, phase: 'results' }));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const totalTasks = gameState.phase === 'challenge' ? CHALLENGE_TASKS.length : PRACTICE_TASKS.length;
      const avgScore = gameState.score / totalTasks;

      await supabase.from('game_sessions').insert({
        user_id: user.id,
        game_type: 'writing',
        score: gameState.score,
        accuracy: Math.round((avgScore / 100) * 100),
        duration_seconds: gameState.timeElapsed,
        questions_attempted: totalTasks,
        questions_correct: totalTasks
      });

      await supabase.rpc('update_progress', {
        p_user_id: user.id,
        p_skill_type: 'writing',
        p_points: gameState.score,
        p_accuracy: Math.round((avgScore / 100) * 100)
      });
    }
  };

  const restart = () => {
    setGameState({
      phase: 'tutorial',
      currentTask: 0,
      score: 0,
      startTime: Date.now(),
      userText: '',
      wordCount: 0,
      timeElapsed: 0,
      templateType: 'email',
      showTemplate: true,
      submitted: false,
      feedback: null
    });
    setTutorialStep(0);
    setTimer(0);
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
              className="h-full bg-green-500 rounded-full transition-all"
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
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-green-700">{step.instruction}</p>
          </div>
        )}

        <button
          onClick={nextTutorialStep}
          className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
        >
          {tutorialStep === TUTORIAL_STEPS.length - 1 ? '📧 Mulai Email Practice!' : 'Lanjut →'}
        </button>
      </div>
    );
  };

  const renderWritingInterface = () => {
    const tasks = gameState.phase === 'challenge' ? CHALLENGE_TASKS : PRACTICE_TASKS;
    const task = tasks[gameState.currentTask];
    const template = task.type === 'email' ? EMAIL_TEMPLATE : DISCUSSION_TEMPLATE;

    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const targetMinutes = Math.floor(task.targetTime / 60);

    const isWordCountGood = gameState.wordCount >= task.minWords && gameState.wordCount <= task.maxWords;
    const isTimeGood = timer <= task.targetTime;

    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{task.type === 'email' ? '📧' : '💭'}</span>
              <div>
                <div className="text-sm text-gray-500">
                  {gameState.phase === 'challenge' ? 'Challenge Mode' : 'Practice Mode'}
                </div>
                <div className="font-bold">
                  {task.type === 'email' ? 'Email Writing' : 'Discussion Writing'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-sm text-gray-500">Score</div>
                <div className="text-2xl font-bold text-green-600">{gameState.score}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Time</div>
                <div className={`text-xl font-bold ${isTimeGood ? 'text-green-600' : 'text-red-500'}`}>
                  {minutes}:{seconds.toString().padStart(2, '0')} / {targetMinutes}:00
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Words</div>
                <div className={`text-xl font-bold ${isWordCountGood ? 'text-green-600' : 'text-orange-500'}`}>
                  {gameState.wordCount} / {task.minWords}-{task.maxWords}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Left: Prompt + Template */}
          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">📝 Task Prompt:</h3>
              <p className="text-base">{task.prompt}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">📋 Template:</h3>
                <div className="space-x-2">
                  <button
                    onClick={copyTemplate}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition-colors"
                  >
                    📋 Copy Template
                  </button>
                  <button
                    onClick={toggleTemplate}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                  >
                    {gameState.showTemplate ? '👁️ Hide' : '👁️‍🗨️ Show'}
                  </button>
                </div>
              </div>

              {gameState.showTemplate && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{template}</pre>
                </div>
              )}

              {!gameState.showTemplate && (
                <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-500">
                  Template disembunyikan. Klik "Show" untuk melihat lagi.
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <h4 className="font-bold mb-2">💡 Tips:</h4>
              <ul className="text-sm space-y-1">
                <li>✅ Copy template 100% (tekan "Copy Template")</li>
                <li>✅ Ubah HANYA kata di [TANDA KURUNG]</li>
                <li>✅ Jangan ubah struktur kalimat</li>
                <li>✅ Target: {task.minWords}-{task.maxWords} kata, {targetMinutes} menit</li>
              </ul>
            </div>
          </div>

          {/* Right: Writing Area */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-bold text-lg mb-3">✏️ Your Writing:</h3>
              <textarea
                ref={textareaRef}
                value={gameState.userText}
                onChange={(e) => setGameState(prev => ({ ...prev, userText: e.target.value }))}
                disabled={gameState.submitted}
                className="w-full h-96 p-4 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm resize-none"
                placeholder="Paste template di sini dan edit 5 kata..."
              />

              <div className="mt-3 flex justify-between items-center">
                <div className="flex space-x-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    isWordCountGood ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {gameState.wordCount} words
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    isTimeGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </div>
                </div>

                {!gameState.submitted && (
                  <button
                    onClick={submitWriting}
                    disabled={gameState.wordCount < 30}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    ✅ Submit
                  </button>
                )}
              </div>
            </div>

            {gameState.submitted && gameState.feedback && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="font-bold text-lg mb-3">📊 Feedback:</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span>Word Count Score:</span>
                    <span className="font-bold text-green-600">+{gameState.feedback.wordCountScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Template Usage Score:</span>
                    <span className="font-bold text-green-600">+{gameState.feedback.templateUsageScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Time Score:</span>
                    <span className="font-bold text-green-600">+{gameState.feedback.timeScore}</span>
                  </div>
                  <div className="border-t-2 pt-2 flex justify-between items-center">
                    <span className="font-bold">Total Score:</span>
                    <span className="font-bold text-2xl text-green-600">+{gameState.feedback.totalScore}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                  <p className="text-lg font-bold text-center">{gameState.feedback.message}</p>
                </div>

                <button
                  onClick={nextTask}
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
                >
                  {gameState.currentTask < (gameState.phase === 'challenge' ? CHALLENGE_TASKS.length : PRACTICE_TASKS.length) - 1
                    ? 'Next Task →'
                    : '🏁 Finish'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const maxScore = (gameState.phase === 'challenge' ? CHALLENGE_TASKS.length : PRACTICE_TASKS.length) * 100;
    const percentage = (gameState.score / maxScore) * 100;

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">
            {percentage >= 80 ? '🏆' : percentage >= 60 ? '🎉' : '💪'}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {percentage >= 80 ? 'Master Copy-Paste!' : percentage >= 60 ? 'Bagus!' : 'Terus Berlatih!'}
          </h2>
          <p className="text-gray-600">Hasil Writing Game</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Score</div>
            <div className="text-3xl font-bold text-green-600">{gameState.score} / {maxScore}</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Percentage</div>
            <div className="text-2xl font-bold text-purple-600">{percentage.toFixed(1)}%</div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Average per Task</div>
            <div className="text-2xl font-bold text-blue-600">
              {(gameState.score / (gameState.phase === 'challenge' ? CHALLENGE_TASKS.length : PRACTICE_TASKS.length)).toFixed(1)} / 100
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {gameState.phase !== 'challenge' && (
            <button
              onClick={startChallenge}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors"
            >
              🚀 Challenge Mode
            </button>
          )}
          <button
            onClick={restart}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
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
    return renderWritingInterface();
  }
};

export default WritingGame;