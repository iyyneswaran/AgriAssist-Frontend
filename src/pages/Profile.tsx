import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/userService';
import type { UserProfile } from '../services/userService';
import { getMyLand, registerLand, updateLand } from '../services/landService';
import type { LandDetails } from '../services/landService';
import { listCrops, assignCrop, getActiveCrops } from '../services/cropService';
import type { Crop } from '../services/cropService';
import { addField, getMyFields } from '../services/fieldService';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';

interface NewFieldInput {
    name: string;
    area: number | '';
    cropId: string;
}

interface ExistingFieldData {
    id: string;
    name: string;
    area: number;
    cropName: string;
}

export default function Profile() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { t } = useTranslation();
    const { refreshAll } = useAppData();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Reference Data
    const [availableCrops, setAvailableCrops] = useState<Crop[]>([]);

    // User State
    const [user, setUser] = useState<UserProfile | null>(null);
    const [name, setName] = useState('');

    // Land State
    const [landExists, setLandExists] = useState(false);
    const [farmName, setFarmName] = useState('');
    const [totalArea, setTotalArea] = useState<number | ''>('');
    const [soilType, setSoilType] = useState('Black');

    // Existing Fields (read-only display)
    const [existingFields, setExistingFields] = useState<ExistingFieldData[]>([]);

    // NEW Fields to be created
    const [newFields, setNewFields] = useState<NewFieldInput[]>([]);

    // Location State
    const [district, setDistrict] = useState('');
    const [state, setState] = useState('');
    const [lat, setLat] = useState<number | ''>('');
    const [lng, setLng] = useState<number | ''>('');
    const [isLocating, setIsLocating] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!token) return;
            try {
                const [userData, landData, cropsData, fieldsData, assignments] = await Promise.all([
                    getProfile(token),
                    getMyLand(token),
                    listCrops(token).catch(() => []),
                    getMyFields(token).catch(() => []),
                    getActiveCrops(token).catch(() => []),
                ]);

                // Initialize user
                setUser(userData);
                setName(userData.name || '');

                // Initialize reference crops
                setAvailableCrops(cropsData);

                // Initialize land
                if (landData) {
                    setLandExists(true);
                    setFarmName(landData.name);
                    setTotalArea(landData.totalArea);
                    setSoilType(landData.soilType);
                    setDistrict(landData.district);
                    setState(landData.state);
                    setLat(landData.latitude);
                    setLng(landData.longitude);
                }

                // Initialize existing fields with their crop names
                const existingMapped: ExistingFieldData[] = fieldsData.map((f: any) => {
                    const assignment = assignments.find((a: any) => a.fieldId === f.id);
                    return {
                        id: f.id,
                        name: f.name,
                        area: f.area,
                        cropName: assignment?.crop?.name || 'No crop assigned',
                    };
                });
                setExistingFields(existingMapped);

            } catch (err) {
                console.error("Failed to fetch profile data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [token]);

    const addNewFieldRow = () => {
        setNewFields(prev => [...prev, { name: '', area: '', cropId: '' }]);
    };

    const removeNewFieldRow = (index: number) => {
        setNewFields(prev => prev.filter((_, i) => i !== index));
    };

    const updateNewField = (index: number, key: keyof NewFieldInput, value: any) => {
        const updated = [...newFields];
        updated[index] = { ...updated[index], [key]: value };
        setNewFields(updated);
    };

    const handleAutoLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLat(position.coords.latitude);
                    setLng(position.coords.longitude);
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Failed to get location. Please allow location permissions.");
                    setIsLocating(false);
                }
            );
        } else {
            alert("Geolocation is not supported by your browser");
            setIsLocating(false);
        }
    };

    const handleSave = async () => {
        if (!token) return;

        // Validation
        if (!name.trim() || !farmName.trim() || totalArea === '' || !district.trim() || !state.trim() || lat === '' || lng === '') {
            alert("All main profile fields are required.");
            return;
        }

        // Validate new fields
        for (let i = 0; i < newFields.length; i++) {
            const f = newFields[i];
            if (!f.name.trim() || f.area === '' || !f.cropId) {
                alert(`Please complete all details for new Field "${f.name || i + 1}"`);
                return;
            }
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
                latitude: Number(lat),
                longitude: Number(lng)
            };

            if (landExists) {
                await updateLand(token, landPayload);
            } else {
                await registerLand(token, landPayload);
                setLandExists(true);
            }

            // 3. Register ONLY NEW Fields & Assign Crops
            for (const field of newFields) {
                const addedFieldRes = await addField(token, { name: field.name, area: Number(field.area) });
                const newFieldId = addedFieldRes.field.id;
                const today = new Date().toISOString();
                await assignCrop(token, newFieldId, field.cropId, today);
            }

            // Move newly created fields into existing and clear new
            const cropLookup = Object.fromEntries(availableCrops.map(c => [c.id, c.name]));
            const newlyCreated: ExistingFieldData[] = newFields.map(f => ({
                id: '',
                name: f.name,
                area: Number(f.area),
                cropName: cropLookup[f.cropId] || 'Unknown',
            }));
            setExistingFields(prev => [...prev, ...newlyCreated]);
            setNewFields([]);

            alert('Profile saved successfully!');
            // Refresh cached data in context so other pages reflect the changes
            refreshAll();
            navigate(-1);
        } catch (error: any) {
            console.error("Failed to save:", error);
            alert(`Failed to save profile: ${error.message || 'Unknown error occurred'}`);
        } finally {
            setIsSaving(false);
        }
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
                        {/* Personal Details Skeleton */}
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
                        {/* Farm Profile Skeleton */}
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

                    {/* Parent Land Details */}
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
                                    <label className="text-xs text-gray-400 ml-2">{t('profile.totalArea')}</label>
                                    <input type="number" value={totalArea} onChange={(e) => setTotalArea(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 mt-1"
                                        placeholder="0.0" />
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
                        </div>
                    </div>

                    {/* Registered Fields (Existing — Read Only) */}
                    {existingFields.length > 0 && (
                        <div className="glass-panel-dark border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                            <h2 className="text-white text-lg font-medium mb-4">{t('profile.yourRegisteredFields')}</h2>
                            <div className="space-y-3">
                                {existingFields.map((ef, i) => (
                                    <div key={ef.id || i} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-white text-sm font-medium">{ef.name}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">{ef.area} {t('profile.acres')} · {ef.cropName}</p>
                                        </div>
                                        <div className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30">
                                            {t('profile.active')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add NEW Fields Section */}
                    <div className="glass-panel-dark border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/10 blur-3xl pointer-events-none rounded-full"></div>
                        <div className="flex justify-between items-center mb-4 relative">
                            <h2 className="text-white text-lg font-medium">{t('profile.addNewCrops')}</h2>
                            <button
                                onClick={addNewFieldRow}
                                className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full hover:bg-green-500/30 transition-colors border border-green-500/30"
                            >
                                <Plus size={12} />
                                {t('profile.addField')}
                            </button>
                        </div>

                        {newFields.length === 0 && (
                            <p className="text-gray-500 text-xs text-center py-4 relative">
                                {t('profile.tapToAdd')}
                            </p>
                        )}

                        <div className="space-y-4 relative z-10">
                            {newFields.map((field, index) => (
                                <div key={index} className="bg-black/40 border border-white/5 p-4 rounded-2xl relative">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-green-400 text-sm font-medium">{t('profile.newField')} {index + 1}</h3>
                                        <button onClick={() => removeNewFieldRow(index)} className="text-red-400/60 hover:text-red-400 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] text-gray-500 ml-1">{t('profile.fieldName')}</label>
                                            <input type="text" value={field.name}
                                                onChange={(e) => updateNewField(index, 'name', e.target.value)}
                                                className="w-full bg-white/5 border border-transparent rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                                                placeholder={t('profile.enterFieldName')} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-500 ml-1">{t('profile.areaAcres')}</label>
                                                <input type="number" value={field.area}
                                                    onChange={(e) => updateNewField(index, 'area', Number(e.target.value))}
                                                    className="w-full bg-white/5 border border-transparent rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                                                    placeholder="0.0" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 ml-1">{t('profile.plantedCrop')}</label>
                                                <select value={field.cropId}
                                                    onChange={(e) => updateNewField(index, 'cropId', e.target.value)}
                                                    className="w-full bg-[#1A1A1A] border border-transparent rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50 appearance-none">
                                                    <option value="" disabled>{t('profile.selectCrop')}</option>
                                                    {availableCrops.map(crop => (
                                                        <option key={crop.id} value={crop.id}>{crop.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="glass-panel-dark border border-white/10 rounded-3xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-white text-lg font-medium">{t('profile.location')}</h2>
                            <button onClick={handleAutoLocation} disabled={isLocating}
                                className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full hover:bg-green-500/30 transition-colors">
                                {isLocating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                                {t('profile.autoDetect')}
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 ml-2">{t('profile.district')}</label>
                                    <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 mt-1"
                                        placeholder="Madurai" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 ml-2">{t('profile.state')}</label>
                                    <input type="text" value={state} onChange={(e) => setState(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 mt-1"
                                        placeholder="Tamil Nadu" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 ml-2">{t('profile.latitude')}</label>
                                    <input type="number" value={lat} onChange={(e) => setLat(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 mt-1 font-mono text-xs"
                                        placeholder="0.0000" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 ml-2">{t('profile.longitude')}</label>
                                    <input type="number" value={lng} onChange={(e) => setLng(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 mt-1 font-mono text-xs"
                                        placeholder="0.0000" />
                                </div>
                            </div>
                        </div>
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
