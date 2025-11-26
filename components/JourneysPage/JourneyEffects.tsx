'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export const FilmGrain: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50 opacity-[0.04]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  );
};

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

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
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleHoverStart);
    document.addEventListener('mouseout', handleHoverEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleHoverStart);
      document.removeEventListener('mouseout', handleHoverEnd);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999]"
        animate={{ x: position.x - 4, y: position.y - 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
      />
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] border border-white/50"
        animate={{ 
          x: position.x - (isHovering ? 30 : 20), 
          y: position.y - (isHovering ? 30 : 20),
          width: isHovering ? 60 : 40,
          height: isHovering ? 60 : 40,
          backgroundColor: isHovering ? 'rgba(255,255,255,0.1)' : 'transparent',
          borderColor: isHovering ? 'transparent' : 'rgba(255,255,255,0.5)'
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        style={{ backdropFilter: isHovering ? 'blur(2px)' : 'none' }}
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
          background: 'rgba(88, 28, 135, 0.2)',
          filter: 'blur(100px)'
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
          background: 'rgba(30, 58, 138, 0.1)',
          filter: 'blur(100px)'
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </>
  );
};

interface ScrollProgressProps {
  containerRef?: React.RefObject<HTMLElement>;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({ containerRef }) => {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

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
        fontFamily: "'Manrope', sans-serif",
        cursor: 'none'
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
