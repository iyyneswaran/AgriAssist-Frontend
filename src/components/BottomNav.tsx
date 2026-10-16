import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShieldAlert, MessageCircle, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { name: t('nav.home'), path: '/home', icon: Home, code: 'home' },
    { name: t('nav.forecast'), path: '/forecast', icon: ShieldAlert, code: 'forecast' },
    { name: t('nav.chat'), path: '/chat', icon: MessageCircle, code: 'chat' },
    { name: t('nav.farm'), path: '/farm-details', icon: LayoutGrid, code: 'farm' },
  ];

  const isItemActive = (path: string, code: string) => {
    if (code === 'home') {
      return location.pathname === '/home';
    }
    if (code === 'forecast') {
      return location.pathname === '/forecast' || location.pathname.startsWith('/alerts/');
    }
    if (code === 'chat') {
      return location.pathname === '/chat' || location.pathname.startsWith('/chat');
    }
    if (code === 'farm') {
      return location.pathname === '/farm-details' || location.pathname.startsWith('/farm');
    }
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto glass-nav-dock rounded-full px-5 py-2.5 flex items-center justify-between shadow-2xl max-w-sm sm:max-w-md w-full mx-auto"
        style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {navItems.map((item) => {
          const isActive = isItemActive(item.path, item.code);
          const Icon = item.icon;

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-1 rounded-2xl transition-all duration-300 glass-focus-ring cursor-pointer select-none ${
                isActive ? 'text-lime-400 font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'bg-lime-400/15 border border-lime-400/30 text-lime-400 shadow-[0_0_12px_rgba(161,229,51,0.25)]'
                    : 'bg-transparent border border-transparent group-hover:bg-white/5'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={`transition-all duration-300 ${
                    isActive ? 'text-lime-400 scale-105' : 'text-gray-400 group-hover:text-gray-200'
                  }`}
                  fill={isActive && (item.code === 'home' || item.code === 'chat') ? 'currentColor' : 'none'}
                />
              </div>
              <span
                className={`text-[10px] tracking-tight transition-colors duration-300 mt-0.5 ${
                  isActive ? 'text-lime-400 font-semibold' : 'text-gray-400 group-hover:text-gray-200 font-medium'
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;