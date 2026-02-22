import React from 'react';
import { MapPin, Sun, Droplets, Wind } from 'lucide-react';

const WeatherSection: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Main Weather Card */}
      <div className="glass-panel-dark rounded-3xl p-5 relative overflow-hidden">
        {/* Background gradient hint */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/5 mb-3">
              <MapPin size={12} className="text-white" />
              <span className="text-xs font-medium">Chennai, Tamilnadu</span>
            </div>

            <div className="flex items-baseline gap-2">
              <h1 className="text-5xl font-light text-white">28° <span className="text-3xl font-normal">C</span></h1>
            </div>
             <p className="text-[10px] text-gray-400 mt-1">31 Oct 2025 | 12.35 pm</p>

            <div className="mt-3 inline-flex items-center gap-1.5 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
              <Sun size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium text-yellow-300">Sunny</span>
            </div>
          </div>

          {/* 3D Sun Illustration Placeholder */}
          <div className="relative w-24 h-24 flex-shrink-0">
             <img 
                src="https://cdn3d.iconscout.com/3d/premium/thumb/sun-3d-icon-download-in-png-blend-fbx-gltf-file-formats--weather-summer-day-sunny-pack-nature-icons-4712558.png?f=webp"
                alt="Sun"
                className="w-full h-full object-contain drop-shadow-2xl"
             />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-gray-300 font-light">
            <span className="text-gray-400">Crop Impact:</span> Spraying not recommended today.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
            <Droplets size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-300">Precipitation</p>
            <p className="text-xl font-medium">5.1 ml</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-300">
            <Wind size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-300">Wind</p>
            <p className="text-xl font-medium">23 m/s</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherSection;