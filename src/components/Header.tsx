import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../services/userService';
import { getNotificationCount } from '../services/notificationService';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t, i18n } = useTranslation();

  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Derive first name: prefer fetched profile name, then auth user name, fallback to Farmer
  const firstName = fetchedName || (user?.name ? user.name.trim().split(' ')[0] : 'Farmer');

  // Fetch fresh profile details on mount / token change
  useEffect(() => {
    if (!token) return;

    let active = true;
    const fetchUser = async () => {
      try {
        const profile = await getProfile(token);
        if (active && profile?.name) {
          const first = profile.name.trim().split(' ')[0];
          if (first) {
            setFetchedName(first);
          }
        }
      } catch (error) {
        console.error('Failed to load user profile for header', error);
      }
    };

    void fetchUser();
    return () => {
      active = false;
    };
  }, [token]);

  // Poll notification count every 60 seconds
  useEffect(() => {
    if (!token) return;

    let active = true;
    const loadNotificationCount = async () => {
      try {
        const count = await getNotificationCount();
        if (active) {
          setUnreadCount(count.unread_count ?? 0);
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

  // Localized dynamic date (Intl.DateTimeFormat with weekday, day, month, year)
  const today = new Date();
  const locale = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'ta' ? 'ta-IN' : 'en-US';
  const formattedDate = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(today);

  return (
    <header className="flex items-center justify-between w-full py-1 gap-2">
      {/* Personalized Greeting */}
      <div className="min-w-0 flex-1">
        <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight truncate">
          <span className="text-gray-300 font-normal">{t('header.hello')}, </span>
          <span className="text-lime-400 capitalize font-semibold">{firstName}</span>
        </h2>
        <p className="text-xs text-gray-400 font-medium tracking-wide truncate mt-0.5 capitalize">
          {formattedDate}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Compact Glass Pill Language Selector */}
        <div className="relative inline-flex items-center">
          <div className="pointer-events-none absolute left-2.5 flex items-center text-gray-400">
            <Globe size={13} className="text-gray-400" />
          </div>
          <select
            aria-label="Select Language"
            className="appearance-none bg-white/[0.08] hover:bg-white/[0.14] transition-colors rounded-full pl-7 pr-6 py-1.5 border border-white/10 text-xs font-medium text-gray-200 hover:text-white focus:outline-none focus:border-lime-400/50 glass-focus-ring cursor-pointer backdrop-blur-md"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="en" className="bg-[#121814] text-white">
              {t('header.english')}
            </option>
            <option value="hi" className="bg-[#121814] text-white">
              {t('header.hindi')}
            </option>
            <option value="ta" className="bg-[#121814] text-white">
              {t('header.tamil')}
            </option>
          </select>
          <div className="pointer-events-none absolute right-2 flex items-center text-gray-400">
            <ChevronDown size={12} />
          </div>
        </div>

        {/* High-Contrast Glass Circle Notification Bell */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 border border-white/15 hover:border-white/30 text-gray-200 hover:text-white transition-all backdrop-blur-md glass-focus-ring cursor-pointer group"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell size={17} className="transition-transform duration-200 group-hover:rotate-6 text-gray-200 group-hover:text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime-400 px-1 text-[9px] font-bold text-black shadow-sm ring-2 ring-[#0a120e]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Avatar Button with Subtle Green Ring Indicator */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="relative flex items-center justify-center w-9 h-9 rounded-full p-[2px] ring-2 ring-lime-400/40 hover:ring-lime-400 transition-all duration-300 glass-focus-ring cursor-pointer active:scale-95"
          aria-label="Profile"
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-white/10">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-lime-400 border-2 border-[#0a120e] rounded-full shadow-[0_0_6px_rgba(161,229,51,0.6)]"
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
};

export default Header;
