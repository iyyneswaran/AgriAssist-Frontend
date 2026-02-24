import { useState, useEffect } from 'react';
import {
    ShieldAlert,
    Leaf,
    CloudRain,
    Thermometer,
    AlertTriangle,
    MapPin,
    RefreshCw,
    Droplets,
    Flame,
    CheckCircle2,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { getMyLand } from '../services/landService';
import { analyzeGeo } from '../services/geoService';
import type { GeoAnalysisData } from '../services/geoService';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// ─── Risk calculator helpers ────────────────────────────────────────────
function calcFloodRisk(rainfallMm: number): number {
    if (rainfallMm >= 80) return 95;
    if (rainfallMm >= 50) return 75;
    if (rainfallMm >= 20) return 45;
    if (rainfallMm >= 5) return 20;
    return 5;
}

function calcDroughtRisk(rainfallMm: number, ndvi: number | null): number {
    let risk = 0;
    if (rainfallMm < 2) risk += 50;
    else if (rainfallMm < 10) risk += 30;
    else if (rainfallMm < 20) risk += 10;
    if (ndvi !== null) {
        if (ndvi < 0.2) risk += 40;
        else if (ndvi < 0.4) risk += 20;
    }
    return Math.min(risk, 100);
}

function calcHeatRisk(maxTemp: number | null): number {
    if (maxTemp === null) return 0;
    if (maxTemp >= 45) return 95;
    if (maxTemp >= 40) return 75;
    if (maxTemp >= 35) return 55;
    if (maxTemp >= 30) return 25;
    return 5;
}

function riskColor(value: number): string {
    if (value >= 70) return 'from-red-500 to-red-600';
    if (value >= 40) return 'from-amber-400 to-orange-500';
    return 'from-green-400 to-emerald-500';
}

function riskLabelKey(value: number): string {
    if (value >= 70) return 'risk.high';
    if (value >= 40) return 'risk.moderate';
    return 'risk.low';
}

function riskTextColor(value: number): string {
    if (value >= 70) return 'text-red-400';
    if (value >= 40) return 'text-amber-400';
    return 'text-green-400';
}

// ─── Alert helpers ──────────────────────────────────────────────────────
function alertStyle(alert: string) {
    const lower = alert.toLowerCase();
    if (lower.includes('flood') || lower.includes('heavy'))
        return { border: 'border-l-red-500', icon: 'text-red-400', bg: 'bg-red-500/10' };
    if (lower.includes('heat') || lower.includes('high temp'))
        return { border: 'border-l-orange-400', icon: 'text-orange-400', bg: 'bg-orange-500/10' };
    if (lower.includes('cold') || lower.includes('drop'))
        return { border: 'border-l-blue-400', icon: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (lower.includes('no immediate'))
        return { border: 'border-l-green-500', icon: 'text-green-400', bg: 'bg-green-500/10' };
    return { border: 'border-l-yellow-400', icon: 'text-yellow-400', bg: 'bg-yellow-500/10' };
}

// ─── NDVI helpers ───────────────────────────────────────────────────────
function ndviColor(status: string): string {
    if (status === 'Healthy') return 'text-green-400';
    if (status === 'Moderate') return 'text-yellow-400';
    return 'text-red-400';
}

function ndviRingColor(status: string): string {
    if (status === 'Healthy') return '#4ade80';
    if (status === 'Moderate') return '#facc15';
    return '#f87171';
}

export default function Forecast() {
    const { token } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<GeoAnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [locationName, setLocationName] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const land = await getMyLand(token);
            if (!land) {
                setError('no_land');
                return;
            }

            setLocationName(`${land.district}, ${land.state}`);
            const result = await analyzeGeo(land.latitude, land.longitude);
            setData(result);
        } catch (err: any) {
            console.error('Forecast fetch error:', err);
            setError(err.message || 'Failed to load forecast data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    // ─── Loading State ──────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
                {/* Background */}
                <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90 pointer-events-none"></div>

                {/* Main Content Skeleton */}
                <div className="relative z-10 w-full max-w-md h-full flex flex-col pb-32 overflow-y-auto no-scrollbar animate-pulse">

                    {/* Header */}
                    <div className="pt-6 px-4 flex items-center justify-between">
                        <div className="h-8 w-40 bg-white/10 rounded-full"></div>
                        <div className="h-8 w-8 bg-white/10 rounded-full"></div>
                    </div>

                    {/* Location */}
                    <div className="px-4 mt-2 mb-2">
                        <div className="h-3 w-32 bg-white/10 rounded-full"></div>
                    </div>

                    {/* ─── Alert Banners Skeleton ───────────────────────── */}
                    <div className="mt-5 px-4 space-y-3">
                        <div className="glass-panel-dark rounded-2xl h-16 border-l-4 border-l-white/10 border border-white/5 bg-white/5"></div>
                        <div className="glass-panel-dark rounded-2xl h-16 border-l-4 border-l-white/10 border border-white/5 bg-white/5"></div>
                    </div>

                    {/* ─── Metric Cards Skeleton ────────────────────────── */}
                    <div className="mt-6 px-4">
                        <div className="h-3 w-28 bg-white/10 rounded-full mb-3"></div>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="glass-panel-dark rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center h-32 bg-white/5">
                                    <div className="w-12 h-12 rounded-full bg-white/10 mb-3"></div>
                                    <div className="h-3 w-14 bg-white/10 rounded-full mb-1"></div>
                                    <div className="h-2 w-10 bg-white/10 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Risk Assessment Skeleton ─────────────────────── */}
                    <div className="mt-6 px-4">
                        <div className="h-3 w-40 bg-white/10 rounded-full mb-3"></div>
                        <div className="glass-panel-dark rounded-2xl border border-white/10 p-4 space-y-5 bg-white/5">
                            {[1, 2, 3].map((i) => (
                                <div key={i}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-3 w-24 bg-white/10 rounded-full"></div>
                                        <div className="h-3 w-16 bg-white/10 rounded-full"></div>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    // ─── No Land Registered ─────────────────────────────────────────────
    if (error === 'no_land') {
        return (
            <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
                <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90 pointer-events-none"></div>
                <div className="relative z-10 w-full max-w-md flex items-center justify-center px-6">
                    <div className="glass-panel-dark rounded-3xl p-8 text-center border border-white/10 w-full">
                        <MapPin className="text-green-400 mx-auto mb-4" size={36} />
                        <h2 className="text-white text-lg font-medium mb-2">{t('forecast.noFarm')}</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {t('forecast.noFarmDesc')}
                        </p>
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    // ─── Error State ────────────────────────────────────────────────────
    if (error || !data) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
                <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90 pointer-events-none"></div>
                <div className="relative z-10 w-full max-w-md flex items-center justify-center px-6">
                    <div className="glass-panel-dark rounded-3xl p-8 text-center border border-white/10 w-full">
                        <AlertTriangle className="text-red-400 mx-auto mb-4" size={36} />
                        <h2 className="text-white text-lg font-medium mb-2">{t('forecast.analysisFailed')}</h2>
                        <p className="text-gray-400 text-sm mb-4">{error || 'Could not fetch forecast data.'}</p>
                        <button
                            onClick={() => fetchData()}
                            className="px-5 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30 hover:bg-green-500/30 transition"
                        >
                            {t('forecast.tryAgain')}
                        </button>
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    // ─── Computed risks ─────────────────────────────────────────────────
    const floodRisk = calcFloodRisk(data.rainfall_forecast.forecast_rainfall_mm);
    const droughtRisk = calcDroughtRisk(data.rainfall_forecast.forecast_rainfall_mm, data.ndvi.ndvi_mean);
    const heatRisk = calcHeatRisk(data.temperature_forecast.max_temp_celsius);

    const ndviValue = data.ndvi.ndvi_mean;
    const circumference = 2 * Math.PI * 36;
    const ndviStroke = ndviValue !== null ? circumference - (ndviValue * circumference) : circumference;

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90 pointer-events-none"></div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md h-full flex flex-col pb-32 overflow-y-auto no-scrollbar">

                {/* Header */}
                <div className="pt-6 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-sm font-medium">
                            <ShieldAlert size={15} className="text-green-400" />
                            {t('forecast.forecastAndAlerts')}
                        </div>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="p-2 rounded-full bg-white/10 border border-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Location */}
                {locationName && (
                    <div className="px-4 mt-2">
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                            <MapPin size={11} />
                            <span>{locationName}</span>
                        </div>
                    </div>
                )}

                {/* ─── Alert Banners ─────────────────────────────────── */}
                <div className="mt-5 px-4 space-y-3">
                    {data.alerts.map((alert, idx) => {
                        const style = alertStyle(alert);
                        const isSafe = alert.toLowerCase().includes('no immediate');
                        return (
                            <div
                                key={idx}
                                className={`glass-panel-dark rounded-2xl p-4 border-l-4 ${style.border} ${style.bg} border border-white/5 flex items-start gap-3`}
                            >
                                {isSafe ? (
                                    <CheckCircle2 size={18} className={`${style.icon} mt-0.5 shrink-0`} />
                                ) : (
                                    <AlertTriangle size={18} className={`${style.icon} mt-0.5 shrink-0`} />
                                )}
                                <p className="text-gray-200 text-sm leading-relaxed">{alert}</p>
                            </div>
                        );
                    })}
                </div>

                {/* ─── Metric Cards ──────────────────────────────────── */}
                <div className="mt-6 px-4">
                    <h2 className="text-gray-300 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-green-400"></span>
                        {t('forecast.satelliteAnalysis')}
                    </h2>

                    <div className="grid grid-cols-3 gap-3">
                        {/* NDVI Card */}
                        <div className="glass-panel-dark rounded-2xl p-3 border border-white/10 flex flex-col items-center text-center">
                            <div className="relative w-16 h-16 mb-2">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                    <circle
                                        cx="40" cy="40" r="36" fill="none"
                                        stroke={ndviRingColor(data.ndvi.health_status)}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={ndviStroke}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                        {ndviValue !== null ? ndviValue.toFixed(2) : '—'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 mb-0.5">
                                <Leaf size={12} className="text-green-400" />
                                <span className="text-[10px] text-gray-400 font-medium">{t('forecast.ndvi')}</span>
                            </div>
                            <span className={`text-[10px] font-semibold ${ndviColor(data.ndvi.health_status)}`}>
                                {t('health.' + data.ndvi.health_status.replace(' ', ''))}
                            </span>
                        </div>

                        {/* Rainfall Card */}
                        <div className="glass-panel-dark rounded-2xl p-3 border border-white/10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 mb-2 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <CloudRain size={28} className="text-blue-400" />
                            </div>
                            <span className="text-white text-lg font-semibold leading-tight">
                                {data.rainfall_forecast.forecast_rainfall_mm}
                                <span className="text-xs text-gray-400 font-normal"> mm</span>
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">
                                {data.rainfall_forecast.forecast_days}-{t('forecast.dayForecast')}
                            </span>
                        </div>

                        {/* Temperature Card */}
                        <div className="glass-panel-dark rounded-2xl p-3 border border-white/10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 mb-2 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Thermometer size={28} className="text-orange-400" />
                            </div>
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-orange-300 text-sm font-semibold">
                                    {data.temperature_forecast.max_temp_celsius !== null
                                        ? `${data.temperature_forecast.max_temp_celsius}°`
                                        : '—'}
                                </span>
                                <span className="text-gray-500 text-[10px]">/</span>
                                <span className="text-blue-300 text-sm font-semibold">
                                    {data.temperature_forecast.min_temp_celsius !== null
                                        ? `${data.temperature_forecast.min_temp_celsius}°`
                                        : '—'}
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-0.5">{t('forecast.maxMin')}</span>
                        </div>
                    </div>
                </div>

                {/* ─── Risk Assessment ───────────────────────────────── */}
                <div className="mt-6 px-4">
                    <h2 className="text-gray-300 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-red-400"></span>
                        {t('forecast.disasterRisk')}
                    </h2>

                    <div className="glass-panel-dark rounded-2xl border border-white/10 p-4 space-y-5">
                        {/* Flood Risk */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Droplets size={14} className="text-blue-400" />
                                    <span className="text-sm text-gray-200">{t('forecast.floodRisk')}</span>
                                </div>
                                <span className={`text-xs font-semibold ${riskTextColor(floodRisk)}`}>
                                    {t(riskLabelKey(floodRisk))} · {floodRisk}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${riskColor(floodRisk)} transition-all duration-1000`}
                                    style={{ width: `${floodRisk}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Drought Risk */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <CloudRain size={14} className="text-amber-400" />
                                    <span className="text-sm text-gray-200">{t('forecast.droughtRisk')}</span>
                                </div>
                                <span className={`text-xs font-semibold ${riskTextColor(droughtRisk)}`}>
                                    {t(riskLabelKey(droughtRisk))} · {droughtRisk}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${riskColor(droughtRisk)} transition-all duration-1000`}
                                    style={{ width: `${droughtRisk}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Heat Stress */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Flame size={14} className="text-orange-400" />
                                    <span className="text-sm text-gray-200">{t('forecast.heatStress')}</span>
                                </div>
                                <span className={`text-xs font-semibold ${riskTextColor(heatRisk)}`}>
                                    {t(riskLabelKey(heatRisk))} · {heatRisk}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${riskColor(heatRisk)} transition-all duration-1000`}
                                    style={{ width: `${heatRisk}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Data Freshness ────────────────────────────────── */}
                <div className="mt-5 px-4 mb-4">
                    <p className="text-[10px] text-gray-500 text-center">
                        {t('forecast.poweredBy')}
                    </p>
                </div>

            </div>

            <BottomNav />
        </div>
    );
}
