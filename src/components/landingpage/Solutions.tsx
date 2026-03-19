import React, { useState } from 'react';
import { Plus, Minus, Sprout, Tractor, Droplet } from 'lucide-react';
import clsx from 'clsx';

const solutions = [
  {
    id: 1,
    title: 'Precision Disease Diagnosis',
    icon: <Sprout size={20} className="text-gray-500" />,
    content: 'Instantly diagnose crop diseases and get actionable remedies with our advanced AI-driven image analysis.'
  },
  {
    id: 2,
    title: 'Multilingual Voice Assistant',
    icon: <Sprout size={20} className="text-dark-green" />,
    content: 'Get instant farming advice and weather updates in your native language with our intelligent AI farm assistant.',
    activeIconClasses: 'bg-brand-green text-dark-green'
  },
  {
    id: 3,
    title: 'Real-time Weather & Mapping',
    icon: <Tractor size={20} className="text-gray-500" />,
    content: 'Plan your farming activities with hyper-local weather forecasts and precise GPS field mapping.'
  },
  {
    id: 4,
    title: 'Offline & Low-Bandwidth Ready',
    icon: <Droplet size={20} className="text-gray-500" />,
    content: 'Access critical farm data and previously saved insights even when cellular connectivity drops.'
  }
];

const Solutions: React.FC = () => {
  const [activeId, setActiveId] = useState<number>(2);

  return (
    <div className="w-full bg-white py-24">
      <div className="container mx-auto px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-gray text-xs font-semibold text-gray-600 tracking-wide uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
              About AgriAssist
            </div>
            
            <h2 className="text-4xl md:text-5xl font-medium text-dark-green leading-tight">
              Smart Farming Solutions <br />
              <span className="font-serif-italic">That Deliver Real Results</span>
            </h2>
          </div>
          
          <p className="text-gray-500 max-w-md text-sm leading-relaxed">
            Our intelligent agriculture solutions help farmers grow more with less by optimizing resources, improving crop health, and supporting long term sustainability across every season.
          </p>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* Accordion */}
          <div className="flex flex-col gap-4">
            {solutions.map((item) => {
              const isActive = activeId === item.id;
              
              return (
                <div 
                  key={item.id}
                  className={clsx(
                    "border rounded-2xl overflow-hidden transition-all duration-300",
                    isActive ? "border-brand-green shadow-sm" : "border-gray-100 hover:border-gray-300"
                  )}
                >
                  <button 
                    onClick={() => setActiveId(item.id)}
                    className="w-full flex items-center justify-between p-6 bg-white text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "p-2 rounded-lg transition-colors",
                        isActive && item.activeIconClasses ? item.activeIconClasses : "bg-gray-100"
                      )}>
                        {isActive && item.id === 2 ? <Sprout size={20} className="text-dark-green" fill="currentColor" /> : item.icon}
                      </div>
                      <span className={clsx(
                        "font-medium text-lg",
                        isActive ? "text-dark-green" : "text-gray-600"
                      )}>
                        {item.title}
                      </span>
                    </div>
                    <div className="text-gray-400">
                      {isActive ? <Minus size={20} /> : <Plus size={20} />}
                    </div>
                  </button>
                  
                  {/* Accordion Content */}
                  <div 
                    className={clsx(
                      "grid transition-all duration-300 ease-in-out",
                      isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-gray-500 text-sm leading-relaxed ml-14">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Image */}
          <div className="rounded-3xl overflow-hidden h-[500px] w-full relative group">
            <img 
              src="https://images.unsplash.com/photo-1592982537447-6f23f662ee5b?q=80&w=2070&auto=format&fit=crop" 
              alt="Farmers inspecting crops with irrigation" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
            />
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Solutions;
