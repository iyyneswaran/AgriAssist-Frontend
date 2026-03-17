import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative h-screen min-h-[700px] w-full flex items-center justify-center overflow-hidden rounded-b-3xl">
      {/* Background Image Setup */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop')", // Wheat field placeholder
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-8 w-full flex flex-col justify-end h-full pb-24">
        <div className="max-w-3xl">
          <h1 className="text-white text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[1.1] mb-6">
            Smart Farming for <br />
            <span className="font-serif-italic">Future Generations</span>
          </h1>
          
          <p className="text-white/80 text-lg max-w-md mb-10 leading-relaxed">
            Send, receive, and track your finances in one secure platform built for speed, clarity, and everyday financial control.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <button className="bg-brand-green hover:bg-brand-green/90 text-dark-green font-medium px-8 py-3.5 rounded-full flex items-center gap-2 transition-colors">
              Start Investing
              <ArrowUpRight size={18} strokeWidth={2.5} />
            </button>
            <button className="text-white border border-white/30 hover:bg-white/10 font-medium px-8 py-3.5 rounded-full transition-colors backdrop-blur-sm">
              Meet the Farmers
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-8 left-8 flex items-center gap-2 text-white/80 text-sm font-medium tracking-widest cursor-pointer group">
          SCROLL 
          <span className="group-hover:translate-y-1 transition-transform">↓</span>
        </div>

        {/* Rating Widget */}
        <div className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-4 shadow-lg text-white">
          <div className="flex items-center gap-1.5 font-bold">
             <span className="text-brand-green">★</span> 4.9
          </div>
          <div className="w-px h-6 bg-white/20"></div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <img src="https://i.pravatar.cc/100?img=33" alt="user" className="w-8 h-8 rounded-full border-2 border-white/20" />
              <img src="https://i.pravatar.cc/100?img=47" alt="user" className="w-8 h-8 rounded-full border-2 border-white/20" />
              <img src="https://i.pravatar.cc/100?img=12" alt="user" className="w-8 h-8 rounded-full border-2 border-white/20" />
            </div>
            <span className="text-sm font-medium ml-1">10k+ Farmers</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Hero;
