import React from 'react';
import { MapPin, Sun, Droplets, Wind, CloudRain, CloudLightning, Snowflake, Cloud } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useTranslation } from 'react-i18next';

const WeatherSection: React.FC = () => {
  const { t } = useTranslation();
  const { weather, land, weatherLoading, landLoading } = useAppData();

  const loading = weatherLoading || landLoading;

  // Format current date nicely
  const today = new Date();
  const dateString = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeString = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase();

  const locationName = land ? `${land.district}, ${land.state}` : t('weather.fetchingLocation');

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Main Weather Card Skeleton */}
        <div className="glass-panel-dark rounded-3xl p-5 relative overflow-hidden shadow-2xl animate-pulse min-h-[192px]">
          <div className="flex justify-between items-start">
            <div className="space-y-4 w-full">
              <div className="h-6 w-32 bg-white/10 rounded-full"></div>
              <div className="h-16 w-32 bg-white/10 rounded-2xl"></div>
              <div className="h-3 w-40 bg-white/10 rounded-full"></div>
              <div className="h-6 w-24 bg-white/10 rounded-full mt-3"></div>
            </div>
            <div className="w-24 h-24 flex-shrink-0 bg-white/10 rounded-full ml-4 mt-2"></div>
          </div>
          <div className="mt-4 border-t border-white/5 pt-3">
            <div className="h-3 w-3/4 bg-white/10 rounded-full"></div>
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel-dark shadow-lg rounded-2xl p-4 flex items-center gap-3 border border-white/5 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0"></div>
            <div className="space-y-2 w-full">
              <div className="h-3 w-16 bg-white/10 rounded-full"></div>
              <div className="h-4 w-20 bg-white/10 rounded-full"></div>
            </div>
          </div>
          <div className="glass-panel-dark shadow-lg rounded-2xl p-4 flex items-center gap-3 border border-white/5 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0"></div>
            <div className="space-y-2 w-full">
              <div className="h-3 w-16 bg-white/10 rounded-full"></div>
              <div className="h-4 w-20 bg-white/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get dynamic image path via Vite
  const iconSrc = weather ? new URL(`../assets/weather/${weather.iconFile}`, import.meta.url).href : '';

  const getWeatherColorClass = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('sunny') || lower.includes('clear')) {
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    }
    if (lower.includes('cloud')) {
      return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
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
    // Default fallback
    return 'bg-white/10 text-white/90 border border-white/20';
  };

  // Helper to dynamically dictate the lucid icon mapped to the weather state
  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return CloudRain;
    if (lower.includes('thunder') || lower.includes('storm')) return CloudLightning;
    if (lower.includes('snow') || lower.includes('ice')) return Snowflake;
    if (lower.includes('cloud')) return Cloud;
    return Sun; // Default
  };

  const WeatherIcon = getWeatherIcon(weather?.conditionName ?? 'Unknown');

  return (
    <div className="space-y-4">
      {/* Main Weather Card */}
      <div className="glass-panel-dark rounded-3xl p-5 relative overflow-hidden shadow-2xl">
        {/* Background gradient hint */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/5 mb-3">
              <MapPin size={12} className="text-white" />
              <span className="text-xs font-medium truncate max-w-[150px]">{locationName}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <h1 className="text-5xl font-light text-white">{weather?.temperature ?? '--'}° <span className="text-3xl font-normal">{t('weather.c')}</span></h1>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{dateString} | {timeString}</p>

            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${getWeatherColorClass(weather?.conditionName ?? 'Unknown')}`}>
              <WeatherIcon size={12} className="text-current fill-current" />
              <span className="text-xs font-medium">{weather?.conditionName ?? 'Unknown'}</span>
            </div>
          </div>

          <div className="relative w-28 h-28 flex-shrink-0 -mt-2 -mr-2">
            {weather?.iconFile && (
              <img
                src={iconSrc}
                alt={weather.conditionName}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-white/5 pt-3">
          <p className="text-xs text-gray-300 font-light">
            <span className="text-gray-400 font-medium">{t('weather.suggestion')}: </span>
            {weather?.precipitation && weather.precipitation > 0
              ? t('weather.highMoisture')
              : t('weather.goodConditions')}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel-dark shadow-lg rounded-2xl p-4 flex items-center gap-3 border border-white/5 text-left">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
            <Droplets size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400">{t('weather.precipitation')}</p>
            <p className="text-lg font-medium text-white">{weather?.precipitation ?? 0} {t('weather.mm')}</p>
          </div>
        </div>

        <div className="glass-panel-dark shadow-lg rounded-2xl p-4 flex items-center gap-3 border border-white/5 text-left">
          <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-300 shrink-0">
            <Wind size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400">{t('weather.wind')}</p>
            <p className="text-lg font-medium text-white">{weather?.windSpeed ?? 0} {t('weather.kmh')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherSection;