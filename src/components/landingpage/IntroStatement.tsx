import React from 'react';

const IntroStatement: React.FC = () => {
  return (
    <div className="w-full bg-white py-24 md:py-32 flex justify-center border-b border-light-gray">
      <div className="container mx-auto px-8 max-w-5xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-gray text-xs font-semibold text-gray-600 tracking-wide uppercase mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
          AgriAssist
        </div>
        
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium text-dark-green leading-tight max-w-4xl">
          Our platform is built to support farmers, agribusinesses, and agricultural innovators <span className="text-gray-400">by delivering 
          <span className="inline-block mx-3 align-middle bg-cover bg-center w-16 md:w-24 h-8 md:h-12 rounded-full overflow-hidden" 
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592982537447-6f23f662ee5b?q=80&w=2070&auto=format&fit=crop')" }}>
          </span>
          practical tools that respect the land while improving productivity.</span>
        </h2>
      </div>
    </div>
  );
};

export default IntroStatement;
