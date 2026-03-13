import { Folder, MapPin, Droplet, Sun } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAppData } from '../context/AppDataContext';
import { useTranslation } from 'react-i18next';

// Crop image mapper from local assets
const cropImages: Record<string, string> = {
    cotton: new URL('../assets/crops/cotton.png', import.meta.url).href,
    paddy: new URL('../assets/crops/paddy.png', import.meta.url).href,
    wheat: new URL('../assets/crops/wheat.png', import.meta.url).href,
    maize: new URL('../assets/crops/maize.png', import.meta.url).href,
    sugarcane: new URL('../assets/crops/wheat.png', import.meta.url).href,
    peanut: new URL('../assets/crops/Peanut.png', import.meta.url).href,
    soya: new URL('../assets/crops/soya.png', import.meta.url).href,
    tomato: new URL('../assets/crops/tomato.png', import.meta.url).href,
};

const getCropImage = (cropName: string): string => {
    const key = cropName.toLowerCase();
    return cropImages[key] || cropImages['wheat'];
};

const getCropStageKey = (sowingDate: string, growthDays: number): string => {
    const sowing = new Date(sowingDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - sowing.getTime()) / (1000 * 60 * 60 * 24));
    const progress = daysPassed / growthDays;
    if (progress < 0.15) return 'farm.germination';
    if (progress < 0.3) return 'farm.seedling';
    if (progress < 0.5) return 'farm.vegetative';
    if (progress < 0.7) return 'farm.flowering';
    if (progress < 0.9) return 'farm.fruiting';
    return 'farm.maturity';
};

export default function FarmDetails() {
    const { t } = useTranslation();
    const { land, weather, fields, activeCrops, isDataReady } = useAppData();

    const loading = !isDataReady;

    const mapSoilType = (type: string) => {
        if (!type) return '—';
        const key = type.toLowerCase().replace(/\s*soil/, 'Soil');
        if (['blackSoil', 'redSoil', 'alluvial', 'laterite', 'sandy'].includes(key)) {
            return t(`profile.${key}`);
        }
        return type;
    };

    // Single farm: first field + first active assignment
    const firstField = fields.length > 0 ? fields[0] : null;
    const assignment = firstField
        ? activeCrops.find((a: any) => a.fieldId === firstField.id)
        : null;

    // Prefer manual crop name from land, then fall back to assignment
    const cropName = (land?.plantedCropManual) || assignment?.crop?.name || t('farm.unassigned');
    const cropImg = getCropImage(cropName);
    const cropStageKey = assignment
        ? getCropStageKey(assignment.sowingDate, assignment.crop.growthDays)
        : null;
    const cropStage = cropStageKey ? t(cropStageKey) : '—';
    const harvestDate = assignment?.harvestDate
        ? new Date(assignment.harvestDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—';

    // Weather icon from local assets
    const weatherIconSrc = weather ? new URL(`../assets/weather/${weather.iconFile}`, import.meta.url).href : '';

    // Format today's date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Corners count
    const cornersCount = land?.corners && Array.isArray(land.corners) ? (land.corners as any[]).length : 0;

    if (loading) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
                {/* Background */}
                <div
                    className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 blur-sm mix-blend-screen pointer-events-none"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=1000&auto=format&fit=crop")' }}
                ></div>
                <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#021102]/90 via-[#051805]/70 to-black/80 pointer-events-none"></div>

                {/* Skeleton Content */}
                <div className="relative z-10 w-full max-w-md h-full flex flex-col pb-32 overflow-y-auto hide-scrollbar">
                    <div className="pt-6 px-4">
                        <div className="h-8 w-32 rounded-full bg-white/10 animate-pulse border border-white/5"></div>
                    </div>
                    <div className="mt-6 px-4 space-y-4">
                        <div className="glass-panel-dark border border-white/10 rounded-3xl p-5 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded bg-white/10 animate-pulse shrink-0"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-5 w-1/2 bg-white/10 rounded animate-pulse"></div>
                                    <div className="h-3 w-1/3 bg-white/5 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    // No farm registered
    if (!land || !firstField) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
                <div
                    className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 blur-sm mix-blend-screen pointer-events-none"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=1000&auto=format&fit=crop")' }}
                ></div>
                <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#021102]/90 via-[#051805]/70 to-black/80 pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-md h-full flex flex-col pb-32 overflow-y-auto hide-scrollbar">
                    <div className="pt-6 px-4">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-sm font-medium">
                            {t('farm.farmDetails')}
                        </div>
                    </div>
                    <div className="mt-8 px-4">
                        <div className="glass-panel-dark border border-white/10 rounded-3xl p-8 text-center">
                            <Folder className="text-gray-500 mx-auto mb-3" size={32} />
                            <p className="text-gray-400 text-sm">{t('farm.noFields')}</p>
                            <p className="text-gray-500 text-xs mt-1">{t('farm.goToProfile')}</p>
                        </div>
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
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 blur-sm mix-blend-screen pointer-events-none"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=1000&auto=format&fit=crop")' }}
            ></div>
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#021102]/90 via-[#051805]/70 to-black/80 pointer-events-none"></div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md h-full flex flex-col pb-32 overflow-y-auto hide-scrollbar">

                {/* Header Pill */}
                <div className="pt-6 px-4">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-sm font-medium">
                        {t('farm.farmDetails')}
                    </div>
                </div>

                {/* Single Farm Card — Flat Layout */}
                <div className="mt-6 px-4">
                    <div className="relative glass-panel-dark border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-5">

                        {/* Decorative glows */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/5 blur-[50px] rounded-full pointer-events-none"></div>

                        {/* Farm Title + Location */}
                        <div className="flex items-start gap-3 relative z-10">
                            <Folder className="text-green-400 mt-0.5 shrink-0" size={22} />
                            <div className="flex-1">
                                <h2 className="text-white text-base font-medium tracking-wide">{land.name}</h2>
                                <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                                    <MapPin size={11} />
                                    <span>{land.district}, {land.state}</span>
                                </div>
                            </div>
                            {/* Crop Image */}
                            {cropImg && (
                                <div className="w-24 h-24 shrink-0 pointer-events-none opacity-90 drop-shadow-2xl -mt-1 -mr-1">
                                    <img src={cropImg} alt={cropName} className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>

                        {/* Farm Details Grid */}
                        <div className="mt-4 space-y-2.5 relative z-10 text-sm">
                            <p className="text-gray-200">
                                {t('farm.totalArea')} <span className="text-green-400">{firstField.area} {t('profile.acres')}</span>
                            </p>
                            <p className="text-gray-200">
                                {t('farm.cropName')} <span className="text-green-400">{cropName}</span>
                            </p>
                            <p className="text-gray-200">
                                {t('farm.soilType')} <span className="text-green-400">{mapSoilType(land.soilType)}</span>
                            </p>
                            <p className="text-gray-200">
                                {t('farm.cropStage')} <span className="text-green-400">{cropStage}</span>
                            </p>
                            <p className="text-gray-200">
                                {t('farm.expectedHarvest')} <span className="text-green-400">{harvestDate}</span>
                            </p>
                            {cornersCount > 0 && (
                                <p className="text-gray-200">
                                    📍 Boundary <span className="text-green-400">{cornersCount} corners mapped</span>
                                </p>
                            )}
                        </div>

                        {/* Environmental Metrics + Weather Widget */}
                        <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-end relative z-10">
                            {/* Left: Environment Stats */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Droplet size={18} className="text-teal-400 fill-teal-400" />
                                    <span className="text-gray-200 text-sm">{t('farm.humidity')} <span className="text-green-400">{weather ? `${weather.humidity}%` : '—'}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Sun size={18} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-gray-200 text-sm">{t('farm.temperature')} <span className="text-white">{weather ? `${weather.temperature}°C` : '—'}</span></span>
                                </div>
                            </div>

                            {/* Right: Weather Mini Widget */}
                            {weather && (
                                <div className="bg-[#1f261f]/80 backdrop-blur-md rounded-2xl border border-white/10 p-3 flex flex-col items-center min-w-[90px]">
                                    <h3 className="text-gray-300 text-[10px] font-medium mb-1.5">{t('farm.weather')}</h3>
                                    <img
                                        src={weatherIconSrc}
                                        alt={weather.conditionName}
                                        className="w-10 h-10 object-contain drop-shadow-lg mb-1"
                                    />
                                    <span className="text-orange-300 text-[10px] font-medium">{weather.conditionName}</span>
                                    <p className="text-[9px] text-gray-400 mt-0.5">{dateStr}</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </div>

            <BottomNav />
        </div>
    );
}
