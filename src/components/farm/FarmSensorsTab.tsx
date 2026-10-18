import { useState, useEffect, useCallback, useRef } from 'react';
import { Thermometer, Droplets, Sprout, Wifi, WifiOff, RefreshCw, Sun, Droplet, Activity, Beaker } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLatestSensorData, subscribeToSensorData } from '../../services/sensorService';
import type { SensorLiveReading, SensorRealtimeStatus } from '../../services/sensorService';
import type { FarmMetricsData } from '../../services/geoService';

interface SensorsTabProps {
    metrics: FarmMetricsData | null;
}

// ── Timestamp formatting ──
const formatTimestamp = (date: Date): string => {
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
};

const getReadingTime = (reading: SensorLiveReading | null): number => {
    if (!reading) return Number.NEGATIVE_INFINITY;
    const timestamp = new Date(reading.createdAt).getTime();
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

// ── Connection status config ──
const statusConfig: Record<SensorRealtimeStatus, {
    label: string; tKey: string;
    dotClass: string; textClass: string;
}> = {
    connecting: { label: 'Connecting', tKey: 'farmTabs.connecting', dotClass: 'bg-cyan-400 animate-pulse', textClass: 'text-cyan-400' },
    live: { label: 'Connected', tKey: 'farmTabs.connected', dotClass: 'bg-green-400 animate-pulse', textClass: 'text-green-400' },
    closed: { label: 'Disconnected', tKey: 'farmTabs.disconnected', dotClass: 'bg-yellow-400', textClass: 'text-yellow-400' },
    error: { label: 'Connection error', tKey: 'farmTabs.socketError', dotClass: 'bg-red-400', textClass: 'text-red-400' },
};

export default function FarmSensorsTab({ metrics }: SensorsTabProps) {
    const { t } = useTranslation();
    const [sensor, setSensor] = useState<SensorLiveReading | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [realtimeStatus, setRealtimeStatus] = useState<SensorRealtimeStatus>('connecting');
    const latestReadingRef = useRef<SensorLiveReading | null>(null);

    const applyIncomingReading = useCallback((nextReading: SensorLiveReading) => {
        if (getReadingTime(nextReading) < getReadingTime(latestReadingRef.current)) return;
        latestReadingRef.current = nextReading;
        setSensor(nextReading);
        setLastUpdated(new Date(nextReading.createdAt));
        setError(null);
        setLoading(false);
    }, []);

    const fetchData = useCallback(async (isRefresh = false, isBackground = false) => {
        if (isBackground) { /* no spinner */ }
        else if (isRefresh) setRefreshing(true);
        else setLoading(true);
        if (!isBackground) setError(null);

        try {
            const data = await getLatestSensorData();
            if (data) {
                applyIncomingReading(data);
                if (isBackground) setError(null);
            } else if (!latestReadingRef.current) {
                setSensor(null);
                setLastUpdated(null);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load sensor data';
            if (!isBackground) setError(message);
        } finally {
            if (!isBackground) setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    }, [applyIncomingReading]);

    useEffect(() => {
        let active = true;
        void fetchData();
        const unsubscribe = subscribeToSensorData({
            onReading: (r) => { if (active) applyIncomingReading(r); },
            onStatusChange: (s) => { if (active) setRealtimeStatus(s); },
        });
        return () => { active = false; unsubscribe(); };
    }, [applyIncomingReading, fetchData]);

    const status = statusConfig[realtimeStatus];

    // ── Sensor warning helpers ──
    const tempWarning = sensor && sensor.temperature > 35;
    const humidityWarning = sensor && sensor.humidity > 80;
    const moistureWarning = sensor && sensor.moisture < 30;

    return (
        <div className="space-y-5 pb-4">

            {/* ═══ Field Sensors (ESP32) ═══ */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            {realtimeStatus === 'error' || realtimeStatus === 'closed'
                                ? <WifiOff size={15} className={status.textClass} />
                                : <Wifi size={15} className={status.textClass} />
                            }
                            {t('farmTabs.fieldSensors', 'Field Sensors')}
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                            {t('farmTabs.sourceESP32', 'Source: ESP32 Field Kit')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Status indicator */}
                        <span className={`flex items-center gap-1.5 text-[10px] font-medium ${status.textClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                            {t(status.tKey, status.label)}
                        </span>
                        <button
                            onClick={() => void fetchData(true)}
                            disabled={refreshing}
                            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/8 text-gray-400 hover:text-white transition-colors glass-focus-ring"
                            aria-label={t('farmTabs.refresh', 'Refresh')}
                        >
                            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="rounded-2xl border border-white/8 bg-[#0d1610]/70 p-5">
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="rounded-xl bg-white/[0.03] p-4 animate-pulse">
                                    <div className="h-3 w-16 bg-white/8 rounded mb-2" />
                                    <div className="h-6 w-12 bg-white/8 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                        <p className="text-red-400 text-xs">{error}</p>
                        <button
                            onClick={() => void fetchData(true)}
                            className="mt-2 text-[10px] text-red-300 underline hover:text-red-200"
                        >
                            {t('farmTabs.tryAgain', 'Try again')}
                        </button>
                    </div>
                )}

                {/* Waiting for sensor */}
                {!loading && !error && !sensor && (
                    <div className="rounded-2xl border border-white/10 bg-[#0d1610]/70 p-6 text-center">
                        <Wifi size={24} className="text-cyan-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">{t('farmTabs.waitingSensor', 'Waiting for sensor data')}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{t('farmTabs.waitingSensorDesc')}</p>
                    </div>
                )}

                {/* Live sensor readings */}
                {!loading && !error && sensor && (
                    <div className="rounded-2xl border border-white/10 bg-[#0d1610]/70 p-4">
                        <div className="grid grid-cols-3 gap-2.5">
                            <SensorCard
                                icon={<Thermometer size={18} className="text-orange-400" />}
                                label={t('farm.temperature', 'Temperature')}
                                value={`${sensor.temperature.toFixed(1)}°C`}
                                warning={tempWarning ?? false}
                                warningText={tempWarning ? 'High' : undefined}
                            />
                            <SensorCard
                                icon={<Droplets size={18} className="text-blue-400" />}
                                label={t('farm.humidity', 'Humidity')}
                                value={`${sensor.humidity.toFixed(0)}%`}
                                warning={humidityWarning ?? false}
                                warningText={humidityWarning ? 'High' : undefined}
                            />
                            <SensorCard
                                icon={<Sprout size={18} className="text-teal-400" />}
                                label={t('farm.soilMoisture', 'Soil Moisture')}
                                value={`${sensor.moisture.toFixed(0)}%`}
                                warning={moistureWarning ?? false}
                                warningText={moistureWarning ? 'Low' : undefined}
                            />
                        </div>

                        {/* Last sync time */}
                        {lastUpdated && (
                            <p className="text-[10px] text-gray-500 text-center mt-3">
                                {t('farmTabs.lastSync', 'Last sync')}: {formatTimestamp(lastUpdated)}
                            </p>
                        )}
                    </div>
                )}
            </section>

            {/* ═══ Regional Satellite Data (GEE) ═══ */}
            <section>
                <div className="mb-3">
                    <h3 className="text-sm font-semibold text-white">
                        {t('farmTabs.regionalData', 'Regional Satellite Data')}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                        {t('farmTabs.sourceGEE', 'Source: Google Earth Engine')}
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0d1610]/70 p-4">
                    <div className="grid grid-cols-2 gap-2.5">
                        <RegionalMetric
                            icon={<Sun size={16} className="text-yellow-400" />}
                            label={t('farm.temperature', 'Temperature')}
                            value={metrics?.temperature_celsius != null ? `${metrics.temperature_celsius}°C` : '—'}
                        />
                        <RegionalMetric
                            icon={<Droplet size={16} className="text-blue-400" />}
                            label={t('farm.humidity', 'Humidity')}
                            value={metrics?.humidity_percent != null ? `${metrics.humidity_percent}%` : '—'}
                        />
                        <RegionalMetric
                            icon={<Activity size={16} className="text-teal-400" />}
                            label={t('farm.soilMoisture', 'Soil Moisture')}
                            value={metrics?.soil_moisture_mm != null ? `${metrics.soil_moisture_mm} mm` : '—'}
                        />
                        <RegionalMetric
                            icon={<Beaker size={16} className="text-purple-400" />}
                            label={t('farm.soilPh', 'Soil pH')}
                            value={metrics?.soil_ph != null ? `${metrics.soil_ph}` : '—'}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

// ── Sensor reading card ──
function SensorCard({ icon, label, value, warning, warningText }: {
    icon: React.ReactNode; label: string; value: string; warning: boolean; warningText?: string;
}) {
    return (
        <div className={`rounded-xl p-3 text-center border transition-colors ${
            warning
                ? 'bg-orange-500/8 border-orange-500/20'
                : 'bg-white/[0.03] border-white/8'
        }`}>
            <div className="flex justify-center mb-1.5">{icon}</div>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-lg font-semibold text-white tabular-nums mt-0.5">{value}</p>
            {warning && warningText && (
                <span className="text-[9px] text-orange-400 font-medium">{warningText}</span>
            )}
        </div>
    );
}

// ── Regional (GEE) metric row ──
function RegionalMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            {icon}
            <div className="min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-white tabular-nums">{value}</p>
            </div>
        </div>
    );
}
