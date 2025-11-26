'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export const FilmGrain: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  );
};

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    
    if (isTouch) return;

    setPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    
    document.body.classList.add('journey-cursor-active');

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleHoverStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-hover]') ||
        target.closest('.track-row') ||
        target.closest('.hover-trigger')
      ) {
        setIsHovering(true);
      }
    };

    const handleHoverEnd = () => setIsHovering(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleHoverStart);
    document.addEventListener('mouseout', handleHoverEnd);

    return () => {
      document.body.classList.remove('journey-cursor-active');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleHoverStart);
      document.removeEventListener('mouseout', handleHoverEnd);
    };
  }, []);

  if (!isClient || isTouchDevice) return null;

  return (
    <>
      <style jsx global>{`
        .journey-cursor-active,
        .journey-cursor-active *:not([data-journey-dialog]):not([data-journey-dialog] *) {
          cursor: none !important;
        }
        [data-journey-dialog],
        [data-journey-dialog] * {
          cursor: auto !important;
        }
      `}</style>
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-gold rounded-full pointer-events-none z-[9999]"
        initial={false}
        animate={{ 
          x: position.x - 6, 
          y: position.y - 6,
          opacity: 1
        }}
        transition={{ type: 'spring', stiffness: 800, damping: 35, mass: 0.3 }}
      />
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] border"
        initial={false}
        animate={{ 
          x: position.x - (isHovering ? 30 : 18), 
          y: position.y - (isHovering ? 30 : 18),
          width: isHovering ? 60 : 36,
          height: isHovering ? 60 : 36,
          opacity: 1,
          backgroundColor: isHovering ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
          borderColor: isHovering ? 'rgba(212, 175, 55, 0.5)' : 'rgba(229, 229, 229, 0.3)'
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      />
    </>
  );
};

export const AmbientOrbs: React.FC = () => {
  return (
    <>
      <motion.div 
        className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none z-[-1]"
        style={{
          background: 'rgba(212, 175, 55, 0.08)',
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none z-[-1]"
        style={{
          background: 'rgba(160, 160, 160, 0.05)',
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div 
        className="fixed top-1/2 right-1/4 w-72 h-72 rounded-full pointer-events-none z-[-1]"
        style={{
          background: 'rgba(229, 229, 229, 0.03)',
          filter: 'blur(100px)'
        }}
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
    </>
  );
};

interface ScrollProgressProps {
  containerRef?: React.RefObject<HTMLElement>;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = () => {
  const { scrollYProgress } = useScroll();

  const height = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const smoothHeight = useSpring(height, { stiffness: 100, damping: 30 });

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 h-64 w-[1px] bg-white/10 hidden lg:block z-30">
      <motion.div 
        className="w-full bg-white origin-top"
        style={{ height: smoothHeight }}
      />
    </div>
  );
};

interface JourneyLayoutWrapperProps {
  children: React.ReactNode;
}

export const JourneyLayoutWrapper: React.FC<JourneyLayoutWrapperProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#050505] text-silk font-sans antialiased selection:bg-white selection:text-black"
      style={{ 
        fontFamily: "'Manrope', sans-serif"
      }}
    >
      <style jsx global>{`
        .journey-page ::-webkit-scrollbar {
          width: 6px;
        }
        .journey-page ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .journey-page ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }
        .journey-page .reveal-text {
          opacity: 0;
          transform: translateY(30px);
        }
        .journey-page .reveal-text.visible {
          opacity: 1;
          transform: translateY(0);
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .journey-page .reveal-image-container {
          overflow: hidden;
          position: relative;
        }
        .journey-page .reveal-image {
          transform: scale(1.1);
          transition: transform 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .journey-page .reveal-image-container.visible .reveal-image {
          transform: scale(1);
        }
      `}</style>
      
      <FilmGrain />
      <CustomCursor />
      <AmbientOrbs />
      <ScrollProgress containerRef={containerRef as React.RefObject<HTMLElement>} />
      
      <div className="journey-page">
        {children}
      </div>
    </div>
  );
};
