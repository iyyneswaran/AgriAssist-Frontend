import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Camera, Landmark, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface ActionCardConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColors: string;
  glowClass: string;
  ambientBlob: string;
  onClick: () => void;
}

const ActionButtons: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cards: ActionCardConfig[] = [
    {
      id: 'ai-assistance',
      title: t('actions.aiAssistance', 'AI Assistance'),
      subtitle: t('actions.askFarmingQuestions', 'Ask farming questions'),
      icon: Bot,
      iconColors: 'text-lime-400 bg-lime-400/10 border-lime-400/20',
      glowClass: 'glow-green',
      ambientBlob: 'bg-lime-400/10 group-hover:bg-lime-400/20',
      onClick: () => navigate('/chat', { state: { starterPrompt: 'Help me with my crop today.' } }),
    },
    {
      id: 'scan-crop',
      title: t('actions.scanCrop', 'Scan Crop'),
      subtitle: t('actions.detectDiseases', 'Detect crop diseases'),
      icon: Camera,
      iconColors: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
      glowClass: 'glow-cyan',
      ambientBlob: 'bg-cyan-400/10 group-hover:bg-cyan-400/20',
      onClick: () => navigate('/scan-crop'),
    },
    {
      id: 'schemes',
      title: t('actions.schemes', 'Schemes'),
      subtitle: t('actions.exploreSchemes', 'Explore government schemes'),
      icon: Landmark,
      iconColors: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
      glowClass: 'glow-violet',
      ambientBlob: 'bg-violet-400/10 group-hover:bg-violet-400/20',
      onClick: () => navigate('/farm-details#schemes'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            aria-label={`${card.title} - ${card.subtitle}`}
            className={clsx(
              'glass-action-card rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group text-left cursor-pointer border border-white/10 hover:border-white/25 transition-all glass-focus-ring min-h-[108px]',
              card.glowClass
            )}
          >
            {/* Ambient subtle glow blob */}
            <div
              className={clsx(
                'absolute -top-6 -right-6 w-24 h-24 rounded-full blur-xl pointer-events-none transition-colors duration-300',
                card.ambientBlob
              )}
            />

            {/* Top row: Icon container + Arrow affordance */}
            <div className="flex items-center justify-between w-full mb-3 relative z-10">
              <div
                className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 shrink-0',
                  card.iconColors
                )}
              >
                <IconComponent size={20} />
              </div>

              <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                <ArrowUpRight size={14} />
              </div>
            </div>

            {/* Bottom section: Bold title and crisp subtitle */}
            <div className="relative z-10 min-w-0 w-full mt-auto">
              <h3 className="text-sm font-semibold text-white tracking-wide truncate">
                {card.title}
              </h3>
              <p className="text-[11px] text-gray-300 leading-snug line-clamp-2 mt-1">
                {card.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ActionButtons;