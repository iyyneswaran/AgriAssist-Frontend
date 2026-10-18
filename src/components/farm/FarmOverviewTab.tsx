import { MapPin, Sprout, ChevronRight, AlertTriangle, CheckCircle2, Landmark, Sun, Droplet, Activity, Beaker } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../../context/AppDataContext';
import type { LandDetails } from '../../services/landService';
import type { Field } from '../../services/fieldService';
import type { CropAssignment } from '../../services/cropService';
import type { FarmMetricsData } from '../../services/geoService';
import { useMemo } from 'react';

// Reuse the analysis engine to get priority insights
import { computeAnalyses } from './analysisEngine';

interface OverviewTabProps {
    land: LandDetails;
    firstField: Field;
    cropName: string;
    cropImg: string;
    assignment: CropAssignment | null;
    metrics: FarmMetricsData | null;
    onNavigateTab: (tab: 'overview' | 'sensors' | 'insights' | 'schemes') => void;
}

// ── Soil type localization helper ──
function mapSoilType(type: string, t: (key: string) => string): string {
    if (!type) return '—';
    const key = type.toLowerCase().replace(/\s*soil/, 'Soil');
    if (['blackSoil', 'redSoil', 'alluvial', 'laterite', 'sandy'].includes(key)) {
        return t(`profile.${key}`);
    }
    return type;
}

// ── Growth stage calculation ──
function getGrowthStageLabel(assignment: CropAssignment | null, t: (key: string) => string): string {
    if (!assignment?.sowingDate) return '—';
    const sown = new Date(assignment.sowingDate);
    if (isNaN(sown.getTime())) return '—';
    const diffDays = Math.floor((Date.now() - sown.getTime()) / (1000 * 60 * 60 * 24));
    const growthDays = assignment.crop?.growthDays || 100;
    if (diffDays < growthDays * 0.2) return t('crops.seedlingStage');
    if (diffDays < growthDays * 0.5) return t('crops.vegetativeStage');
    if (diffDays < growthDays * 0.7) return t('crops.floweringStage');
    if (diffDays <= growthDays) return t('crops.fruitingStage');
    return t('crops.readyToHarvest');
}

export default function FarmOverviewTab({ land, firstField, cropName, cropImg, assignment, metrics, onNavigateTab }: OverviewTabProps) {
    const { t } = useTranslation();
    const { schemes, schemesLoading, schemesError } = useAppData();

    const cornersCount = land.corners && Array.isArray(land.corners) ? land.corners.length : 0;
    const growthStage = getGrowthStageLabel(assignment, t);

    // Compute priority insights (top issues)
    const analyses = useMemo(() => {
        if (!metrics) return [];
        return computeAnalyses(
            metrics.temperature_celsius,
            metrics.humidity_percent,
            metrics.soil_moisture_mm,
            metrics.soil_ph,
            t
        );
    }, [metrics, t]);

    const criticalInsights = analyses.filter(a => a.severity === 'critical' || a.severity === 'high');

    return (
        <div className="space-y-4 pb-4">

            {/* ═══ A. Farm identity card ═══ */}
            <section className="rounded-2xl border border-white/10 bg-[#0d1610]/70 overflow-hidden">
                {/* Hero header — crop image + farm name */}
                <div className="relative px-4 pt-4 pb-3 sm:px-5 sm:pt-5 flex items-center gap-4">
                    {/* Crop image — circular with subtle ring */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full bg-brand-green/8 border-2 border-brand-green/25 p-2 flex items-center justify-center">
                        <img src={cropImg} alt={cropName} className="w-full h-full object-contain drop-shadow-sm" />
                    </div>

                    {/* Farm name + location */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-white text-lg font-bold tracking-tight truncate leading-tight">{land.name}</h2>
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                            <MapPin size={12} className="shrink-0 text-gray-500" />
                            <span className="truncate">{land.district}, {land.state}</span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-4 sm:mx-5 border-t border-white/[0.06]" />

                {/* Metadata grid — 2×2, full-width below the header */}
                <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                    <MetadataCell
                        label={t('farmTabs.cropInfo', 'Crop')}
                        value={cropName}
                        accent
                    />
                    <MetadataCell
                        label={t('farmTabs.areaInfo', 'Area')}
                        value={`${firstField.area} ${t('profile.acres')}`}
                    />
                </div>
                <div className="mx-4 sm:mx-5 border-t border-white/[0.06]" />
                <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                    <MetadataCell
                        label={t('farmTabs.soilInfo', 'Soil')}
                        value={mapSoilType(land.soilType, t)}
                    />
                    <MetadataCell
                        label={t('farmTabs.boundaryInfo', 'Boundary')}
                        value={cornersCount > 0
                            ? t('farmTabs.cornersMapped', { count: cornersCount })
                            : t('farmTabs.notMapped', 'Not mapped')
                        }
                    />
                </div>

                {/* Growth stage footer strip */}
                {growthStage !== '—' && (
                    <div className="bg-brand-green/[0.06] border-t border-brand-green/15 px-4 py-2.5 sm:px-5 flex items-center gap-2">
                        <Sprout size={14} className="text-brand-green shrink-0" />
                        <span className="text-[12px] font-medium text-brand-green">
                            {t('farmTabs.growthStage', 'Growth Stage')}: {growthStage}
                        </span>
                    </div>
                )}
            </section>

            {/* ═══ B. Environmental snapshot (compact metric grid) ═══ */}
            <section>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2.5 px-0.5">
                    {t('farmTabs.environmentalData', 'Environmental Data')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <MetricTile
                        icon={<Sun size={16} className="text-yellow-400" />}
                        label={t('farm.temperature', 'Temperature')}
                        value={metrics?.temperature_celsius != null ? `${metrics.temperature_celsius}°C` : '—'}
                        source={t('farmTabs.sourceGEE', 'GEE')}
                    />
                    <MetricTile
                        icon={<Droplet size={16} className="text-blue-400" />}
                        label={t('farm.humidity', 'Humidity')}
                        value={metrics?.humidity_percent != null ? `${metrics.humidity_percent}%` : '—'}
                        source={t('farmTabs.sourceGEE', 'GEE')}
                    />
                    <MetricTile
                        icon={<Activity size={16} className="text-teal-400" />}
                        label={t('farm.soilMoisture', 'Soil Moisture')}
                        value={metrics?.soil_moisture_mm != null ? `${metrics.soil_moisture_mm} mm` : '—'}
                        source={t('farmTabs.sourceGEE', 'GEE')}
                    />
                    <MetricTile
                        icon={<Beaker size={16} className="text-purple-400" />}
                        label={t('farm.soilPh', 'Soil pH')}
                        value={metrics?.soil_ph != null ? `${metrics.soil_ph}` : '—'}
                        source={t('farmTabs.sourceGEE', 'GEE')}
                    />
                </div>
            </section>

            {/* ═══ C. Priority insights summary ═══ */}
            <section className="rounded-2xl border border-white/10 bg-[#0d1610]/70 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Activity size={15} className="text-purple-400" />
                        {t('farmTabs.priorityInsights', 'Priority Insights')}
                    </h3>
                    <button
                        onClick={() => onNavigateTab('insights')}
                        className="text-[11px] text-brand-green font-medium flex items-center gap-0.5 hover:underline transition-colors glass-focus-ring"
                    >
                        {t('farmTabs.viewAllInsights', 'View all insights')}
                        <ChevronRight size={12} />
                    </button>
                </div>

                {!metrics ? (
                    <p className="text-xs text-gray-500">{t('analysis.noData')}</p>
                ) : criticalInsights.length === 0 ? (
                    <div className="flex items-center gap-2.5 py-2">
                        <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                        <div>
                            <p className="text-sm text-gray-200">{t('farmTabs.noAlerts', 'No issues detected')}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{t('farmTabs.noAlertsDesc', 'All monitored parameters are within normal ranges.')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {criticalInsights.slice(0, 3).map(item => {
                            const isC = item.severity === 'critical';
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigateTab('insights')}
                                    className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors glass-focus-ring ${
                                        isC
                                            ? 'bg-red-500/8 border-red-500/20 hover:bg-red-500/12'
                                            : 'bg-orange-500/8 border-orange-500/20 hover:bg-orange-500/12'
                                    }`}
                                >
                                    <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${isC ? 'text-red-400' : 'text-orange-400'}`} />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-white truncate">{t(item.titleKey)}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                                                isC
                                                    ? 'bg-red-500/15 text-red-400'
                                                    : 'bg-orange-500/15 text-orange-400'
                                            }`}>
                                                {t(isC ? 'analysis.critical' : 'analysis.warning')}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                                            {t(item.summaryKey, item.summaryInterp || {})}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ═══ D. Scheme preview ═══ */}
            <section className="rounded-2xl border border-white/10 bg-[#0d1610]/70 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Landmark size={15} className="text-amber-400" />
                        <h3 className="text-sm font-semibold text-white">
                            {t('farmTabs.schemesTitle', 'Government Schemes')}
                        </h3>
                    </div>
                    <button
                        onClick={() => onNavigateTab('schemes')}
                        className="text-[11px] text-brand-green font-medium flex items-center gap-0.5 hover:underline transition-colors glass-focus-ring"
                    >
                        {t('farmTabs.viewSchemes', 'View schemes')}
                        <ChevronRight size={12} />
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    {schemesLoading
                        ? t('farmTabs.schemesLoading', 'Matching schemes...')
                        : schemesError
                            ? schemesError
                            : schemes.length > 0
                                ? t('farmTabs.schemesAvailable', { count: schemes.length })
                                : t('farm.noSchemes')
                    }
                </p>
            </section>
        </div>
    );
}

// ── Reusable sub-components ──

function MetadataCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="px-4 py-2.5 sm:px-5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium block leading-none">{label}</span>
            <span className={`text-sm font-semibold truncate block mt-1 leading-tight ${accent ? 'text-brand-green' : 'text-gray-100'}`}>{value}</span>
        </div>
    );
}

function MetricTile({ icon, label, value, source }: { icon: React.ReactNode; label: string; value: string; source?: string }) {
    return (
        <div className="rounded-xl border border-white/8 bg-[#0d1610]/60 p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                {icon}
                {source && <span className="text-[9px] text-gray-600 font-mono">{source}</span>}
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-base font-semibold text-white tabular-nums mt-0.5">{value}</p>
            </div>
        </div>
    );
}
