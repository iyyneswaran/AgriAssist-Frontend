import { useState, useEffect, useCallback } from 'react';
import { Thermometer, Droplets, Sprout, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { getHardwareSensorData } from '../../services/sensorService';
import type { HardwareSensorData } from '../../services/sensorService';

interface SensorLiveDataProps {
    userId: string;
}

export default function SensorLiveData({ userId: _userId }: SensorLiveDataProps) {
    const [sensor, setSensor] = useState<HardwareSensorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const data = await getHardwareSensorData();
            setSensor(data);
            setLastUpdated(new Date());
        } catch (err: any) {
            if (err.message === 'device_offline') {
                setError('device_offline');
            } else {
                setError(err.message || 'Failed to load sensor data');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Auto-refresh every 10 seconds for live hardware data
        const interval = setInterval(() => {
            fetchData(true);
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchData]);

    const formatTimeAgo = (date: Date): string => {
        const diff = Date.now() - date.getTime();
        const secs = Math.floor(diff / 1000);
        if (secs < 5) return 'Just now';
        if (secs < 60) return `${secs}s ago`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="relative glass-panel-dark border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded bg-white/10 animate-pulse"></div>
                    <div className="h-5 w-40 bg-white/10 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                            <div className="h-3 w-16 bg-white/10 rounded mb-2"></div>
                            <div className="h-6 w-12 bg-white/10 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Device offline state
    if (error === 'device_offline') {
        return (
            <div className="relative glass-panel-dark border border-yellow-500/20 rounded-3xl shadow-2xl overflow-hidden p-5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/8 blur-[50px] rounded-full pointer-events-none"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <WifiOff size={18} className="text-yellow-400" />
                        <h3 className="text-white text-base font-medium">IoT Sensor Data</h3>
                        <span className="flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                            OFFLINE
                        </span>
                    </div>
                    <button onClick={() => fetchData(true)} className="text-gray-400 hover:text-white transition-colors p-1">
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="text-center py-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                        <Wifi size={24} className="text-yellow-600" />
                    </div>
                    <p className="text-gray-400 text-sm">ESP32 device is currently offline</p>
                    <p className="text-gray-600 text-[11px] mt-1">Check your hardware connection and ensure ngrok tunnel is running</p>
                </div>
            </div>
        );
    }

    // General error state
    if (error) {
        return (
            <div className="relative glass-panel-dark border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <WifiOff size={18} className="text-red-400" />
                        <h3 className="text-white text-base font-medium">IoT Sensor Data</h3>
                    </div>
                    <button onClick={() => fetchData(true)} className="text-gray-400 hover:text-white transition-colors p-1">
                        <RefreshCw size={14} />
                    </button>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                    <p className="text-red-400 text-xs">{error}</p>
                </div>
            </div>
        );
    }

    const sensorCards = [
        {
            label: 'Temperature',
            value: sensor?.temperature != null ? `${Number(sensor.temperature).toFixed(1)}°C` : '—',
            icon: <Thermometer size={20} className="text-orange-400" />,
            color: 'from-orange-500/20 to-red-500/10',
            borderColor: sensor?.temperature != null && Number(sensor.temperature) > 35 ? 'border-red-500/30' : 'border-white/10',
        },
        {
            label: 'Humidity',
            value: sensor?.humidity != null ? `${Number(sensor.humidity).toFixed(0)}%` : '—',
            icon: <Droplets size={20} className="text-blue-400" />,
            color: 'from-blue-500/20 to-cyan-500/10',
            borderColor: sensor?.humidity != null && Number(sensor.humidity) > 80 ? 'border-blue-500/30' : 'border-white/10',
        },
        {
            label: 'Soil Moisture',
            value: sensor?.soil_moisture != null ? `${Number(sensor.soil_moisture).toFixed(0)}%` : '—',
            icon: <Sprout size={20} className="text-teal-400" />,
            color: 'from-teal-500/20 to-emerald-500/10',
            borderColor: sensor?.soil_moisture != null && Number(sensor.soil_moisture) < 30 ? 'border-yellow-500/30' : 'border-white/10',
        },
    ];

    return (
        <div className="relative glass-panel-dark border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-5">
            {/* Decorative glows */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/8 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 blur-[40px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Wifi size={18} className="text-cyan-400" />
                    <h3 className="text-white text-base font-medium">IoT Sensor Data</h3>
                    {/* Live indicator */}
                    <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        LIVE
                    </span>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Sensor Cards Grid */}
            <div className="grid grid-cols-3 gap-3 relative z-10">
                {sensorCards.map((card, idx) => (
                    <div
                        key={idx}
                        className={`bg-gradient-to-br ${card.color} backdrop-blur-md rounded-xl border ${card.borderColor} p-3 text-center transition-all hover:scale-[1.02]`}
                    >
                        <div className="flex justify-center mb-2">{card.icon}</div>
                        <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-1">{card.label}</p>
                        <p className="text-white text-lg font-semibold">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Last updated */}
            {lastUpdated && (
                <p className="text-gray-600 text-[10px] text-center mt-3 relative z-10">
                    Last reading: {formatTimeAgo(lastUpdated)} • Auto-refreshes every 10s
                </p>
            )}
        </div>
    );
}
