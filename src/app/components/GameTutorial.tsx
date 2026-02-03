// components/GameTutorial.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PenState, DrawingMode } from '@/types';
import { bleEmitter } from './EEGWhiteboard'; // Import the shared emitter

interface GameLevel {
  id: number;
  title: string;
  shape: string;
  description: string;
  targetGrid: boolean[][];
  columns: number;
  rows: number;
  maxMoves: number;
}

interface GameTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
  bleConnected?: boolean;
  bleEmitter?: any; // Accept the emitter as prop
}

const GameTutorial: React.FC<GameTutorialProps> = ({ 
  onComplete, 
  onSkip,
  bleConnected = false,
  bleEmitter
}) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [playerGrid, setPlayerGrid] = useState<boolean[][]>([]);
  const [moves, setMoves] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cursorX, setCursorX] = useState(7);
  const [cursorY, setCursorY] = useState(7);
  const [penState, setPenState] = useState<PenState>(1);
  const [currentMode, setCurrentMode] = useState<DrawingMode>(0);
  const [score, setScore] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [lastBleAction, setLastBleAction] = useState('');

  // Game levels
  const levels: GameLevel[] = [
    {
      id: 1,
      title: "Level 1: Triangle",
      shape: "▲",
      description: "Trace the triangle using BLE controls",
      columns: 15,
      rows: 15,
      maxMoves: 50,
      targetGrid: Array(15).fill(null).map((_, y) => 
        Array(15).fill(null).map((_, x) => {
          // Triangle shape
          if (y >= 4 && y <= 12) {
            const rowWidth = 12 - y;
            const startX = 7 - Math.floor(rowWidth / 2);
            const endX = startX + rowWidth;
            return x >= startX && x <= endX && (y === 4 || y === 12 || x === startX || x === endX);
          }
          return false;
        })
      )
    },
    {
      id: 2,
      title: "Level 2: Square",
      shape: "■",
      description: "Trace the square using BLE controls",
      columns: 15,
      rows: 15,
      maxMoves: 60,
      targetGrid: Array(15).fill(null).map((_, y) => 
        Array(15).fill(null).map((_, x) => {
          // Square shape
          const top = 5;
          const bottom = 9;
          const left = 5;
          const right = 9;
          
          return (x >= left && x <= right && (y === top || y === bottom)) ||
                 (y >= top && y <= bottom && (x === left || x === right));
        })
      )
    },
    {
      id: 3,
      title: "Level 3: Arrow",
      shape: "➡️",
      description: "Trace the arrow using BLE controls",
      columns: 15,
      rows: 15,
      maxMoves: 70,
      targetGrid: Array(15).fill(null).map((_, y) => 
        Array(15).fill(null).map((_, x) => {
          // Arrow
          const centerY = 7;
          
          if (x >= 3 && x <= 8 && y === centerY) return true;
          
          if (x >= 9 && x <= 11) {
            const distance = x - 9;
            return Math.abs(y - centerY) <= distance;
          }
          return false;
        })
      )
    }
  ];

  // Initialize player grid
  useEffect(() => {
    const level = levels[currentLevel];
    const newGrid = Array(level.rows).fill(null).map(() =>
      Array(level.columns).fill(false)
    );
    setPlayerGrid(newGrid);
    setCursorX(Math.floor(level.columns / 2));
    setCursorY(Math.floor(level.rows / 2));
    setMoves(0);
    setIsComplete(false);
    setShowHint(false);
    setTimeLeft(300);
    setAccuracy(0);
  }, [currentLevel]);

  // Calculate accuracy
  useEffect(() => {
    const level = levels[currentLevel];
    let correctCount = 0;
    let totalTarget = 0;
    
    for (let y = 0; y < level.rows; y++) {
      for (let x = 0; x < level.columns; x++) {
        if (level.targetGrid[y][x]) {
          totalTarget++;
          if (playerGrid[y] && playerGrid[y][x]) {
            correctCount++;
          }
        }
      }
    }
    
    const newAccuracy = totalTarget > 0 ? (correctCount / totalTarget) * 100 : 0;
    setAccuracy(newAccuracy);
    
    if (newAccuracy >= 85 && !isComplete) {
      setIsComplete(true);
      const levelScore = Math.max(0, 100 - moves + Math.floor(timeLeft / 10));
      setScore(prev => prev + levelScore);
    }
  }, [playerGrid, currentLevel, moves, timeLeft, isComplete]);

  // Handle BLE movement in game
  const handleBleMovement = useCallback((direction: number) => {
    if (isComplete) return;
    
    setLastBleAction(`Movement: ${direction}`);
    
    const level = levels[currentLevel];
    let newX = cursorX;
    let newY = cursorY;
    let moved = false;

    console.log('Game: BLE Movement', direction, 'Mode:', currentMode);

    switch (direction) {
      case 9: // Up/Left
        if (currentMode === 0) { // Horizontal: Left
          newX = Math.max(0, cursorX - 1);
          moved = true;
        } else if (currentMode === 1) { // Vertical: Up
          newY = Math.max(0, cursorY - 1);
          moved = true;
        } else if (currentMode === 2) { // Diagonal NW-SE: NW
          newX = Math.max(0, cursorX - 1);
          newY = Math.max(0, cursorY - 1);
          moved = true;
        } else if (currentMode === 3) { // Diagonal NE-SW: NE
          newX = Math.min(level.columns - 1, cursorX + 1);
          newY = Math.max(0, cursorY - 1);
          moved = true;
        }
        break;
        
      case 8: // Down/Right
        if (currentMode === 0) { // Horizontal: Right
          newX = Math.min(level.columns - 1, cursorX + 1);
          moved = true;
        } else if (currentMode === 1) { // Vertical: Down
          newY = Math.min(level.rows - 1, cursorY + 1);
          moved = true;
        } else if (currentMode === 2) { // Diagonal NW-SE: SE
          newX = Math.min(level.columns - 1, cursorX + 1);
          newY = Math.min(level.rows - 1, cursorY + 1);
          moved = true;
        } else if (currentMode === 3) { // Diagonal NE-SW: SW
          newX = Math.max(0, cursorX - 1);
          newY = Math.min(level.rows - 1, cursorY + 1);
          moved = true;
        }
        break;
    }

    if (moved) {
      setCursorX(newX);
      setCursorY(newY);
      setMoves(prev => prev + 1);
      
      // Auto-draw if pen is enabled
      if (penState === 1 || penState === 2) {
        handleDrawAtPosition(newX, newY);
      }
    }
  }, [cursorX, cursorY, currentMode, penState, currentLevel, isComplete]);

  // Handle drawing at position
  const handleDrawAtPosition = useCallback((x: number, y: number) => {
    if (isComplete) return;
    
    setPlayerGrid(prev => {
      const newGrid = [...prev.map(row => [...row])];
      if (penState === 1) { // Draw
        if (!newGrid[y][x]) {
          newGrid[y][x] = true;
          setIsDrawing(true);
          setTimeout(() => setIsDrawing(false), 100);
        }
      } else if (penState === 2) { // Erase
        if (newGrid[y][x]) {
          newGrid[y][x] = false;
          setIsDrawing(true);
          setTimeout(() => setIsDrawing(false), 100);
        }
      }
      return newGrid;
    });
  }, [penState, isComplete]);

  // Setup BLE event listeners for game
  useEffect(() => {
    if (!bleEmitter) return;

    const handleBLEMovement = (direction: number) => {
      console.log('Game: Received movement event', direction);
      handleBleMovement(direction);
    };

    const handleBLEMode = (mode: number) => {
      console.log('Game: Received mode event', mode);
      setCurrentMode(mode as DrawingMode);
      setLastBleAction(`Mode: ${mode}`);
    };

    const handleBLEPen = (state: number) => {
      console.log('Game: Received pen event', state);
      setPenState(state as PenState);
      setLastBleAction(`Pen: ${state === 0 ? 'Off' : state === 1 ? 'Draw' : 'Erase'}`);
    };

    // Register listeners
    bleEmitter.on('movement', handleBLEMovement);
    bleEmitter.on('mode', handleBLEMode);
    bleEmitter.on('pen', handleBLEPen);

    return () => {
      // Cleanup listeners
      bleEmitter.off('movement', handleBLEMovement);
      bleEmitter.off('mode', handleBLEMode);
      bleEmitter.off('pen', handleBLEPen);
    };
  }, [bleEmitter, handleBleMovement]);

  // Timer
  useEffect(() => {
    if (isComplete || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isComplete]);

  // Next level
  const nextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  // Reset level
  const resetLevel = () => {
    const level = levels[currentLevel];
    const newGrid = Array(level.rows).fill(null).map(() =>
      Array(level.columns).fill(false)
    );
    setPlayerGrid(newGrid);
    setMoves(0);
    setIsComplete(false);
    setCursorX(Math.floor(level.columns / 2));
    setCursorY(Math.floor(level.rows / 2));
    setTimeLeft(300);
    setAccuracy(0);
  };

  const level = levels[currentLevel];
  const isLastLevel = currentLevel === levels.length - 1;
  const modeNames = ['Horizontal', 'Vertical', 'Diagonal NW-SE', 'Diagonal NE-SW'];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Render game (same as before, but with BLE status)
  return (
       <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 z-50 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Main Content - Single Screen, No Scroll */}
            <div className="relative h-screen flex flex-col">
                {/* Top Bar */}
                <div className="bg-black/40 backdrop-blur-lg border-b border-white/10 p-4">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                🧠 NeuroArt Training
                            </h1>
                            <div className={`px-3 py-1 rounded-full ${bleConnected ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
                                {bleConnected ? '✅ BLE Connected' : '❌ Connect BLE'}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={onSkip}
                                className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-lg border border-gray-600 transition-all"
                            >
                                Skip to Drawing
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - No Scroll */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Left Panel - Game Info */}
                        <div className="lg:col-span-1 space-y-4 h-full flex flex-col">
                            {/* Game Info Card */}
                            <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10 flex-1">
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-white mb-2">{level.title}</h2>
                                    <p className="text-gray-300 text-sm">{level.description}</p>
                                </div>

                                {/* Score */}
                                <div className="mb-6">
                                    <div className="text-3xl font-bold text-cyan-300">{score}</div>
                                    <div className="text-gray-400 text-sm">Total Score</div>
                                </div>

                                {/* Stats Grid */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-300 text-sm">Accuracy</span>
                                            <span className="font-bold text-white">{accuracy.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-cyan-400 transition-all duration-500"
                                                style={{ width: `${accuracy}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-300 text-sm">Moves</span>
                                            <span className="font-bold text-white">{moves}/{level.maxMoves}</span>
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${moves > level.maxMoves * 0.8 ? 'bg-red-500' :
                                                        moves > level.maxMoves * 0.6 ? 'bg-yellow-500' :
                                                            'bg-blue-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, (moves / level.maxMoves) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-300 text-sm">Time Left</span>
                                            <span className={`font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                                                {minutes}:{seconds.toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                                style={{ width: `${(timeLeft / 300) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Controls Panel */}
                            <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10 flex-1">
                                <h3 className="text-lg font-bold text-white mb-4">🎮 BLE Controls</h3>

                                {/* Mode Indicator */}
                                <div className="mb-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-300 text-sm">Mode</span>
                                        <span className="font-bold text-cyan-300">{modeNames[currentMode]}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1">
                                        {[0, 1, 2, 3].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => handleBleModeSwitch(mode)}
                                                className={`p-2 rounded-lg text-xs ${currentMode === mode
                                                        ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-700'
                                                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                {mode === 0 ? '↔' : mode === 1 ? '↕' : mode === 2 ? '↖' : '↗'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pen State */}
                                <div className="mb-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-300 text-sm">Tool</span>
                                        <span className={`font-bold ${penState === 0 ? 'text-red-400' :
                                                penState === 1 ? 'text-green-400' :
                                                    'text-yellow-400'
                                            }`}>
                                            {penState === 0 ? 'Disabled' : penState === 1 ? 'Draw' : 'Erase'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => handleBlePenToggle()}
                                            className={`p-3 rounded-lg border ${penState === 0
                                                    ? 'border-red-700 bg-red-900/30 text-red-300'
                                                    : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:bg-gray-700/30'
                                                }`}
                                        >
                                            <div className="text-lg">❌</div>
                                            <div className="text-xs mt-1">Off</div>
                                        </button>

                                        <button
                                            onClick={() => handleBlePenToggle()}
                                            className={`p-3 rounded-lg border ${penState === 1
                                                    ? 'border-green-700 bg-green-900/30 text-green-300'
                                                    : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:bg-gray-700/30'
                                                }`}
                                        >
                                            <div className="text-lg">✏️</div>
                                            <div className="text-xs mt-1">Draw</div>
                                        </button>

                                        <button
                                            onClick={() => handleBlePenToggle()}
                                            className={`p-3 rounded-lg border ${penState === 2
                                                    ? 'border-yellow-700 bg-yellow-900/30 text-yellow-300'
                                                    : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:bg-gray-700/30'
                                                }`}
                                        >
                                            <div className="text-lg">🧽</div>
                                            <div className="text-xs mt-1">Erase</div>
                                        </button>
                                    </div>
                                </div>

                                {/* Game Controls */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowHint(!showHint)}
                                        className="w-full p-2 bg-purple-900/30 hover:bg-purple-800/30 text-purple-300 rounded-lg border border-purple-700 transition-all text-sm"
                                    >
                                        💡 {showHint ? 'Hide Hint' : 'Show Hint'}
                                    </button>

                                    <button
                                        onClick={resetLevel}
                                        className="w-full p-2 bg-red-900/30 hover:bg-red-800/30 text-red-300 rounded-lg border border-red-700 transition-all text-sm"
                                    >
                                        🔄 Restart Level
                                    </button>
                                </div>
                            </div>

                            {/* Levels Panel */}
                            <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-3">Levels</h3>
                                <div className="space-y-2">
                                    {levels.map((levelItem, index) => (
                                        <button
                                            key={levelItem.id}
                                            onClick={() => !isComplete && setCurrentLevel(index)}
                                            disabled={isComplete}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${currentLevel === index
                                                    ? 'bg-cyan-900/50 border border-cyan-700'
                                                    : index < currentLevel
                                                        ? 'bg-green-900/30 border border-green-800'
                                                        : 'bg-gray-800/30 border border-gray-700 hover:bg-gray-700/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{levelItem.shape}</span>
                                                <div>
                                                    <div className="text-white font-medium text-sm">Level {levelItem.id}</div>
                                                    <div className="text-gray-400 text-xs">{levelItem.title.split(': ')[1]}</div>
                                                </div>
                                            </div>
                                            {index < currentLevel && (
                                                <span className="text-green-400">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Game Board */}
                        <div className="lg:col-span-3 h-full flex flex-col">
                            <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10 flex-1 flex flex-col">
                                {/* Board Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">Training Board</h3>
                                    <div className="flex gap-2">
                                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${isComplete
                                                ? 'bg-green-900/50 text-green-300 border border-green-700'
                                                : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                                            }`}>
                                            {isComplete ? '🎉 Level Complete!' : '🎯 In Progress'}
                                        </div>
                                    </div>
                                </div>

                                {/* Game Grid */}
                                <div className="flex-1 bg-gray-900/50 rounded-xl border border-white/10 p-4 flex items-center justify-center">
                                    <div
                                        className="grid gap-1"
                                        style={{
                                            gridTemplateColumns: `repeat(${level.columns}, minmax(0, 1fr))`,
                                            width: 'fit-content'
                                        }}
                                    >
                                        {Array.from({ length: level.rows }).map((_, y) => (
                                            Array.from({ length: level.columns }).map((_, x) => {
                                                const isTarget = level.targetGrid[y][x];
                                                const isPlayer = playerGrid[y] && playerGrid[y][x];
                                                const isCursor = x === cursorX && y === cursorY;

                                                let cellClasses = 'w-8 h-8 rounded-md transition-all duration-200';

                                                // Target shape (semi-transparent)
                                                if (isTarget) {
                                                    cellClasses += ' bg-blue-500/20 border border-blue-500/40';
                                                } else {
                                                    cellClasses += ' bg-gray-800/50 border border-gray-700';
                                                }

                                                // Player drawing
                                                if (isPlayer) {
                                                    cellClasses += ' bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]';
                                                }

                                                // Cursor
                                                if (isCursor) {
                                                    cellClasses += ' animate-pulse scale-110 z-10 border-2';
                                                    if (penState === 0) {
                                                        cellClasses += ' border-red-500 bg-red-500/20';
                                                    } else if (penState === 1) {
                                                        cellClasses += ' border-green-500 bg-green-500/20';
                                                    } else {
                                                        cellClasses += ' border-yellow-500 bg-yellow-500/20';
                                                    }

                                                    // Drawing effect
                                                    if (isDrawing) {
                                                        cellClasses += ' ring-2 ring-opacity-50';
                                                        if (penState === 1) {
                                                            cellClasses += ' ring-green-500';
                                                        } else if (penState === 2) {
                                                            cellClasses += ' ring-yellow-500';
                                                        }
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={`${x}-${y}`}
                                                        className={cellClasses}
                                                    />
                                                );
                                            })
                                        ))}
                                    </div>
                                </div>

                                {/* Completion Message */}
                                {isComplete && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl border border-green-700">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-xl font-bold text-green-300 mb-2">🎉 Excellent!</h4>
                                                <p className="text-green-200">
                                                    You mastered level {level.id}! Accuracy: {accuracy.toFixed(1)}%
                                                </p>
                                                <div className="flex gap-6 mt-3">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-cyan-300">{moves}</div>
                                                        <div className="text-green-200 text-sm">Moves</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-purple-300">{Math.floor(timeLeft / 60)}:{seconds.toString().padStart(2, '0')}</div>
                                                        <div className="text-green-200 text-sm">Time Left</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-yellow-300">+{Math.max(0, 100 - moves + Math.floor(timeLeft / 10))}</div>
                                                        <div className="text-green-200 text-sm">Points</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={nextLevel}
                                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                                            >
                                                {isLastLevel ? 'Start Drawing 🎨' : 'Next Level →'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Hint */}
                                {showHint && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-700">
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">💡</div>
                                            <div>
                                                <h4 className="text-lg font-bold text-purple-300 mb-1">Pro Tip:</h4>
                                                <p className="text-purple-200 text-sm">
                                                    {level.id === 1 && "For the triangle, start from top point. Use different modes for different sides."}
                                                    {level.id === 2 && "For the square, switch between horizontal and vertical modes for best results."}
                                                    {level.id === 3 && "For the arrow, use horizontal mode for shaft, diagonal for arrowhead."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Status Bar */}
                <div className="bg-black/40 backdrop-blur-lg border-t border-white/10 p-3">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                            <div className="text-gray-400 text-sm">
                                Use <span className="text-cyan-300 font-bold">BLE Commands</span> to control:
                                <span className="mx-2">• EMG = Move</span>
                                <span className="mx-2">• Triple Blink = Change Tool</span>
                                <span className="mx-2">• Jaw Clench = Change Mode</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-white">{currentLevel + 1}/3</div>
                                    <div className="text-gray-400 text-xs">Level</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-white">{score}</div>
                                    <div className="text-gray-400 text-xs">Score</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
  );
};

export default GameTutorial;
       
       
       
       
       
       
       
       
       
       
       
       

