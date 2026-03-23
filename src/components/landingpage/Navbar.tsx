import React from 'react';
import { Home, Sprout } from 'lucide-react';

interface NavbarProps {
  onContactClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onContactClick = () => {} }) => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="bg-brand-green text-dark-green p-1.5 rounded-lg flex items-center justify-center">
          <Sprout size={24} strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-semibold tracking-tight">AgriAssist</span>
      </div>

      {/* Navigation Pill */}
      <div className="hidden lg:flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1.5 shadow-sm">
        <a href="#" className="flex items-center gap-2 bg-white text-dark-green px-4 py-2 rounded-full font-medium text-sm transition-colors">
          <Home size={16} />
          Home
        </a>
        <a href="#" className="px-5 py-2 hover:bg-white/20 rounded-full transition-colors text-sm font-medium">About Us</a>
        <a href="#" className="px-5 py-2 hover:bg-white/20 rounded-full transition-colors text-sm font-medium">Solutions</a>
        <a href="#" className="px-5 py-2 hover:bg-white/20 rounded-full transition-colors text-sm font-medium">Investors</a>
        <a href="#" className="px-5 py-2 hover:bg-white/20 rounded-full transition-colors text-sm font-medium">Success Story</a>
      </div>

      {/* CTA Button */}
      <div className="hidden md:block">
        <button
          type="button"
          onClick={onContactClick}
          className="bg-white text-dark-green hover:bg-gray-100 transition-colors px-6 py-2.5 rounded-full font-medium text-sm"
        >
          Contact Us
        </button>
      </div>

      {/* Mobile Menu Toggle (Placeholder) */}
      <div className="lg:hidden">
        {/* Placeholder for mobile menu icon */}
      </div>
    </nav>
  );
};

export default Navbar;
