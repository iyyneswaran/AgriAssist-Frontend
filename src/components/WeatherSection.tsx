import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  MapPinOff,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Droplets,
  Wind,
  Droplet,
  ChevronRight,
  Sparkles,
  CloudOff
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useTranslation } from 'react-i18next';

const getWeatherColorClass = (condition: string): string => {
  const lower = condition.toLowerCase();
  if (lower.includes('sunny') || lower.includes('clear')) {
    return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
  }
  if (lower.includes('partly')) {
    return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
  }
  if (lower.includes('cloud')) {
    return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
  }
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) {
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  }
  if (lower.includes('thunder') || lower.includes('storm')) {
    return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
  }
  if (lower.includes('snow') || lower.includes('ice')) {
    return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
  }
  return 'bg-white/10 text-white/90 border border-white/20';
};

function WeatherConditionIcon({ condition }: { condition: string }) {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) {
    return <CloudRain size={13} className="shrink-0" />;
  }
  if (lower.includes('thunder') || lower.includes('storm')) {
    return <CloudLightning size={13} className="shrink-0" />;
  }
  if (lower.includes('snow') || lower.includes('ice')) {
    return <Snowflake size={13} className="shrink-0" />;
  }
  if (lower.includes('partly')) {
    return <CloudSun size={13} className="shrink-0" />;
  }
  if (lower.includes('cloud')) {
    return <Cloud size={13} className="shrink-0" />;
  }
  return <Sun size={13} className="shrink-0" />;
}

const WeatherSection: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { weather, land, weatherLoading, landLoading } = useAppData();

  const loading = weatherLoading || landLoading;

  // Format current date & time nicely with locale awareness
  const today = new Date();
  const dateString = today.toLocaleDateString(
    i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'ta' ? 'ta-IN' : 'en-GB',
    { day: '2-digit', month: 'short', year: 'numeric' }
  );
  const timeString = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();

  // Shimmer skeleton loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {/* Main Weather Card Skeleton */}
        <div className="glass-panel-dark rounded-3xl p-5 relative overflow-hidden border border-white/10 shadow-2xl glass-skeleton min-h-[196px]">
          <div className="flex justify-between items-start">
            <div className="space-y-3 w-3/5">
              <div className="h-5 w-32 bg-white/10 rounded-full"></div>
              <div className="h-12 w-28 bg-white/10 rounded-xl mt-3"></div>
              <div className="h-3 w-40 bg-white/10 rounded-full"></div>
              <div className="h-6 w-24 bg-white/10 rounded-full mt-3"></div>
            </div>
            <div className="w-24 h-24 bg-white/10 rounded-full shrink-0"></div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="h-3 w-3/4 bg-white/10 rounded-full"></div>
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-surface-deep rounded-2xl p-3 border border-white/5 glass-skeleton h-20 flex flex-col justify-between">
              <div className="h-3 w-12 bg-white/10 rounded-full"></div>
              <div className="h-5 w-16 bg-white/10 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Honest unavailable state: no farm/land registered yet
  if (!land) {
    return (
      <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
          <MapPinOff size={22} />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">
          {t('weather.weatherUnavailable', 'Weather unavailable')}
        </h3>
        <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto leading-relaxed">
          {t('advisoryV2.noDataDesc', 'Register your farm and crops in your profile to receive personalized advisories.')}
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green/20 text-brand-green border border-brand-green/30 text-xs font-semibold hover:bg-brand-green/30 transition-all hover:scale-102"
        >
          <span>{t('profile.masterFarmProfile', 'Register Farm Profile')}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  // Honest unavailable state: land exists but weather API call failed
  if (!weather) {
    return (
      <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 text-center relative overflow-hidden shadow-2xl">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 text-gray-300 flex items-center justify-center mb-3 border border-white/10">
          <CloudOff size={22} />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">
          {t('weather.weatherUnavailable', 'Weather unavailable')}
        </h3>
        <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto leading-relaxed">
          {t('advisoryV2.staleData', 'Weather service is temporarily unavailable. Check back shortly or view full forecast.')}
        </p>
        <button
          onClick={() => navigate('/forecast')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white/90 border border-white/15 text-xs font-medium hover:bg-white/15 transition-colors"
        >
          <span>{t('weather.viewForecast', 'View full forecast')}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  const locationName = `${land.district}, ${land.state}`;

  // Get dynamic image path via Vite
  const iconSrc = weather.iconFile
    ? new URL(`../assets/weather/${weather.iconFile}`, import.meta.url).href
    : '';

  const isHighMoisture = weather.precipitation > 0;

  return (
    <div className="space-y-3">
      {/* Premium Liquid Glass Weather Card */}
      <div className="glass-panel-dark rounded-3xl p-5 relative overflow-hidden shadow-2xl border border-white/10">
        {/* Ambient atmospheric backlight hint */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-brand-green/15 blur-3xl rounded-full pointer-events-none"></div>

        {/* Top bar: Registered farm location + Data source badge & Forecast link */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <MapPin size={12} className="text-brand-green shrink-0" />
            <span className="text-xs font-medium text-white/90 truncate max-w-[140px] sm:max-w-[170px]" title={locationName}>
              {locationName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5 font-mono">
              {t('weather.dataSource', 'Open-Meteo')}
            </span>
            <button
              onClick={() => navigate('/forecast')}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-green hover:text-emerald-300 transition-colors"
              aria-label={t('weather.viewForecast', 'View full forecast')}
            >
              <span>{t('weather.viewForecast', 'Forecast')}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Center content: Temperature & illustration */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-light text-white tracking-tight">{weather.temperature}</span>
              <span className="text-2xl font-light text-white/70">°{t('weather.c', 'C')}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {dateString} • {t('weather.updatedAt', 'Updated')} {timeString}
            </p>

            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getWeatherColorClass(weather.conditionName ?? 'Unknown')}`}>
              <WeatherConditionIcon condition={weather.conditionName ?? 'Unknown'} />
              <span>{weather.conditionName ?? 'Unknown'}</span>
            </div>
          </div>

          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 -mt-1 -mr-1 flex items-center justify-center">
            {iconSrc && (
              <img
                src={iconSrc}
                alt={weather.conditionName}
                className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-105"
              />
            )}
          </div>
        </div>

        {/* Agro-meteorological Contextual Suggestion */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-full bg-brand-green/15 text-brand-green flex items-center justify-center shrink-0 mt-0.5 border border-brand-green/20">
            <Sparkles size={11} />
          </div>
          <p className="text-xs text-gray-300 leading-snug">
            <span className="text-white/80 font-medium">{t('weather.suggestion', 'Suggestion')}: </span>
            {isHighMoisture
              ? t('weather.highMoisture', 'High moisture detected. Delay spraying chemicals.')
              : t('weather.goodConditions', 'Good conditions for farm activities.')}
          </p>
        </div>
      </div>

      {/* Metrics Row using .glass-surface-deep */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Rainfall / Precipitation with explicit accumulation period */}
        <div className="glass-surface-deep rounded-2xl p-3 border border-white/5 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
              <Droplets size={15} />
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">
              1h
            </span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium truncate">
              {t('weather.precipitation', 'Precipitation')}
            </p>
            <p className="text-base font-semibold text-white mt-0.5">
              {weather.precipitation ?? 0} <span className="text-xs font-normal text-gray-400">{t('weather.mm', 'mm')}</span>
            </p>
            <p className="text-[9px] text-blue-300/80 mt-0.5 truncate">
              {t('weather.currentHour', 'Current Hour')}
            </p>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="glass-surface-deep rounded-2xl p-3 border border-white/5 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-300 shrink-0">
              <Wind size={15} />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium truncate">
              {t('weather.wind', 'Wind')}
            </p>
            <p className="text-base font-semibold text-white mt-0.5">
              {weather.windSpeed ?? 0} <span className="text-xs font-normal text-gray-400">{t('weather.kmh', 'km/h')}</span>
            </p>
            <p className="text-[9px] text-teal-300/80 mt-0.5 truncate">
              10m AGL
            </p>
          </div>
        </div>

        {/* Humidity */}
        <div className="glass-surface-deep rounded-2xl p-3 border border-white/5 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-300 shrink-0">
              <Droplet size={15} />
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">
              RH
            </span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium truncate">
              {t('weather.humidity', 'Humidity')}
            </p>
            <p className="text-base font-semibold text-white mt-0.5">
              {weather.humidity ?? 0}%
            </p>
            <p className="text-[9px] text-emerald-300/80 mt-0.5 truncate">
              Relative
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherSection;