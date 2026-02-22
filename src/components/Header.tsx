import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../services/userService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [firstName, setFirstName] = useState('Farmer');

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

  // Dynamic Date
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <h2 className="text-xl font-medium text-green-400 capitalize">Hello, {firstName}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1.5 border border-white/10">
          <span className="text-xs font-medium">English</span>
          <ChevronDown size={12} className="text-gray-300" />
        </div>

        {/* Notification */}
        <div className="relative p-2 bg-white/10 rounded-full border border-white/10">
          <Bell size={18} className="text-white" />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-black"></span>
        </div>

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