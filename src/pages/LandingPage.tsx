import React, { useLayoutEffect, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Navbar, 
  Hero, 
  LogoTicker, 
  IntroStatement, 
  Solutions, 
  FeaturesTab, 
  ModernFarmingCards, 
  Testimonials, 
  FAQ, 
  CTA, 
  Footer 
} from '../components/landingpage';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const LandingPage: React.FC = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPWA] = useState(() => 
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone || 
    document.referrer.includes('android-app://')
  );

  useEffect(() => {
    if (isPWA && !isLoading) {
      if (isAuthenticated) {
        navigate('/home', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [isPWA, isLoading, isAuthenticated, navigate]);

  useLayoutEffect(() => {
    if (isPWA) return; // Skip animations for PWA since we will redirect

    // A simple context to clean up animations when component unmounts
    const ctx = gsap.context(() => {
      
      // Hero Animation - Fade in content
      gsap.fromTo('.hero-content', 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.2 }
      );

      // Scroll Animations for sections
      const sections = gsap.utils.toArray<HTMLElement>('.animate-section');
      
      sections.forEach((section) => {
        gsap.fromTo(section,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%", // Trigger when top of section hits 80% down the viewport
              toggleActions: "play none none reverse"
            }
          }
        );
      });

    }, mainRef);

    return () => ctx.revert(); // Cleanup on unmount
  }, [isPWA]);

  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);

  if (isPWA) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div ref={mainRef} className="bg-light-gray min-h-screen text-dark-green font-sans overflow-x-hidden">
      <Navbar onContactClick={openContactModal} />
      
      <main>
        {/* We wrap sections in divs with 'animate-section' to target them easily with GSAP */}
        <section className="hero-content">
          <Hero />
        </section>
        
        <section className="animate-section">
          <LogoTicker />
        </section>
        
        <section className="animate-section">
          <IntroStatement />
        </section>
        
        <section className="animate-section">
          <Solutions />
        </section>
        
        <section className="animate-section">
          <FeaturesTab />
        </section>
        
        <section className="animate-section">
          <ModernFarmingCards />
        </section>
        
        <section className="animate-section">
          <Testimonials />
        </section>
        
        <section className="animate-section">
          <FAQ />
        </section>
        
        <section className="animate-section">
          <CTA onContactClick={openContactModal} />
        </section>
      </main>

      <Footer />

      {isContactModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close contact form"
            onClick={closeContactModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative z-[71] w-full max-w-lg rounded-3xl border border-white/15 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-dark-green">Contact Us</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Share your details and our team will get in touch.
                </p>
              </div>
              <button
                type="button"
                onClick={closeContactModal}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition-colors focus:border-dark-green/60"
                  placeholder="Enter your name"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition-colors focus:border-dark-green/60"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition-colors focus:border-dark-green/60"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition-colors focus:border-dark-green/60"
                  placeholder="Tell us what support you need"
                />
              </div>
              <button
                type="button"
                className="w-full rounded-xl bg-dark-green px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                Submit Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
