import React, { useState, useEffect } from 'react';
import { getActiveCrops } from '../services/cropService';
import type { CropAssignment } from '../services/cropService';
import { useAuth } from '../context/AuthContext';

// Crop image mapper (using Vite's new URL for static assets or direct imports if small)
import peanutImg from '../assets/crops/Peanut.png';
import cottonImg from '../assets/crops/cotton.png';
import maizeImg from '../assets/crops/maize.png';
import paddyImg from '../assets/crops/paddy.png';
import soyaImg from '../assets/crops/soya.png';
import tomatoImg from '../assets/crops/tomato.png';
import wheatImg from '../assets/crops/wheat.png';

const getCropImage = (name: string): string => {
  const normalized = name.toLowerCase();
  switch (normalized) {
    case 'peanut': return peanutImg;
    case 'cotton': return cottonImg;
    case 'maize': return maizeImg;
    case 'paddy': return paddyImg;
    case 'soya': return soyaImg;
    case 'tomato': return tomatoImg;
    case 'wheat': return wheatImg;
    default: return paddyImg; // Default fallback
  }
};

const calculateStage = (sowingDate: string, growthDays: number): string => {
  const sown = new Date(sowingDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - sown.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Simple heuristic for stage
  if (diffDays < growthDays * 0.2) return 'Seedling Stage';
  if (diffDays < growthDays * 0.5) return 'Vegetative Stage';
  if (diffDays < growthDays * 0.7) return 'Flowering Stage';
  if (diffDays <= growthDays) return 'Fruiting Stage';
  return 'Ready to Harvest';
};

const CropsSection: React.FC = () => {
  const { token } = useAuth();
  const [crops, setCrops] = useState<CropAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrops = async () => {
      if (!token) return;
      try {
        const assignments = await getActiveCrops(token);
        setCrops(assignments);
      } catch (err) {
        console.error("Failed to load crops:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, [token]);

  if (loading) {
    return <div className="animate-pulse h-20 bg-white/5 rounded-xl"></div>;
  }

  if (crops.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium text-gray-200 mb-3">Your Crops</h3>
        <p className="text-sm border border-white/5 bg-white/5 italic text-gray-400 p-4 rounded-xl text-center">
          No crops registered yet. Add them in your profile.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-200 mb-3">Your Crops</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {crops.map((assignment) => (
          <div key={assignment.id} className="glass-panel-dark p-3 rounded-xl flex items-center gap-3 min-w-[200px] flex-1 border border-white/5 shrink-0 shadow-lg">
            <img
              src={getCropImage(assignment.crop.name)}
              alt={assignment.crop.name}
              className="w-12 h-12 rounded-lg object-contain bg-white/10 p-1 border border-white/10"
            />
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[120px]">{assignment.crop.name}</p>
              <p className="text-[10px] text-gray-400">{calculateStage(assignment.sowingDate, assignment.crop.growthDays)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CropsSection;