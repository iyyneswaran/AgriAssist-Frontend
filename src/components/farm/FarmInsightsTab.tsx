import { useState, useMemo } from 'react';
import { Activity, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { computeAnalyses, severityConfig } from './analysisEngine';
import type { AnalysisResult } from './analysisEngine';

interface InsightsTabProps {
    temperature: number | null;
    humidity: number | null;
    soilMoisture: number | null;
    soilPh: number | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function FarmInsightsTab({ temperature, humidity, soilMoisture, soilPh }: InsightsTabProps) {
    const { t } = useTranslation();
    const hasAnyData = temperature !== null || humidity !== null || soilMoisture !== null || soilPh !== null;

    const analyses = useMemo(() => {
        if (!hasAnyData) return [];
        return computeAnalyses(temperature, humidity, soilMoisture, soilPh, t);
    }, [temperature, humidity, soilMoisture, soilPh, hasAnyData, t]);

    const criticalCount = analyses.filter(a => a.severity === 'critical' || a.severity === 'high').length;

    // ── No data state ──
    if (!hasAnyData) {
        return (
            <div className="rounded-2xl border border-white/10 bg-[#0d1610]/70 p-6 text-center">
                <Activity size={24} className="text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-300">{t('analysis.noData')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('analysis.noDataDesc')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-4">

            {/* ═══ Summary header ═══ */}
            <section className="rounded-2xl border border-white/10 bg-[#0d1610]/70 p-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                    <Activity size={15} className="text-purple-400" />
                    {t('farmTabs.insightsSummary', 'Field Condition Summary')}
                </h3>

                {/* Data source badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {temperature !== null && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/15">{temperature}°C</span>
                    )}
                    {humidity !== null && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/15">{humidity}%</span>
                    )}
                    {soilMoisture !== null && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/15">{soilMoisture} mm</span>
                    )}
                    {soilPh !== null && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/15">pH {soilPh}</span>
                    )}
                </div>

                {/* Status summary */}
                {criticalCount > 0 ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-500/8 border border-orange-500/15">
                        <AlertTriangle size={16} className="text-orange-400 shrink-0" />
                        <p className="text-xs text-gray-200">
                            {t('farmTabs.issuesFound', { count: criticalCount })}
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-500/8 border border-green-500/15">
                        <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                        <p className="text-xs text-gray-200">
                            {t('farmTabs.allNormal', 'All parameters are within normal ranges')}
                        </p>
                    </div>
                )}
            </section>

            {/* ═══ Analysis list ═══ */}
            <section>
                <p className="text-xs text-gray-400 mb-3 px-0.5">
                    {t('analysis.subtitle')}
                </p>
                <div className="space-y-2">
                    {analyses.map(item => (
                        <AnalysisRow key={item.id} item={item} />
                    ))}
                </div>
            </section>
        </div>
    );
}

// ── Individual analysis row (collapsible) ──
function AnalysisRow({ item }: { item: AnalysisResult }) {
    const { t } = useTranslation();
    // Auto-expand critical items
    const [expanded, setExpanded] = useState(item.severity === 'critical');
    const config = severityConfig[item.severity] || severityConfig.low;

    return (
        <div className={`rounded-xl border overflow-hidden transition-colors ${config.border} ${
            expanded ? config.bg : 'bg-[#0d1610]/70'
        }`}>
            {/* Header row — always visible */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-3.5 text-left flex items-center gap-3 glass-focus-ring"
                aria-expanded={expanded}
            >
                <span className="text-lg shrink-0" aria-hidden="true">{item.icon}</span>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{t(item.titleKey)}</h4>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium border shrink-0 flex items-center gap-1 ${config.bg} ${config.text} ${config.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${item.severity === 'critical' ? 'animate-pulse' : ''}`} />
                    {t(config.labelKey)}
                </span>
                {expanded
                    ? <ChevronUp size={14} className="text-gray-400 shrink-0" />
                    : <ChevronDown size={14} className="text-gray-400 shrink-0" />
                }
            </button>

            {/* Expanded detail panel */}
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
                                <div
                                    className={`h-full ${config.barColor} rounded-full transition-all duration-700`}
                                    style={{ width: `${clamp(item.score, 0, 100)}%` }}
                                />
                            </div>
                            <span className={`text-[10px] ${config.text} font-medium tabular-nums`}>{item.score}</span>
                        </div>
                    )}

                    {/* Recommendation */}
                    <div className="bg-white/[0.03] rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('analysis.recommendation')}</p>
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
                                    <p className="text-gray-300 text-xs font-medium mt-0.5 tabular-nums">{f.value}</p>
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
                                    <p className="text-gray-300 text-xs font-medium mt-0.5 tabular-nums">{d.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
