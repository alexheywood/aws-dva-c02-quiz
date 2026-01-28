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

const MASTERY_KEY = 'aws_dva_mastery_mobile'; 
const STREAK_KEY = 'aws_dva_streak_mobile';

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

  // Calculate Mastery Stats
  const masteryStats = useMemo(() => {
    const stats = {};
    DOMAINS.forEach(domain => {
      const domainQuestions = QUESTIONS_DB.filter(q => q.domain === domain);
      const totalInDomain = domainQuestions.length || 1;
      const masteredCount = domainQuestions.filter(q => (mastery[q.id] || 0) >= 4).length;
      stats[domain] = {
        percent: Math.round((masteredCount / totalInDomain) * 100),
        mastered: masteredCount,
        total: domainQuestions.length
      };
    });
    return stats;
  }, [mastery]);

  useEffect(() => {
    const savedMastery = localStorage.getItem(MASTERY_KEY);
    if (savedMastery) setMastery(JSON.parse(savedMastery));

    const savedStreak = JSON.parse(localStorage.getItem(STREAK_KEY) || '{"count": 0, "lastDate": null}');
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (savedStreak.lastDate === today || savedStreak.lastDate === yesterday) {
      setStreak(savedStreak.count);
    }
  }, []);

  const startQuiz = () => {
    const weakest = DOMAINS.reduce((prev, curr) => 
      masteryStats[curr].percent < masteryStats[prev].percent ? curr : prev
    );

    let selected = [];
    DOMAINS.forEach(domain => {
      const count = domain === weakest ? 4 : 1;
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
    
    const newM = isCorrect ? Math.min((mastery[q.id] || 0) + 1, 4) : 0;
    const updatedMastery = { ...mastery, [q.id]: newM };
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
      const newStreak = { count: streak + 1, lastDate: today };
      localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
      setStreak(newStreak.count);
      setGameState('results');
    }
  };

  if (gameState === 'menu') {
    const totalMastered = Object.values(mastery).filter(v => v === 4).length;
    return (
      <div className="md:mx-auto h-[100dvh] w-full md:w-1/2 bg-slate-50 flex flex-col p-4 overflow-hidden">
        <header className="mt-4 mb-4 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AWS DVA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery Level</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-orange-200">
              <Flame size={14} fill="currentColor" />
              <span className="text-sm font-black">{streak}</span>
            </div>
            <div className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-indigo-200">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-black">{totalMastered}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-hide">
          {DOMAINS.map(domain => {
            const stats = masteryStats[domain];
            return (
              <div key={domain} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-transform active:scale-[0.98]">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col max-w-[75%]">
                    <span className="text-sm font-bold text-slate-800 leading-tight truncate">{domain}</span>
                    <span className="text-[10px] font-bold text-slate-400">{stats.mastered}/{stats.total} Mastered</span>
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
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-all shrink-0 mb-2"
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
      <div className="h-[100dvh] w-full md:w-1/2 md:mx-auto bg-white flex flex-col p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="shrink-0 mb-4 pt-2">
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => setGameState('menu')} className="p-1 -ml-1 text-slate-400">
              <ChevronLeft size={24} />
            </button>
            <div className="flex gap-1 bg-gray-50 p-3 rounded-lg">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-3 h-1.5 rounded-full ${i < mLevel ? 'bg-amber-400' : 'bg-gray-200'}`} />
              ))}
            </div>
            <span className="text-xs font-black text-indigo-600 tabular-nums">{currentIndex + 1}/{currentQuestions.length}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full">
            <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <h2 className="text-lg font-black text-slate-800 mb-4 leading-snug tracking-tight shrink-0">
            {q.question}
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2.5 pb-4 scrollbar-hide">
            {q.options.map((opt, i) => {
              const isSelected = selectedOptions.includes(i);
              const isCorrect = q.correct.includes(i);
              let style = "w-full text-left p-4 rounded-xl border-2 transition-all flex gap-3 items-start ";
              if (!showExplanation) {
                style += isSelected ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-100 bg-white text-slate-600";
              } else {
                if (isCorrect) style += "border-emerald-500 bg-emerald-50 text-emerald-900";
                else if (isSelected) style += "border-rose-500 bg-rose-50 text-rose-900";
                else style += "opacity-40 border-transparent scale-[0.97]";
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

        <div className="shrink-0 pb-4">
          {!showExplanation ? (
            <button 
              onClick={handleSubmitAnswer}
              disabled={selectedOptions.length === 0}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
                selectedOptions.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white shadow-lg'
              }`}
            >
              {selectedOptions.length < q.correct.length ? `NEED ${q.correct.length - selectedOptions.length} MORE` : 'CONFIRM ANSWER'}
            </button>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-400">
              <div className="bg-slate-900 text-white p-4 rounded-2xl mb-3 flex gap-3 items-start max-h-[160px] overflow-y-auto">
                 <div className="shrink-0 mt-0.5">
                    {userAnswers[currentIndex].isCorrect ? <CheckCircle className="text-emerald-400" size={18}/> : <XCircle className="text-rose-400" size={18}/>}
                 </div>
                 <p className="text-xs leading-relaxed font-medium text-slate-300">{q.explanation}</p>
              </div>
              <button onClick={nextQuestion} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95">
                CONTINUE <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (gameState === 'results') {
    const score = userAnswers.filter(a => a.isCorrect).length;
    const pct = Math.round((score / currentQuestions.length) * 100);
    return (
      <div className="h-[100dvh] w-full md:w-1/2 md:mx-auto bg-white flex flex-col p-6 items-center justify-center text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <Trophy className="text-indigo-600" size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-1">Session Complete</h2>
        <p className="text-sm font-bold text-slate-400 mb-8">{pct}% Accuracy • {score} Correct</p>
        
        <div className="w-full space-y-3">
          {missedQuestions.length > 0 && (
            <button onClick={() => { setCurrentQuestions([...missedQuestions]); setMissedQuestions([]); setCurrentIndex(0); setUserAnswers([]); setSelectedOptions([]); setShowExplanation(false); setGameState('quiz'); }} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-sm shadow-md active:scale-95">
              Review Errors
            </button>
          )}
          <button onClick={() => setGameState('menu')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm active:scale-95">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  function toggleOption(index) {
    if (showExplanation) return;
    const max = currentQuestions[currentIndex].correct.length;
    setSelectedOptions(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (max === 1) return [index];
      return prev.length < max ? [...prev, index] : prev;
    });
  }
};

export default App;