// components/TutorialPanel.tsx
const TutorialPanel = () => {
  return (
    <div 
      className="fixed bottom-5 left-5 p-4 rounded-xl text-sm max-w-xs backdrop-blur-lg border-2 shadow-lg hidden lg:block"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#00b4d8',
        color: 'white'
      }}
    >
      <div 
        className="font-bold mb-3 flex items-center gap-2"
        style={{
          color: '#90e0ef'
        }}
      >
        <span>📚</span> How to Use
      </div>
      <div className="space-y-2">
        {[
          'Jaw Clench: Cycle through modes',
          'Long Jaw Clench (4s): Open menu',
          'EMG Signals: Move cursor',
          'Triple Blink: Select menu items',
          'Single Blink: No action'
        ].map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span style={{ color: '#00b4d8' }}>•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorialPanel;