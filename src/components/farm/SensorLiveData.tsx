import { useState, useEffect, useCallback, useRef } from 'react';
import { Thermometer, Droplets, Sprout, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { getLatestSensorData, subscribeToSensorData } from '../../services/sensorService';
import type { SensorLiveReading, SensorRealtimeStatus } from '../../services/sensorService';

const formatTimestamp = (date: Date): string => {
    if (Number.isNaN(date.getTime())) {
        return 'Unknown time';
    }

    return date.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getReadingTime = (reading: SensorLiveReading | null): number => {
    if (!reading) {
        return Number.NEGATIVE_INFINITY;
    }

    const timestamp = new Date(reading.createdAt).getTime();
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const realtimeStatusConfig: Record<SensorRealtimeStatus, {
    label: string;
    className: string;
    dotClassName: string;
}> = {
    connecting: {
        label: 'CONNECTING',
        className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        dotClassName: 'bg-cyan-400 animate-pulse',
    },
    live: {
        label: 'WS LIVE',
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        dotClassName: 'bg-green-400 animate-pulse',
    },
    closed: {
        label: 'DISCONNECTED',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        dotClassName: 'bg-yellow-400',
    },
    error: {
        label: 'SOCKET ERROR',
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
        dotClassName: 'bg-red-400',
    },
};

export default function SensorLiveData() {
    const [sensor, setSensor] = useState<SensorLiveReading | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [realtimeStatus, setRealtimeStatus] = useState<SensorRealtimeStatus>('connecting');
    const latestReadingRef = useRef<SensorLiveReading | null>(null);

    const applyIncomingReading = useCallback((nextReading: SensorLiveReading) => {
        if (getReadingTime(nextReading) < getReadingTime(latestReadingRef.current)) {
            return;
        }

        latestReadingRef.current = nextReading;
        setSensor(nextReading);
        setLastUpdated(new Date(nextReading.createdAt));
        setError(null);
        setLoading(false);
    }, []);

    const fetchData = useCallback(async (isRefresh = false, isBackground = false) => {
        if (isBackground) {
            // No loading spinner for background fetches
        } else if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        if (!isBackground) {
            setError(null);
        }

        try {
            const data = await getLatestSensorData();
            if (data) {
                applyIncomingReading(data);
                if (isBackground) setError(null); // Recovery from error
            } else {
                latestReadingRef.current = null;
                setSensor(null);
                setLastUpdated(null);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load sensor data';
            if (!isBackground) setError(message); // Don't disrupt the user in the background
        } finally {
            if (!isBackground) setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    }, [applyIncomingReading]);

    useEffect(() => {
        let active = true;
        void fetchData();

        const intervalId = setInterval(() => {
            if (active) {
                void fetchData(false, true); // background fetch
            }
        }, 5000);

        const unsubscribe = subscribeToSensorData({
            onReading: (nextReading) => {
                if (!active) {
                    return;
                }

                applyIncomingReading(nextReading);
            },
            onStatusChange: (status) => {
                if (!active) {
                    return;
                }

                setRealtimeStatus(status);
            },
        });

        return () => {
            active = false;
            clearInterval(intervalId);
            unsubscribe();
        };
    }, [applyIncomingReading, fetchData]);

    const realtimeBadge = realtimeStatusConfig[realtimeStatus];

    if (loading) {
        return (
            <div className="relative glass-panel-dark border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded bg-white/10 animate-pulse"></div>
                    <div className="h-5 w-40 bg-white/10 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="bg-white/5 rounded-xl p-4 animate-pulse">
                            <div className="h-3 w-16 bg-white/10 rounded mb-2"></div>
                            <div className="h-6 w-12 bg-white/10 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative glass-panel-dark border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <WifiOff size={18} className="text-red-400" />
                        <h3 className="text-white text-base font-medium">IoT Sensor Data</h3>
                    </div>
                    <button
                        onClick={() => void fetchData(true)}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                    <p className="text-red-400 text-xs">{error}</p>
                </div>
                <p className="text-gray-500 text-[10px] text-center mt-3">
                    WebSocket status: {realtimeBadge.label}
                </p>
            </div>
        );
    }

    if (!sensor) {
        return (
            <div className="relative glass-panel-dark border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/8 blur-[50px] rounded-full pointer-events-none"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <Wifi size={18} className="text-cyan-400" />
                        <h3 className="text-white text-base font-medium">IoT Sensor Data</h3>
                        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${realtimeBadge.className}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${realtimeBadge.dotClassName}`}></span>
                            {realtimeBadge.label}
                        </span>
                    </div>
                    <button
                        onClick={() => void fetchData(true)}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="text-center py-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                        <Wifi size={24} className="text-cyan-400" />
                    </div>
                    <p className="text-gray-300 text-sm">Waiting for the first sensor reading</p>
                    <p className="text-gray-500 text-[11px] mt-1">The websocket is listening and the latest row from Supabase will appear here automatically.</p>
                </div>
            </div>
        );
    }

    const sensorCards = [
        {
            label: 'Temperature',
            value: `${sensor.temperature.toFixed(1)}°C`,
            icon: <Thermometer size={20} className="text-orange-400" />,
            color: 'from-orange-500/20 to-red-500/10',
            borderColor: sensor.temperature > 35 ? 'border-red-500/30' : 'border-white/10',
        },
        {
            label: 'Humidity',
            value: `${sensor.humidity.toFixed(0)}%`,
            icon: <Droplets size={20} className="text-blue-400" />,
            color: 'from-blue-500/20 to-cyan-500/10',
            borderColor: sensor.humidity > 80 ? 'border-blue-500/30' : 'border-white/10',
        },
        {
            label: 'Soil Moisture',
            value: `${sensor.moisture.toFixed(0)}%`,
            icon: <Sprout size={20} className="text-teal-400" />,
            color: 'from-teal-500/20 to-emerald-500/10',
            borderColor: sensor.moisture < 30 ? 'border-yellow-500/30' : 'border-white/10',
        },
    ];

    return (
        <div className="relative glass-panel-dark border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/8 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 blur-[40px] rounded-full pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Wifi size={18} className="text-cyan-400" />
                    <h3 className="text-white text-base font-medium">IoT Sensor Data</h3>
                    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${realtimeBadge.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${realtimeBadge.dotClassName}`}></span>
                        {realtimeBadge.label}
                    </span>
                </div>
                <button
                    onClick={() => void fetchData(true)}
                    disabled={refreshing}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 relative z-10">
                {sensorCards.map((card) => (
                    <div
                        key={card.label}
                        className={`bg-gradient-to-br ${card.color} backdrop-blur-md rounded-xl border ${card.borderColor} p-3 text-center transition-all hover:scale-[1.02]`}
                    >
                        <div className="flex justify-center mb-2">{card.icon}</div>
                        <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-1">{card.label}</p>
                        <p className="text-white text-lg font-semibold">{card.value}</p>
                    </div>
                ))}
            </div>

            {lastUpdated && (
                <p className="text-gray-500 text-[10px] text-center mt-3 relative z-10">
                    Latest websocket sync: {formatTimestamp(lastUpdated)} | Supabase Realtime
                </p>
            )}
        </div>
    );
}
