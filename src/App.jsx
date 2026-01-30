import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  ChevronRight,
  CheckSquare,
  Square,
  Flame,
  Star,
  ChevronLeft
} from 'lucide-react';

import QUESTIONS_DB from './questions.json'

const DOMAINS = [
  "Development with AWS Services",
  "Refactoring",
  "Deployment",
  "Security",
  "Monitoring and Troubleshooting"
];

const MASTERY_KEY = 'aws_dva_mastery_v2'; 
const STREAK_KEY = 'aws_dva_streak_v2';

const App = () => {
  const [gameState, setGameState] = useState('menu');
  const [mastery, setMastery] = useState({});
  const [streak, setStreak] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [missedQuestions, setMissedQuestions] = useState([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedMastery = localStorage.getItem(MASTERY_KEY);
    if (savedMastery) setMastery(JSON.parse(savedMastery));

    const savedStreakData = localStorage.getItem(STREAK_KEY);
    if (savedStreakData) {
      const { count, lastDate } = JSON.parse(savedStreakData);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (lastDate === today || lastDate === yesterday) {
        setStreak(count);
      } else {
        setStreak(0); // Streak broken
      }
    }
  }, []);

  // Fixed Mastery Stats Calculation
  const masteryStats = useMemo(() => {
    const stats = {};
    DOMAINS.forEach(domain => {
      const domainQuestions = QUESTIONS_DB.filter(q => q.domain === domain);
      const totalInDomain = domainQuestions.length;
      
      // Explicitly check mastery mapping for questions belonging to this domain
      const masteredCount = domainQuestions.filter(q => (mastery[q.id] || 0) >= 4).length;
      
      stats[domain] = {
        percent: totalInDomain > 0 ? Math.round((masteredCount / totalInDomain) * 100) : 0,
        mastered: masteredCount,
        total: totalInDomain
      };
    });
    return stats;
  }, [mastery]);

  const startQuiz = () => {
    const weakest = DOMAINS.reduce((prev, curr) => 
      masteryStats[curr].percent < masteryStats[prev].percent ? curr : prev
    );

    let selected = [];
    DOMAINS.forEach(domain => {
      const count = domain === weakest ? 3 : 1; 
      const pool = QUESTIONS_DB.filter(q => q.domain === domain);
      const prioritized = [...pool].sort((a, b) => (mastery[a.id] || 0) - (mastery[b.id] || 0));
      selected = [...selected, ...prioritized.slice(0, count)];
    });

    setCurrentQuestions(selected.sort(() => 0.5 - Math.random()));
    setMissedQuestions([]);
    setCurrentIndex(0);
    setUserAnswers([]);
    setSelectedOptions([]);
    setShowExplanation(false);
    setGameState('quiz');
  };

  const handleSubmitAnswer = () => {
    const q = currentQuestions[currentIndex];
    const isCorrect = selectedOptions.length === q.correct.length && 
                      selectedOptions.every(val => q.correct.includes(val));
    
    // Update mastery logic
    const currentLevel = mastery[q.id] || 0;
    const newLevel = isCorrect ? Math.min(currentLevel + 1, 4) : 0;
    
    const updatedMastery = { ...mastery, [q.id]: newLevel };
    setMastery(updatedMastery);
    localStorage.setItem(MASTERY_KEY, JSON.stringify(updatedMastery));

    if (!isCorrect) setMissedQuestions(p => [...p, q]);
    setUserAnswers([...userAnswers, { questionId: q.id, isCorrect }]);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptions([]);
      setShowExplanation(false);
    } else {
      const today = new Date().toDateString();
      const newStreakCount = streak + 1;
      setStreak(newStreakCount);
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newStreakCount, lastDate: today }));
      setGameState('results');
    }
  };

  const toggleOption = (index) => {
    if (showExplanation) return;
    const max = currentQuestions[currentIndex].correct.length;
    setSelectedOptions(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (max === 1) return [index];
      return prev.length < max ? [...prev, index] : prev;
    });
  };

  if (gameState === 'menu') {
    const totalMastered = Object.values(mastery).filter(v => v >= 4).length;
    return (
      <div className="md:mx-auto h-[100dvh] w-full md:max-w-md bg-slate-50 flex flex-col p-4 overflow-hidden">
        <header className="mt-4 mb-6 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AWS DVA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery Dashboard</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-orange-200 shadow-sm">
              <Flame size={14} fill="currentColor" />
              <span className="text-sm font-black">{streak}</span>
            </div>
            <div className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-indigo-200 shadow-sm">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-black">{totalMastered}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {DOMAINS.map(domain => {
            const stats = masteryStats[domain];
            return (
              <div key={domain} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all active:scale-[0.98]">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col max-w-[75%]">
                    <span className="text-sm font-bold text-slate-800 leading-tight">{domain}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{stats.mastered}/{stats.total} Mastered</span>
                  </div>
                  <span className="text-sm font-black text-indigo-600">{stats.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-700" 
                    style={{ width: `${stats.percent}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={startQuiz} 
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-all shrink-0 mb-4"
        >
          START DAILY SESSION
        </button>
      </div>
    );
  }

  if (gameState === 'quiz') {
    const q = currentQuestions[currentIndex];
    const mLevel = mastery[q.id] || 0;
    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;

    return (
      <div className="h-[100dvh] w-full md:max-w-md md:mx-auto bg-white flex flex-col p-4 animate-in fade-in duration-300">
        <div className="shrink-0 mb-6 pt-2">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setGameState('menu')} className="p-1 -ml-1 text-slate-400">
              <ChevronLeft size={24} />
            </button>
            <div className="flex gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-3.5 h-1.5 rounded-full ${i < mLevel ? 'bg-amber-400' : 'bg-slate-200'}`} />
              ))}
            </div>
            <span className="text-xs font-black text-indigo-600 tabular-nums">{currentIndex + 1}/{currentQuestions.length}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <h2 className="text-lg font-black text-slate-800 mb-6 leading-snug tracking-tight shrink-0">
            {q.question}
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pb-6 pr-1">
            {q.options.map((opt, i) => {
              const isSelected = selectedOptions.includes(i);
              const isCorrect = q.correct.includes(i);
              let style = "w-full text-left p-4 rounded-xl border-2 transition-all flex gap-4 items-start ";
              
              if (!showExplanation) {
                style += isSelected ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm" : "border-slate-100 bg-white text-slate-600";
              } else {
                if (isCorrect) style += "border-emerald-500 bg-emerald-50 text-emerald-900";
                else if (isSelected) style += "border-rose-500 bg-rose-50 text-rose-900";
                else style += "opacity-40 border-slate-50 scale-[0.97]";
              }

              return (
                <button key={i} onClick={() => toggleOption(i)} disabled={showExplanation} className={style}>
                  <div className="shrink-0 mt-0.5">
                    {isSelected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-slate-200" />}
                  </div>
                  <span className="text-sm font-bold leading-tight">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 pt-4 mb-4">
          {!showExplanation ? (
            <button 
              onClick={handleSubmitAnswer}
              disabled={selectedOptions.length === 0}
              className={`w-full py-5 rounded-2xl font-black text-base transition-all ${
                selectedOptions.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              }`}
            >
              {selectedOptions.length < q.correct.length ? `SELECT ${q.correct.length - selectedOptions.length} MORE` : 'CONFIRM ANSWER'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-5 rounded-2xl flex gap-4 items-start shadow-xl">
                 <div className="shrink-0 mt-1">
                    {userAnswers[currentIndex]?.isCorrect ? <CheckCircle className="text-emerald-400" size={20}/> : <XCircle className="text-rose-400" size={20}/>}
                 </div>
                 <p className="text-xs leading-relaxed font-medium text-slate-300">{q.explanation}</p>
              </div>
              <button onClick={nextQuestion} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                CONTINUE <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    const score = userAnswers.filter(a => a.isCorrect).length;
    const pct = Math.round((score / currentQuestions.length) * 100);
    return (
      <div className="h-[100dvh] w-full md:max-w-md md:mx-auto bg-white flex flex-col p-8 items-center justify-center text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner ring-8 ring-indigo-50/50">
          <Trophy className="text-indigo-600" size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Session Complete!</h2>
        <p className="text-sm font-bold text-slate-400 mb-10 tracking-wide uppercase">{pct}% Accuracy • {score} Correct</p>
        
        <div className="w-full space-y-4">
          {missedQuestions.length > 0 && (
            <button 
              onClick={() => { 
                setCurrentQuestions([...missedQuestions]); 
                setMissedQuestions([]); 
                setCurrentIndex(0); 
                setUserAnswers([]); 
                setSelectedOptions([]); 
                setShowExplanation(false); 
                setGameState('quiz'); 
              }} 
              className="w-full bg-rose-500 text-white py-5 rounded-2xl font-black text-base shadow-lg shadow-rose-100 active:scale-95"
            >
              REVIEW MISTAKES ({missedQuestions.length})
            </button>
          )}
          <button 
            onClick={() => setGameState('menu')} 
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-base active:scale-95"
          >
            BACK TO HOME
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default App;