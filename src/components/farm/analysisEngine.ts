/**
 * Shared agronomic analysis computation engine.
 * Extracted from AdvancedAnalysis.tsx so both FarmOverviewTab and FarmInsightsTab
 * can consume the same logic without duplicating code.
 */
import type { TFunction } from 'i18next';

export type AnalysisDetailValue = string | number | boolean | null | string[];

export interface AnalysisResult {
    id: string;
    titleKey: string;
    icon: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    score: number | null;
    summaryKey: string;
    summaryInterp?: Record<string, string | number>;
    recKey: string;
    recInterp?: Record<string, string | number>;
    details?: Record<string, AnalysisDetailValue>;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const scoreToSeverity = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
};

export const severityConfig = {
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

export function computeAnalyses(
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
        if (ph < 5.5) { score = 80; phTier = 'sAcid'; }
        else if (ph <= 6.5) { score = 30; phTier = 'mAcid'; }
        else if (ph <= 7.5) { score = 10; phTier = 'neutral'; }
        else { score = 65; phTier = 'alkaline'; }
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
