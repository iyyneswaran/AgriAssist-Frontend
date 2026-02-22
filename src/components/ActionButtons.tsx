import React from 'react';
import { Mic, Camera, Star } from 'lucide-react';

const ActionButtons: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button className="glass-panel-dark p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/5 hover:bg-white/10 transition-colors group">
        <Mic className="text-green-400 group-hover:scale-110 transition-transform" size={20} />
        <span className="text-[11px] font-medium text-gray-200">Ask AI</span>
      </button>

      <button className="glass-panel-dark p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/5 hover:bg-white/10 transition-colors group">
        <Camera className="text-green-300 group-hover:scale-110 transition-transform" size={20} />
        <span className="text-[11px] font-medium text-gray-200">Scan Crop</span>
      </button>

      <button className="glass-panel-dark p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/5 hover:bg-white/10 transition-colors group">
        <Star className="text-green-200 group-hover:scale-110 transition-transform" size={20} />
        <span className="text-[11px] font-medium text-gray-200 text-center leading-tight">Schemes</span>
      </button>
    </div>
  );
};

export default ActionButtons;