import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Folder, Pencil, ChevronRight, Landmark, Activity, Wifi } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAppData } from '../context/AppDataContext';
import { useTranslation } from 'react-i18next';
import type { CropAssignment } from '../services/cropService';
import { getCropImage } from '../utils/cropImages';

// Tab view components
import FarmOverviewTab from '../components/farm/FarmOverviewTab';
import FarmSensorsTab from '../components/farm/FarmSensorsTab';
import FarmInsightsTab from '../components/farm/FarmInsightsTab';
import FarmSchemesTab from '../components/farm/FarmSchemesTab';

// ── Tab definitions ──
const TAB_KEYS = ['overview', 'sensors', 'insights', 'schemes'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_ICONS: Record<TabKey, React.ElementType> = {
    overview: Folder,
    sensors: Wifi,
    insights: Activity,
    schemes: Landmark,
};

/** Derive the active tab directly from the current URL (hash or search param). */
function tabFromLocation(location: { hash: string; search: string }): TabKey {
    if (location.hash === '#schemes') return 'schemes';
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && TAB_KEYS.includes(tab as TabKey)) return tab as TabKey;
    return 'overview';
}

export default function FarmDetails() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { land, isDataReady, fields, activeCrops, geoData } = useAppData();

    // Derive tab from URL on every render — no internal tab state needed for initialization.
    // If the URL contains a legacy #schemes hash, redirect to the canonical query-param form.
    const urlTab = tabFromLocation(location);
    if (location.hash === '#schemes') {
        // Replace synchronously during render (no effect needed)
        navigate('/farm-details?tab=schemes', { replace: true });
    }

    const [activeTab, setActiveTab] = useState<TabKey>(urlTab);

    // Sync tab to URL search params
    const handleTabChange = useCallback((tab: TabKey) => {
        setActiveTab(tab);
        navigate(`/farm-details?tab=${tab}`, { replace: true });
    }, [navigate]);

    const loading = !isDataReady;

    // Farm data
    const firstField = fields.length > 0 ? fields[0] : null;
    const assignment = firstField
        ? activeCrops.find((a: CropAssignment) => a.fieldId === firstField.id)
        : null;
    const cropName = land?.plantedCropManual || assignment?.crop?.name || t('farm.unassigned');
    const metrics = geoData?.farm_metrics;

    // ── Loading skeleton ──
    if (loading) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
                <div
                    className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 blur-sm pointer-events-none"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=1000&auto=format&fit=crop")' }}
                />
                <div className="fixed inset-0 z-0 bg-gradient-to-t from-black/95 via-[#0a120e]/80 to-black/90 pointer-events-none" />
                <div className="relative z-10 w-full max-w-2xl h-full flex flex-col pb-32 overflow-y-auto no-scrollbar">
                    <div className="pt-5 px-4 sm:px-6">
                        <div className="h-7 w-36 rounded-lg bg-white/8 animate-pulse" />
                        <div className="h-4 w-48 rounded bg-white/5 animate-pulse mt-2" />
                    </div>
                    <div className="mt-4 px-4 sm:px-6 flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-9 w-24 rounded-lg bg-white/6 animate-pulse" />
                        ))}
                    </div>
                    <div className="mt-6 px-4 sm:px-6 space-y-4">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 h-48 animate-pulse" />
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 h-32 animate-pulse" />
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    // ── No farm registered ──
    if (!land || !firstField) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
                <div className="fixed inset-0 z-0 bg-gradient-to-t from-black/95 via-[#0a120e]/80 to-black/90 pointer-events-none" />
                <div className="relative z-10 w-full max-w-2xl h-full flex flex-col items-center justify-center pb-32 px-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0a120e]/80 p-8 text-center max-w-sm w-full">
                        <Folder className="text-gray-500 mx-auto mb-3" size={32} />
                        <h2 className="text-white text-lg font-semibold mb-1">{t('farm.farmDetails')}</h2>
                        <p className="text-gray-400 text-sm mb-1">{t('farm.noFields')}</p>
                        <p className="text-gray-500 text-xs">{t('farm.goToProfile')}</p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green/20 text-brand-green border border-brand-green/30 text-xs font-semibold hover:bg-brand-green/30 transition-colors"
                        >
                            {t('farmTabs.editFarm', 'Edit Farm')}
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
            {/* Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 blur-sm pointer-events-none"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=1000&auto=format&fit=crop")' }}
            />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black/95 via-[#0a120e]/85 to-black/90 pointer-events-none" />

            {/* Main content */}
            <div className="relative z-10 w-full max-w-2xl h-full flex flex-col pb-28 overflow-y-auto no-scrollbar">

                {/* ── Compact page header ── */}
                <header className="pt-5 pb-2 px-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-lg font-semibold text-white tracking-tight truncate">
                                {t('farm.farmDetails')}
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-sm text-brand-green font-medium truncate">{land.name}</span>
                                <span className="text-gray-600">·</span>
                                <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                    <MapPin size={10} className="shrink-0" />
                                    {land.district}, {land.state}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/profile')}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/8 text-gray-300 text-xs font-medium transition-colors glass-focus-ring"
                            aria-label={t('farmTabs.editFarm', 'Edit Farm')}
                        >
                            <Pencil size={12} />
                            <span className="hidden sm:inline">{t('farmTabs.editFarm', 'Edit Farm')}</span>
                        </button>
                    </div>
                </header>

                {/* ── Tab navigation ── */}
                <nav
                    className="px-4 sm:px-6 mt-1 mb-4 sticky top-0 z-20 bg-gradient-to-b from-black/90 via-black/80 to-transparent pb-3 pt-1"
                    role="tablist"
                    aria-label="Farm details sections"
                >
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {TAB_KEYS.map((tab) => {
                            const isActive = activeTab === tab;
                            const Icon = TAB_ICONS[tab];
                            return (
                                <button
                                    key={tab}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`panel-${tab}`}
                                    id={`tab-${tab}`}
                                    onClick={() => handleTabChange(tab)}
                                    className={`
                                        flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap
                                        transition-all duration-200 glass-focus-ring shrink-0
                                        ${isActive
                                            ? 'bg-brand-green/15 text-brand-green border border-brand-green/25'
                                            : 'bg-white/[0.04] text-gray-400 border border-transparent hover:bg-white/[0.07] hover:text-gray-200'
                                        }
                                    `}
                                >
                                    <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                                    {t(`farmTabs.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* ── Tab panels ── */}
                <div className="px-4 sm:px-6 flex-1">
                    {activeTab === 'overview' && (
                        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
                            <FarmOverviewTab
                                land={land}
                                firstField={firstField}
                                cropName={cropName}
                                cropImg={getCropImage(cropName)}
                                assignment={assignment ?? null}
                                metrics={metrics ?? null}
                                onNavigateTab={handleTabChange}
                            />
                        </div>
                    )}
                    {activeTab === 'sensors' && (
                        <div role="tabpanel" id="panel-sensors" aria-labelledby="tab-sensors">
                            <FarmSensorsTab metrics={metrics ?? null} />
                        </div>
                    )}
                    {activeTab === 'insights' && (
                        <div role="tabpanel" id="panel-insights" aria-labelledby="tab-insights">
                            <FarmInsightsTab
                                temperature={metrics?.temperature_celsius ?? null}
                                humidity={metrics?.humidity_percent ?? null}
                                soilMoisture={metrics?.soil_moisture_mm ?? null}
                                soilPh={metrics?.soil_ph ?? null}
                            />
                        </div>
                    )}
                    {activeTab === 'schemes' && (
                        <div role="tabpanel" id="panel-schemes" aria-labelledby="tab-schemes">
                            <FarmSchemesTab />
                        </div>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
