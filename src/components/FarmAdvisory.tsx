import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  CheckCircle2,
  Circle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useTranslation } from 'react-i18next';

interface AdvisoryItem {
  id: string;
  action: string;
  desc: string;
  why: string;
  priority: 'high' | 'medium' | 'low';
  evidence: string;
}

const FarmAdvisory: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { weather, activeCrops, land, weatherLoading, cropsLoading } = useAppData();

  const loading = weatherLoading || cropsLoading;

  const [currentTimestamp] = useState(() => Date.now());
  const [todayKey] = useState(() => `agri_advisory_done_${new Date().toISOString().slice(0, 10)}`);

  // Local state for completed tasks (persisted by date in localStorage)
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`agri_advisory_done_${new Date().toISOString().slice(0, 10)}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(todayKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save advisory completion state', e);
      }
      return updated;
    });
  };

  // Loading shimmer state
  if (loading) {
    return (
      <div className="glass-panel-dark rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 glass-skeleton"></div>
            <div className="h-4 w-40 bg-white/10 rounded-full glass-skeleton"></div>
          </div>
          <div className="h-4 w-12 bg-white/10 rounded-full glass-skeleton"></div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass-surface-deep rounded-2xl p-4 border border-white/5 glass-skeleton h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  // Generate dynamic, deterministic rules from actual data
  const items: AdvisoryItem[] = [];

  // 1. Irrigation / Moisture Rule
  if (weather) {
    if (weather.precipitation > 0) {
      items.push({
        id: 'advisory_rule_spray',
        action: t('advisoryV2.delaySpray', 'Delay chemical spraying'),
        desc: t('advisoryV2.delaySprayDesc', 'High moisture detected in your area.'),
        why: t('advisoryV2.delaySprayWhy', 'Rain may wash away chemicals, wasting resources.'),
        priority: 'high',
        evidence: `${weather.precipitation} mm rain recorded (${t('advisoryV2.weatherData', 'weather data')})`,
      });
    } else if (weather.temperature >= 35) {
      items.push({
        id: 'advisory_rule_heat',
        action: t('advisoryV2.heatWarning', 'Protect crops from heat'),
        desc: t('advisoryV2.heatWarningDesc', 'High temperatures detected in your region.'),
        why: t('advisoryV2.heatWarningWhy', 'Irrigate early morning or late evening to reduce heat stress.'),
        priority: 'high',
        evidence: `${weather.temperature}°C (${t('advisoryV2.weatherData', 'weather data')})`,
      });
    } else {
      items.push({
        id: 'advisory_rule_irrigation',
        action: t('advisoryV2.checkIrrigation', 'Check irrigation needs'),
        desc: t('advisoryV2.checkIrrigationDesc', 'Review soil moisture before watering.'),
        why: t('advisoryV2.checkIrrigationWhy', 'Avoid excess watering and conserve water resources.'),
        priority: 'low',
        evidence: `Dry weather (${t('advisoryV2.weatherData', 'weather data')})`,
      });
    }
  }

  // 2. Crop Surveillance Rule
  if (activeCrops && activeCrops.length > 0) {
    const primaryCrop = activeCrops[0];
    const cropName = primaryCrop.crop?.name || 'crop';
    items.push({
      id: `advisory_rule_pests_${primaryCrop.id || cropName}`,
      action: t('advisoryV2.monitorPests', 'Inspect crop leaves'),
      desc: `Inspect ${cropName} for visible pest or foliar signs.`,
      why: t('advisoryV2.monitorPestsWhy', 'Early detection helps prevent crop loss.'),
      priority: 'medium',
      evidence: `Active crop: ${cropName}`,
    });
  }

  // 3. Growth Stage / Nutrient Rule
  if (activeCrops && activeCrops.length > 0) {
    const postSeedlingCrop = activeCrops.find((c) => {
      if (!c.sowingDate) return true;
      const sown = new Date(c.sowingDate);
      if (isNaN(sown.getTime())) return true;
      const diffDays = Math.floor((currentTimestamp - sown.getTime()) / (1000 * 60 * 60 * 24));
      const threshold = c.crop?.growthDays ? c.crop.growthDays * 0.15 : 12;
      return diffDays >= threshold;
    });

    if (postSeedlingCrop) {
      const cropName = postSeedlingCrop.crop?.name || 'crop';
      items.push({
        id: `advisory_rule_nutrition_${postSeedlingCrop.id || cropName}`,
        action: t('advisoryV2.fertilizerReminder', 'Plan fertilizer application'),
        desc: `Review nutrition needs for ${cropName}`,
        why: t('advisoryV2.fertilizerReminderWhy', 'Timely fertilization optimizes yield and reduces waste.'),
        priority: 'low',
        evidence: `Stage: Active growth (${t('advisoryV2.cropStage', 'crop stage')})`,
      });
    }
  }

  // Friendly empty state card when neither land nor crops registered or no items available
  if (items.length === 0 || (!land && (!activeCrops || activeCrops.length === 0))) {
    return (
      <div className="glass-panel-dark rounded-3xl p-5 border border-white/10 shadow-2xl space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-green/15 border border-brand-green/20 flex items-center justify-center text-brand-green shadow-inner">
            <Sprout size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {t('advisoryV2.title', t('advisory.todaysFarmAdvisory', "Today's Farm Advisory"))}
            </h3>
          </div>
        </div>

        <div className="glass-surface-deep rounded-2xl p-5 border border-white/5 text-center">
          <p className="text-xs font-semibold text-white mb-1">
            {t('advisoryV2.noData', 'No advisory data available')}
          </p>
          <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto leading-relaxed">
            {t('advisoryV2.noDataDesc', 'Register your farm and crops in your profile to receive personalized advisories.')}
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green/20 text-brand-green border border-brand-green/30 text-xs font-semibold hover:bg-brand-green/30 transition-all hover:scale-102"
          >
            <span>{t('profile.masterFarmProfile', 'Register Farm & Crops')}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  const completedCount = items.filter((item) => completedIds[item.id]).length;

  const getPriorityClass = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    }
  };

  const getPriorityLabel = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return t('advisoryV2.high', 'High');
      case 'medium':
        return t('advisoryV2.medium', 'Medium');
      case 'low':
        return t('advisoryV2.low', 'Low');
    }
  };

  return (
    <div className="glass-panel-dark rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-green/15 border border-brand-green/20 flex items-center justify-center text-brand-green shadow-inner">
            <Sprout size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {t('advisoryV2.title', t('advisory.todaysFarmAdvisory', "Today's Farm Advisory"))}
            </h3>
            <p className="text-[10px] text-gray-400">
              {t('advisoryV2.basedOn', 'Based on')} {t('advisoryV2.weatherData', 'weather data')} & {t('advisoryV2.cropStage', 'crop stage')}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/5">
          {completedCount}/{items.length} {t('profile.active', 'done')}
        </span>
      </div>

      {/* Advisory Cards List */}
      <div className="space-y-3">
        {items.map((item) => {
          const isDone = !!completedIds[item.id];
          return (
            <div
              key={item.id}
              className={`glass-surface-deep rounded-2xl p-3.5 border transition-all duration-200 ${
                isDone
                  ? 'border-white/5 bg-black/40 opacity-75'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Toggle completion button */}
                <button
                  type="button"
                  onClick={() => toggleComplete(item.id)}
                  className="mt-0.5 text-gray-400 hover:text-brand-green transition-colors shrink-0"
                  aria-label={isDone ? 'Mark as incomplete' : 'Mark as done'}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-brand-green fill-brand-green/20" />
                  ) : (
                    <Circle size={18} className="text-gray-400 hover:text-brand-green" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4
                      className={`text-xs font-semibold text-white truncate ${
                        isDone ? 'line-through text-gray-400' : ''
                      }`}
                    >
                      {item.action}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${getPriorityClass(
                        item.priority
                      )}`}
                    >
                      {getPriorityLabel(item.priority)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {item.desc}
                  </p>

                  {/* Why & Evidence block */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <div className="flex items-center gap-1 font-medium text-brand-green">
                        <HelpCircle size={11} className="shrink-0" />
                        <span>Why?</span>
                      </div>
                      <span className="font-mono text-gray-400 truncate max-w-[180px]">
                        {item.evidence}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300/80 leading-relaxed">
                      {item.why}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with View Full Forecast */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-[11px] text-gray-400">
          {completedCount === items.length
            ? 'All tasks completed for today!'
            : `${items.length - completedCount} pending action${items.length - completedCount > 1 ? 's' : ''}`}
        </span>
        <button
          onClick={() => navigate('/forecast')}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-green hover:underline transition-colors"
        >
          <span>{t('advisoryV2.viewForecast', 'View Full Forecast')}</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default FarmAdvisory;