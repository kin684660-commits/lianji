/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  History as HistoryIcon, 
  BarChart3, 
  List, 
  Brush, 
  Check, 
  Calendar as CalendarIcon,
  Search,
  QrCode,
  X,
  ChevronRight,
  RotateCcw,
  Database,
  Clock,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// --- Types ---

type Set = {
  id: string;
  weight: number;
  reps: number;
  rpe: number;
  completed: boolean;
};

type ActiveExercise = {
  id: string;
  name: string;
  sets: Set[];
};

type Plan = {
  id: string;
  name: string;
  exercises: string[];
};

type Workout = {
  id: string;
  date: string;
  title: string;
  category: string;
  sets: Set[];
  duration?: string;
  isRecord?: boolean;
};

// --- Mock Data ---

const MOCK_HISTORY: Workout[] = [
  {
    id: '1',
    date: '10月24日',
    title: '练腿日',
    category: '增肌',
    duration: '1小时 15分',
    isRecord: true,
    sets: [
      { id: 's1', weight: 100, reps: 8, rpe: 8, completed: true },
      { id: 's2', weight: 100, reps: 8, rpe: 9, completed: true },
    ]
  },
  {
    id: '2',
    date: '10月22日',
    title: '推力',
    category: '大重量',
    duration: '55分',
    sets: [
      { id: 's3', weight: 90, reps: 5, rpe: 7, completed: true },
    ]
  },
  {
    id: '3',
    date: '10月20日',
    title: '拉力',
    category: '增肌',
    duration: '1小时 05分',
    sets: [
      { id: 's4', weight: 80, reps: 10, rpe: 7, completed: true },
    ]
  }
];

const STATS_DATA = [
  { name: '10/18', volume: 5200 },
  { name: '10/20', volume: 10100 },
  { name: '10/22', volume: 8200 },
  { name: '10/24', volume: 12450 },
  { name: '10/26', volume: 3420 },
];

const COMMON_EXERCISES = ['卧推', '深蹲', '硬拉', '引体向上', '划船', '推举', '腿举', '二头弯举', '三头下压'];

const PRESET_PLANS: Plan[] = [
  { id: 'p1', name: '周一：胸腿爆发', exercises: ['卧推', '深蹲', '腿举'] },
  { id: 'p2', name: '周三：拉力增肌', exercises: ['硬拉', '引体向上', '划船'] },
  { id: 'p3', name: '周五：全身力量', exercises: ['推举', '硬拉', '卧推'] },
];

// --- Custom Hooks ---

const useLongPress = (onLongPress: () => void, onClick: () => void, ms = 500) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const start = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, ms);
  };

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLongPress.current) onClick();
  };

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 bg-paper rounded-t-3xl z-50 p-6 shadow-2xl max-h-[90vh] overflow-y-auto paper-texture"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-serif">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-ink/5 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const Header = ({ onSettings }: { onSettings: () => void }) => (
  <header className="px-6 py-4 flex items-center justify-between z-20">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 border-2 border-ink flex items-center justify-center rounded-sm rotate-45">
        <Brush className="text-ink -rotate-45 w-5 h-5" strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-widest text-ink">炼记</h1>
        <span className="text-[10px] font-light block -mt-1 tracking-widest opacity-60">RAWLOG</span>
      </div>
    </div>
    <button 
      onClick={onSettings}
      className="w-10 h-10 rounded-full border border-stone-300 bg-white/50 flex items-center justify-center text-stone-600 hover:text-crimson hover:border-crimson transition-colors"
    >
      <Settings className="w-5 h-5" />
    </button>
  </header>
);

const QuickInput = ({ onAdd, activeExerciseName }: { onAdd: (val: string) => void, activeExerciseName: string }) => {
  const [value, setValue] = useState('100 8');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRecord = () => {
    onAdd(value);
    setValue('');
  };

  return (
    <div className="px-5 mt-4 sticky top-0 z-10 bg-gradient-to-b from-paper via-paper to-transparent pb-6 pt-2">
      <div className="relative flex items-center bg-paper-light rounded-sm border-b-2 border-ink h-16 shadow-sm transition-all focus-within:border-crimson">
        <div className="pl-4 pr-3 text-ink opacity-70 flex flex-col items-center">
          <Brush className="w-5 h-5" />
          <span className="text-[8px] font-bold mt-1 text-crimson truncate max-w-[40px]">{activeExerciseName}</span>
        </div>
        <input 
          ref={inputRef}
          className="w-full bg-transparent border-none focus:outline-none text-ink text-2xl font-serif placeholder:text-stone-400 placeholder:text-lg tracking-wide h-full"
          placeholder={`输入 ${activeExerciseName} 数据...`}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRecord()}
        />
        <button 
          onClick={handleRecord}
          className="h-10 mr-3 px-5 bg-ink text-paper font-medium text-sm tracking-widest flex items-center gap-1 hover:bg-crimson transition-colors rounded-sm shadow-md"
        >
          <span>记录</span>
        </button>
      </div>
      <div className="flex justify-between mt-2 text-[10px] font-sans text-stone-500 tracking-widest px-2 uppercase">
        <span>重量 (kg)</span>
        <span>次数</span>
      </div>
    </div>
  );
};

const LastRecordCard = ({ onClone }: { onClone: (w: number, r: number) => void }) => (
  <div className="px-5 mb-10">
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={() => onClone(95, 8)}
      className="bg-paper-light rounded-sm p-6 relative overflow-hidden border border-crimson/10 shadow-md cursor-pointer group"
    >
      <div className="absolute top-0 right-0 w-40 h-40 opacity-5 pointer-events-none">
        <svg fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="20" r="40" stroke="currentColor" strokeWidth="20"></circle>
          <circle cx="80" cy="20" r="25" stroke="currentColor" strokeWidth="5"></circle>
        </svg>
      </div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-crimson"></div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest font-sans">上次记录 • 点击镜像克隆</span>
          </div>
          <h3 className="text-ink text-2xl font-bold tracking-tight mb-2 font-serif">卧推</h3>
          <div className="flex items-baseline gap-2 text-ink">
            <span className="text-4xl font-light font-serif">95</span>
            <span className="text-xs font-sans text-stone-500">公斤</span>
            <span className="mx-1 text-stone-400 font-light">×</span>
            <span className="text-4xl font-light font-serif">8</span>
            <span className="text-xs font-sans text-stone-500">次</span>
          </div>
        </div>
        <div className="h-16 w-24 opacity-80 flex items-end justify-between gap-1.5 pb-1">
          <div className="w-1 bg-stone-300 h-[40%]"></div>
          <div className="w-1 bg-stone-300 h-[60%]"></div>
          <div className="w-1 bg-stone-300 h-[50%]"></div>
          <div className="w-1 bg-stone-300 h-[80%]"></div>
          <div className="w-1.5 bg-crimson h-[100%] relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-crimson"></div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-crimson/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-crimson font-bold text-sm tracking-widest">镜像克隆数据</span>
      </div>
    </motion.div>
  </div>
);

interface SetItemProps {
  set: Set;
  index: number;
  onToggle: (id: string) => void;
  onUpdateRpe: (id: string, rpe: number) => void;
  onDelete: (id: string) => void;
  key?: React.Key;
}

const SetItem = ({ set, index, onToggle, onUpdateRpe, onDelete }: SetItemProps) => {
  const [isAdjustingRpe, setIsAdjustingRpe] = useState(false);

  const handleToggle = () => {
    // Haptic feedback simulation
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]); // Double tap feel
    }
    onToggle(set.id);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden border-l-4 pl-4 pr-4 py-5 flex items-center justify-between shadow-sm transition-all duration-500 ${
        set.completed ? 'bg-ink/5 border-stone-400 opacity-60 grayscale' : 'bg-paper-light border-crimson shadow-lg'
      }`}
    >
      <div className="flex flex-col">
        <span className={`text-[10px] font-bold mb-1 tracking-widest uppercase ${set.completed ? 'text-stone-500' : 'text-crimson'}`}>
          第{['一', '二', '三', '四', '五', '六', '七', '八'][index] || index + 1}组
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-medium text-ink font-serif">{set.weight}</span>
          <span className="text-[10px] text-stone-400 uppercase">公斤</span>
          <span className="mx-2 text-stone-300 font-light">×</span>
          <span className="text-3xl font-medium text-ink font-serif">{set.reps}</span>
          <span className="text-[10px] text-stone-400 uppercase">次</span>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center gap-2">
        <div 
          onClick={() => !set.completed && setIsAdjustingRpe(!isAdjustingRpe)}
          className={`border rounded-sm px-2 py-0.5 cursor-pointer transition-colors ${isAdjustingRpe ? 'border-crimson bg-crimson/5' : 'border-stone-300'}`}
        >
          <span className="text-[10px] text-stone-500 font-sans tracking-wide">RPE {set.rpe}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onDelete(set.id)}
            className="p-1 text-stone-300 hover:text-crimson transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleToggle}
            className={`seal-stamp text-[10px] transform transition-all duration-500 active:scale-95 ${set.completed ? 'rotate-[-8deg] opacity-100' : 'rotate-0 opacity-20'}`}
          >
            完成
          </button>
        </div>
      </div>

      {/* RPE Slider Overlay */}
      <AnimatePresence>
        {isAdjustingRpe && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-paper-light/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20"
          >
            <div className="flex justify-between w-full mb-4">
              <span className="text-xs font-bold text-stone-500">调节主观疲劳感 (RPE)</span>
              <button onClick={() => setIsAdjustingRpe(false)}><X className="w-4 h-4" /></button>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="0.5"
              value={set.rpe} 
              onChange={(e) => onUpdateRpe(set.id, parseFloat(e.target.value))}
              className="w-full accent-crimson"
            />
            <div className="flex justify-between w-full mt-2 text-[10px] text-stone-400">
              <span>轻松 (1)</span>
              <span className="text-crimson font-bold text-lg">{set.rpe}</span>
              <span>力竭 (10)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'log' | 'history' | 'stats'>('log');
  
  // Persistence logic
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>(() => {
    const saved = localStorage.getItem('rawlog_active_exercises');
    return saved ? JSON.parse(saved) : [
      {
        id: 'e1',
        name: '卧推',
        sets: [
          { id: '1', weight: 90, reps: 10, rpe: 7, completed: true },
          { id: '2', weight: 100, reps: 8, rpe: 8, completed: false },
        ]
      }
    ];
  });

  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(() => {
    return localStorage.getItem('rawlog_current_exercise_id') || 'e1';
  });

  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>(() => {
    const saved = localStorage.getItem('rawlog_history');
    return saved ? JSON.parse(saved) : MOCK_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem('rawlog_active_exercises', JSON.stringify(activeExercises));
  }, [activeExercises]);

  useEffect(() => {
    if (currentExerciseId) {
      localStorage.setItem('rawlog_current_exercise_id', currentExerciseId);
    }
  }, [currentExerciseId]);

  useEffect(() => {
    localStorage.setItem('rawlog_history', JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const longPressPlus = useLongPress(
    () => setIsPlansOpen(true),
    () => setIsSearchOpen(true)
  );

  const activeExercise = useMemo(() => 
    activeExercises.find(e => e.id === currentExerciseId) || activeExercises[0] || { id: '', name: '未选择', sets: [] }
  , [activeExercises, currentExerciseId]);

  const totalVolume = useMemo(() => {
    return activeExercises.reduce((acc, ex) => 
      acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + s.weight * s.reps, 0)
    , 0);
  }, [activeExercises]);

  const handleAddSet = (input: string) => {
    if (!currentExerciseId) {
      setIsSearchOpen(true);
      return;
    }
    const parts = input.replace(/[x*]/g, ' ').trim().split(/\s+/);
    const w = parseFloat(parts[0]);
    const r = parseFloat(parts[1]);
    
    if (!isNaN(w) && !isNaN(r)) {
      setActiveExercises(prev => prev.map(ex => 
        ex.id === currentExerciseId 
          ? { ...ex, sets: [...ex.sets, { id: Date.now().toString(), weight: w, reps: r, rpe: 8, completed: false }] }
          : ex
      ));
    }
  };

  const toggleSet = (exId: string, setId: string) => {
    setActiveExercises(prev => prev.map(ex => 
      ex.id === exId 
        ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s) }
        : ex
    ));
  };

  const deleteSet = (exId: string, setId: string) => {
    setActiveExercises(prev => prev.map(ex => 
      ex.id === exId 
        ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) }
        : ex
    ));
  };

  const updateRpe = (exId: string, setId: string, rpe: number) => {
    setActiveExercises(prev => prev.map(ex => 
      ex.id === exId 
        ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, rpe } : s) }
        : ex
    ));
  };

  const addExercise = (name: string) => {
    const newId = Date.now().toString();
    setActiveExercises(prev => [{ id: newId, name, sets: [] }, ...prev]);
    setCurrentExerciseId(newId);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const renameExercise = (id: string, newName: string) => {
    setActiveExercises(prev => prev.map(ex => ex.id === id ? { ...ex, name: newName } : ex));
  };

  const deleteExercise = (id: string) => {
    if (confirm('确定要删除这个动作及其所有记录吗？')) {
      setActiveExercises(prev => prev.filter(ex => ex.id !== id));
      if (currentExerciseId === id) {
        setCurrentExerciseId(activeExercises.find(ex => ex.id !== id)?.id || null);
      }
    }
  };

  const finishWorkout = () => {
    if (activeExercises.every(ex => ex.sets.length === 0)) {
      alert('当前没有训练记录，无法结束');
      return;
    }

    if (confirm('确定要结束本次训练并保存到历史吗？')) {
      const newWorkout: Workout = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
        title: activeExercises[0]?.name || '训练记录',
        category: '常规',
        duration: '1小时', // Mock duration
        sets: activeExercises.flatMap(ex => ex.sets),
        isRecord: false
      };

      setWorkoutHistory([newWorkout, ...workoutHistory]);
      setActiveExercises([]);
      setCurrentExerciseId(null);
      alert('训练已保存！');
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden paper-texture">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <Header onSettings={() => setIsSettingsOpen(true)} />

      <main className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col pb-24 z-10">
        <AnimatePresence mode="wait">
          {view === 'log' ? (
            <motion.div 
              key="log"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col"
            >
              <QuickInput onAdd={handleAddSet} activeExerciseName={activeExercise.name} />
              
              <LastRecordCard onClone={(w, r) => handleAddSet(`${w} ${r}`)} />

              <div className="px-6 mb-6 flex items-end justify-between border-b border-stone-300 pb-2 mx-5">
                <h2 className="text-2xl font-bold text-ink leading-none tracking-tight font-serif">
                  今日<br/><span className="text-stone-400 font-light text-lg">训练</span>
                </h2>
                <div 
                  onClick={() => setIsSummaryOpen(true)}
                  className="flex flex-col items-end pb-1 cursor-pointer group"
                >
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1 group-hover:text-crimson transition-colors">总容量 (点击详情)</span>
                  <span className="text-lg font-serif text-ink border-b-2 border-crimson leading-tight group-hover:scale-105 transition-transform">
                    {totalVolume.toLocaleString()} <span className="text-xs text-stone-500 font-sans">公斤</span>
                  </span>
                </div>
              </div>

              <div className="px-5 mb-6">
                <button 
                  onClick={finishWorkout}
                  className="w-full py-4 bg-crimson text-paper font-bold tracking-[0.2em] rounded-sm shadow-lg hover:bg-crimson/90 transition-all active:scale-[0.98] ink-brush-border"
                >
                  结束本次训练
                </button>
              </div>

              <div className="flex flex-col gap-8 px-5">
                {activeExercises.map((ex) => (
                  <div key={ex.id} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-1.5 h-6 ${ex.id === currentExerciseId ? 'bg-crimson' : 'bg-stone-300'}`}></div>
                        <input 
                          className={`text-xl font-bold font-serif bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full ${ex.id === currentExerciseId ? 'text-ink' : 'text-stone-400'}`}
                          value={ex.name}
                          onChange={(e) => renameExercise(ex.id, e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => deleteExercise(ex.id)}
                          className="p-1 text-stone-300 hover:text-crimson transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setCurrentExerciseId(ex.id)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${
                            ex.id === currentExerciseId 
                              ? 'bg-ink text-paper border-ink' 
                              : 'text-stone-400 border-stone-200 hover:border-crimson hover:text-crimson'
                          }`}
                        >
                          {ex.id === currentExerciseId ? '正在记录' : '切换至此'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {ex.sets.length === 0 ? (
                        <div className="p-8 border border-dashed border-stone-200 rounded-sm text-center text-stone-300 text-xs font-serif">
                          暂无数据，输入上方数据开始记录
                        </div>
                      ) : (
                        [...ex.sets].reverse().map((set, i) => (
                          <SetItem 
                            key={set.id} 
                            set={set} 
                            index={ex.sets.length - 1 - i} 
                            onToggle={(sid) => toggleSet(ex.id, sid)} 
                            onUpdateRpe={(sid, rpe) => updateRpe(ex.id, sid, rpe)}
                            onDelete={(sid) => deleteSet(ex.id, sid)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : view === 'history' ? (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-6"
            >
              <div className="flex items-center justify-between pt-4 mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-ink font-serif">历史记录</h2>
                <button className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center text-crimson">
                  <CalendarIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
                {['所有记录', '个人最佳', '腿部', '推力'].map((tab, i) => (
                  <button 
                    key={tab}
                    className={`px-5 py-2 rounded-sm text-sm whitespace-nowrap ink-brush-border transition-all ${
                      i === 0 ? 'bg-crimson text-paper font-bold shadow-sm' : 'border border-ink/20 text-stone-500 font-medium'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-8 py-4 relative">
                <div className="absolute left-[39px] top-0 bottom-0 w-[2px] bg-ink/10 z-0"></div>
                {workoutHistory.map((workout) => (
                  <div key={workout.id} className="flex gap-6 group">
                    <div className="flex flex-col items-center pt-2 w-8 shrink-0">
                      <div className={`w-3 h-3 rounded-full border ${workout.isRecord ? 'bg-crimson border-crimson/50' : 'bg-ink/30 border-transparent'}`}></div>
                    </div>
                    <div className="flex-1 bg-paper-light rounded-sm p-5 border border-ink/10 shadow-sm transition-transform active:scale-[0.99] relative overflow-hidden ink-brush-border">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-ink font-serif">{workout.date}</h3>
                          <p className="text-stone-500 text-xs font-medium tracking-wide border-l-2 border-crimson/30 pl-2">
                            {workout.title} • {workout.category}
                          </p>
                        </div>
                        {workout.isRecord && <div className="seal-stamp text-[8px] transform rotate-[-5deg]">最佳</div>}
                      </div>
                      <div className="flex items-end justify-between border-t border-ink/10 pt-4">
                        <div>
                          <p className="text-[10px] text-stone-400 tracking-widest mb-1 font-serif uppercase">总吨位</p>
                          <p className="text-2xl font-light text-ink font-serif tracking-tight">
                            {workout.sets.reduce((acc, s) => acc + s.weight * s.reps, 0).toLocaleString()}
                            <span className="text-sm text-stone-500 font-normal ml-1">公斤</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-stone-400 tracking-widest mb-1 font-serif uppercase">时长</p>
                          <p className="text-lg font-medium text-ink/80 font-serif">{workout.duration}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-6 pt-4"
            >
              <h2 className="text-2xl font-bold tracking-tight text-ink font-serif mb-6">数据可视化</h2>
              
              <div className="bg-paper-light p-6 rounded-sm border border-ink/10 shadow-sm mb-6 ink-brush-border">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">总吨位趋势 (公斤)</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={STATS_DATA}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#b91c1c" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fdfbf7', border: '1px solid #eee', borderRadius: '4px', fontFamily: 'serif' }}
                      />
                      <Area type="monotone" dataKey="volume" stroke="#b91c1c" fillOpacity={1} fill="url(#colorVolume)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-paper-light p-4 rounded-sm border border-ink/10 ink-brush-border">
                  <span className="text-[10px] text-stone-400 uppercase font-bold">力量增长</span>
                  <p className="text-xl font-serif text-ink font-bold">+12.5%</p>
                </div>
                <div className="bg-paper-light p-4 rounded-sm border border-ink/10 ink-brush-border">
                  <span className="text-[10px] text-stone-400 uppercase font-bold">训练频率</span>
                  <p className="text-xl font-serif text-ink font-bold">4.2 次/周</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <Modal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} title="动作检索与添加">
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input 
              className="w-full bg-ink/5 border-none rounded-xl pl-12 pr-4 py-4 font-sans focus:ring-2 focus:ring-crimson"
              placeholder="输入动作名称 (如: 卧推)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchQuery && addExercise(searchQuery)}
              autoFocus
            />
          </div>
          
          {searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => addExercise(searchQuery)}
              className="flex items-center gap-4 p-4 bg-crimson text-paper rounded-xl border border-crimson shadow-lg cursor-pointer hover:bg-crimson/90 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
              <div className="flex-1">
                <p className="font-bold text-sm">直接添加为新动作</p>
                <p className="text-xs opacity-80">“{searchQuery}”</p>
              </div>
              <span className="text-[10px] font-bold border border-paper/30 px-2 py-0.5 rounded-sm">回车确认</span>
            </motion.div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              {searchQuery ? '搜索结果' : '常用动作'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_EXERCISES
                .filter(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(ex => (
                <div 
                  key={ex} 
                  onClick={() => addExercise(ex)}
                  className="flex justify-between items-center p-3 bg-ink/5 hover:bg-crimson/5 rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-crimson/20"
                >
                  <span className="font-serif text-sm">{ex}</span>
                  <Plus className="w-4 h-4 text-stone-300 group-hover:text-crimson" />
                </div>
              ))}
              {searchQuery && COMMON_EXERCISES.filter(ex => ex.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="col-span-2 py-8 text-center text-stone-400 text-xs font-serif italic">
                  未找到匹配的常用动作，请点击上方按钮直接添加
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPlansOpen} onClose={() => setIsPlansOpen(false)} title="快捷开启常用计划">
        <div className="space-y-4">
          {PRESET_PLANS.map(plan => (
            <div 
              key={plan.id}
              onClick={() => {
                alert(`已加载计划: ${plan.name}`);
                setIsPlansOpen(false);
              }}
              className="p-5 bg-paper-light border border-ink/10 rounded-sm ink-brush-border flex justify-between items-center hover:bg-crimson/5 transition-colors cursor-pointer group"
            >
              <div>
                <p className="font-bold font-serif text-lg group-hover:text-crimson transition-colors">{plan.name}</p>
                <p className="text-xs text-stone-500">{plan.exercises.join(' • ')}</p>
              </div>
              <ChevronRight className="text-stone-300 group-hover:text-crimson" />
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} title="今日训练清单">
        <div className="space-y-4">
          {activeExercises.map(ex => (
            <div key={ex.id} className="p-4 bg-paper-light border border-ink/10 rounded-sm ink-brush-border flex justify-between items-center">
              <div>
                <p className="font-bold font-serif text-lg">{ex.name}</p>
                <p className="text-xs text-stone-500">
                  {ex.sets.length} 组 • {ex.sets.filter(s => s.completed).reduce((acc, s) => acc + s.weight * s.reps, 0).toLocaleString()} 公斤
                </p>
              </div>
              <button 
                onClick={() => {
                  setCurrentExerciseId(ex.id);
                  setIsSummaryOpen(false);
                }}
                className="text-crimson text-xs font-bold"
              >
                查看
              </button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="个性化配置">
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-ink/5 rounded-xl">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-stone-500" />
              <span className="font-medium">单位设置</span>
            </div>
            <div className="flex bg-paper rounded-lg p-1 border border-ink/10">
              <button className="px-3 py-1 bg-crimson text-paper rounded-md text-xs font-bold">KG</button>
              <button className="px-3 py-1 text-stone-400 text-xs">LB</button>
            </div>
          </div>
          <div className="flex justify-between items-center p-4 bg-ink/5 rounded-xl">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-stone-500" />
              <span className="font-medium">组间休息倒计时</span>
            </div>
            <span className="text-crimson font-bold">60s</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-ink/5 rounded-xl cursor-pointer hover:bg-ink/10 transition-colors">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-stone-500" />
              <span className="font-medium">数据备份与同步</span>
            </div>
            <ChevronRight className="text-stone-300" />
          </div>
        </div>
      </Modal>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-paper/95 backdrop-blur-md border-t border-stone-300 pb-8 pt-4 px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setView('log')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'log' ? 'text-crimson' : 'text-stone-400'}`}
          >
            <List className="w-6 h-6" />
            <span className="text-[10px] font-bold font-sans">日志</span>
          </button>

          <div className="relative">
            <button 
              {...longPressPlus}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-ink text-paper rounded-sm rotate-45 p-3 shadow-lg border-4 border-paper transform transition-transform hover:scale-110 active:bg-crimson z-40"
            >
              <Plus className="w-6 h-6 -rotate-45" />
            </button>
          </div>

          <button 
            onClick={() => setView('history')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'history' ? 'text-crimson' : 'text-stone-400'}`}
          >
            <HistoryIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold font-sans">历史</span>
          </button>
          
          <button 
            onClick={() => setView('stats')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'stats' ? 'text-crimson' : 'text-stone-400'}`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-bold font-sans">统计</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
