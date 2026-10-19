import { useState } from 'react';
import {
    Landmark,
    MapPin,
    RefreshCw,
    Loader2,
    ChevronDown,
    Leaf,
    Banknote,
    CheckCircle2,
    Users,
    FileText,
    Sparkles,
    ShieldCheck,
    Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAppData } from '../../context/AppDataContext';
import type { SchemeRecommendation } from '../../services/schemeService';

// ── Score badge helper ──
const getScoreBadge = (score: number, t: TFunction) => {
    if (score >= 0.7) {
        return {
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            border: 'border-emerald-500/25',
            label: t('farmTabs.highMatch', 'High Match'),
            Icon: ShieldCheck,
        };
    }
    if (score >= 0.5) {
        return {
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
            border: 'border-amber-500/25',
            label: t('farmTabs.goodMatch', 'Good Match'),
            Icon: Sparkles,
        };
    }
    return {
        bg: 'bg-sky-500/10',
        text: 'text-sky-400',
        border: 'border-sky-500/25',
        label: t('farmTabs.relevant', 'Relevant'),
        Icon: Award,
    };
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
                        <Landmark size={16} className="text-amber-400" />
                        {t('farmTabs.schemesTitle', 'Government Schemes')}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 max-w-sm">
                        {t('farmTabs.schemesSubtitle', 'Recommendations based on your crop, soil, location, and farm size.')}
                    </p>
                </div>
                <button
                    onClick={refreshSchemes}
                    disabled={schemesLoading}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-400 hover:text-white transition-colors glass-focus-ring cursor-pointer"
                    aria-label={t('farmTabs.refresh', 'Refresh')}
                >
                    <RefreshCw size={14} className={schemesLoading ? 'animate-spin text-brand-green' : ''} />
                </button>
            </div>

            {/* ═══ Loading ═══ */}
            {schemesLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-2xl border border-white/10 bg-[#0d1610]/70 p-4 sm:p-5 animate-pulse space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-3/4 bg-white/8 rounded" />
                                    <div className="h-3 w-1/3 bg-white/5 rounded" />
                                </div>
                                <div className="h-6 w-20 bg-white/5 rounded-full shrink-0" />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <div className="h-6 w-28 bg-white/5 rounded-md" />
                                <div className="h-6 w-20 bg-white/5 rounded-md" />
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-center gap-2 py-3">
                        <Loader2 size={15} className="animate-spin text-brand-green" />
                        <span className="text-gray-400 text-xs">{t('farm.findingSchemes')}</span>
                    </div>
                </div>
            )}

            {/* ═══ Error ═══ */}
            {!schemesLoading && schemesError && (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5 text-center space-y-2">
                    <p className="text-red-400 text-xs font-medium">{schemesError}</p>
                    <button
                        onClick={refreshSchemes}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                        <RefreshCw size={12} />
                        {t('farmTabs.tryAgain', 'Try again')}
                    </button>
                </div>
            )}

            {/* ═══ Empty ═══ */}
            {!schemesLoading && !schemesError && schemes.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#0d1610]/70 p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                        <Landmark size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-200">{t('farm.noSchemes')}</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{t('farm.noSchemesDesc')}</p>
                    </div>
                </div>
            )}

            {/* ═══ Scheme Cards ═══ */}
            {!schemesLoading && !schemesError && schemes.length > 0 && (
                <>
                    <div className="flex items-center justify-between px-0.5">
                        <span className="text-xs font-medium text-gray-400">
                            {t('farmTabs.schemesAvailable', { count: schemes.length })}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {schemes.map((scheme) => {
                            const badge = getScoreBadge(scheme.final_score, t);
                            const BadgeIcon = badge.Icon;
                            const isExpanded = expandedScheme === scheme.id;

                            return (
                                <div
                                    key={scheme.id}
                                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                                        isExpanded
                                            ? 'border-brand-green/35 bg-[#0e1913]/90 shadow-lg shadow-black/50 ring-1 ring-brand-green/20'
                                            : 'border-white/10 bg-[#0d1610]/75 hover:border-white/20 hover:bg-[#0f1b14]/80'
                                    }`}
                                >
                                    {/* Scheme Interactive Card Header */}
                                    <button
                                        onClick={() => setExpandedScheme(isExpanded ? null : scheme.id)}
                                        className="w-full p-4 sm:p-5 text-left glass-focus-ring cursor-pointer group"
                                        aria-expanded={isExpanded}
                                    >
                                        <div className="flex items-start gap-3.5">
                                            {/* Landmark / Official Emblem Icon */}
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                                <Landmark size={18} />
                                            </div>

                                            {/* Main title & score badge */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2.5">
                                                    <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight leading-snug group-hover:text-brand-green transition-colors">
                                                        {getSchemeTitle(scheme)}
                                                    </h4>
                                                    <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full font-medium border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                                                        <BadgeIcon size={12} className="shrink-0" />
                                                        <span>{badge.label}</span>
                                                    </span>
                                                </div>

                                                {/* Financial Benefit Badge */}
                                                {scheme.benefit_amount && (
                                                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                                                        <Banknote size={13} className="shrink-0 text-emerald-400" />
                                                        <span className="text-gray-300 font-normal">{t('farmTabs.benefit', 'Benefit')}:</span>
                                                        <span className="text-white font-bold">{scheme.benefit_amount}</span>
                                                    </div>
                                                )}

                                                {/* Tags: Crop (with Leaf icon) & Region (with MapPin icon) */}
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                                                    {scheme.crop_type && scheme.crop_type !== 'Not mentioned' && (
                                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                                                            <Leaf size={11} className="shrink-0 text-emerald-400" />
                                                            <span className="truncate max-w-[200px]">
                                                                {scheme.crop_type.length > 40 ? scheme.crop_type.substring(0, 40) + '...' : scheme.crop_type}
                                                            </span>
                                                        </span>
                                                    )}

                                                    {hasValidRegion(scheme.region) && (
                                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-sky-950/40 text-sky-300 border border-sky-500/20 px-2.5 py-1 rounded-md">
                                                            <MapPin size={11} className="shrink-0 text-sky-400" />
                                                            <span>{scheme.region}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Expand/Collapse Hint Bar */}
                                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.06] text-xs">
                                            <span className="text-[11px] text-gray-400 group-hover:text-gray-200 transition-colors flex items-center gap-1 font-medium">
                                                {isExpanded ? t('farmTabs.collapseDetails', 'Hide details') : t('farmTabs.expandDetails', 'Show details')}
                                            </span>
                                            <div className={`w-5 h-5 rounded-full bg-white/[0.04] border border-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-all duration-200 ${isExpanded ? 'rotate-180 text-brand-green bg-brand-green/10 border-brand-green/20' : ''}`}>
                                                <ChevronDown size={12} />
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Details Section */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 space-y-3 border-t border-white/[0.06] bg-black/20">
                                            {/* Key Points */}
                                            {scheme.description && (
                                                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2 mt-3">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                                                        <FileText size={13} className="text-amber-400 shrink-0" />
                                                        <span>{t('farm.keyPoints', 'Key Points')}</span>
                                                    </div>
                                                    <ul className="space-y-2 pt-0.5">
                                                        {formatDescriptionAsBullets(scheme.description).map((point, idx) => (
                                                            <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 leading-relaxed">
                                                                <CheckCircle2 size={13} className="text-brand-green mt-0.5 shrink-0" />
                                                                <span>{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Eligibility */}
                                            {scheme.eligibility && scheme.eligibility !== 'Not mentioned' && (
                                                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                                                        <Users size={13} className="text-sky-400 shrink-0" />
                                                        <span>{t('farm.whoCanApply', 'Who Can Apply')}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-300 leading-relaxed pl-5">
                                                        {scheme.eligibility}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Official Scheme Tracking ID Footer */}
                                            {scheme.scheme_id && (
                                                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px] text-gray-500 px-1">
                                                    <span>{t('farm.schemeId', 'Scheme ID')}</span>
                                                    <code className="font-mono text-gray-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded text-[10px]">
                                                        {scheme.scheme_id}
                                                    </code>
                                                </div>
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
