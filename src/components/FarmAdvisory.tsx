import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const FarmAdvisory: React.FC = () => {
  return (
    <div className="glass-panel-dark rounded-2xl p-5 border-l-4 border-l-green-500">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle2 size={14} className="text-black" />
        </div>
        <h3 className="text-sm font-semibold text-gray-100">Today's Farm Advisory</h3>
      </div>
      
      <ul className="space-y-2 pl-2">
        <li className="flex items-start gap-2 text-xs text-gray-300">
          <span className="block w-1.5 h-1.5 mt-1 rounded-full bg-white flex-shrink-0"></span>
          <span>No irrigation needed today.</span>
        </li>
        <li className="flex items-start gap-2 text-xs text-gray-300">
          <span className="block w-1.5 h-1.5 mt-1 rounded-full bg-white flex-shrink-0"></span>
          <span>Monitor paddy for leaf folder.</span>
        </li>
        <li className="flex items-start gap-2 text-xs text-gray-300">
          <span className="block w-1.5 h-1.5 mt-1 rounded-full bg-white flex-shrink-0"></span>
          <span>Apply fertilizer in 2 days.</span>
        </li>
      </ul>
    </div>
  );
};

export default FarmAdvisory;