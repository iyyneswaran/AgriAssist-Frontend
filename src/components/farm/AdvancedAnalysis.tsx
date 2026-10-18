import { useState, useMemo } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { computeAnalyses, severityConfig } from './analysisEngine';
import type { AnalysisResult } from './analysisEngine';

/* ─── Props: GEE + Weather data passed from FarmDetails ─── */
interface AdvancedAnalysisProps {
    temperature: number | null;
    humidity: number | null;
    soilMoisture: number | null;
    soilPh: number | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ─── Collapsible Analysis Card (collapsed by default) ─── */
function AnalysisCard({ item }: { item: AnalysisResult }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const config = severityConfig[item.severity] || severityConfig.low;

    return (
        <div className={`${config.bg} border ${config.border} rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20`}>
            {/* Collapsed header — always visible */}
            <button onClick={() => setExpanded(!expanded)} className="w-full p-3.5 text-left">
                <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <h4 className="text-white text-sm font-medium flex-1">{t(item.titleKey)}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border} flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${item.severity === 'critical' ? 'animate-pulse' : ''}`}></span>
                        {t(config.labelKey)}
                    </span>
                    {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
            </button>

            {/* Expanded body — summary, score bar, recommendation, details */}
            {expanded && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-white/5 space-y-2.5">
                    {/* Summary */}
                    <p className="text-gray-300 text-xs mt-2.5 leading-relaxed">
                        {t(item.summaryKey, item.summaryInterp || {})}
                    </p>

                    {/* Score bar */}
                    {item.score != null && (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full ${config.barColor} rounded-full transition-all duration-700`} style={{ width: `${clamp(item.score, 0, 100)}%` }}></div>
                            </div>
                            <span className={`text-[10px] ${config.text} font-medium`}>{item.score}</span>
                        </div>
                    )}

                    {/* Recommendation */}
                    <div className="bg-white/[0.03] rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t('analysis.recommendation')}</p>
                        <p className="text-gray-300 text-xs leading-relaxed">
                            {t(item.recKey, item.recInterp || {})}
                        </p>
                    </div>

                    {/* Growth condition details */}
                    {item.id === 'growth_condition' && item.details?.conditions && (
                        <div className="space-y-1">
                            {(item.details.conditions as unknown as string[]).map((cond, idx) => (
                                <p key={idx} className="text-gray-400 text-[11px]">{cond}</p>
                            ))}
                        </div>
                    )}

                    {/* pH nutrient details */}
                    {item.id === 'ph_nutrients' && item.details?.nutrients_key && (
                        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('analysis.nutrientAvailability')}</p>
                            <p className="text-gray-300 text-[11px]">{t(String(item.details.nutrients_key))}</p>
                        </div>
                    )}

                    {/* Crop stress breakdown */}
                    {item.id === 'crop_stress' && item.details && (
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: t('analysis.temp'), value: item.details.temp_stress },
                                { label: t('analysis.moisture'), value: item.details.moisture_stress },
                                { label: t('analysis.humidityLabel'), value: item.details.humidity_stress },
                            ].map((f, idx) => (
                                <div key={idx} className="bg-white/[0.03] rounded-lg p-2 text-center">
                                    <p className="text-[9px] text-gray-500 uppercase">{f.label}</p>
                                    <p className="text-gray-300 text-xs font-medium mt-0.5">{f.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ET details */}
                    {item.id === 'et_irrigation' && item.details && (
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: t('analysis.estEt'), value: item.details.estimated_et },
                                { label: t('analysis.temp'), value: item.details.temp_input },
                                { label: t('analysis.humidityLabel'), value: item.details.humidity_input },
                            ].map((d, idx) => (
                                <div key={idx} className="bg-white/[0.03] rounded-lg p-2 text-center">
                                    <p className="text-[9px] text-gray-500 uppercase">{d.label}</p>
                                    <p className="text-gray-300 text-xs font-medium mt-0.5">{d.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Main Component ─── */
export default function AdvancedAnalysis({ temperature, humidity, soilMoisture, soilPh }: AdvancedAnalysisProps) {
    const { t } = useTranslation();
    const [sectionOpen, setSectionOpen] = useState(true);
    const hasAnyData = temperature !== null || humidity !== null || soilMoisture !== null || soilPh !== null;

    const analyses = useMemo(() => {
        if (!hasAnyData) return [];
        return computeAnalyses(temperature, humidity, soilMoisture, soilPh, t);
    }, [temperature, humidity, soilMoisture, soilPh, hasAnyData, t]);

    if (!hasAnyData) {
        return (
            <div className="relative glass-panel-dark border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Activity size={18} className="text-purple-400" />
                    <h3 className="text-white text-base font-medium">{t('analysis.title')}</h3>
                </div>
                <div className="text-center py-6">
                    <p className="text-gray-500 text-xs">{t('analysis.noData')}</p>
                    <p className="text-gray-600 text-[10px] mt-1">{t('analysis.noDataDesc')}</p>
                </div>
            </div>
        );
    }

    const criticalItems = analyses.filter(a => a.severity === 'critical' || a.severity === 'high');

    return (
        <div className="relative glass-panel-dark border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-5">
            <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/8 blur-[60px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-36 h-36 bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none"></div>

            {/* Collapsible section header */}
            <button onClick={() => setSectionOpen(!sectionOpen)} className="w-full flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-purple-400" />
                    <h3 className="text-white text-base font-medium">{t('analysis.title')}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {criticalItems.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                            {criticalItems.length} ⚠️
                        </span>
                    )}
                    {sectionOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </button>

            {sectionOpen && (
                <>
                    <p className="text-gray-500 text-[11px] mb-4 relative z-10">{t('analysis.subtitle')}</p>

                    {/* Data source badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 relative z-10">
                        {temperature !== null && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">🌡️ {temperature}°C</span>
                        )}
                        {humidity !== null && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">💧 {humidity}%</span>
                        )}
                        {soilMoisture !== null && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">🌿 {soilMoisture} mm</span>
                        )}
                        {soilPh !== null && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">🧪 pH {soilPh}</span>
                        )}
                    </div>

                    {/* All cards — each fully collapsible */}
                    <div className="space-y-2.5 relative z-10">
                        {analyses.map(item => <AnalysisCard key={item.id} item={item} />)}
                    </div>
                </>
            )}
        </div>
    );
}
