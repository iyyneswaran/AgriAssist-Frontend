import React from 'react';
import { Quote } from 'lucide-react';

const Testimonials: React.FC = () => {
  return (
    <div className="w-full bg-light-gray py-24 border-t border-gray-100">
      <div className="container mx-auto px-8 max-w-6xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 tracking-wide uppercase mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
              Testimonials
            </div>
            
            <h2 className="text-4xl md:text-5xl font-medium text-dark-green leading-tight">
              Real Stories Shared <br />
              <span className="font-serif-italic">by Our Farmers</span>
            </h2>
          </div>
          
          <p className="text-gray-500 max-w-sm text-sm leading-relaxed text-right md:text-left">
            Hear directly from farmers who use our solutions every day and see real impact across their fields and harvests.
          </p>
        </div>

        {/* Testimonial Cards Slider Concept */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-8 flex-1 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
             <div className="mb-6">
               <Quote className="text-brand-green/30 fill-brand-green/30 w-12 h-12 mb-4" />
               <p className="text-xl md:text-2xl font-medium text-dark-green leading-snug">
                 "The platform was easy to implement and delivered value fast. Within the first month, we improved irrigation planning and reduced input costs significantly."
               </p>
             </div>
             
             <div className="flex items-center justify-between mt-8">
               <div className="flex items-center gap-4">
                  <div className="opacity-0 lg:opacity-100 transition-opacity">
                     <p className="font-semibold text-dark-green text-sm">Michael Thompson</p>
                     <p className="text-xs text-gray-400 font-medium">Agrifields, Iowa</p>
                  </div>
               </div>
               <button className="text-xs font-semibold text-gray-400 hover:text-dark-green transition-colors uppercase tracking-widest flex items-center gap-2 group">
                 Read more <span className="group-hover:translate-x-1 transition-transform">→</span>
               </button>
             </div>
             
             <div className="absolute right-0 bottom-0 top-0 w-1/3 z-0 overflow-hidden pointer-events-none rounded-tl-full opacity-60">
                 <img src="https://images.unsplash.com/photo-1595822521191-039c36ec3ba8?q=80&w=1964&auto=format&fit=crop" alt="Farmer" className="object-cover w-full h-full object-center translate-x-4" />
             </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-8 flex-1 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
             <div className="mb-6">
               <Quote className="text-brand-green/30 fill-brand-green/30 w-12 h-12 mb-4" />
               <p className="text-xl md:text-2xl font-medium text-dark-green leading-snug">
                 "Real-time field data completely changed how we manage our crops. We're making smarter decisions and seeing healthier yields season after season."
               </p>
             </div>
             
             <div className="flex items-center justify-between mt-8">
               <div className="flex items-center gap-4">
                  <div className="opacity-0 lg:opacity-100 transition-opacity">
                     <p className="font-semibold text-dark-green text-sm">Sarah Williams</p>
                     <p className="text-xs text-gray-400 font-medium">Greenacres, California</p>
                  </div>
               </div>
               <button className="text-xs font-semibold text-gray-400 hover:text-dark-green transition-colors uppercase tracking-widest flex items-center gap-2 group">
                 Read more <span className="group-hover:translate-x-1 transition-transform">→</span>
               </button>
             </div>
             
             <div className="absolute right-0 bottom-0 top-0 w-1/3 z-0 overflow-hidden pointer-events-none rounded-tl-full opacity-60">
                 <img src="https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1974&auto=format&fit=crop" alt="Farmer" className="object-cover w-full h-full object-center translate-x-4" />
             </div>
          </div>
          
        </div>

        {/* Carousel Controls */}
        <div className="flex justify-between items-center mt-12 w-full md:w-auto">
          <div className="flex items-center gap-4 text-xs font-medium text-gray-400 tracking-wider">
             <span className="text-dark-green font-bold border-b-2 border-dark-green pb-1 cursor-pointer">Agrifield</span>
             <span className="hover:text-dark-green cursor-pointer transition-colors pb-1 border-b-2 border-transparent hover:border-dark-green/30 px-2">Greenacres</span>
             <span className="hover:text-dark-green cursor-pointer transition-colors pb-1 border-b-2 border-transparent hover:border-dark-green/30 px-2">Sun Dwell</span>
             <span className="hover:text-dark-green cursor-pointer transition-colors pb-1 border-b-2 border-transparent hover:border-dark-green/30 px-2">Nature Agri</span>
          </div>
          
          <div className="hidden md:flex gap-2">
            <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-dark-green hover:border-dark-green transition-all">
              ←
            </button>
            <button className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-dark-green hover:bg-[#8cc72b] transition-all shadow-sm">
              →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Testimonials;
