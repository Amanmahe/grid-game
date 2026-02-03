// components/InfoPanel.tsx
import React from 'react';

interface InfoPanelProps {
  commandLog: string[];
}

const InfoPanel: React.FC<InfoPanelProps> = ({ commandLog }) => {
  return (
    <div 
      className="rounded-xl p-6 mt-8 backdrop-blur-lg border-2 w-full max-w-[1400px]"
      style={{
        background: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white'
      }}
    >
      <div 
        className="text-lg font-bold mb-4 flex items-center gap-2"
        style={{
          color: '#90e0ef'
        }}
      >
        <span>📝</span> Command Log & System Information
      </div>
      <div 
        className="max-h-40 overflow-y-auto font-mono text-sm p-4 rounded-lg border"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        {commandLog.map((log, index) => (
          <div key={index} className="mb-1">
            <span style={{ color: '#90e0ef' }}>
              [{new Date().toLocaleTimeString()}]
            </span> {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoPanel;