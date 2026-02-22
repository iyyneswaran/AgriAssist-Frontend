import React, { useState, useEffect } from 'react';
import { MapPin, Sun, Droplets, Wind, Loader2, CloudRain, CloudLightning, Snowflake, Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyLand } from '../services/landService';
import { getWeather } from '../services/weatherService';
import type { WeatherData } from '../services/weatherService';

const WeatherSection: React.FC = () => {
  const { token } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState('Fetching location...');
  const [loading, setLoading] = useState(true);

  // Format current date nicely
  const today = new Date();
  const dateString = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeString = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase();

  useEffect(() => {
    const fetchWeather = async () => {
      if (!token) return;
      try {
        // 1. Get farmer's land for coordinates
        const land = await getMyLand(token);

        let lat = 13.0827; // Default Chennai
        let lng = 80.2707;

        if (land) {
          lat = land.latitude;
          lng = land.longitude;
          setLocationName(`${land.district}, ${land.state}`);
        } else {
          setLocationName('Default Location');
        }

        // 2. Fetch live weather
        const weatherData = await getWeather(lat, lng);
        setWeather(weatherData);

      } catch (err) {
        console.error("Failed to load weather:", err);
        setLocationName('Weather unavailable');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [token]);

  if (loading) {
    return (
      <div className="glass-panel-dark rounded-3xl p-5 h-48 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={32} />
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
              <h1 className="text-5xl font-light text-white">{weather?.temperature ?? '--'}° <span className="text-3xl font-normal">C</span></h1>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{dateString} | {timeString}</p>

            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${getWeatherColorClass(weather?.conditionName ?? 'Unknown')}`}>
              <WeatherIcon size={12} className="text-current fill-current" /> {/* text-current and fill-current will inherit color from parent */}
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
            <span className="text-gray-400 font-medium">Suggestion: </span>
            {weather?.precipitation && weather.precipitation > 0
              ? "High moisture detected. Delay spraying chemicals."
              : "Good conditions for farm activities."}
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
            <p className="text-[10px] text-gray-400">Precipitation</p>
            <p className="text-lg font-medium text-white">{weather?.precipitation ?? 0} mm</p>
          </div>
        </div>

        <div className="glass-panel-dark shadow-lg rounded-2xl p-4 flex items-center gap-3 border border-white/5 text-left">
          <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-300 shrink-0">
            <Wind size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Wind</p>
            <p className="text-lg font-medium text-white">{weather?.windSpeed ?? 0} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherSection;