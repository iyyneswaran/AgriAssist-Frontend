import React from 'react';

const LogoTicker: React.FC = () => {
  return (
    <div className="w-full bg-white py-10 border-b border-gray-100 flex justify-center">
      <div className="container mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 flex-wrap">
        <p className="text-gray-500 font-medium text-sm w-full md:w-auto text-center md:text-left">
          Trusted by <span className="font-bold text-gray-800">thousand</span><br />
          companies in the world
        </p>
        
        {/* Logos Placeholder - In a real app we'd use actual SVGs here, using text for now to match structure */}
        <div className="flex items-center gap-8 lg:gap-16 opacity-70 grayscale font-bold text-xl tracking-tighter">
          <div>CHASE O</div>
          <div>JOHN DEERE</div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-black transform rotate-45"></div> Leader
          </div>
          <div className="font-serif italic text-2xl">Kubota</div>
          <div className="tracking-widest">GLEANER</div>
        </div>
      </div>
    </div>
  );
};

export default LogoTicker;
