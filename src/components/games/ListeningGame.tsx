// ============================================================================
// LISTENING GAME COMPONENT - Echo Challenge
// ============================================================================
// Purpose: Student mendengar audio template dan mengulang dengan recording
// Scoring: Speech recognition untuk accuracy, waveform visualization
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic, Square, RotateCcw, Volume2, Award, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, createGameSession, completeGameSession } from '../../lib/supabase';
import type { ListeningQuestion, GameSession } from '../../types';

interface ListeningGameProps {
  userId: string;
  userLevel: number;
  onComplete: (session: GameSession) => void;
  onExit: () => void;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const AUDIO_BASE_URL = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/audio-templates/`
  : '/audio/';

const QUESTIONS: ListeningQuestion[] = [
  {
    id: '1',
    audio_url: `${AUDIO_BASE_URL}08_REVISI_Practice_Sentence_Level_1.mp3`,
    text: 'The library is open.',
    difficulty: 'easy',
    duration_seconds: 3,
    expected_words: ['the', 'library', 'is', 'open'],
  },
  {
    id: '2',
    audio_url: `${AUDIO_BASE_URL}09_REVISI_Practice_Sentence_Level_2.mp3`,
    text: 'I really enjoy studying English.',
    difficulty: 'easy',
    duration_seconds: 4,
    expected_words: ['i', 'really', 'enjoy', 'studying', 'english'],
  },
  {
    id: '3',
    audio_url: `${AUDIO_BASE_URL}10_REVISI_Practice_Sentence_Level_3.mp3`,
    text: 'My favorite place is the local library because it is quiet.',
    difficulty: 'medium',
    duration_seconds: 6,
    expected_words: ['favorite', 'place', 'local', 'library', 'quiet'],
  },
  {
    id: '4',
    audio_url: `${AUDIO_BASE_URL}11_REVISI_Practice_Sentence_Level_4.mp3`,
    text: 'Students should take notes during lectures because it helps them remember important information.',
    difficulty: 'medium',
    duration_seconds: 8,
    expected_words: ['students', 'should', 'take', 'notes', 'lectures', 'helps', 'remember', 'important'],
  },
  {
    id: '5',
    audio_url: `${AUDIO_BASE_URL}12_REVISI_Practice_Sentence_Level_5.mp3`,
    text: 'Before leaving the gallery, please make sure to return your audio guide at the entrance.',
    difficulty: 'hard',
    duration_seconds: 10,
    expected_words: ['before', 'leaving', 'gallery', 'make', 'sure', 'return', 'audio', 'guide', 'entrance'],
  },
];

export function ListeningGame({ userId, userLevel, onComplete, onExit }: ListeningGameProps) {
  // State Management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [attempts, setAttempts] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Audio & Recording Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timer
  const timerRef = useRef<number | null>(null);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  // Initialize Game Session
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await createGameSession(
          userId,
          'listening',
          QUESTIONS.length * 10, // 10 points per question
          userLevel
        );
        setSessionId(session.id);
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    };

    initSession();

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Play Audio
  const handlePlayAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(currentQuestion.audio_url);
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Change Playback Speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Start Recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        recordedAudioRef.current = new Audio(audioUrl);
        setHasRecorded(true);

        // Auto-score after recording
        scoreRecording(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAttempts(prev => prev + 1);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Tidak bisa akses microphone. Cek browser permissions.');
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Play Recorded Audio
  const handlePlayRecording = () => {
    if (recordedAudioRef.current) {
      recordedAudioRef.current.play();
    }
  };

  // Score Recording (Simplified - In production use Speech Recognition API)
  const scoreRecording = async (blob: Blob) => {
    // Simplified scoring: Random accuracy for demo
    // In production: Use Web Speech API or server-side STT
    const mockAccuracy = Math.random() * 40 + 60; // 60-100%
    const earnedPoints = mockAccuracy >= 80 ? 10 : mockAccuracy >= 60 ? 7 : 5;

    setScore(earnedPoints);
    setTotalScore(prev => prev + earnedPoints);
    setShowFeedback(true);

    if (mockAccuracy < 80) {
      setMistakes(prev => [...prev, {
        question_number: currentQuestionIndex + 1,
        expected_answer: currentQuestion.text,
        user_answer: 'Recording',
        mistake_type: 'pronunciation',
        accuracy: mockAccuracy,
      }]);
    }
  };

  // Next Question
  const handleNextQuestion = () => {
    setShowFeedback(false);
    setHasRecorded(false);
    setScore(0);
    setAttempts(0);

    // Reset audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinishGame();
    }
  };

  // Retry Current Question
  const handleRetry = () => {
    setShowFeedback(false);
    setHasRecorded(false);
    setScore(0);
  };

  // Finish Game
  const handleFinishGame = async () => {
    if (!sessionId) return;

    try {
      const session = await completeGameSession(
        sessionId,
        totalScore,
        totalScore,
        mistakes,
        { questions_completed: QUESTIONS.length, time_elapsed: timeElapsed }
      );

      onComplete(session);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  // Format Time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                🎧 Listening Challenge
              </h1>
              <p className="text-gray-600 mt-1">
                Dengar audio, lalu ulang dengan rekaman kamu!
              </p>
            </div>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              Exit
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Pertanyaan {currentQuestionIndex + 1} dari {QUESTIONS.length}</span>
              <span className="flex items-center gap-1">
                <Timer size={16} />
                {formatTime(timeElapsed)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Score */}
          <div className="mt-4 flex justify-between items-center bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="text-yellow-600" size={24} />
              <span className="font-bold text-lg text-gray-800">
                Total Score: {totalScore} / {QUESTIONS.length * 10}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Target: {Math.ceil(QUESTIONS.length * 10 * 0.7)} untuk lulus
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-b-2xl shadow-lg p-8">
          <AnimatePresence mode="wait">
            {!showFeedback ? (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Question Info */}
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${currentQuestion.difficulty === 'easy' ? 'bg-green-200 text-green-800' :
                      currentQuestion.difficulty === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                      Level: {currentQuestion.difficulty.toUpperCase()}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {currentQuestion.expected_words.length} kata
                    </span>
                  </div>

                  {/* Audio Player */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button
                        onClick={handlePlayAudio}
                        className={`p-6 rounded-full transition-all transform hover:scale-110 ${isPlaying
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                          } text-white shadow-lg`}
                      >
                        {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                      </button>
                    </div>

                    {/* Playback Speed */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Volume2 size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-600 mr-2">Kecepatan:</span>
                      {[0.5, 0.75, 1.0].map(speed => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-3 py-1 rounded-lg text-sm transition ${playbackSpeed === speed
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                        >
                          {speed}×
                        </button>
                      ))}
                    </div>

                    {/* Waveform Placeholder */}
                    <div className="h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <div className="flex items-end gap-1 h-16">
                        {Array.from({ length: 50 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-blue-500 rounded-t"
                            animate={{
                              height: isPlaying
                                ? `${Math.random() * 100}%`
                                : '20%'
                            }}
                            transition={{ duration: 0.2, repeat: isPlaying ? Infinity : 0 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expected Text (Hidden until after recording) */}
                  {hasRecorded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg"
                    >
                      <p className="text-sm text-gray-600 mb-1">Teks yang harus diulang:</p>
                      <p className="text-lg font-semibold text-gray-800">
                        "{currentQuestion.text}"
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Recording Controls */}
                <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Mic size={24} className="text-purple-600" />
                    Rekam Suara Kamu
                  </h3>

                  <div className="space-y-4">
                    {/* Record Button */}
                    {!hasRecorded && (
                      <div className="flex justify-center">
                        {!isRecording ? (
                          <button
                            onClick={handleStartRecording}
                            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-lg shadow-lg transform hover:scale-105 transition flex items-center gap-2"
                          >
                            <Mic size={24} />
                            Mulai Rekam
                          </button>
                        ) : (
                          <button
                            onClick={handleStopRecording}
                            className="px-8 py-4 bg-gray-800 hover:bg-gray-900 text-white rounded-full font-bold text-lg shadow-lg animate-pulse flex items-center gap-2"
                          >
                            <Square size={24} />
                            Stop Rekam
                          </button>
                        )}
                      </div>
                    )}

                    {/* Recording Animation */}
                    {isRecording && (
                      <motion.div
                        className="flex justify-center items-center gap-2"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-red-600 font-semibold">Recording...</span>
                      </motion.div>
                    )}

                    {/* Playback Recorded */}
                    {hasRecorded && (
                      <div className="space-y-3">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={handlePlayRecording}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2 transition"
                          >
                            <Play size={20} />
                            Dengar Rekaman
                          </button>
                          <button
                            onClick={handleRetry}
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center gap-2 transition"
                          >
                            <RotateCcw size={20} />
                            Rekam Ulang
                          </button>
                        </div>

                        <p className="text-center text-sm text-gray-600">
                          Attempt {attempts} - Klik "Next" jika sudah selesai
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Button (only after recording) */}
                {hasRecorded && showFeedback && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleNextQuestion}
                      className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full font-bold text-lg shadow-lg transform hover:scale-105 transition"
                    >
                      {currentQuestionIndex < QUESTIONS.length - 1 ? 'Next Question →' : 'Finish Game 🎉'}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Feedback Screen */
              <motion.div
                key="feedback"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className={`inline-block p-8 rounded-full ${score >= 9 ? 'bg-green-100' : score >= 7 ? 'bg-yellow-100' : 'bg-orange-100'
                  }`}>
                  <span className="text-6xl">
                    {score >= 9 ? '🎉' : score >= 7 ? '👍' : '💪'}
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-gray-800">
                  {score >= 9 ? 'Perfect Echo!' : score >= 7 ? 'Good Job!' : 'Keep Practicing!'}
                </h2>

                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8">
                  <p className="text-5xl font-bold text-gray-800 mb-2">
                    +{score} Points
                  </p>
                  <p className="text-gray-600">
                    Accuracy: {score >= 9 ? '90-100%' : score >= 7 ? '70-89%' : '50-69%'}
                  </p>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button
                    onClick={handleRetry}
                    className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center gap-2 transition"
                  >
                    <RotateCcw size={20} />
                    Try Again
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold transition"
                  >
                    {currentQuestionIndex < QUESTIONS.length - 1 ? 'Next Question →' : 'Finish 🎉'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
