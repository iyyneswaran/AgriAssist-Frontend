import { useState, useEffect } from 'react';
import { Folder, MapPin, Droplet, Sun, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { getMyLand } from '../services/landService';
import { getMyFields } from '../services/fieldService';
import { getActiveCrops } from '../services/cropService';
import type { CropAssignment } from '../services/cropService';
import { getWeather } from '../services/weatherService';
import type { WeatherData } from '../services/weatherService';

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

const getCropStage = (sowingDate: string, growthDays: number): string => {
    const sowing = new Date(sowingDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - sowing.getTime()) / (1000 * 60 * 60 * 24));
    const progress = daysPassed / growthDays;
    if (progress < 0.15) return 'Germination';
    if (progress < 0.3) return 'Seedling';
    if (progress < 0.5) return 'Vegetative';
    if (progress < 0.7) return 'Flowering';
    if (progress < 0.9) return 'Fruiting';
    return 'Maturity';
};

interface FieldCardData {
    fieldId: string;
    fieldName: string;
    fieldArea: number;
    assignment?: CropAssignment & { crop: { name: string; growthDays: number } };
}

export default function FarmDetails() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [farmLocation, setFarmLocation] = useState({ district: '', state: '', soilType: '' });
    const [fieldCards, setFieldCards] = useState<FieldCardData[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                // Fetch land, fields, active assignments, and weather in parallel
                const [land, fields, assignments] = await Promise.all([
                    getMyLand(token),
                    getMyFields(token).catch(() => []),
                    getActiveCrops(token).catch(() => []),
                ]);

                if (land) {
                    setFarmLocation({ district: land.district, state: land.state, soilType: land.soilType });
                    // Fetch weather for this location
                    const w = await getWeather(land.latitude, land.longitude).catch(() => null);
                    setWeather(w);
                }

                // Map fields to cards, attaching their active assignment if any
                const cards: FieldCardData[] = fields.map((field: any) => {
                    const assignment = assignments.find((a: any) => a.fieldId === field.id);
                    return {
                        fieldId: field.id,
                        fieldName: field.name,
                        fieldArea: field.area,
                        assignment,
                    };
                });

                setFieldCards(cards);
            } catch (err) {
                console.error("Failed to load farm details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const toggleCard = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Weather icon from local assets
    const weatherIconSrc = weather ? new URL(`../assets/weather/${weather.iconFile}`, import.meta.url).href : '';

    // Format today's date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-green-500" size={32} />
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
                        Farm Details
                    </div>
                </div>

                {/* No fields fallback */}
                {fieldCards.length === 0 && (
                    <div className="mt-8 px-4">
                        <div className="glass-panel-dark border border-white/10 rounded-3xl p-8 text-center">
                            <Folder className="text-gray-500 mx-auto mb-3" size={32} />
                            <p className="text-gray-400 text-sm">No fields registered yet.</p>
                            <p className="text-gray-500 text-xs mt-1">Go to your Profile to add fields and crops.</p>
                        </div>
                    </div>
                )}

                {/* Dynamic Collapsible Field Cards */}
                <div className="mt-6 px-4 space-y-4">
                    {fieldCards.map((card, index) => {
                        const isExpanded = expandedIndex === index;
                        const cropName = card.assignment?.crop?.name || 'Unassigned';
                        const cropImg = card.assignment ? getCropImage(cropName) : '';
                        const cropStage = card.assignment
                            ? getCropStage(card.assignment.sowingDate, card.assignment.crop.growthDays)
                            : '—';
                        const harvestDate = card.assignment?.harvestDate
                            ? new Date(card.assignment.harvestDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : '—';

                        return (
                            <div key={card.fieldId} className="relative glass-panel-dark border border-white/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">

                                {/* Collapsed Header — Always Visible */}
                                <button
                                    onClick={() => toggleCard(index)}
                                    className="w-full flex items-center justify-between p-5 text-left"
                                >
                                    <div className="flex items-start gap-3">
                                        <Folder className="text-green-400 mt-0.5 shrink-0" size={22} />
                                        <div>
                                            <h2 className="text-white text-base font-medium tracking-wide">{card.fieldName}</h2>
                                            <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                                                <span>{farmLocation.district}, {farmLocation.state}</span>
                                                <MapPin size={11} />
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded
                                        ? <ChevronUp className="text-gray-400 shrink-0" size={20} />
                                        : <ChevronDown className="text-gray-400 shrink-0" size={20} />
                                    }
                                </button>

                                {/* Expanded Detail Body */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 relative">
                                        {/* Decorative glows */}
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/5 blur-[50px] rounded-full pointer-events-none"></div>

                                        <div className="border-t border-white/5 pt-4"></div>

                                        <div className="flex justify-between relative">
                                            {/* Left Text Details */}
                                            <div className="space-y-2.5 z-10 text-sm">
                                                <p className="text-gray-200">
                                                    Farm Number: <span className="text-green-400">{index + 1}</span>
                                                </p>
                                                <p className="text-gray-200">
                                                    Total Area: <span className="text-green-400">{card.fieldArea} Acres</span>
                                                </p>
                                                <p className="text-gray-200">
                                                    Crop Name: <span className="text-green-400">{cropName}</span>
                                                </p>
                                                <p className="text-gray-200">
                                                    Soil Type: <span className="text-green-400">{farmLocation.soilType}</span>
                                                </p>
                                                <p className="text-gray-200">
                                                    Crop Stage: <span className="text-green-400">{cropStage}</span>
                                                </p>
                                                <p className="text-gray-200 mt-1">
                                                    Expected Harvest: <span className="text-green-400">{harvestDate}</span>
                                                </p>
                                            </div>

                                            {/* Right Crop Image */}
                                            {cropImg && (
                                                <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none opacity-90 drop-shadow-2xl z-0 -mt-2 -mr-2">
                                                    <img
                                                        src={cropImg}
                                                        alt={cropName}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Environmental Metrics + Weather Widget */}
                                        <div className="mt-6 flex justify-between items-end">
                                            {/* Left: Environment Stats */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Droplet size={18} className="text-teal-400 fill-teal-400" />
                                                    <span className="text-gray-200 text-sm">Humidity: <span className="text-green-400">{weather ? `${weather.humidity}%` : '—'}</span></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Sun size={18} className="text-yellow-400 fill-yellow-400" />
                                                    <span className="text-gray-200 text-sm">Temperature: <span className="text-white">{weather ? `${weather.temperature}°C` : '—'}</span></span>
                                                </div>
                                            </div>

                                            {/* Right: Weather Mini Widget */}
                                            {weather && (
                                                <div className="bg-[#1f261f]/80 backdrop-blur-md rounded-2xl border border-white/10 p-3 flex flex-col items-center min-w-[90px]">
                                                    <h3 className="text-gray-300 text-[10px] font-medium mb-1.5">Weather</h3>
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
                                )}

                            </div>
                        );
                    })}
                </div>

            </div>

            <BottomNav />
        </div>
    );
}
