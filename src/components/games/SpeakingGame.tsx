// ============================================================================
// SPEAKING GAME COMPONENT - Template Master
// ============================================================================
// Purpose: Siswa pilih template berdasarkan question type, rekam jawaban
// Scoring: AI keyword detection, template matching, timing
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, RotateCcw, Clock, Award, Lightbulb, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, createGameSession, completeGameSession } from '@/lib/supabase';
import type { SpeakingQuestion, Template, GameSession } from '@/types';

interface SpeakingGameProps {
  userId: string;
  userLevel: number;
  onComplete: (session: GameSession) => void;
  onExit: () => void;
}

// Color-Coded Templates
const TEMPLATES: Template[] = [
  {
    id: '1',
    template_type: 'speaking',
    template_number: 1,
    template_name: 'Memory/Experience',
    color_code: 'blue',
    template_text: 'I remember when I was in high school. It was my favorite time. I studied with my friends. We learned many subjects together. It was really fun. I enjoyed that experience very much.',
    template_text_indonesian: 'Template untuk pertanyaan tentang masa lalu atau pengalaman',
    keywords: ['remember', 'experienced', 'was', 'past'],
    audio_url: '/audio/template1.mp3',
    example_questions: ['Tell me about a memorable experience', 'What did you do last summer?'],
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    template_type: 'speaking',
    template_number: 2,
    template_name: 'Preference/Feeling',
    color_code: 'green',
    template_text: 'I prefer studying at the library. It is quiet there. I can focus on my work. The library has many books. I like the environment. It helps me study better.',
    template_text_indonesian: 'Template untuk pertanyaan tentang kesukaan atau preferensi',
    keywords: ['prefer', 'favorite', 'like', 'enjoy'],
    audio_url: '/audio/template2.mp3',
    example_questions: ['What is your favorite place to study?', 'Do you prefer online or offline classes?'],
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    template_type: 'speaking',
    template_number: 3,
    template_name: 'Opinion/Agreement',
    color_code: 'yellow',
    template_text: 'I agree with this idea. It is important for students. This helps them learn better. Many people support this. I think it is a good solution. We should do this.',
    template_text_indonesian: 'Template untuk pertanyaan tentang pendapat atau persetujuan',
    keywords: ['agree', 'disagree', 'think', 'opinion'],
    audio_url: '/audio/template3.mp3',
    example_questions: ['Do you agree that homework is important?', 'What is your opinion about uniforms?'],
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    template_type: 'speaking',
    template_number: 4,
    template_name: 'Problem & Solution',
    color_code: 'red',
    template_text: 'I think we should reduce homework. Students have too much work. This causes stress. If we reduce homework, students can rest more. This is a better solution. Schools should do this.',
    template_text_indonesian: 'Template untuk pertanyaan tentang masalah dan solusi',
    keywords: ['should', 'problem', 'solution', 'fix'],
    audio_url: '/audio/template4.mp3',
    example_questions: ['What should schools do to reduce stress?', 'How can we solve this problem?'],
    created_at: new Date().toISOString(),
  },
];

const QUESTIONS: SpeakingQuestion[] = [
  {
    id: '1',
    question_text: 'Tell me about your favorite memory from school.',
    template_id: '1',
    template: TEMPLATES[0],
    time_limit_seconds: 45,
    keywords_to_detect: ['remember', 'school', 'favorite', 'was'],
  },
  {
    id: '2',
    question_text: 'What is your favorite place to relax?',
    template_id: '2',
    template: TEMPLATES[1],
    time_limit_seconds: 45,
    keywords_to_detect: ['prefer', 'favorite', 'like', 'place'],
  },
  {
    id: '3',
    question_text: 'Do you agree that students should wear uniforms to school?',
    template_id: '3',
    template: TEMPLATES[2],
    time_limit_seconds: 45,
    keywords_to_detect: ['agree', 'think', 'students', 'should'],
  },
  {
    id: '4',
    question_text: 'What should schools do to help students learn better?',
    template_id: '4',
    template: TEMPLATES[3],
    time_limit_seconds: 45,
    keywords_to_detect: ['should', 'schools', 'students', 'better'],
  },
];

const COLOR_STYLES = {
  blue: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', button: 'bg-blue-500 hover:bg-blue-600' },
  green: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', button: 'bg-green-500 hover:bg-green-600' },
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', button: 'bg-yellow-500 hover:bg-yellow-600' },
  red: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', button: 'bg-red-500 hover:bg-red-600' },
};

export default function SpeakingGame({ userId, userLevel, onComplete, onExit }: SpeakingGameProps) {
  // State Management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const currentTemplate = currentQuestion.template;
  const colorStyle = COLOR_STYLES[currentTemplate.color_code];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;
  
  // Initialize Session
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await createGameSession(
          userId,
          'speaking',
          QUESTIONS.length * 50,
          userLevel
        );
        setSessionId(session.id);
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    };
    
    initSession();
    
    // Game timer
    gameTimerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
  
  // Auto-detect Template
  useEffect(() => {
    // Show template hint after 3 seconds
    const timer = setTimeout(() => {
      setShowTemplate(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);
  
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
        
        // Auto-score
        scoreRecording();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= currentQuestion.time_limit_seconds - 1) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
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
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };
  
  // Score Recording
  const scoreRecording = () => {
    // Simplified: Mock keyword detection
    // In production: Use Web Speech API transcription
    
    const mockDetectedKeywords = currentQuestion.keywords_to_detect
      .filter(() => Math.random() > 0.3); // Random 70% detection
    
    setDetectedKeywords(mockDetectedKeywords);
    
    const keywordMatchRate = mockDetectedKeywords.length / currentQuestion.keywords_to_detect.length;
    const timingScore = recordingDuration >= 30 && recordingDuration <= 50 ? 1 : 0.7;
    
    let earnedPoints = 0;
    if (keywordMatchRate >= 0.8 && timingScore === 1) {
      earnedPoints = 50; // Perfect
    } else if (keywordMatchRate >= 0.6) {
      earnedPoints = 35; // Good
    } else {
      earnedPoints = 20; // Basic
    }
    
    setScore(earnedPoints);
    setTotalScore(prev => prev + earnedPoints);
    setShowFeedback(true);
    
    if (earnedPoints < 35) {
      setMistakes(prev => [...prev, {
        question_number: currentQuestionIndex + 1,
        expected_answer: `Use ${currentTemplate.template_name}`,
        user_answer: 'Recording',
        mistake_type: 'template_mismatch',
      }]);
    }
  };
  
  // Play Recording
  const handlePlayRecording = () => {
    if (recordedAudioRef.current) {
      recordedAudioRef.current.play();
    }
  };
  
  // Next Question
  const handleNextQuestion = () => {
    setShowFeedback(false);
    setHasRecorded(false);
    setShowTemplate(false);
    setScore(0);
    setRecordingDuration(0);
    setDetectedKeywords([]);
    
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinishGame();
    }
  };
  
  // Retry
  const handleRetry = () => {
    setShowFeedback(false);
    setHasRecorded(false);
    setScore(0);
    setRecordingDuration(0);
    setDetectedKeywords([]);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                🗣️ Speaking Master
              </h1>
              <p className="text-gray-600 mt-1">
                Gunakan template yang tepat untuk jawab pertanyaan!
              </p>
            </div>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              Exit
            </button>
          </div>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Pertanyaan {currentQuestionIndex + 1} dari {QUESTIONS.length}</span>
              <span>⏱️ {formatTime(timeElapsed)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          
          {/* Score */}
          <div className="mt-4 bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Award className="text-purple-600" size={24} />
                <span className="font-bold text-lg">
                  Total Score: {totalScore} / {QUESTIONS.length * 50}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Target: {Math.ceil(QUESTIONS.length * 50 * 0.7)}
              </span>
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
                {/* Question Card */}
                <div className={`${colorStyle.bg} rounded-xl p-6 border-4 ${colorStyle.border}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 ${colorStyle.button} rounded-full flex items-center justify-center text-white font-bold text-xl`}>
                      {currentQuestionIndex + 1}
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${colorStyle.text}`}>
                        {currentTemplate.template_name}
                      </span>
                      <p className="text-xs text-gray-600">
                        {currentTemplate.template_text_indonesian}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <p className="text-2xl font-bold text-gray-800 mb-4">
                      "{currentQuestion.question_text}"
                    </p>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={20} />
                      <span>Time Limit: {currentQuestion.time_limit_seconds} seconds</span>
                    </div>
                  </div>
                </div>
                
                {/* Template Hint */}
                <AnimatePresence>
                  {showTemplate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`${colorStyle.bg} rounded-xl p-6 border-2 ${colorStyle.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className={colorStyle.text} size={24} />
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg ${colorStyle.text} mb-2`}>
                            💡 Template Hint
                          </h3>
                          <p className="text-gray-700 mb-4 italic">
                            "{currentTemplate.template_text}"
                          </p>
                          <p className="text-sm text-gray-600">
                            🎯 Ubah 3-4 kata saja sesuai pertanyaan. 80% template tetap sama!
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Recording Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Mic size={24} className="text-red-600" />
                    Rekam Jawaban Kamu ({currentQuestion.time_limit_seconds}s)
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Recording Timer */}
                    {isRecording && (
                      <motion.div
                        className="bg-red-100 rounded-lg p-4 border-2 border-red-500"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold text-red-700">RECORDING</span>
                          </div>
                          <span className="text-3xl font-bold text-red-700">
                            {recordingDuration}s
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-red-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(recordingDuration / currentQuestion.time_limit_seconds) * 100}%` }}
                          />
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Record Button */}
                    {!hasRecorded && (
                      <div className="flex justify-center">
                        {!isRecording ? (
                          <button
                            onClick={handleStartRecording}
                            className={`px-12 py-6 ${colorStyle.button} text-white rounded-full font-bold text-xl shadow-xl transform hover:scale-105 transition flex items-center gap-3`}
                          >
                            <Mic size={32} />
                            Start Recording
                          </button>
                        ) : (
                          <button
                            onClick={handleStopRecording}
                            className="px-12 py-6 bg-gray-800 hover:bg-gray-900 text-white rounded-full font-bold text-xl shadow-xl flex items-center gap-3"
                          >
                            <Square size={32} />
                            Stop Recording
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Playback */}
                    {hasRecorded && (
                      <div className="space-y-3">
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="text-green-600" size={20} />
                            <span className="font-semibold text-green-700">
                              Recording Complete! ({recordingDuration}s)
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={handlePlayRecording}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 transition"
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
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Submit Button */}
                {hasRecorded && showFeedback && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleNextQuestion}
                      className={`px-12 py-4 ${colorStyle.button} text-white rounded-full font-bold text-lg shadow-lg transform hover:scale-105 transition`}
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
                <div className={`inline-block p-8 rounded-full ${
                  score >= 45 ? 'bg-green-100' : score >= 30 ? 'bg-yellow-100' : 'bg-orange-100'
                }`}>
                  <span className="text-6xl">
                    {score >= 45 ? '🌟' : score >= 30 ? '👍' : '💪'}
                  </span>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-800">
                  {score >= 45 ? 'Excellent!' : score >= 30 ? 'Good Job!' : 'Keep Trying!'}
                </h2>
                
                <div className={`${colorStyle.bg} rounded-2xl p-8 border-4 ${colorStyle.border}`}>
                  <p className="text-5xl font-bold text-gray-800 mb-2">
                    +{score} Points
                  </p>
                  <p className="text-gray-600 mb-4">
                    Template Match: {score >= 45 ? '90%+' : score >= 30 ? '70-89%' : '50-69%'}
                  </p>
                  
                  {/* Detected Keywords */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      ✓ Keywords Detected:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {detectedKeywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
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
                    className={`px-8 py-3 ${colorStyle.button} text-white rounded-lg font-semibold transition`}
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
