import React, { useState } from 'react';
import { Eye, Sun, Settings, Activity } from 'lucide-react';
import clsx from 'clsx';

const tabs = [
  { id: 'overview', icon: <Eye size={18} />, label: 'Overview', sublabel: 'Real-Time Insights' },
  { id: 'smart-planning', icon: <Sun size={18} />, label: 'Smart Planning', sublabel: 'Precision Planning' },
  { id: 'farm-control', icon: <Settings size={18} />, label: 'Farm Control', sublabel: 'Total Management' },
  { id: 'field-monitor', icon: <Activity size={18} />, label: 'Field Monitor', sublabel: 'Growth Tracker' },
];

const FeaturesTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('smart-planning');

  return (
    <div className="w-full bg-light-gray py-24 border-t border-gray-200">
      <div className="container mx-auto px-8 max-w-6xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 tracking-wide uppercase mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
              How it works
            </div>
            
            <h2 className="text-4xl md:text-5xl font-medium text-dark-green leading-tight">
              Intelligent Farming Made <br />
              <span className="font-serif-italic">Simple and Accessible</span>
            </h2>
          </div>
          
          <p className="text-gray-500 max-w-sm text-sm leading-relaxed mt-4">
            A comprehensive smart farming platform that brings disease diagnosis, weather insights, and AI assistance directly to your field.
          </p>
        </div>

        {/* Tabs Desktop & Tablet */}
        <div className="hidden md:flex flex-nowrap w-full overflow-x-auto gap-2 mb-8 no-scrollbar bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center flex-1 px-4 py-3 rounded-xl transition-all duration-300 gap-4 whitespace-nowrap",
                  isActive 
                    ? "bg-brand-green/10 text-dark-green border border-brand-green/20" 
                    : "text-gray-500 hover:bg-gray-50 border border-transparent"
                )}
              >
                <div className={clsx(
                  "p-2 rounded-lg",
                  isActive ? "bg-brand-green text-dark-green" : "bg-gray-100 text-gray-400"
                )}>
                  {tab.icon}
                </div>
                <div className="text-left">
                  <div className={clsx("font-semibold text-sm", isActive ? "text-dark-green" : "text-gray-700")}>
                    {tab.label}
                  </div>
                  <div className={clsx("text-xs font-medium", isActive ? "text-dark-green/70" : "text-gray-400")}>
                    {tab.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden flex flex-wrap gap-2 mb-8">
            {tabs.map((tab) => (
               <button
                  key={`mobile-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex-1 items-center px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm border font-medium",
                    activeTab === tab.id 
                      ? "bg-brand-green text-dark-green border-brand-green/30" 
                      : "bg-white text-gray-500 border-gray-200"
                  )}
               >
                 {tab.label}
               </button>
            ))}
        </div>

        {/* Feature Visual Asset */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-white/20 aspect-[16/9] md:aspect-[21/9] bg-white">
          <img 
            src="https://images.unsplash.com/photo-1595822533924-ce4d0b118ad4?q=80&w=2670&auto=format&fit=crop" 
            alt="Farmer looking at dashboard" 
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Widget */}
          {activeTab === 'smart-planning' && (
             <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl w-72 border border-white max-w-[calc(100%-4rem)] hidden sm:block">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center">
                    <Sun className="text-brand-green" size={20} />
                  </div>
                  <div className="text-right">
                     <div className="text-2xl font-bold text-dark-green">24°C</div>
                     <div className="text-xs text-gray-400 font-medium">Today's Avg Temperature</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-6 border-y border-gray-100 py-4">
                   <div className="text-center">
                     <div className="text-sm font-bold text-dark-green">68%</div>
                     <div className="text-[10px] text-gray-400 mt-1 uppercase">Humidity</div>
                   </div>
                   <div className="text-center border-x border-gray-100">
                     <div className="text-sm font-bold text-dark-green">20%</div>
                     <div className="text-[10px] text-gray-400 mt-1 uppercase">Precipitation</div>
                   </div>
                   <div className="text-center">
                     <div className="text-sm font-bold text-dark-green">12 <span className="text-[10px]">km/h</span></div>
                     <div className="text-[10px] text-gray-400 mt-1 uppercase">Wind Speed</div>
                   </div>
                </div>

                <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-semibold text-gray-600">Area Prediction AI Model</span>
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                   </div>
                   {/* Gradient Bar */}
                   <div className="h-6 w-full rounded-md bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 opacity-60 relative flex overflow-hidden">
                      {/* Vertical ticks */}
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="flex-1 border-r border-white/30 h-full"></div>
                      ))}
                      <div className="absolute top-0 bottom-0 left-2/3 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10"></div>
                   </div>
                   
                   <div className="mt-4 flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100">
                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs">!</div>
                      <p className="text-[10px] text-orange-800 leading-tight">Rain is expected within the next 2 hours. Protect your crops.</p>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-gray-100">
                <div className="text-4xl font-semibold text-dark-green mb-1 text-center">1.5M+</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Crops Diagnosed</div>
            </div>
            <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-gray-100">
                <div className="text-4xl font-semibold text-dark-green mb-1 text-center">500K+</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Farmers Supported</div>
            </div>
            <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-gray-100">
                <div className="text-4xl font-semibold text-dark-green mb-1 text-center">2M+</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">AI Conversations</div>
            </div>
            <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-gray-100">
                <div className="text-4xl font-semibold text-dark-green mb-1 text-center">750K+</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Harvests Secured</div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default FeaturesTab;
