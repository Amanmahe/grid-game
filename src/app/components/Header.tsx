// components/Header.tsx
import React from 'react';

interface HeaderProps {
  connected: boolean;
  currentMode: number;
  penState: number;
  onConnect: () => void;
  onDisconnect: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  getModeName: (mode?: number) => string;
  getModeSymbol: () => string;
  getModeClass: () => string;
  getPenStateName: () => string;
}

const Header: React.FC<HeaderProps> = ({
  connected,
  currentMode,
  penState,
  onConnect,
  onDisconnect,
  onUndo,
  onRedo,
  onClear,
  getModeName,
  getModeSymbol,
  getModeClass,
  getPenStateName,
}) => {
  const getPenStateColor = () => {
    switch (penState) {
      case 0: return 'bg-red-100 text-red-800 border-red-300';
      case 1: return 'bg-green-100 text-green-800 border-green-300';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPenStateIcon = () => {
    switch (penState) {
      case 0: return '❌';
      case 1: return '✏️';
      case 2: return '🧽';
      default: return '?';
    }
  };

  return (
    <div className="w-full max-w-7xl mb-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left: Title and Status */}
        <div className="flex flex-col items-start gap-3">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00b4d8] to-[#0077b6] bg-clip-text text-transparent">
            NeuroArt EEG Whiteboard
          </h1>
          
          <div className="flex flex-wrap gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${connected ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="font-semibold">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Pen State */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getPenStateColor()}`}>
              <span className="text-lg">{getPenStateIcon()}</span>
              <span className="font-semibold">
                {getPenStateName()}
              </span>
            </div>

            {/* Mode Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-blue-300 bg-blue-100 text-blue-800">
              <span className="text-lg font-bold">{getModeSymbol()}</span>
              <span className="font-semibold">{getModeName()}</span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap gap-3">
          {/* BLE Controls */}
          <div className="flex gap-2">
            {!connected ? (
              <button
                onClick={onConnect}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00b4d8] to-[#0077b6] text-white rounded-lg hover:from-[#0096c7] hover:to-[#005f8a] transition-all shadow-md hover:shadow-lg"
              >
                <span>🔗</span>
                <span className="font-semibold">Connect BLE</span>
              </button>
            ) : (
              <button
                onClick={onDisconnect}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
              >
                <span>🔌</span>
                <span className="font-semibold">Disconnect</span>
              </button>
            )}
          </div>

          {/* Drawing Controls */}
          <div className="flex gap-2">
            <button
              onClick={onUndo}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all shadow-md hover:shadow-lg"
              title="Undo (Ctrl+Z)"
            >
              <span>↶</span>
              <span className="hidden sm:inline font-semibold">Undo</span>
            </button>
            
            <button
              onClick={onRedo}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all shadow-md hover:shadow-lg"
              title="Redo (Ctrl+Y)"
            >
              <span>↷</span>
              <span className="hidden sm:inline font-semibold">Redo</span>
            </button>
            
            <button
              onClick={onClear}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg"
              title="Clear Board"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline font-semibold">Clear</span>
            </button>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Header;