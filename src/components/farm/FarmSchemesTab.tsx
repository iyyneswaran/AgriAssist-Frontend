import { useState } from 'react';
import { Award, MapPin, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAppData } from '../../context/AppDataContext';
import type { SchemeRecommendation } from '../../services/schemeService';

// ── Score badge helper ──
const getScoreBadge = (score: number, t: TFunction) => {
    if (score >= 0.7) return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: t('farmTabs.highMatch', 'High Match') };
    if (score >= 0.5) return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: t('farmTabs.goodMatch', 'Good Match') };
    return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: t('farmTabs.relevant', 'Relevant') };
};

// ── Title extraction ──
const getSchemeTitle = (scheme: SchemeRecommendation): string => {
    if (scheme.title && !scheme.title.toLowerCase().startsWith('unknown')) {
        return scheme.title.replace(/\s*\(Part \d+\)$/i, '');
    }
    if (scheme.description) {
        const nameMatch = scheme.description.match(/(?:scheme|yojana|mission|programme|program|abhiyan)[:\s]+([^.]+)/i);
        if (nameMatch) return nameMatch[1].trim().substring(0, 60);
        const firstSentence = scheme.description.split(/[.!]/)[0]?.trim();
        if (firstSentence && firstSentence.length > 5) {
            return firstSentence.length > 60 ? firstSentence.substring(0, 57) + '...' : firstSentence;
        }
    }
    return scheme.scheme_id || 'Agricultural Scheme';
};

// ── Description bullets ──
const formatDescriptionAsBullets = (text: string): string[] => {
    if (!text) return [];
    const parts = text
        .split(/(?<=[.;])\s+|\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .map(s => s.replace(/^[-•]\s*/, ''));
    return parts.slice(0, 6);
};

// ── Region check ──
const hasValidRegion = (region: string | undefined): boolean => {
    if (!region) return false;
    const lower = region.toLowerCase().trim();
    return lower !== '' && lower !== 'not mentioned' && lower !== 'unknown' && lower !== 'n/a';
};

export default function FarmSchemesTab() {
    const { t } = useTranslation();
    const { schemes, schemesLoading, schemesError, refreshSchemes } = useAppData();

    const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

    return (
        <div className="space-y-4 pb-4">

            {/* ═══ Header ═══ */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Award size={16} className="text-amber-400" />
                        {t('farmTabs.schemesTitle', 'Government Schemes')}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 max-w-sm">
                        {t('farmTabs.schemesSubtitle', 'Recommendations based on your crop, soil, location, and farm size.')}
                    </p>
                </div>
                <button
                    onClick={refreshSchemes}
                    disabled={schemesLoading}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/8 text-gray-400 hover:text-white transition-colors glass-focus-ring"
                    aria-label={t('farmTabs.refresh', 'Refresh')}
                >
                    <RefreshCw size={13} className={schemesLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ═══ Loading ═══ */}
            {schemesLoading && (
                <div className="space-y-2.5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-xl border border-white/8 bg-[#0d1610]/70 p-4 animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-3/4 bg-white/8 rounded" />
                                    <div className="h-3 w-1/2 bg-white/5 rounded" />
                                </div>
                                <div className="h-5 w-16 bg-white/8 rounded-md" />
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-center gap-2 py-2">
                        <Loader2 size={14} className="animate-spin text-amber-400" />
                        <span className="text-gray-400 text-xs">{t('farm.findingSchemes')}</span>
                    </div>
                </div>
            )}

            {/* ═══ Error ═══ */}
            {!schemesLoading && schemesError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                    <p className="text-red-400 text-xs">{schemesError}</p>
                    <button
                        onClick={refreshSchemes}
                        className="mt-2 text-[10px] text-red-300 underline hover:text-red-200"
                    >
                        {t('farmTabs.tryAgain', 'Try again')}
                    </button>
                </div>
            )}

            {/* ═══ Empty ═══ */}
            {!schemesLoading && !schemesError && schemes.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-[#0d1610]/70 p-6 text-center">
                    <Award size={28} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-300">{t('farm.noSchemes')}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{t('farm.noSchemesDesc')}</p>
                </div>
            )}

            {/* ═══ Scheme Cards ═══ */}
            {!schemesLoading && !schemesError && schemes.length > 0 && (
                <>
                    <p className="text-xs text-gray-400 px-0.5">
                        {t('farmTabs.schemesAvailable', { count: schemes.length })}
                    </p>
                    <div className="space-y-2">
                        {schemes.map((scheme) => {
                            const badge = getScoreBadge(scheme.final_score, t);
                            const isExpanded = expandedScheme === scheme.id;

                            return (
                                <div
                                    key={scheme.id}
                                    className="rounded-xl border border-white/10 bg-[#0d1610]/70 overflow-hidden transition-colors hover:border-white/15"
                                >
                                    {/* Scheme header */}
                                    <button
                                        onClick={() => setExpandedScheme(isExpanded ? null : scheme.id)}
                                        className="w-full p-3.5 text-left glass-focus-ring"
                                        aria-expanded={isExpanded}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-white leading-snug">
                                                    {getSchemeTitle(scheme)}
                                                </h4>
                                                {scheme.benefit_amount && (
                                                    <p className="text-brand-green text-xs mt-1 font-medium">
                                                        {t('farmTabs.benefit', 'Benefit')}: {scheme.benefit_amount}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                                                    {badge.label}
                                                </span>
                                                {isExpanded
                                                    ? <ChevronUp size={14} className="text-gray-400" />
                                                    : <ChevronDown size={14} className="text-gray-400" />
                                                }
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {hasValidRegion(scheme.region) && (
                                                <span className="text-[10px] bg-white/[0.04] text-gray-400 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                                                    <MapPin size={9} className="shrink-0" /> {scheme.region}
                                                </span>
                                            )}
                                            {scheme.crop_type && scheme.crop_type !== 'Not mentioned' && (
                                                <span className="text-[10px] bg-white/[0.04] text-gray-400 px-2 py-0.5 rounded border border-white/5">
                                                    {scheme.crop_type.length > 40 ? scheme.crop_type.substring(0, 40) + '...' : scheme.crop_type}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="px-3.5 pb-3.5 pt-0 border-t border-white/5 space-y-3">
                                            {scheme.description && (
                                                <div className="mt-3">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                                                        {t('farm.keyPoints', 'Key Points')}
                                                    </p>
                                                    <ul className="space-y-1.5">
                                                        {formatDescriptionAsBullets(scheme.description).map((point, idx) => (
                                                            <li key={idx} className="text-gray-300 text-xs leading-relaxed flex gap-2">
                                                                <span className="text-brand-green mt-0.5 shrink-0">•</span>
                                                                <span>{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {scheme.eligibility && scheme.eligibility !== 'Not mentioned' && (
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                                                        {t('farm.whoCanApply', 'Who Can Apply')}
                                                    </p>
                                                    <p className="text-gray-300 text-xs leading-relaxed">
                                                        {scheme.eligibility}
                                                    </p>
                                                </div>
                                            )}
                                            {scheme.scheme_id && (
                                                <p className="text-[10px] text-gray-600">
                                                    {t('farm.schemeId', 'Scheme ID')}: {scheme.scheme_id}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
