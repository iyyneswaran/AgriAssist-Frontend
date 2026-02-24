import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useTranslation } from 'react-i18next';

export default function ScanCrop() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files).slice(0, 3);
            setSelectedFiles(filesArray);

            // Generate preview URLs
            const urls = filesArray.map(file => URL.createObjectURL(file));
            setPreviewUrls(urls);
        }
    };

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewUrls]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            {/* Background Image (Blurred Landscape) */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 blur-[10px] pointer-events-none"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1592982537447-6f23f5112df3?q=80&w=1000&auto=format&fit=crop")' }}
            ></div>
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-[rgba(10,20,10,0.4)] pointer-events-none"></div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md flex-1 flex flex-col pb-32">

                {/* Header Sequence */}
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

                {/* Center View */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 mt-8">
                    {/* Image Icon & Text */}
                    <div className="bg-white text-black p-3 rounded-[1.25rem] mb-6 shadow-2xl">
                        <ImageIcon size={48} strokeWidth={2} />
                    </div>

                    <p className="text-white text-center text-[17px] font-medium leading-snug mb-8 max-w-[260px]">
                        {t('scan.uploadToBegin')}
                    </p>

                    {/* Previews Container */}
                    <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-3 h-[112px] mb-6 overflow-x-auto shadow-inner">
                        {previewUrls.map((url, index) => (
                            <img
                                key={index}
                                src={url}
                                alt={`preview-${index}`}
                                className="w-20 h-20 object-cover rounded-xl border border-white/20 flex-shrink-0"
                            />
                        ))}
                    </div>

                    {/* Faux File Upload Input Container */}
                    <div className="relative w-full mb-10">
                        {/* The visible styling */}
                        <div className="w-full bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-6 py-4 flex items-center justify-between text-sm shadow-xl">
                            <span className="text-white font-medium">{t('scan.chooseImages')}</span>
                            <span className="text-gray-300 font-medium truncate max-w-[120px]">
                                {selectedFiles.length > 0 ? t('scan.filesChosen', { count: selectedFiles.length }) : t('scan.noFileChosen')}
                            </span>
                        </div>

                        {/* The actual hidden input stretched to cover the container */}
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    {/* Action Button */}
                    <button className="bg-black/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-2 text-white font-medium hover:bg-white/10 transition-transform active:scale-95">
                        {t('scan.startAnalytic')} <span>✨</span>
                    </button>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
