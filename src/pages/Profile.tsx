import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Loader2, Save, Plus, Trash2, LocateFixed, Pencil, Check, X, LogOut } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/userService';
import type { UserProfile } from '../services/userService';
import { getMyLand, registerLand, updateLand } from '../services/landService';
import type { LandDetails, CornerCoord } from '../services/landService';
import { addField, getMyFields } from '../services/fieldService';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';

// Calculate polygon area in acres from GPS corner coordinates using Shoelace formula
const calculateAreaAcres = (corners: CornerCoord[]): number => {
    if (corners.length < 3) return 0;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371000;
    const refLat = corners[0].lat;
    const refLng = corners[0].lng;
    const points = corners.map((c) => ({
        x: (c.lng - refLng) * toRad(1) * R * Math.cos(toRad(refLat)),
        y: (c.lat - refLat) * toRad(1) * R,
    }));
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;
    return Math.round((area / 4046.86) * 10000) / 10000; // sq meters to acres
};

export default function Profile() {
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const { t } = useTranslation();
    const { refreshAll } = useAppData();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // User State
    const [user, setUser] = useState<UserProfile | null>(null);
    const [name, setName] = useState('');

    // Land State
    const [landExists, setLandExists] = useState(false);
    const [farmName, setFarmName] = useState('');
    const [totalArea, setTotalArea] = useState<number | ''>('');
    const [soilType, setSoilType] = useState('Black');

    // Manual crop name (text input)
    const [plantedCropManual, setPlantedCropManual] = useState('');

    // Location State — Corner-based mapping
    const [district, setDistrict] = useState('');
    const [state, setState] = useState('');
    const [corners, setCorners] = useState<CornerCoord[]>([]);
    const [isLocating, setIsLocating] = useState(false);
    const [isGeoLocating, setIsGeoLocating] = useState(false);

    // Manual entry mode state
    const [locationMode, setLocationMode] = useState<'auto' | 'manual'>('auto');
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');

    // Inline editing state
    const [editingCornerIndex, setEditingCornerIndex] = useState<number | null>(null);
    const [editLat, setEditLat] = useState('');
    const [editLng, setEditLng] = useState('');

    // Initial Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!token) return;
            try {
                const [userData, landData, fieldsData] = await Promise.all([
                    getProfile(token),
                    getMyLand(token),
                    getMyFields(token).catch(() => []),
                ]);

                // Initialize user
                setUser(userData);
                setName(userData.name || '');

                // Initialize land
                if (landData) {
                    setLandExists(true);
                    setFarmName(landData.name);
                    setTotalArea(landData.totalArea);
                    setSoilType(landData.soilType);
                    setDistrict(landData.district);
                    setState(landData.state);
                    setPlantedCropManual(landData.plantedCropManual || '');
                    // Load existing corners
                    if (landData.corners && Array.isArray(landData.corners)) {
                        setCorners(landData.corners as CornerCoord[]);
                    }
                }

                // Track existing field for area sync
                if (fieldsData.length > 0) {
                    // Field exists — we'll update it on save
                }

            } catch (err) {
                console.error("Failed to fetch profile data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [token]);

    // Auto-calculate area when corners change (≥3 corners)
    useEffect(() => {
        if (corners.length >= 3) {
            const acres = calculateAreaAcres(corners);
            setTotalArea(acres);
        }
    }, [corners]);

    // Auto-resolve district & state from corners via reverse geocoding
    useEffect(() => {
        if (corners.length < 3) return;

        const centerLat = corners.reduce((s, c) => s + c.lat, 0) / corners.length;
        const centerLng = corners.reduce((s, c) => s + c.lng, 0) / corners.length;

        const reverseGeocode = async () => {
            setIsGeoLocating(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${centerLat}&lon=${centerLng}&format=json&addressdetails=1`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const data = await res.json();
                const addr = data.address || {};
                setDistrict(addr.county || addr.state_district || addr.city || '');
                setState(addr.state || '');
            } catch (err) {
                console.error('Reverse geocoding failed:', err);
            } finally {
                setIsGeoLocating(false);
            }
        };

        reverseGeocode();
    }, [corners]);

    // Add a corner using device GPS
    const handleAddCornerGPS = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newCorner: CornerCoord = {
                        lat: parseFloat(position.coords.latitude.toFixed(6)),
                        lng: parseFloat(position.coords.longitude.toFixed(6)),
                    };
                    setCorners(prev => [...prev, newCorner]);
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Failed to get location. Please allow location permissions.");
                    setIsLocating(false);
                },
                { enableHighAccuracy: true, timeout: 15000 }
            );
        } else {
            alert("Geolocation is not supported by your browser");
            setIsLocating(false);
        }
    };

    // Add a corner manually
    const handleAddCornerManual = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            alert('Please enter valid coordinates. Lat: -90 to 90, Lng: -180 to 180');
            return;
        }
        const newCorner: CornerCoord = {
            lat: parseFloat(lat.toFixed(6)),
            lng: parseFloat(lng.toFixed(6)),
        };
        setCorners(prev => [...prev, newCorner]);
        setManualLat('');
        setManualLng('');
    };

    // Start editing a corner inline
    const startEditCorner = (index: number) => {
        setEditingCornerIndex(index);
        setEditLat(corners[index].lat.toString());
        setEditLng(corners[index].lng.toString());
    };

    // Save inline edit
    const saveEditCorner = () => {
        if (editingCornerIndex === null) return;
        const lat = parseFloat(editLat);
        const lng = parseFloat(editLng);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            alert('Invalid coordinates.');
            return;
        }
        setCorners(prev => prev.map((c, i) =>
            i === editingCornerIndex ? { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) } : c
        ));
        setEditingCornerIndex(null);
    };

    // Cancel inline edit
    const cancelEditCorner = () => {
        setEditingCornerIndex(null);
    };

    const removeCorner = (index: number) => {
        setCorners(prev => prev.filter((_, i) => i !== index));
        if (editingCornerIndex === index) setEditingCornerIndex(null);
    };

    const handleSave = async () => {
        if (!token) return;

        // Validation
        if (!name.trim() || !farmName.trim() || totalArea === '' || !district.trim() || !state.trim()) {
            alert("All main profile fields are required.");
            return;
        }

        if (corners.length < 3) {
            alert("Please map at least 3 corners of your land.");
            return;
        }

        setIsSaving(true);

        try {
            // 1. Update User Profile Name
            if (name !== user?.name) {
                await updateProfile(token, { name });
            }

            // 2. Register/Update Parent Land
            const landPayload: LandDetails = {
                name: farmName,
                totalArea: Number(totalArea),
                soilType,
                district,
                state,
                latitude: corners[0].lat,
                longitude: corners[0].lng,
                corners,
                plantedCropManual: plantedCropManual.trim() || undefined,
            };

            if (landExists) {
                await updateLand(token, landPayload);
            } else {
                await registerLand(token, landPayload);
                setLandExists(true);
            }

            // 3. Create field if it doesn't exist
            const fieldsData = await getMyFields(token).catch(() => []);
            if (fieldsData.length === 0) {
                await addField(token, { name: farmName, area: Number(totalArea) });
            }

            alert('Profile saved successfully!');
            refreshAll();
            navigate(-1);
        } catch (error: any) {
            console.error("Failed to save:", error);
            alert(`Failed to save profile: ${error.message || 'Unknown error occurred'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    if (isLoading) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
                <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-gradient-to-br from-green-900/40 via-black to-teal-900/30"></div>
                <div className="relative z-10 w-full max-w-md flex-1 flex flex-col pb-32 animate-pulse">
                    <div className="pt-12 px-5 flex items-center gap-4 border-b border-white/5 pb-4">
                        <div className="w-10 h-10 rounded-full bg-white/10"></div>
                        <div className="h-9 w-32 rounded-full bg-white/10"></div>
                    </div>
                    <div className="px-6 mt-6 space-y-8">
                        <div className="glass-panel-dark border border-white/10 rounded-3xl p-6 bg-white/5">
                            <div className="h-6 w-40 bg-white/10 rounded-full mb-6"></div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-white/10 rounded-full ml-2"></div>
                                    <div className="h-12 w-full bg-white/10 rounded-xl"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-24 bg-white/10 rounded-full ml-2"></div>
                                    <div className="h-12 w-full bg-white/10 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                        <div className="glass-panel-dark border border-white/10 rounded-3xl p-6 bg-white/5 relative overflow-hidden">
                            <div className="h-6 w-48 bg-white/10 rounded-full mb-6"></div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="h-3 w-32 bg-white/10 rounded-full ml-2"></div>
                                    <div className="h-12 w-full bg-white/10 rounded-xl"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="h-3 w-28 bg-white/10 rounded-full ml-2"></div>
                                        <div className="h-12 w-full bg-white/10 rounded-xl"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-20 bg-white/10 rounded-full ml-2"></div>
                                        <div className="h-12 w-full bg-white/10 rounded-xl"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-gradient-to-br from-green-900/40 via-black to-teal-900/30"></div>

            <div className="relative z-10 w-full max-w-md flex-1 flex flex-col pb-32 overflow-y-auto hide-scrollbar">

                {/* Header Navbar */}
                <div className="pt-12 px-5 flex items-center gap-4 sticky top-0 bg-black/50 backdrop-blur-xl z-20 pb-4 border-b border-white/5">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-white/90 hover:bg-white/20 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium">
                        {t('profile.myProfile')}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="ml-auto flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20"
                    >
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>

                <div className="px-6 mt-6 space-y-8">

                    {/* Personal Information */}
                    <div className="glass-panel-dark border border-white/10 rounded-3xl p-6 shadow-2xl">
                        <h2 className="text-white text-lg font-medium mb-4 flex items-center gap-2">
                            {t('profile.personalDetails')}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 ml-2">{t('profile.fullName')}</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 mt-1 placeholder-gray-500"
                                    placeholder={t('profile.enterName')} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 ml-2">{t('profile.phoneNumber')}</label>
                                <input type="text" disabled value={user?.phoneNumber || ''}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-gray-400 mt-1 cursor-not-allowed" />
                                <p className="text-[10px] text-gray-500 ml-2 mt-1">{t('profile.phoneDesc')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Farm Profile — Single Farm + Single Crop */}
                    <div className="glass-panel-dark border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl pointer-events-none rounded-full"></div>
                        <h2 className="text-white text-lg font-medium mb-4 flex items-center gap-2 relative">
                            {t('profile.masterFarmProfile')}
                        </h2>
                        <div className="space-y-4 relative">
                            <div>
                                <label className="text-xs text-gray-400 ml-2">{t('profile.totalFarmName')}</label>
                                <input type="text" value={farmName} onChange={(e) => setFarmName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 mt-1 placeholder-gray-500"
                                    placeholder={t('profile.enterFarmName')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 ml-2">{t('profile.totalArea')} (acres)</label>
                                    <input type="number" value={totalArea} readOnly
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-gray-300 mt-1 cursor-not-allowed"
                                        placeholder="Auto-calculated" />
                                    <p className="text-[10px] text-gray-500 ml-2 mt-1">Auto-calculated from mapped corners</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 ml-2">{t('profile.soilType')}</label>
                                    <select value={soilType} onChange={(e) => setSoilType(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 mt-1 appearance-none">
                                        <option value="Black">{t('profile.blackSoil')}</option>
                                        <option value="Red">{t('profile.redSoil')}</option>
                                        <option value="Alluvial">{t('profile.alluvial')}</option>
                                        <option value="Laterite">{t('profile.laterite')}</option>
                                        <option value="Sandy">{t('profile.sandy')}</option>
                                    </select>
                                </div>
                            </div>
                            {/* Planted Crop — Manual Text Entry */}
                            <div>
                                <label className="text-xs text-gray-400 ml-2">{t('profile.plantedCrop')}</label>
                                <input type="text" value={plantedCropManual}
                                    onChange={(e) => setPlantedCropManual(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 mt-1 placeholder-gray-500"
                                    placeholder="e.g. Paddy, Cotton, Wheat..." />
                                <p className="text-[10px] text-gray-500 ml-2 mt-1">Type your planted crop name</p>
                            </div>
                        </div>
                    </div>

                    {/* Location Mapping — Corner-based */}
                    <div className="glass-panel-dark border border-white/10 rounded-3xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-white text-lg font-medium">{t('profile.location')}</h2>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setLocationMode('auto')}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-xl transition-all border ${
                                    locationMode === 'auto'
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                <LocateFixed size={13} />
                                📍 Auto Detect
                            </button>
                            <button
                                onClick={() => setLocationMode('manual')}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-xl transition-all border ${
                                    locationMode === 'manual'
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                <Pencil size={13} />
                                ✏️ Manual Entry
                            </button>
                        </div>

                        {/* Auto Detect Mode */}
                        {locationMode === 'auto' && (
                            <div className="mb-4">
                                <p className="text-gray-500 text-[11px] mb-3">
                                    Walk to each corner of your farm and tap "Add Corner" to pin your GPS location. At least 3 corners required.
                                </p>
                                <button onClick={handleAddCornerGPS} disabled={isLocating}
                                    className="w-full flex items-center justify-center gap-2 text-sm bg-green-500/20 text-green-400 px-4 py-3 rounded-xl hover:bg-green-500/30 transition-colors border border-green-500/30">
                                    {isLocating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                                    {isLocating ? 'Detecting GPS...' : 'Add Corner (GPS)'}
                                </button>
                            </div>
                        )}

                        {/* Manual Entry Mode */}
                        {locationMode === 'manual' && (
                            <div className="mb-4">
                                <p className="text-gray-500 text-[11px] mb-3">
                                    Enter the latitude and longitude for each corner of your farm. At least 3 corners required.
                                </p>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 ml-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={manualLat}
                                            onChange={(e) => setManualLat(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-green-500/50 mt-1 placeholder-gray-600"
                                            placeholder="e.g. 11.0168"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 ml-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={manualLng}
                                            onChange={(e) => setManualLng(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-green-500/50 mt-1 placeholder-gray-600"
                                            placeholder="e.g. 76.9558"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddCornerManual}
                                    disabled={!manualLat || !manualLng}
                                    className="w-full flex items-center justify-center gap-2 text-sm bg-green-500/20 text-green-400 px-4 py-3 rounded-xl hover:bg-green-500/30 transition-colors border border-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Plus size={14} />
                                    Add Corner
                                </button>
                            </div>
                        )}

                        {/* Corner List */}
                        {corners.length === 0 ? (
                            <div className="text-center py-6">
                                <MapPin size={28} className="text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 text-xs">No corners mapped yet</p>
                                <p className="text-gray-600 text-[10px] mt-1">
                                    {locationMode === 'auto'
                                        ? 'Go to the first corner of your farm and tap the button above'
                                        : 'Enter lat/lng above and click "Add Corner"'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 mb-4">
                                {corners.map((corner, index) => (
                                    <div key={index}
                                        className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-xs font-bold shrink-0">
                                                {index + 1}
                                            </div>
                                            {editingCornerIndex === index ? (
                                                /* Inline Edit Mode */
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="number" step="0.000001" value={editLat}
                                                        onChange={(e) => setEditLat(e.target.value)}
                                                        className="w-24 bg-black/60 border border-green-500/30 rounded-lg px-2 py-1.5 text-white text-xs font-mono focus:outline-none"
                                                    />
                                                    <input
                                                        type="number" step="0.000001" value={editLng}
                                                        onChange={(e) => setEditLng(e.target.value)}
                                                        className="w-24 bg-black/60 border border-green-500/30 rounded-lg px-2 py-1.5 text-white text-xs font-mono focus:outline-none"
                                                    />
                                                    <button onClick={saveEditCorner} className="text-green-400 hover:text-green-300 p-1"><Check size={14} /></button>
                                                    <button onClick={cancelEditCorner} className="text-gray-400 hover:text-gray-300 p-1"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                /* Display Mode */
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-mono truncate">
                                                        {corner.lat}, {corner.lng}
                                                    </p>
                                                    <p className="text-gray-500 text-[10px]">Corner {index + 1}</p>
                                                </div>
                                            )}
                                        </div>
                                        {editingCornerIndex !== index && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => startEditCorner(index)}
                                                    className="text-gray-400/60 hover:text-blue-400 transition-colors p-1"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => removeCorner(index)}
                                                    className="text-red-400/60 hover:text-red-400 transition-colors p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* District & State — Auto-resolved from coordinates */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="text-xs text-gray-400 ml-2">{t('profile.district')}</label>
                                <input type="text" value={isGeoLocating ? 'Detecting...' : district} readOnly
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-gray-300 mt-1 cursor-not-allowed"
                                    placeholder="Auto-detected" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 ml-2">{t('profile.state')}</label>
                                <input type="text" value={isGeoLocating ? 'Detecting...' : state} readOnly
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-gray-300 mt-1 cursor-not-allowed"
                                    placeholder="Auto-detected" />
                            </div>
                            <p className="col-span-2 text-[10px] text-gray-500 ml-2 -mt-2">Auto-detected from mapped corners</p>
                        </div>

                        {/* Corner count badge */}
                        {corners.length > 0 && (
                            <div className="mt-4 flex items-center gap-2">
                                <div className={`text-[10px] px-2.5 py-1 rounded-full border ${corners.length >= 3
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    }`}>
                                    {corners.length} corner{corners.length !== 1 ? 's' : ''} mapped
                                </div>
                                {corners.length < 3 && (
                                    <span className="text-yellow-500/70 text-[10px]">Need at least 3</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button onClick={handleSave} disabled={isSaving}
                        className="w-full bg-white text-black font-semibold rounded-2xl py-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-gray-200 transition-all flex justify-center items-center gap-2 mb-8">
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {t('profile.saveProfile')}
                    </button>

                </div>
            </div>

            <BottomNav />
        </div>
    );
}
