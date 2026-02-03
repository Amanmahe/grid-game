// components/StatsPanel.tsx
import React, { useState, useEffect } from 'react';

interface StatsPanelProps {
  drawnCount: number;
  cursorX: number;
  cursorY: number;
  historyLength: number;
  penState: number;
  lastActionTime: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  drawnCount,
  cursorX,
  cursorY,
  historyLength,
  penState,
  lastActionTime,
}) => {
  const [timeSinceLastAction, setTimeSinceLastAction] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastActionTime) / 1000);
      setTimeSinceLastAction(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActionTime]);

  const getPenStateColor = () => {
    switch (penState) {
      case 0: return 'text-red-600';
      case 1: return 'text-green-600';
      case 2: return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getPenStateText = () => {
    switch (penState) {
      case 0: return 'Disabled';
      case 1: return 'Pen (Draw)';
      case 2: return 'Eraser';
      default: return 'Unknown';
    }
  };

  return (
    <div className="w-full max-w-7xl mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cursor Position */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-gray-800">Cursor Position</span>
            <span className="text-2xl">📍</span>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">X Coordinate:</span>
              <span className="text-2xl font-bold text-blue-600">{cursorX}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Y Coordinate:</span>
              <span className="text-2xl font-bold text-blue-600">{cursorY}</span>
            </div>
          </div>
        </div>

        {/* Drawing Stats */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-gray-800">Drawing Stats</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dots Drawn:</span>
              <span className="text-2xl font-bold text-purple-600">{drawnCount}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">History Size:</span>
              <span className="text-2xl font-bold text-purple-600">{historyLength}</span>
            </div>
          </div>
        </div>

        {/* Pen State */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-gray-800">Tool Status</span>
            <span className="text-2xl">🛠️</span>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Tool:</span>
              <span className={`text-2xl font-bold ${getPenStateColor()}`}>
                {getPenStateText()}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Action:</span>
              <span className={`text-xl font-bold ${getPenStateColor()}`}>
                {penState === 0 ? 'Navigation Only' : 
                 penState === 1 ? 'Drawing' : 'Erasing'}
              </span>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-gray-800">Activity</span>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Action:</span>
              <span className={`text-2xl font-bold ${timeSinceLastAction > 10 ? 'text-red-600' : 'text-green-600'}`}>
                {timeSinceLastAction}s ago
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Status:</span>
              <span className={`text-xl font-bold ${timeSinceLastAction > 10 ? 'text-red-600' : 'text-green-600'}`}>
                {timeSinceLastAction > 10 ? 'Idle' : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;