// components/Whiteboard.tsx
import React, { useState, useEffect } from 'react';

interface WhiteboardProps {
  columns: number;
  rows: number;
  cursorX: number;
  cursorY: number;
  currentMode: number;
  penState: number; // 0 = disabled, 1 = pen, 2 = eraser
  menuActive: boolean;
  onDotClick: (x: number, y: number) => void;
  grid?: boolean[][];
  onGridUpdate?: (x: number, y: number, value: boolean) => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({
  columns,
  rows,
  cursorX,
  cursorY,
  currentMode,
  penState,
  menuActive,
  onDotClick,
  grid: externalGrid,
  onGridUpdate,
}) => {
  // Use external grid if provided, otherwise use internal state
  const [internalGrid, setInternalGrid] = useState<boolean[][]>([]);
  const grid = externalGrid || internalGrid;

  // Initialize grid
  useEffect(() => {
    if (!externalGrid) {
      const newGrid = Array(rows).fill(null).map(() => 
        Array(columns).fill(false)
      );
      setInternalGrid(newGrid);
    }
  }, [columns, rows, externalGrid]);

  // Handle click - update grid based on pen state
  const handleDotClick = (x: number, y: number) => {
    if (!menuActive) {
      if (penState !== 0 && onGridUpdate) {
        // If pen is enabled (1) or eraser is enabled (2)
        const currentValue = grid[y]?.[x] || false;
        if (penState === 1) {
          // Pen mode: draw (set to true)
          if (!currentValue) {
            onGridUpdate(x, y, true);
          }
        } else if (penState === 2) {
          // Eraser mode: erase (set to false)
          if (currentValue) {
            onGridUpdate(x, y, false);
          }
        }
      }
      onDotClick(x, y);
    }
  };

  // Calculate direction arrows
  const getDirectionArrows = () => {
    const arrows: {x: number, y: number, direction: string}[] = [];
    
    switch (currentMode) {
      case 0: // Horizontal
        if (cursorX > 0) arrows.push({x: cursorX - 1, y: cursorY, direction: 'left'});
        if (cursorX < columns - 1) arrows.push({x: cursorX + 1, y: cursorY, direction: 'right'});
        break;
      case 1: // Vertical
        if (cursorY > 0) arrows.push({x: cursorX, y: cursorY - 1, direction: 'up'});
        if (cursorY < rows - 1) arrows.push({x: cursorX, y: cursorY + 1, direction: 'down'});
        break;
      case 2: // Diagonal NW-SE
        if (cursorX > 0 && cursorY > 0) arrows.push({x: cursorX - 1, y: cursorY - 1, direction: 'up-left'});
        if (cursorX < columns - 1 && cursorY < rows - 1) arrows.push({x: cursorX + 1, y: cursorY + 1, direction: 'down-right'});
        break;
      case 3: // Diagonal NE-SW
        if (cursorX < columns - 1 && cursorY > 0) arrows.push({x: cursorX + 1, y: cursorY - 1, direction: 'up-right'});
        if (cursorX > 0 && cursorY < rows - 1) arrows.push({x: cursorX - 1, y: cursorY + 1, direction: 'down-left'});
        break;
    }
    
    return arrows;
  };

  const directionArrows = getDirectionArrows();
  const modeNames = ['Horizontal', 'Vertical', 'Diagonal NW-SE', 'Diagonal NE-SW'];
  const penStateNames = ['Disabled', 'Pen (Draw)', 'Eraser'];
  const penStateIcons = ['❌', '✏️', '🧽'];

  // Helper to get arrow symbol
  const getArrowSymbol = (direction?: string) => {
    switch (direction) {
      case 'up': return '⬆';
      case 'down': return '⬇';
      case 'left': return '⬅';
      case 'right': return '➡';
      case 'up-left': return '↖';
      case 'up-right': return '↗';
      case 'down-left': return '↙';
      case 'down-right': return '↘';
      default: return '';
    }
  };

  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, #ffffff, #f8f9fa)'
      }}
      className="rounded-2xl p-4 shadow-2xl w-full h-[75vh] flex flex-col border-4 border-[#00b4d8]"
    >
      {/* Whiteboard Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white/90 rounded-xl p-4 mb-4 shadow-lg">
        <div className="flex flex-wrap gap-4 mb-4 lg:mb-0">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            penState === 0 ? 'bg-red-50' : 
            penState === 1 ? 'bg-green-50' : 
            'bg-yellow-50'
          }`}>
            <span>{penStateIcons[penState]}</span>
            <span className="font-bold">Tool: {penStateNames[penState]}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <span>📏</span>
            <span className="font-bold">Grid: {columns}×{rows}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <span>🎯</span>
            <span className="font-bold">Mode: {modeNames[currentMode]}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <span>🖊️</span>
            <span className="font-bold">Drawn: {grid.flat().filter(cell => cell).length} dots</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
          <span>⏱️</span>
          <span className="font-bold">Last Action: 0s ago</span>
        </div>
      </div>

      {/* Whiteboard Grid */}
      <div className="flex-1 bg-gray-100 p-4 rounded-xl overflow-hidden">
        <div 
          className="grid gap-px w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: rows }).map((_, y) => (
            Array.from({ length: columns }).map((_, x) => {
              const isCursor = x === cursorX && y === cursorY;
              const isDrawn = grid[y] && grid[y][x];
              const isArrow = directionArrows.some(arrow => arrow.x === x && arrow.y === y);
              const arrowDirection = directionArrows.find(arrow => arrow.x === x && arrow.y === y)?.direction;
              const arrowSymbol = getArrowSymbol(arrowDirection);

              // Build CSS classes based on state
              let dotClasses = 'rounded-full transition-all duration-200 cursor-pointer aspect-square flex items-center justify-center border border-gray-200';
              
              if (isDrawn) {
                dotClasses += ' bg-gray-900 shadow-[0_0_5px_rgba(26,26,46,0.3)]';
              } else {
                dotClasses += ' bg-white hover:bg-blue-50 hover:scale-110';
              }

              if (isCursor) {
                // Different cursor styles based on pen state
                if (penState === 0) {
                  // Disabled - Red X
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`${dotClasses} animate-pulse scale-125 shadow-[0_0_20px_rgba(239,68,68,0.8)] z-20`}
                      style={{
                        position: 'relative',
                        background: isDrawn ? '#1a1a2e' : 'transparent'
                      }}
                      onClick={() => handleDotClick(x, y)}
                    >
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          color: '#ef4444',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          textShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                        }}
                      >
                        X
                      </div>
                    </div>
                  );
                } else if (penState === 1) {
                  // Pen mode - Green O
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`${dotClasses} animate-pulse scale-125 shadow-[0_0_20px_rgba(34,197,94,0.8)] z-20`}
                      style={{
                        position: 'relative',
                        background: isDrawn ? '#1a1a2e' : 'transparent'
                      }}
                      onClick={() => handleDotClick(x, y)}
                    >
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          color: '#22c55e',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          textShadow: '0 0 8px rgba(34, 197, 94, 0.8)'
                        }}
                      >
                        O
                      </div>
                    </div>
                  );
                } else {
                  // Eraser mode - Yellow E
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`${dotClasses} animate-pulse scale-125 shadow-[0_0_20px_rgba(234,179,8,0.8)] z-20`}
                      style={{
                        position: 'relative',
                        background: isDrawn ? '#1a1a2e' : 'transparent'
                      }}
                      onClick={() => handleDotClick(x, y)}
                    >
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          color: '#eab308',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          textShadow: '0 0 8px rgba(234, 179, 8, 0.8)'
                        }}
                      >
                        E
                      </div>
                    </div>
                  );
                }
              } else if (isArrow) {
                // Different arrow colors based on pen state
                const bgColor = penState === 0 
                  ? 'rgba(239, 68, 68, 0.3)'  // Red for disabled
                  : penState === 1 
                  ? 'rgba(34, 197, 94, 0.3)'  // Green for pen
                  : 'rgba(234, 179, 8, 0.3)'; // Yellow for eraser
                
                const shadow = penState === 0
                  ? '0 0 10px rgba(239, 68, 68, 0.4)'
                  : penState === 1
                  ? '0 0 10px rgba(34, 197, 94, 0.4)'
                  : '0 0 10px rgba(234, 179, 8, 0.4)';
                
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`${dotClasses} scale-110 z-10`}
                    style={{
                      background: isDrawn ? '#1a1a2e' : bgColor,
                      boxShadow: isDrawn ? '0 0 5px rgba(26,26,46,0.3)' : shadow,
                      position: 'relative'
                    }}
                    onClick={() => handleDotClick(x, y)}
                  >
                    {!isDrawn && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          color: 'white',
                          fontWeight: 'bold',
                          filter: 'drop-shadow(0 0 3px black)',
                          zIndex: 16
                        }}
                      >
                        {arrowSymbol}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div
                    key={`${x}-${y}`}
                    className={dotClasses}
                    onClick={() => handleDotClick(x, y)}
                  />
                );
              }
            })
          ))}
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;