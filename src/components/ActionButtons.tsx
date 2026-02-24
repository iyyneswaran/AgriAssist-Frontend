import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Camera, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ActionButtons: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-3">
      <button className="glass-panel-dark p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/5 hover:bg-white/10 transition-colors group">
        <Mic className="text-green-400 group-hover:scale-110 transition-transform" size={20} />
        <span className="text-[11px] font-medium text-gray-200">{t('actions.aiAssistant')}</span>
      </button>

      <button
        onClick={() => navigate('/scan-crop')}
        className="glass-panel-dark p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/5 hover:bg-white/10 transition-colors group"
      >
        <Camera className="text-green-300 group-hover:scale-110 transition-transform" size={20} />
        <span className="text-[11px] font-medium text-gray-200">{t('actions.scanCrop')}</span>
      </button>

      <button className="glass-panel-dark p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/5 hover:bg-white/10 transition-colors group">
        <Star className="text-green-200 group-hover:scale-110 transition-transform" size={20} />
        <span className="text-[11px] font-medium text-gray-200 text-center leading-tight">{t('actions.schemes')}</span>
      </button>
    </div>
  );
};

export default ActionButtons;