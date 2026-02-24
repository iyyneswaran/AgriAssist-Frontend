import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FarmAdvisory: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="glass-panel-dark rounded-2xl p-5 border-l-4 border-l-green-500">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <CheckCircle2 size={14} className="text-black" />
        </div>
        <h3 className="text-sm font-semibold text-gray-100">{t('advisory.todaysFarmAdvisory')}</h3>
      </div>

      <ul className="space-y-2 pl-2">
        <li className="flex items-start gap-2 text-xs text-gray-300">
          <span className="block w-1.5 h-1.5 mt-1 rounded-full bg-white flex-shrink-0"></span>
          <span>{t('advisory.noIrrigation')}</span>
        </li>
        <li className="flex items-start gap-2 text-xs text-gray-300">
          <span className="block w-1.5 h-1.5 mt-1 rounded-full bg-white flex-shrink-0"></span>
          <span>{t('advisory.monitorPaddy')}</span>
        </li>
        <li className="flex items-start gap-2 text-xs text-gray-300">
          <span className="block w-1.5 h-1.5 mt-1 rounded-full bg-white flex-shrink-0"></span>
          <span>{t('advisory.applyFertilizer')}</span>
        </li>
      </ul>
    </div>
  );
};

export default FarmAdvisory;