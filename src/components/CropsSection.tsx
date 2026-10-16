import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Sprout, Calendar, MapPin, ArrowRight, ChevronRight, Plus } from 'lucide-react';
import clsx from 'clsx';
import type { CropAssignment } from '../services/cropService';
import { useAppData } from '../context/AppDataContext';

// Crop image assets
import peanutImg from '../assets/crops/Peanut.png';
import cottonImg from '../assets/crops/cotton.png';
import maizeImg from '../assets/crops/maize.png';
import paddyImg from '../assets/crops/paddy.png';
import soyaImg from '../assets/crops/soya.png';
import tomatoImg from '../assets/crops/tomato.png';
import wheatImg from '../assets/crops/wheat.png';

const getCropImage = (name?: string): string => {
  const normalized = (name || '').toLowerCase().trim();
  if (normalized.includes('peanut') || normalized.includes('groundnut')) return peanutImg;
  if (normalized.includes('cotton')) return cottonImg;
  if (normalized.includes('maize') || normalized.includes('corn')) return maizeImg;
  if (normalized.includes('paddy') || normalized.includes('rice')) return paddyImg;
  if (normalized.includes('soya') || normalized.includes('soybean')) return soyaImg;
  if (normalized.includes('tomato')) return tomatoImg;
  if (normalized.includes('wheat')) return wheatImg;
  return paddyImg; // Default fallback
};

interface GrowthStageInfo {
  label: string;
  badgeStyle: string;
  dotStyle: string;
}

const getGrowthStage = (sowingDate: string, growthDays: number, t: TFunction): GrowthStageInfo => {
  if (!sowingDate) {
    return {
      label: t('crops.vegetativeStage', 'Vegetative Stage'),
      badgeStyle: 'text-lime-300 bg-lime-500/15 border-lime-500/30',
      dotStyle: 'bg-lime-400',
    };
  }

  const sown = new Date(sowingDate);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - sown.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const effectiveGrowthDays = growthDays > 0 ? growthDays : 100;

  if (diffDays < effectiveGrowthDays * 0.2) {
    return {
      label: t('crops.seedlingStage', 'Seedling Stage'),
      badgeStyle: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
      dotStyle: 'bg-emerald-400',
    };
  }
  if (diffDays < effectiveGrowthDays * 0.5) {
    return {
      label: t('crops.vegetativeStage', 'Vegetative Stage'),
      badgeStyle: 'text-lime-300 bg-lime-500/15 border-lime-500/30',
      dotStyle: 'bg-lime-400',
    };
  }
  if (diffDays < effectiveGrowthDays * 0.7) {
    return {
      label: t('crops.floweringStage', 'Flowering Stage'),
      badgeStyle: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
      dotStyle: 'bg-amber-400',
    };
  }
  if (diffDays <= effectiveGrowthDays) {
    return {
      label: t('crops.fruitingStage', 'Fruiting Stage'),
      badgeStyle: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
      dotStyle: 'bg-cyan-400',
    };
  }
  return {
    label: t('crops.readyToHarvest', 'Ready to Harvest'),
    badgeStyle: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
    dotStyle: 'bg-purple-400',
  };
};

const getDaysSinceSowing = (sowingDate: string): number => {
  if (!sowingDate) return 0;
  const sown = new Date(sowingDate);
  if (isNaN(sown.getTime())) return 0;
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - sown.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const CropsSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeCrops: crops, fields, cropsLoading: loading } = useAppData();

  // Loading skeleton state
  if (loading) {
    return (
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded-lg glass-skeleton" />
          <div className="h-3 w-16 rounded-lg glass-skeleton" />
        </div>
        <div className="flex gap-3.5 overflow-hidden pb-2 pt-1">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass-surface-deep border border-white/5 rounded-2xl p-3.5 w-[240px] shrink-0 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl glass-skeleton shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-4 w-3/4 rounded glass-skeleton" />
                  <div className="h-3 w-1/2 rounded glass-skeleton" />
                </div>
              </div>
              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
                <div className="h-5 w-24 rounded-full glass-skeleton" />
                <div className="h-3 w-12 rounded glass-skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!crops || crops.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            {t('crops.yourCrops', 'Your Crops')}
          </h3>
        </div>
        <div className="glass-panel-dark rounded-2xl p-6 border border-white/10 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center mb-3">
            <Sprout size={22} />
          </div>
          <p className="text-xs text-gray-300 max-w-xs mb-4 leading-relaxed">
            {t('crops.noCrops', 'No crops registered yet. Add them in your profile.')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-dark-green bg-lime-400 hover:bg-lime-300 transition-all shadow-md shadow-lime-400/20 active:scale-95 glass-focus-ring cursor-pointer"
          >
            <Plus size={14} />
            <span>{t('crops.addCrops', 'Add Crops')}</span>
          </button>
        </div>
      </div>
    );
  }

  // Populated carousel state
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {t('crops.yourCrops', 'Your Crops')}
        </h3>
        <Link
          to="/farm-details"
          className="text-xs text-lime-400 hover:text-lime-300 font-medium flex items-center gap-1 transition-colors group"
        >
          <span>{t('crops.viewAll', 'View all')}</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Carousel Container */}
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1">
        {crops.map((assignment: CropAssignment) => {
          const field = fields?.find((f) => f.id === assignment.fieldId);
          const stageInfo = getGrowthStage(
            assignment.sowingDate,
            assignment.crop?.growthDays ?? 0,
            t
          );
          const daysElapsed = getDaysSinceSowing(assignment.sowingDate);

          return (
            <div
              key={assignment.id}
              onClick={() => navigate('/farm-details')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/farm-details');
                }
              }}
              className="glass-surface-deep hover:border-lime-400/30 border border-white/10 rounded-2xl p-3.5 w-[240px] shrink-0 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 group relative overflow-hidden flex flex-col justify-between glass-focus-ring"
            >
              {/* Subtle ambient light on hover */}
              <div className="absolute -top-8 -right-8 w-20 h-20 bg-lime-400/10 rounded-full blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Top row: Image + Crop Name + Field Name */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={getCropImage(assignment.crop?.name)}
                    alt={assignment.crop?.name || 'Crop'}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-lime-300 transition-colors">
                      {assignment.crop?.name || 'Crop'}
                    </h4>
                    <ChevronRight
                      size={14}
                      className="text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all shrink-0 ml-1"
                    />
                  </div>
                  {field ? (
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin size={11} className="text-lime-400/80 shrink-0" />
                      <span className="truncate">{field.name}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {assignment.crop?.growthDays ? `${assignment.crop.growthDays}d cycle` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom row: Growth stage badge + Days elapsed */}
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2 relative z-10">
                <div
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border truncate',
                    stageInfo.badgeStyle
                  )}
                >
                  <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', stageInfo.dotStyle)} />
                  <span className="truncate">{stageInfo.label}</span>
                </div>

                <span className="text-[11px] text-gray-400 font-medium shrink-0 flex items-center gap-1">
                  <Calendar size={11} className="text-gray-500" />
                  {t('crops.daysOld', {
                    count: daysElapsed,
                    defaultValue: `${daysElapsed} days`,
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CropsSection;