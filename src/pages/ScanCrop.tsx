import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon, AlertCircle, CheckCircle2, ShieldAlert, Leaf, RefreshCw, Sparkles, Activity } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useTranslation } from 'react-i18next';
import { analyzeCrop, type ScanResult } from '../services/scanService';

type ScanState = 'idle' | 'analyzing' | 'results' | 'error';

export default function ScanCrop() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [result, setResult] = useState<ScanResult | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Client-side validation: only JPEG/PNG
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                setErrorMsg(t('scan.invalidType'));
                setScanState('error');
                return;
            }
            // Size check: 10MB max
            if (file.size > 10 * 1024 * 1024) {
                setErrorMsg(t('scan.fileTooLarge'));
                setScanState('error');
                return;
            }

            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setScanState('idle');
            setResult(null);
            setErrorMsg('');
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setScanState('analyzing');
        setErrorMsg('');

        try {
            const data = await analyzeCrop(selectedFile);
            setResult(data);
            setScanState('results');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Analysis failed';
            setErrorMsg(msg);
            setScanState('error');
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        setScanState('idle');
        setResult(null);
        setErrorMsg('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Cleanup object URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // ── Confidence color ──
    const getConfidenceColor = (conf: number) => {
        if (conf >= 0.85) return '#22c55e';
        if (conf >= 0.6) return '#eab308';
        return '#ef4444';
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            {/* Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 blur-[10px] pointer-events-none"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1592982537447-6f23f5112df3?q=80&w=1000&auto=format&fit=crop")' }}
            />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-[rgba(10,20,10,0.4)] pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md flex-1 flex flex-col pb-32 overflow-y-auto">

                {/* Header */}
                <div className="pt-12 px-5 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-white/90 hover:bg-white/20 transition-colors backdrop-blur-md"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium">
                        {t('scan.analysisUsingAI')}
                    </div>
                </div>

                {/* ── IDLE / UPLOAD STATE ── */}
                {(scanState === 'idle' || scanState === 'error') && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 mt-8" style={{ animation: 'fadeIn 0.4s ease' }}>
                        {/* Icon */}
                        {!previewUrl && (
                            <>
                                <div className="bg-white text-black p-3 rounded-[1.25rem] mb-6 shadow-2xl">
                                    <ImageIcon size={48} strokeWidth={2} />
                                </div>
                                <p className="text-white text-center text-[17px] font-medium leading-snug mb-8 max-w-[260px]">
                                    {t('scan.uploadToBegin')}
                                </p>
                            </>
                        )}

                        {/* Preview */}
                        {previewUrl && (
                            <div className="w-full mb-6" style={{ animation: 'scaleIn 0.3s ease' }}>
                                <div className="relative mx-auto w-56 h-56 rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                                    <img
                                        src={previewUrl}
                                        alt="Selected crop"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 rounded-2xl border border-white/10" />
                                </div>
                                <p className="text-white/60 text-center text-sm mt-3 truncate max-w-[280px] mx-auto">
                                    {selectedFile?.name}
                                </p>
                            </div>
                        )}

                        {/* Error Banner */}
                        {scanState === 'error' && (
                            <div className="w-full bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3"
                                style={{ animation: 'slideIn 0.3s ease' }}>
                                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-red-300 text-sm font-medium">{t('scan.error')}</p>
                                    <p className="text-red-400/80 text-xs mt-1">{errorMsg}</p>
                                </div>
                            </div>
                        )}

                        {/* File Upload Input */}
                        <div className="relative w-full mb-6">
                            <div className="w-full bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-6 py-4 flex items-center justify-between text-sm shadow-xl">
                                <span className="text-white font-medium">{t('scan.chooseImages')}</span>
                                <span className="text-gray-300 font-medium truncate max-w-[120px]">
                                    {selectedFile ? selectedFile.name : t('scan.noFileChosen')}
                                </span>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={!selectedFile}
                            className={`rounded-full px-8 py-4 flex items-center gap-2 font-medium transition-all active:scale-95 shadow-2xl ${
                                selectedFile
                                    ? 'bg-emerald-500/90 hover:bg-emerald-400/90 text-white border border-emerald-400/30 backdrop-blur-md'
                                    : 'bg-white/5 text-white/40 border border-white/10 backdrop-blur-md cursor-not-allowed'
                            }`}
                        >
                            {t('scan.startAnalytic')} <Sparkles size={18} />
                        </button>
                    </div>
                )}

                {/* ── ANALYZING STATE ── */}
                {scanState === 'analyzing' && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 mt-8"
                        style={{ animation: 'fadeIn 0.4s ease' }}>
                        {/* Pulsing preview */}
                        {previewUrl && (
                            <div className="relative w-40 h-40 rounded-2xl overflow-hidden mb-8">
                                <img
                                    src={previewUrl}
                                    alt="Analyzing"
                                    className="w-full h-full object-cover"
                                    style={{ animation: 'pulse 2s ease-in-out infinite' }}
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-2xl">
                                    <div className="w-12 h-12 border-3 border-emerald-400 border-t-transparent rounded-full"
                                        style={{ animation: 'spin 1s linear infinite', borderWidth: '3px' }} />
                                </div>
                            </div>
                        )}

                        {/* Scanning text */}
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="text-emerald-400" size={20}
                                style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                            <p className="text-white text-lg font-semibold">
                                {t('scan.analyzing')}
                            </p>
                        </div>

                        <p className="text-white/50 text-sm text-center max-w-[240px]">
                            {t('scan.analyzingDesc')}
                        </p>

                        {/* Progress bar */}
                        <div className="w-48 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                style={{ animation: 'progressBar 3s ease-in-out infinite', width: '0%' }} />
                        </div>
                    </div>
                )}

                {/* ── RESULTS STATE ── */}
                {scanState === 'results' && result && (
                    <div className="px-5 mt-8 space-y-4" style={{ animation: 'slideUp 0.5s ease' }}>

                        {/* Prediction Card */}
                        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
                            {/* Preview + Meta */}
                            <div className="flex gap-4 items-start mb-5">
                                {previewUrl && (
                                    <img
                                        src={previewUrl}
                                        alt="Scanned crop"
                                        className="w-20 h-20 rounded-2xl object-cover border border-white/10 flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Leaf className="text-emerald-400" size={16} />
                                        <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                                            {result.prediction.crop_name}
                                        </span>
                                    </div>
                                    <h2 className="text-white text-lg font-bold leading-tight">
                                        {result.prediction.is_healthy
                                            ? t('scan.healthy')
                                            : result.prediction.disease_name}
                                    </h2>

                                    {/* Confidence Bar */}
                                    <div className="mt-3">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-white/50 text-xs font-medium">{t('scan.confidence')}</span>
                                            <span className="text-sm font-bold" style={{ color: getConfidenceColor(result.prediction.confidence) }}>
                                                {(result.prediction.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${result.prediction.confidence * 100}%`,
                                                    backgroundColor: getConfidenceColor(result.prediction.confidence),
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Health Badge */}
                            {result.prediction.is_healthy && (
                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                                    <CheckCircle2 className="text-emerald-400" size={18} />
                                    <p className="text-emerald-300 text-sm font-medium">{t('scan.noDisease')}</p>
                                </div>
                            )}
                        </div>

                        {/* Remedy Card */}
                        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl"
                            style={{ animation: 'slideUp 0.6s ease' }}>

                            {/* Source Badge */}
                            <div className="flex items-center gap-2 mb-4">
                                {result.remedy.source === 'ai' ? (
                                    <Sparkles className="text-amber-400" size={16} />
                                ) : (
                                    <ShieldAlert className="text-blue-400" size={16} />
                                )}
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{
                                    color: result.remedy.source === 'ai' ? '#fbbf24' : '#60a5fa'
                                }}>
                                    {result.remedy.source === 'ai' ? t('scan.aiGenerated') : t('scan.fallbackRemedy')}
                                </span>
                            </div>

                            {/* Explanation */}
                            <div className="mb-5">
                                <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
                                    {t('scan.explanation')}
                                </h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    {result.remedy.explanation}
                                </p>
                            </div>

                            {/* Treatment Steps */}
                            {result.remedy.treatment_steps.length > 0 && (
                                <div className="mb-5">
                                    <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">
                                        {t('scan.treatment')}
                                    </h3>
                                    <div className="space-y-2.5">
                                        {result.remedy.treatment_steps.map((step, i) => (
                                            <div key={i} className="flex gap-3 items-start">
                                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                <p className="text-white/70 text-sm leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Preventive Measures */}
                            {result.remedy.preventive_measures.length > 0 && (
                                <div className="mb-5">
                                    <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">
                                        {t('scan.prevention')}
                                    </h3>
                                    <div className="space-y-2">
                                        {result.remedy.preventive_measures.map((measure, i) => (
                                            <div key={i} className="flex gap-2.5 items-start">
                                                <span className="text-teal-400 text-sm mt-0.5">•</span>
                                                <p className="text-white/70 text-sm leading-relaxed">{measure}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sensor Advice */}
                            {result.remedy.sensor_advice && (
                                <div className="bg-blue-500/8 border border-blue-500/15 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="text-blue-400" size={14} />
                                        <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
                                            {t('scan.sensorAdvice')}
                                        </span>
                                    </div>
                                    <p className="text-blue-300/80 text-sm leading-relaxed">
                                        {result.remedy.sensor_advice}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2 pb-4">
                            <button
                                onClick={handleReset}
                                className="flex-1 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-full px-5 py-3.5 flex items-center justify-center gap-2 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors active:scale-95"
                            >
                                <RefreshCw size={16} />
                                {t('scan.scanAnother')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />

            {/* Inline Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes progressBar {
                    0% { width: 0%; }
                    50% { width: 80%; }
                    100% { width: 100%; }
                }
            `}</style>
        </div>
    );
}
