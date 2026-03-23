import React from 'react';

interface CTAProps {
  onContactClick?: () => void;
}

const CTA: React.FC<CTAProps> = ({ onContactClick = () => {} }) => {
  return (
    <div className="w-full bg-white pt-24 pb-32">
      <div className="container mx-auto px-8 max-w-4xl text-center">

        <h2 className="text-4xl md:text-5xl font-medium text-dark-green mb-6 leading-tight">
          Make farming smarter, <br />
          <span className="font-serif-italic">stronger, and simpler</span>
        </h2>

        <p className="text-gray-500 text-sm max-w-md mx-auto mb-10 leading-relaxed">
          Straightforward answers to help you make confident decisions for your farm.
        </p>

        <button
          type="button"
          onClick={onContactClick}
          className="bg-dark-green hover:bg-black text-white px-8 py-3.5 rounded-full text-sm font-medium transition-colors shadow-[0_10px_20px_rgba(30,41,35,0.2)]"
        >
          Contact Us
        </button>

      </div>
    </div>
  );
};

export default CTA;
