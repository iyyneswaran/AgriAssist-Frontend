import React, { useLayoutEffect, useRef } from 'react';
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
} from './components';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const App: React.FC = () => {
  const mainRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
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
  }, []);

  return (
    <div ref={mainRef} className="bg-light-gray min-h-screen text-dark-green font-sans overflow-x-hidden">
      <Navbar />
      
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
          <CTA />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;
