import { Mic, X, Menu } from 'lucide-react';
import { Bot } from 'lucide-react';

interface VoiceChatOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VoiceChatOverlay({ isOpen, onClose }: VoiceChatOverlayProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 animate-in fade-in duration-300">
            {/* Blurry Animated Background completely overriding the screen */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl">
                {/* Subtle gradient blobs for ambiance */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Top Navigation Row */}
            <div className="relative z-10 flex items-center justify-between mt-2">
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
                >
                    <Menu size={24} />
                </button>

                <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white/90 text-sm font-medium tracking-wide">
                    AgriAssist
                </div>

                <div className="w-12 font-medium"></div> {/* Spacer to keep title centered */}
            </div>

            {/* Center Area: Bot Avatar & Status */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1">
                {/* Glowing Avatar */}
                <div className="relative mb-8">
                    {/* Ring animation */}
                    <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border border-green-400/50 transform scale-125 duration-1000"></div>

                    {/* The Avatar */}
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-2xl shadow-green-900/40 border border-white/10 z-10 relative">
                        {/* Placeholder for actual bot image. Using Lucide Bot for now, ideally an image tag */}
                        <Bot size={80} className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                    </div>
                </div>

                <p className="text-xl font-medium text-white tracking-wide animate-pulse">
                    Listening...
                </p>
            </div>

            {/* Bottom Controls */}
            <div className="relative z-10 flex items-end justify-between mb-8">
                <button className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition">
                    <Mic size={24} />
                </button>

                <button
                    onClick={onClose}
                    className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                >
                    <X size={24} />
                </button>
            </div>

        </div>
    );
}
