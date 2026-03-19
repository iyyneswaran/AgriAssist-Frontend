import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const cards = [
  {
    image: "https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=2070&auto=format&fit=crop",
    title: "Instant Disease Diagnosis",
    description: "Scan crops with your phone camera to identify diseases instantly and get actionable remedies."
  },
  {
    image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=2071&auto=format&fit=crop",
    title: "Native Voice Assistant",
    description: "Ask questions, check weather, and get farming advice in your own language, hands-free."
  },
  {
    image: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=2036&auto=format&fit=crop",
    title: "Offline Reliability",
    description: "Keep logging and viewing farm data even when you're out in the field with poor connection."
  }
];

const ModernFarmingCards: React.FC = () => {
  return (
    <div className="w-full bg-white py-24">
      <div className="container mx-auto px-8 max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-gray text-xs font-semibold text-gray-600 tracking-wide uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
              Core Features
            </div>
            
            <h2 className="text-4xl md:text-5xl font-medium text-dark-green leading-tight">
              Tools Built Specifically <br />
              <span className="font-serif-italic">For Farmers</span>
            </h2>
          </div>
          
          <p className="text-gray-500 max-w-md text-sm leading-relaxed">
            We empower farmers with accessible mobile tools, AI insights, and offline support to protect crops and ensure successful harvests.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="rounded-3xl overflow-hidden mb-6 aspect-[4/5] relative">
                <img 
                  src={card.image} 
                  alt={card.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Hover overlay and button */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl">
                      <ArrowUpRight className="text-dark-green" size={20} strokeWidth={2.5} />
                   </div>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-dark-green mb-2 group-hover:text-brand-green transition-colors">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed pr-4">{card.description}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ModernFarmingCards;
