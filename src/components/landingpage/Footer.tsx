import React from 'react';
import { Sprout, Mail, Twitter, Linkedin, Github } from 'lucide-react';

const Footer: React.FC = () => {
   return (
      <footer className="w-full bg-white pb-6 pt-12 relative overflow-hidden">

         {/* Background Image Container */}
         <div className="absolute inset-0 bottom-0 z-0 h-full w-full">
            <img
               src="https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=2070&auto=format&fit=crop"
               alt="Farm landscape"
               className="w-full h-full object-cover object-bottom"
            />
         </div>

         <div className="container mx-auto px-8 relative z-10">
            <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-12 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border border-white/50">

               <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 border-b border-gray-100 pb-12">

                  {/* Brand Column */}
                  <div className="md:col-span-5 lg:col-span-4 flex flex-col items-start">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="bg-brand-green text-dark-green p-1.5 rounded-lg flex items-center justify-center">
                           <Sprout size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl font-bold text-dark-green tracking-tight">AgriAssist</span>
                     </div>

                     <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
                        AgriAssist empowers farmers with smart tools for better yields and sustainable growth.
                     </p>

                     <div className="flex items-center gap-2 text-sm font-medium text-dark-green mb-8">
                        <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
                           <Mail size={14} className="text-gray-500" />
                        </div>
                        hello@agrovia.com
                     </div>

                     <div className="w-full">
                        <h4 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wider">Social Media</h4>
                        <div className="flex items-center gap-3">
                           <a href="#" className="w-9 h-9 rounded-full bg-light-gray flex items-center justify-center text-gray-600 hover:bg-brand-green hover:text-dark-green transition-colors">
                              <Twitter size={16} />
                           </a>
                           <a href="#" className="w-9 h-9 rounded-full bg-light-gray flex items-center justify-center text-gray-600 hover:bg-brand-green hover:text-dark-green transition-colors">
                              <Linkedin size={16} />
                           </a>
                           <a href="#" className="w-9 h-9 rounded-full bg-light-gray flex items-center justify-center text-gray-600 hover:bg-brand-green hover:text-dark-green transition-colors">
                              <Github size={16} />
                           </a>
                        </div>
                     </div>
                  </div>

                  {/* Spacer */}
                  <div className="hidden lg:block lg:col-span-2"></div>

                  {/* Links Columns */}
                  <div className="md:col-span-7 lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">

                     <div>
                        <h4 className="text-sm font-bold text-dark-green mb-6">Quick Links</h4>
                        <ul className="flex flex-col gap-4 text-sm text-gray-500 font-medium">
                           <li><a href="#" className="hover:text-brand-green transition-colors">Home</a></li>
                           <li><a href="#" className="hover:text-brand-green transition-colors">About</a></li>
                           <li><a href="#" className="hover:text-brand-green transition-colors">Services</a></li>
                           <li><a href="#" className="hover:text-brand-green transition-colors">Contact</a></li>
                        </ul>
                     </div>

                     <div>
                        <h4 className="text-sm font-bold text-dark-green mb-6">Services</h4>
                        <ul className="flex flex-col gap-4 text-sm text-gray-500 font-medium">
                           <li><a href="#" className="hover:text-brand-green transition-colors">Smart Crop Monitoring</a></li>
                           <li><a href="#" className="hover:text-brand-green transition-colors">Precision Irrigation Systems</a></li>
                           <li><a href="#" className="hover:text-brand-green transition-colors">Soil & Weather Analytics</a></li>
                           <li><a href="#" className="hover:text-brand-green transition-colors">Maintenance & Support</a></li>
                        </ul>
                     </div>

                     <div>
                        <h4 className="text-sm font-bold text-dark-green mb-6">Company</h4>
                        <ul className="flex flex-col gap-4 text-sm text-gray-500 font-medium">
                           <li><a href="#" className="hover:text-brand-green transition-colors">Contact Us</a></li>
                           <li><a href="#" className="hover:text-brand-green transition-colors">Emergency Help</a></li>
                           <li><a href="#" className="hover:text-brand-green transition-colors">FAQ</a></li>
                           <li><a href="#" className="hover:text-brand-green transition-colors">Privacy Policy</a></li>
                        </ul>
                     </div>

                  </div>
               </div>

               <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-4">
                  <p className="text-xs font-semibold text-gray-400 mb-4 md:mb-0">
                     © 2024 AgriAssist. All rights reserved.
                  </p>
                  <div className="flex items-center gap-6 text-xs font-semibold text-gray-400">
                     <a href="#" className="hover:text-dark-green transition-colors">Terms of Service</a>
                     <a href="#" className="hover:text-dark-green transition-colors">Privacy Policy</a>
                  </div>
               </div>

            </div>
         </div>
      </footer>
   );
};

export default Footer;
