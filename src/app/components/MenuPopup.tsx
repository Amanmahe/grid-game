// components/MenuPopup.tsx
import { MenuItem } from '@/app/types';

interface MenuPopupProps {
  active: boolean;
  selection: number;
  items: MenuItem[];
  onClose: () => void;
  onSelect: (index: number) => void;
}

const MenuPopup: React.FC<MenuPopupProps> = ({
  active,
  selection,
  items,
  onClose,
  onSelect,
}) => {
  if (!active) return null;

  // Gradient definitions for menu items
  const getGradient = (index: number) => {
    switch (index) {
      case 0: return 'linear-gradient(45deg, #4CAF50, #45a049)';
      case 1: return 'linear-gradient(45deg, #f44336, #d32f2f)';
      case 2: return 'linear-gradient(45deg, #9C27B0, #7B1FA2)';
      case 3: return 'linear-gradient(45deg, #FF9800, #F57C00)';
      case 4: return 'linear-gradient(45deg, #607D8B, #455A64)';
      default: return 'linear-gradient(45deg, #4CAF50, #45a049)';
    }
  };

  const getSelectedGradient = (index: number) => {
    switch (index) {
      case 0: return 'linear-gradient(45deg, #45a049, #3d8b40)';
      case 1: return 'linear-gradient(45deg, #d32f2f, #b71c1c)';
      case 2: return 'linear-gradient(45deg, #7B1FA2, #6A1B9A)';
      case 3: return 'linear-gradient(45deg, #F57C00, #E65100)';
      case 4: return 'linear-gradient(45deg, #455A64, #37474F)';
      default: return 'linear-gradient(45deg, #45a049, #3d8b40)';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50 backdrop-blur-sm animate-fade-in"
        style={{
          background: 'rgba(26, 26, 46, 0.9)'
        }}
        onClick={onClose}
      />

      {/* Menu Popup */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl p-10 shadow-2xl z-50 min-w-[500px] max-w-[700px] text-center border-4 border-[#00b4d8] backdrop-blur-xl animate-popup-appear"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #f8f9fa)'
        }}
      >
        <div className="text-2xl font-bold text-[#1a1a2e] mb-8 pb-4 border-b-4 border-[#00b4d8] flex items-center justify-center gap-4">
          <span>🎨</span> NeuroArt Menu
        </div>
        
        <div className="space-y-4 mb-8">
          {items.map((item, index) => {
            const isSelected = index === selection;
            const gradient = isSelected ? getSelectedGradient(index) : getGradient(index);
            
            return (
              <div
                key={item.id}
                style={{
                  background: gradient,
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected 
                    ? '0 10px 30px rgba(0, 0, 0, 0.2)'
                    : '0 5px 15px rgba(0, 0, 0, 0.1)',
                  border: `3px solid ${isSelected ? getBorderColor(index) : 'transparent'}`
                }}
                className="w-full px-8 py-5 rounded-xl font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-4 text-white hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]"
                onClick={() => onSelect(index)}
              >
                <span>{item.icon}</span>
                {item.name}
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between text-gray-600 text-sm mb-6 px-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#00b4d8] text-lg">←</span>
            Right EMG: Navigate Left
          </div>
          <div className="flex items-center gap-2">
            Left EMG: Navigate Right
            <span className="font-bold text-[#00b4d8] text-lg">→</span>
          </div>
        </div>
        
        <div className="text-gray-600 mt-6 pt-6 border-t-2 border-gray-200 leading-relaxed">
          Navigate with EMG signals, select with{' '}
          <span 
            className="font-bold px-2 py-1 rounded-md"
            style={{
              color: '#4CAF50',
              background: 'rgba(76, 175, 80, 0.1)'
            }}
          >
            Triple Blink 👁️👁️👁️
          </span>
        </div>
        
        <div 
          className="text-green-500 font-bold mt-4 px-5 py-3 rounded-xl border-2 border-green-500 flex items-center justify-center gap-3 animate-hint-pulse"
          style={{
            background: 'rgba(76, 175, 80, 0.15)'
          }}
        >
          <span>⚠️</span>
          Perform Triple Blink (3 rapid blinks) to select highlighted option
        </div>
      </div>
    </>
  );
};

// Helper function for border colors
const getBorderColor = (index: number) => {
  switch (index) {
    case 0: return '#2e7d32';
    case 1: return '#c62828';
    case 2: return '#8e24aa';
    case 3: return '#ff9800';
    case 4: return '#546e7a';
    default: return '#2e7d32';
  }
};

export default MenuPopup;