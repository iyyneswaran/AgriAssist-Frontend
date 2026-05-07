import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../services/userService';
import { getNotificationCount } from '../services/notificationService';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const [firstName, setFirstName] = useState('Farmer');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const user = await getProfile(token);
        if (user && user.name) {
          // Extract just the first name for the greeting
          const first = user.name.split(' ')[0];
          setFirstName(first);
        }
      } catch (error) {
        console.error("Failed to load user for header", error);
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let active = true;
    const loadNotificationCount = async () => {
      try {
        const count = await getNotificationCount();
        if (active) {
          setUnreadCount(count.unread_count);
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    };

    void loadNotificationCount();
    const intervalId = window.setInterval(loadNotificationCount, 60_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [token]);

  // Dynamic Date
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <h2 className="text-xl font-medium text-green-400 capitalize">{t('header.hello')}, {firstName}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <div className="relative">
          <select
            className="appearance-none bg-white/10 rounded-full px-3 py-1.5 pl-4 pr-8 border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-green-500/50 cursor-pointer"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="en" className="bg-black">{t('header.english')}</option>
            <option value="hi" className="bg-black">{t('header.hindi')}</option>
            <option value="ta" className="bg-black">{t('header.tamil')}</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
            <ChevronDown size={12} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-2 bg-white/10 rounded-full border border-white/10"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-white" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full border border-black bg-green-500 px-1 text-[10px] font-semibold text-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Pic */}
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full overflow-hidden border border-white/20 hover:border-white/50 transition-colors"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </div>
  );
};

export default Header;
