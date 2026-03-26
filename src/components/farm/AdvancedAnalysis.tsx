import { useState, useMemo } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

/* ─── Props: GEE + Weather data passed from FarmDetails ─── */
interface AdvancedAnalysisProps {
    temperature: number | null;
    humidity: number | null;
    soilMoisture: number | null;
    soilPh: number | null;
}

/* ─── Analysis item type ─── */
interface AnalysisResult {
    id: string;
    titleKey: string;
    icon: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    score: number | null;
    summaryKey: string;
    summaryInterp?: Record<string, string | number>;
    recKey: string;
    recInterp?: Record<string, string | number>;
    details?: Record<string, any>;
}

/* ─── Severity Config ─── */
const severityConfig = {
    low: {
        bg: 'bg-green-500/10', border: 'border-green-500/20',
        text: 'text-green-400', dot: 'bg-green-400',
        labelKey: 'analysis.normal', barColor: 'bg-green-500',
    },
    medium: {
        bg: 'bg-yellow-500/10', border: 'border-yellow-500/20',
        text: 'text-yellow-400', dot: 'bg-yellow-400',
        labelKey: 'analysis.monitor', barColor: 'bg-yellow-500',
    },
    high: {
        bg: 'bg-orange-500/10', border: 'border-orange-500/20',
        text: 'text-orange-400', dot: 'bg-orange-400',
        labelKey: 'analysis.warning', barColor: 'bg-orange-500',
    },
    critical: {
        bg: 'bg-red-500/10', border: 'border-red-500/20',
        text: 'text-red-400', dot: 'bg-red-400',
        labelKey: 'analysis.critical', barColor: 'bg-red-500',
    },
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const scoreToSeverity = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
};

/* ─── Client-side analysis engine (now returns i18n keys) ─── */
function computeAnalyses(
    temp: number | null, humidity: number | null,
    moisture: number | null, ph: number | null,
    t: TFunction,
): AnalysisResult[] {
    const analyses: AnalysisResult[] = [];

    // 1. Irrigation Need
    if (moisture !== null) {
        const rawScore = moisture < 20 ? 90 : moisture < 35 ? 70 - (moisture - 20) : moisture < 50 ? 40 - (moisture - 35) * 0.5 : 10;
        const score = clamp(Math.round(rawScore), 0, 100);
        const tier = score >= 60 ? 'high' : score >= 30 ? 'mod' : 'low';
        analyses.push({
            id: 'irrigation_need', titleKey: 'analysis.irrigationNeed', icon: '💧',
            severity: scoreToSeverity(score), score,
            summaryKey: `analysis.irr_${tier}Sum`, summaryInterp: { val: moisture },
            recKey: `analysis.irr_${tier}Rec`,
        });
    }

    // 2. Fungal Disease Risk
    if (humidity !== null) {
        let score = humidity > 85 ? 90 : humidity > 75 ? 60 + (humidity - 75) : humidity > 60 ? 25 + (humidity - 60) * 2 : 10;
        if (temp !== null && temp >= 20 && temp <= 30 && humidity > 70) score = clamp(score + 15, 0, 100);
        score = clamp(Math.round(score), 0, 100);
        const tier = score >= 60 ? 'high' : score >= 30 ? 'mod' : 'low';
        analyses.push({
            id: 'fungal_risk', titleKey: 'analysis.fungalRisk', icon: '🦠',
            severity: scoreToSeverity(score), score,
            summaryKey: `analysis.fun_${tier}Sum`, summaryInterp: { val: humidity },
            recKey: `analysis.fun_${tier}Rec`,
        });
    }

    // 3. Evapotranspiration Irrigation
    if (temp !== null && humidity !== null) {
        const etFactor = (0.0023 * (temp + 17.8) * Math.sqrt(Math.max(1, 40 - humidity))) * 0.408;
        const etScore = clamp(Math.round(etFactor * 40), 0, 100);
        const etMmDay = (etFactor * 5).toFixed(1);
        const tier = etScore >= 60 ? 'high' : etScore >= 30 ? 'mod' : 'low';
        analyses.push({
            id: 'et_irrigation', titleKey: 'analysis.etIrrigation', icon: '🌡️',
            severity: scoreToSeverity(etScore), score: etScore,
            summaryKey: `analysis.et_${tier}Sum`, summaryInterp: { val: etMmDay },
            recKey: `analysis.et_${tier}Rec`, recInterp: { val: Math.round(etFactor * 5) },
            details: { estimated_et: `${etMmDay} mm/day`, temp_input: `${temp}°C`, humidity_input: `${humidity}%` },
        });
    }

    // 4. Crop Stress Index
    if (temp !== null || humidity !== null || moisture !== null) {
        let tempStress = 0, moistureStress = 0, humidityStress = 0;
        if (temp !== null) {
            if (temp > 40) tempStress = 100;
            else if (temp > 35) tempStress = 50 + (temp - 35) * 10;
            else if (temp > 30) tempStress = 20 + (temp - 30) * 6;
            else if (temp < 10) tempStress = 60 + (10 - temp) * 4;
            else if (temp < 15) tempStress = 20 + (15 - temp) * 8;
            else tempStress = 5;
        }
        if (moisture !== null) {
            if (moisture < 10) moistureStress = 90;
            else if (moisture < 20) moistureStress = 50 + (20 - moisture) * 4;
            else if (moisture < 30) moistureStress = 20 + (30 - moisture) * 3;
            else if (moisture > 85) moistureStress = 40 + (moisture - 85) * 3;
            else if (moisture > 70) moistureStress = 10 + (moisture - 70) * 2;
            else moistureStress = 5;
        }
        if (humidity !== null) {
            if (humidity > 90) humidityStress = 50;
            else if (humidity > 80) humidityStress = 20 + (humidity - 80) * 3;
            else if (humidity < 20) humidityStress = 60;
            else if (humidity < 30) humidityStress = 30 + (30 - humidity) * 3;
            else humidityStress = 5;
        }
        const score = clamp(Math.round((tempStress + moistureStress + humidityStress) / 3), 0, 100);
        const tier = score >= 60 ? 'high' : score >= 30 ? 'mod' : 'low';
        analyses.push({
            id: 'crop_stress', titleKey: 'analysis.cropStress', icon: '🌾',
            severity: scoreToSeverity(score), score,
            summaryKey: `analysis.str_${tier}Sum`,
            recKey: `analysis.str_${tier}Rec`,
            details: { temp_stress: `${Math.round(tempStress)}%`, moisture_stress: `${Math.round(moistureStress)}%`, humidity_stress: `${Math.round(humidityStress)}%` },
        });
    }

    // 5. Growth Condition Score
    if (temp !== null || humidity !== null || moisture !== null) {
        const conditions: string[] = [];
        let growthScore = 100;
        if (temp !== null) {
            if (temp >= 20 && temp <= 32) { conditions.push(t('analysis.cond_tempOpt', { val: temp })); }
            else if (temp >= 15 && temp <= 38) { conditions.push(t('analysis.cond_tempOk', { val: temp })); growthScore -= 15; }
            else { conditions.push(t('analysis.cond_tempBad', { val: temp })); growthScore -= 35; }
        }
        if (humidity !== null) {
            if (humidity >= 40 && humidity <= 75) conditions.push(t('analysis.cond_humOpt', { val: humidity }));
            else if (humidity >= 30 && humidity <= 85) { conditions.push(t('analysis.cond_humOk', { val: humidity })); growthScore -= 10; }
            else { conditions.push(t('analysis.cond_humBad', { val: humidity })); growthScore -= 25; }
        }
        if (moisture !== null) {
            if (moisture >= 30 && moisture <= 70) conditions.push(t('analysis.cond_moiOpt', { val: moisture }));
            else if (moisture >= 15 && moisture <= 85) { conditions.push(t('analysis.cond_moiOk', { val: moisture })); growthScore -= 15; }
            else { conditions.push(t('analysis.cond_moiBad', { val: moisture })); growthScore -= 30; }
        }
        if (ph !== null) {
            if (ph >= 5.5 && ph <= 7.5) conditions.push(t('analysis.cond_phOpt', { val: ph }));
            else if (ph >= 4.5 && ph <= 8.5) { conditions.push(t('analysis.cond_phOk', { val: ph })); growthScore -= 10; }
            else { conditions.push(t('analysis.cond_phBad', { val: ph })); growthScore -= 25; }
        }
        growthScore = clamp(growthScore, 0, 100);
        const tier = growthScore >= 75 ? 'high' : growthScore >= 50 ? 'mod' : 'low';
        analyses.push({
            id: 'growth_condition', titleKey: 'analysis.growthCondition', icon: '🌱',
            severity: scoreToSeverity(100 - growthScore), score: growthScore,
            summaryKey: `analysis.gro_${tier}Sum`,
            recKey: `analysis.gro_${tier}Rec`,
            details: { conditions },
        });
    }

    // 6. pH & Nutrient Availability
    if (ph !== null) {
        let score: number, phTier: string;
        if (ph < 5.0) { score = 80; phTier = 'vAcid'; }
        else if (ph < 5.5) { score = 55; phTier = 'mAcid'; }
        else if (ph <= 7.0) { score = 10; phTier = 'opt'; }
        else if (ph <= 7.5) { score = 25; phTier = 'sAlk'; }
        else if (ph <= 8.5) { score = 60; phTier = 'alk'; }
        else { score = 85; phTier = 'hAlk'; }
        analyses.push({
            id: 'ph_nutrients', titleKey: 'analysis.phNutrients', icon: '🧪',
            severity: scoreToSeverity(score), score,
            summaryKey: `analysis.ph_${phTier}Sum`, summaryInterp: { val: ph },
            recKey: `analysis.ph_${phTier}Rec`,
            details: { nutrients_key: `analysis.ph_${phTier}Nut`, ph_value: ph },
        });
    }

    return analyses;
}

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
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">💡 {t('analysis.recommendation')}</p>
                        <p className="text-gray-300 text-xs leading-relaxed">
                            {t(item.recKey, item.recInterp || {})}
                        </p>
                    </div>

                    {/* Growth condition details */}
                    {item.id === 'growth_condition' && item.details?.conditions && (
                        <div className="space-y-1">
                            {(item.details.conditions as string[]).map((cond, idx) => (
                                <p key={idx} className="text-gray-400 text-[11px]">{cond}</p>
                            ))}
                        </div>
                    )}

                    {/* pH nutrient details */}
                    {item.id === 'ph_nutrients' && item.details?.nutrients_key && (
                        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('analysis.nutrientAvailability')}</p>
                            <p className="text-gray-300 text-[11px]">{t(item.details.nutrients_key)}</p>
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
