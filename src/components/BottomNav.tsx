import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, LayoutGrid } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Chat', path: '/chat', icon: MessageCircle },
    { name: 'Farm Details', path: '/farm-details', icon: LayoutGrid },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
      <div className="bg-[#1a201a]/90 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl gap-8">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 group w-16"
            >
              <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-white/5'}`}>
                <Icon
                  size={20}
                  className={`transition-colors duration-300 ${isActive ? 'text-white fill-current' : 'text-gray-400 group-hover:text-gray-200'}`}
                  fill={isActive && item.name === 'Home' ? "white" : "none"}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;