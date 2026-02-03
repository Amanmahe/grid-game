// components/EEGWhiteboard.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './Header';
import Whiteboard from './Whiteboard';
import MenuPopup from './MenuPopup';
import TutorialPanel from './TutorialPanel';
import StatsPanel from './StatsPanel';
import InfoPanel from './InfoPanel';
import JawTimer from './JawTimer';
import GameTutorial from './GameTutorial';
import { BoardState, MenuItem, DrawingMode, PenState } from '@/types';

// Create a shared BLE event emitter
const createBLEEventEmitter = () => {
  const listeners: Record<string, Function[]> = {
    'movement': [],
    'mode': [],
    'pen': [],
    'jaw': [],
    'menu': [],
    'nav': [],
    'confirm': []
  };

  return {
    on: (event: string, callback: Function) => {
      if (listeners[event]) {
        listeners[event].push(callback);
      }
    },
    off: (event: string, callback: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    },
    emit: (event: string, data: any) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(data));
      }
    }
  };
};

const bleEmitter = createBLEEventEmitter();

const EEGWhiteboard = () => {
  // State variables
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [cursorX, setCursorX] = useState(37);
  const [cursorY, setCursorY] = useState(25);
  const [currentMode, setCurrentMode] = useState<DrawingMode>(0);
  const [penState, setPenState] = useState<PenState>(0);
  const [menuActive, setMenuActive] = useState(false);
  const [menuSelection, setMenuSelection] = useState(0);
  const [jawTimerActive, setJawTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [drawnCount, setDrawnCount] = useState(0);
  const [lastActionTime, setLastActionTime] = useState(Date.now());
  const [connected, setConnected] = useState(false);
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [commandLog, setCommandLog] = useState<string[]>([
    'System initialized. Waiting for BLE connection...',
    'Connect to "ESP32C6_EEG" via Bluetooth',
    'Modes: Horizontal, Vertical, Diagonal NW-SE, Diagonal NE-SW',
    'Triple blink cycles: Disabled → Pen → Eraser → Disabled',
    'Short jaw clench cycles modes, 4s jaw clench opens menu',
  ]);

  // Game tutorial state
  const [showGameTutorial, setShowGameTutorial] = useState(true);

  // Refs
  const lastMoveTime = useRef(0);
  const moveDelay = useRef(200);
  const history = useRef<BoardState[]>([]);
  const historyIndex = useRef(-1);
  const maxHistorySize = 100;
  const columns = useRef(window.innerWidth <= 768 ? (window.innerWidth <= 480 ? 30 : 40) : 70);
  const rows = useRef(28);

  // State refs
  const cursorXRef = useRef(cursorX);
  const cursorYRef = useRef(cursorY);
  const currentModeRef = useRef<DrawingMode>(currentMode);
  const penStateRef = useRef<PenState>(penState);
  const menuActiveRef = useRef(menuActive);
  const menuSelectionRef = useRef(menuSelection);
  const menuItemsRef = useRef<MenuItem[]>([]);

  // Update refs
  useEffect(() => {
    cursorXRef.current = cursorX;
    cursorYRef.current = cursorY;
    currentModeRef.current = currentMode;
    penStateRef.current = penState;
    menuActiveRef.current = menuActive;
    menuSelectionRef.current = menuSelection;
  }, [cursorX, cursorY, currentMode, penState, menuActive, menuSelection]);



  // Initialize grid
  useEffect(() => {
    const initializeGrid = () => {
      const newGrid = Array(rows.current).fill(null).map(() =>
        Array(columns.current).fill(false)
      );
      setGrid(newGrid);
    };
    initializeGrid();
  }, []);

  // Log command
  const logCommand = useCallback((message: string) => {
    console.log(`Command Log: ${message}`);
    const timestamp = new Date().toLocaleTimeString();
    setCommandLog(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
  }, []);

  // Get mode name
  const getModeName = useCallback((mode?: number): string => {
    const m = mode ?? currentMode;
    switch (m) {
      case 0: return 'Horizontal';
      case 1: return 'Vertical';
      case 2: return 'Diagonal NW-SE';
      case 3: return 'Diagonal NE-SW';
      default: return 'Unknown';
    }
  }, [currentMode]);
  const saveState = useCallback(() => {
    const state: BoardState = {
      board: grid.map(row => [...row]),
      cursorX,
      cursorY,
      currentMode,
      penState,
      menuActive,
      menuSelection,
      timestamp: Date.now(),
    };

    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(state);

    if (history.current.length > maxHistorySize) {
      history.current.shift();
    } else {
      historyIndex.current++;
    }
  }, [grid, cursorX, cursorY, currentMode, penState, menuActive, menuSelection]);

  // Menu items
  const menuItems: MenuItem[] = [
    { id: 'game', name: 'Practice Game', icon: '🎮', action: () => setShowGameTutorial(true) },
    {
      id: 'save', name: 'Save Drawing', icon: '💾', action: () => {
        const drawingData = {
          grid,
          cursor: { x: cursorX, y: cursorY },
          mode: currentMode,
          penState,
          timestamp: new Date().toISOString(),
        };
        const dataStr = JSON.stringify(drawingData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `neuroart-${new Date().toISOString().slice(0, 10)}.json`);
        link.click();
        logCommand('💾 Drawing saved');
        alert('Drawing saved!');
      }
    },
    { id: 'close', name: 'Close Menu', icon: '❌', action: () => setMenuActive(false) },
    {
      id: 'clear', name: 'Clear Board', icon: '🧹', action: () => {
        if (confirm('Clear board?')) {
          setGrid(prev => prev.map(row => row.map(() => false)));
          setDrawnCount(0);
          saveState();
          logCommand('🧹 Board cleared');
        }
      }
    },
  ];

  const executeMenuAction = useCallback((selection: number) => {
    const menuItem = menuItems[selection];
    if (menuItem && menuItem.action) {
      menuItem.action();
    }
  }, [menuItems]);

  // Draw or erase at cursor
  const drawAtCursor = useCallback((x: number, y: number) => {
    const currentPenState = penStateRef.current;

    setGrid(prev => {
      const newGrid = [...prev.map(row => [...row])];
      if (newGrid[y] && newGrid[y][x] !== undefined) {
        if (currentPenState === 1) {
          if (!newGrid[y][x]) {
            newGrid[y][x] = true;
            return newGrid;
          }
        } else if (currentPenState === 2) {
          if (newGrid[y][x]) {
            newGrid[y][x] = false;
            return newGrid;
          }
        }
      }
      return prev;
    });

    if (currentPenState === 1) {
      setDrawnCount(prev => prev + 1);
    } else if (currentPenState === 2) {
      setDrawnCount(prev => Math.max(0, prev - 1));
    }

    saveState();
    setLastActionTime(Date.now());
    logCommand(`🎨 ${currentPenState === 1 ? 'Drew' : 'Erased'} at (${x}, ${y})`);
  }, [saveState, logCommand]);



  // Handle movement for main app
  const handleMovement = useCallback((direction: number) => {
    if (menuActiveRef.current) return;

    const now = Date.now();
    if (lastMoveTime.current && (now - lastMoveTime.current) < moveDelay.current) return;
    lastMoveTime.current = now;

    const currentModeValue = currentModeRef.current;
    const currentX = cursorXRef.current;
    const currentY = cursorYRef.current;
    const currentPenState = penStateRef.current;

    let newX = currentX;
    let newY = currentY;
    let moved = false;

    switch (direction) {
      case 9: // Left/Up
        if (currentModeValue === 0) {
          newX = Math.max(0, currentX - 1);
          moved = true;
        } else if (currentModeValue === 1) {
          newY = Math.max(0, currentY - 1);
          moved = true;
        }
        break;

      case 8: // Right/Down
        if (currentModeValue === 0) {
          newX = Math.min(columns.current - 1, currentX + 1);
          moved = true;
        } else if (currentModeValue === 1) {
          newY = Math.min(rows.current - 1, currentY + 1);
          moved = true;
        }
        break;

      case 5: // NW
        if (currentModeValue === 2) {
          newX = Math.max(0, currentX - 1);
          newY = Math.max(0, currentY - 1);
          moved = true;
        }
        break;

      case 3: // SE
        if (currentModeValue === 2) {
          newX = Math.min(columns.current - 1, currentX + 1);
          newY = Math.min(rows.current - 1, currentY + 1);
          moved = true;
        }
        break;

      case 4: // NE
        if (currentModeValue === 3) {
          newX = Math.min(columns.current - 1, currentX + 1);
          newY = Math.max(0, currentY - 1);
          moved = true;
        }
        break;

      case 2: // SW
        if (currentModeValue === 3) {
          newX = Math.max(0, currentX - 1);
          newY = Math.min(rows.current - 1, currentY + 1);
          moved = true;
        }
        break;
    }

    if (moved) {
      const positionChanged = newX !== currentX || newY !== currentY;
      if (positionChanged) {
        if (newX !== currentX) setCursorX(newX);
        if (newY !== currentY) setCursorY(newY);

        if (currentPenState !== 0) {
          drawAtCursor(newX, newY);
        }

        saveState();
        setLastActionTime(Date.now());
      }
    }
  }, [drawAtCursor, saveState]);

  // Handle mode switch for main app
  const handleModeSwitch = useCallback((mode: number) => {
    if (mode >= 0 && mode <= 3) {
      setCurrentMode(mode as DrawingMode);
      setLastActionTime(Date.now());
      logCommand(`🔄 Mode switched to ${getModeName(mode)}`);
    }
  }, [getModeName, logCommand]);

  // Handle pen state change for main app
  const handlePenStateChange = useCallback((state: PenState) => {
    setPenState(state);
    setLastActionTime(Date.now());
    const stateName = state === 0 ? 'Disabled' : state === 1 ? 'Pen' : 'Eraser';
    logCommand(`✏️ Pen state changed to: ${stateName}`);
  }, [logCommand]);

  // Setup BLE event listeners for main app
  useEffect(() => {
    if (showGameTutorial) {
      // Don't listen to BLE events if game is active
      return;
    }

    const handleBLEMovement = (direction: number) => {
      console.log('Main app: Movement event', direction);
      handleMovement(direction);
    };

    const handleBLEMode = (mode: number) => {
      console.log('Main app: Mode event', mode);
      handleModeSwitch(mode);
    };

    const handleBLEPen = (state: number) => {
      console.log('Main app: Pen event', state);
      handlePenStateChange(state as PenState);
    };

    const handleBLEJaw = (seconds: number) => {
      console.log('Main app: Jaw event', seconds);
      setJawTimerActive(true);
      setTimerSeconds(seconds);
      logCommand(`🦷 Jaw timer: ${seconds}s`);
    };

    const handleBLEMenu = () => {
      console.log('Main app: Menu activate');
      setMenuActive(true);
      setMenuSelection(0);
      logCommand('📋 Menu activated');
      setLastActionTime(Date.now());
    };

    bleEmitter.on('movement', handleBLEMovement);
    bleEmitter.on('mode', handleBLEMode);
    bleEmitter.on('pen', handleBLEPen);
    bleEmitter.on('jaw', handleBLEJaw);
    bleEmitter.on('menu', handleBLEMenu);

    return () => {
      bleEmitter.off('movement', handleBLEMovement);
      bleEmitter.off('mode', handleBLEMode);
      bleEmitter.off('pen', handleBLEPen);
      bleEmitter.off('jaw', handleBLEJaw);
      bleEmitter.off('menu', handleBLEMenu);
    };
  }, [showGameTutorial, handleMovement, handleModeSwitch, handlePenStateChange, logCommand]);

  // BLE Data Handler - This runs for ALL BLE data
  const handleBLEData = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const data = new Uint8Array(value.buffer);
    if (data.length < 2) return;

    const command = String.fromCharCode(data[0]);
    const valueData = data[1];

    console.log(`BLE Raw Command: ${command}, Value: ${valueData}`);

    // Emit events for ALL screens
    switch (command) {
      case 'M':
        bleEmitter.emit('movement', valueData);
        break;
      case 'S':
        bleEmitter.emit('mode', valueData);
        break;
      case 'T':
      case 'P':
        const currentPenState = penStateRef.current;
        const newState = ((currentPenState + 1) % 3) as PenState;
        bleEmitter.emit('pen', newState);
        break;
      case 'J':
        bleEmitter.emit('jaw', valueData);
        break;
      case 'A':
        bleEmitter.emit('menu', null);
        break;
      case 'E':
        if (menuActiveRef.current && valueData >= 0 && valueData < menuItemsRef.current.length) {
          executeMenuAction(valueData);
          setMenuActive(false);
          setJawTimerActive(false);
          logCommand(`✅ Selected menu item ${valueData}`);
          setLastActionTime(Date.now());
        }
        break;
      case 'N':
        if (menuActiveRef.current) {
          if (valueData === 0) {
            setMenuSelection(prev => (prev - 1 + menuItemsRef.current.length) % menuItemsRef.current.length);
          } else if (valueData === 1) {
            setMenuSelection(prev => (prev + 1) % menuItemsRef.current.length);
          }
          logCommand(`🧭 Menu navigation: ${valueData === 0 ? 'Left' : 'Right'}`);
          setLastActionTime(Date.now());
        }
        break;
      case 'C':
        if (menuActiveRef.current) {
          logCommand('👁️👁️👁️ Triple blink detected - confirming selection');
          executeMenuAction(menuSelectionRef.current);
          setMenuActive(false);
          setJawTimerActive(false);
          setLastActionTime(Date.now());
        }
        break;
    }
  }, [executeMenuAction, logCommand]);

  // BLE connection
  const connectToBLE = async () => {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth not supported');
      }

      logCommand('🔗 Attempting to connect to BLE device...');

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32C6_EEG' }],
        optionalServices: ['6910123a-eb0d-4c35-9a60-bebe1dcb549d'],
      });

      setBluetoothDevice(device);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('6910123a-eb0d-4c35-9a60-bebe1dcb549d');
      const characteristic = await service.getCharacteristic('5f4f1107-7fc1-43b2-a540-0aa1a9f1ce78');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleBLEData);

      setCharacteristic(characteristic);
      setConnected(true);
      logCommand('✅ Connected to ESP32C6_EEG successfully!');
      logCommand('📡 BLE communication established');
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      setConnected(false);
      logCommand(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      alert('Failed to connect to device. Please ensure:\n1. Device is powered on\n2. Bluetooth is enabled\n3. Device is in range\n4. Try connecting again');
    }
  };

  // Disconnect from BLE
  const disconnect = () => {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
      bluetoothDevice.gatt.disconnect();
    }
    setConnected(false);
    setBluetoothDevice(null);
    setCharacteristic(null);
    logCommand('🔌 Disconnected from device');
  };





  useEffect(() => {
    menuItemsRef.current = menuItems;
  }, [menuItems]);

  // Render Game or Main App
  if (showGameTutorial) {
    return (
      <GameTutorial
        onComplete={() => setShowGameTutorial(false)}
        onSkip={() => setShowGameTutorial(false)}
        bleConnected={connected}
        bleEmitter={bleEmitter} // Pass the emitter to game
      />
    );
  }

  // Main App
  return (
    <div className="flex flex-col items-center min-h-screen w-full p-5 md:p-10 bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <Header
        connected={connected}
        currentMode={currentMode}
        penState={penState}
        onConnect={connectToBLE}
        onDisconnect={disconnect}
        onUndo={() => {
          if (historyIndex.current > 0) {
            historyIndex.current--;
            const state = history.current[historyIndex.current];
            setGrid(state.board || []);
            setCursorX(state.cursorX);
            setCursorY(state.cursorY);
            setCurrentMode(state.currentMode);
            setPenState(state.penState);
            logCommand('↶ Undo');
          }
        }}
        onRedo={() => {
          if (historyIndex.current < history.current.length - 1) {
            historyIndex.current++;
            const state = history.current[historyIndex.current];
            setGrid(state.board || []);
            setCursorX(state.cursorX);
            setCursorY(state.cursorY);
            setCurrentMode(state.currentMode);
            setPenState(state.penState);
            logCommand('↷ Redo');
          }
        }}
        onClear={() => {
          if (confirm('Clear board?')) {
            setGrid(prev => prev.map(row => row.map(() => false)));
            setDrawnCount(0);
            saveState();
            logCommand('🧹 Board cleared');
          }
        }}
        onGameStart={() => setShowGameTutorial(true)}
        getModeName={getModeName}
        getModeSymbol={() => {
          switch (currentMode) {
            case 0: return '↔';
            case 1: return '↕';
            case 2: return '↖';
            case 3: return '↗';
            default: return '?';
          }
        }}
        getModeClass={() => {
          switch (currentMode) {
            case 0: return 'horizontal';
            case 1: return 'vertical';
            case 2: return 'diagonal-nw-se';
            case 3: return 'diagonal-ne-sw';
            default: return '';
          }
        }}
        getPenStateName={() => {
          switch (penState) {
            case 0: return 'Disabled';
            case 1: return 'Pen';
            case 2: return 'Eraser';
            default: return 'Unknown';
          }
        }}
      />

      {jawTimerActive && (
        <JawTimer seconds={timerSeconds} />
      )}

      <Whiteboard
        columns={columns.current}
        rows={rows.current}
        cursorX={cursorX}
        cursorY={cursorY}
        currentMode={currentMode}
        penState={penState}
        menuActive={menuActive}
        onDotClick={(x, y) => {
          setCursorX(x);
          setCursorY(y);
          if (penState !== 0) {
            drawAtCursor(x, y);
          }
        }}
        grid={grid}
        onGridUpdate={(x, y, value) => {
          setGrid(prev => {
            const newGrid = [...prev.map(row => [...row])];
            if (newGrid[y] && newGrid[y][x] !== undefined) {
              newGrid[y][x] = value;
            }
            return newGrid;
          });
          saveState();
        }}
      />

      <MenuPopup
        active={menuActive}
        selection={menuSelection}
        items={menuItems}
        onClose={() => setMenuActive(false)}
        onSelect={(index) => {
          executeMenuAction(index);
          setMenuActive(false);
        }}
      />

      {/* Floating Game Button */}
      <button
        onClick={() => setShowGameTutorial(true)}
        className="fixed bottom-6 right-6 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all flex items-center gap-2 z-40 font-bold"
      >
        <span className="text-xl">🎮</span>
        <span>Practice Game</span>
      </button>
    </div>
  );
};

export default EEGWhiteboard;

// Export the BLE emitter for GameTutorial to use
export { bleEmitter };