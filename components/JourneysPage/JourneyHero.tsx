'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { JourneyWithSeasons } from '@/types/journey';
import Image from 'next/image';
import { Check, HelpCircle, X } from 'lucide-react';
import { FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }
  }
  
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }
  
  return false;
};

interface JourneyHeroProps {
  journey: JourneyWithSeasons;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const JourneyHero: React.FC<JourneyHeroProps> = ({ journey }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [exportedData, setExportedData] = useState<string>('');

  const [scrollFade, setScrollFade] = useState(1);

  const handleCopyFromModal = async () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      textAreaRef.current.setSelectionRange(0, 99999);
      
      const success = await copyToClipboard(exportedData);
      if (success) {
        setHasCopied(true);
        toast.success('Copied! Paste it into your favorite AI assistant.');
        setTimeout(() => {
          setHasCopied(false);
          setShowCopyModal(false);
        }, 1500);
      } else {
        toast.info('Please use Ctrl+C (or Cmd+C on Mac) to copy the selected text.');
      }
    }
  };

  const handleCopyToClipboard = async () => {
    if (isCopying) return;
    
    setIsCopying(true);
    try {
      const response = await axios.get(`/api/journeys/export-for-llm?username=${journey.username}`);
      const jsonData = JSON.stringify(response.data, null, 2);
      
      const success = await copyToClipboard(jsonData);
      
      if (success) {
        setHasCopied(true);
        toast.success('Journey data copied to clipboard! Paste it into your favorite AI assistant to explore.');
        setTimeout(() => setHasCopied(false), 3000);
      } else {
        setExportedData(jsonData);
        setShowCopyModal(true);
      }
    } catch (error) {
      console.error('Error copying journey data:', error);
      toast.error('Failed to fetch journey data');
    } finally {
      setIsCopying(false);
    }
  };

  useEffect(() => {
    const updateScrollFade = () => {
      if (!heroRef.current || !hasAnimatedIn) return;
      const heroHeight = heroRef.current.offsetHeight;
      const scrolled = window.scrollY;
      const fadeStart = heroHeight * 0.1;
      const fadeEnd = heroHeight * 0.7;
      
      if (scrolled <= fadeStart) {
        setScrollFade(1);
      } else if (scrolled >= fadeEnd) {
        setScrollFade(0);
      } else {
        const progress = (scrolled - fadeStart) / (fadeEnd - fadeStart);
        setScrollFade(1 - progress);
      }
    };

    window.addEventListener('scroll', updateScrollFade, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollFade);
  }, [hasAnimatedIn]);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setHasAnimatedIn(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgAlt: isDark ? '#0a0a0a' : '#f0ede6',
    bgCard: isDark ? '#0f0f0f' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
  };

  const totalSongs = journey.seasons.reduce((acc, season) => acc + (season.songs?.length || 0), 0);
  const totalSeasons = journey.seasons.length;

  const backgroundImageUrl = journey.cover_image_url 
    ? journey.cover_image_url 
    : null;

  const titleWords = journey.title.split(' ');
  const firstWord = titleWords.length > 1 ? titleWords[0] : 'The';
  const restWords = titleWords.length > 1 ? titleWords.slice(1).join(' ') : journey.title;

  if (!mounted) {
    return (
      <div 
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#050505' }}
      />
    );
  }

  return (
    <motion.div 
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
    >
      {backgroundImageUrl && (
        <div className="absolute inset-0">
          <Image
            src={backgroundImageUrl}
            alt={journey.title}
            fill
            className="object-cover grayscale opacity-30"
            priority
          />
        </div>
      )}
      
      <div 
        className="absolute inset-0" 
        style={{ background: `linear-gradient(to top, ${theme.bg}, transparent, transparent)` }} 
      />
      <div 
        className="absolute inset-0" 
        style={{ background: `linear-gradient(to bottom, ${theme.bg}80, transparent, transparent)` }} 
      />
      
      <motion.div 
        className="relative z-10 container mx-auto px-6 text-center pt-24"
        style={{ 
          opacity: hasAnimatedIn ? scrollFade : 1,
          transform: hasAnimatedIn ? `translateY(${(1 - scrollFade) * -50}px)` : 'translateY(0px)',
          transition: 'opacity 0.15s ease-out, transform 0.15s ease-out'
        }}
      >
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.1 }}
        >
          <span 
            className="text-xs md:text-sm tracking-[0.5em] uppercase transition-colors duration-300"
            style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
          >
            A Sonic Archive
          </span>
        </motion.div>
        
        <motion.h1 
          className="mb-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.2 }}
        >
          <span 
            className="block text-6xl md:text-9xl tracking-tight transition-colors duration-300"
            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
          >
            {firstWord}
          </span>
          <span 
            className="block text-6xl md:text-9xl tracking-tight italic transition-colors duration-300"
            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
          >
            {restWords}
          </span>
        </motion.h1>
        
        {journey.subtitle && (
          <motion.p 
            className="text-sm md:text-base font-light max-w-xl mx-auto leading-relaxed mb-10 transition-colors duration-300"
            style={{ fontFamily: "'Manrope', sans-serif", color: `${theme.text}cc` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.4 }}
          >
            {journey.subtitle}
          </motion.p>
        )}
        
        <motion.div 
          className="flex items-center justify-center gap-4 sm:gap-8 px-4 transition-colors duration-300"
          style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-sm" 
              style={{ color: theme.accent }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 20 }}
            >
              {totalSongs}
            </motion.span>
            <span className="text-xs tracking-[0.2em] uppercase">Songs</span>
          </div>
          <div className="w-px h-4" style={{ backgroundColor: `${theme.textSecondary}4d` }} />
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-sm" 
              style={{ color: theme.accent }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 20 }}
            >
              {totalSeasons}
            </motion.span>
            <span className="text-xs tracking-[0.2em] uppercase">Seasons</span>
          </div>
          <div className="w-px h-4" style={{ backgroundColor: `${theme.textSecondary}4d` }} />
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.2em] uppercase">By {journey.username}</span>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center justify-center gap-3 mt-8 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.55 }}
        >
          <button
            onClick={handleCopyToClipboard}
            disabled={isCopying}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs tracking-[0.15em] uppercase transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: `${theme.accent}15`,
              color: theme.accent,
              border: `1px solid ${theme.accent}33`,
            }}
            title="Copy journey data to clipboard for AI exploration"
          >
            {hasCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : isCopying ? (
              <>
                <motion.div
                  className="w-3.5 h-3.5 border-2 rounded-full"
                  style={{ borderColor: `${theme.accent}33`, borderTopColor: theme.accent }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Copying...</span>
              </>
            ) : (
              <>
                <FaCopy className="w-3.5 h-3.5" />
                <span>Copy for AI</span>
              </>
            )}
          </button>

          {journey.notebook_lm_url && (
            <a
              href={journey.notebook_lm_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs tracking-[0.15em] uppercase transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: `${theme.accent}15`,
                color: theme.accent,
                border: `1px solid ${theme.accent}33`,
              }}
              title="Explore this journey in Google NotebookLM"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-3.5 h-3.5"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span>NotebookLM</span>
              <FaExternalLinkAlt className="w-2.5 h-2.5" />
            </a>
          )}

          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 hover:scale-110"
            style={{ 
              backgroundColor: `${theme.textSecondary}10`,
              color: theme.textSecondary,
            }}
            title="Learn about AI features"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </motion.div>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
                className="relative max-w-md w-full p-6"
                style={{ 
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowHelp(false)}
                  className="absolute top-4 right-4 p-1 transition-colors duration-200"
                  style={{ color: theme.textSecondary }}
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 
                  className="text-xl mb-6"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  AI Features
                </h3>

                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${theme.accent}15` }}
                    >
                      <FaCopy className="w-4 h-4" style={{ color: theme.accent }} />
                    </div>
                    <div>
                      <h4 
                        className="text-sm font-medium mb-1.5"
                        style={{ color: theme.text }}
                      >
                        Copy for AI
                      </h4>
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                      >
                        Copies the entire journey to your clipboard in a format ready for AI assistants like ChatGPT, Claude, or Gemini. Includes all seasons, songs, important dates, and Bible verses in the LSB translation.
                      </p>
                    </div>
                  </div>

                  {journey.notebook_lm_url && (
                    <div className="flex gap-4">
                      <div 
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${theme.accent}15` }}
                      >
                        <svg 
                          viewBox="0 0 24 24" 
                          className="w-4 h-4"
                          fill={theme.accent}
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 
                          className="text-sm font-medium mb-1.5"
                          style={{ color: theme.text }}
                        >
                          NotebookLM
                        </h4>
                        <p 
                          className="text-sm leading-relaxed"
                          style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                        >
                          Opens Google NotebookLM, where the journey creator has set up an AI-powered notebook. Ask questions, generate summaries, or explore connections across the journey&apos;s songs and scripture.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full mt-6 py-2.5 text-xs tracking-[0.15em] uppercase transition-all duration-300"
                  style={{ 
                    backgroundColor: `${theme.accent}15`,
                    color: theme.accent,
                    border: `1px solid ${theme.accent}33`,
                  }}
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCopyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
              onClick={() => setShowCopyModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
                className="relative max-w-2xl w-full p-6 max-h-[80vh] flex flex-col"
                style={{ 
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="absolute top-4 right-4 p-1 transition-colors duration-200"
                  style={{ color: theme.textSecondary }}
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 
                  className="text-xl mb-2"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  Copy Journey Data
                </h3>
                
                <p 
                  className="text-sm mb-4"
                  style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                >
                  Select all the text below and copy it (Ctrl+C or Cmd+C), then paste into your AI assistant.
                </p>

                <textarea
                  ref={textAreaRef}
                  readOnly
                  value={exportedData}
                  className="flex-1 min-h-[300px] p-4 text-xs font-mono resize-none focus:outline-none"
                  style={{ 
                    backgroundColor: theme.bgAlt,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                  }}
                  onClick={(e) => {
                    (e.target as HTMLTextAreaElement).select();
                  }}
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCopyFromModal}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs tracking-[0.15em] uppercase transition-all duration-300"
                    style={{ 
                      backgroundColor: theme.accent,
                      color: theme.bg,
                    }}
                  >
                    {hasCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <FaCopy className="w-3.5 h-3.5" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCopyModal(false)}
                    className="px-6 py-2.5 text-xs tracking-[0.15em] uppercase transition-all duration-300"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: theme.textSecondary,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {journey.bio && (
          <motion.div
            className="mt-16 max-w-2xl mx-auto transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.6 }}
          >
            <div 
              className="relative px-8 py-6"
              style={{ 
                borderLeft: `1px solid ${theme.accent}33`,
                borderRight: `1px solid ${theme.accent}33`,
              }}
            >
              <div 
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-4"
                style={{ backgroundColor: theme.bg }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-px" style={{ backgroundColor: theme.accent }} />
                  <div 
                    className="w-1.5 h-1.5 rotate-45"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <div className="w-8 h-px" style={{ backgroundColor: theme.accent }} />
                </div>
              </div>
              
              <div className="space-y-6">
                {journey.bio.split(/\*{3,}|\n{2,}/).filter(section => section.trim()).map((section, index, arr) => (
                  <div key={index}>
                    <p
                      className="text-sm leading-[1.9] transition-colors duration-300"
                      style={{ 
                        fontFamily: "'Manrope', sans-serif", 
                        color: `${theme.textSecondary}cc`,
                        textAlign: 'center'
                      }}
                    >
                      {section.trim()}
                    </p>
                    {index < arr.length - 1 && (
                      <div className="flex items-center justify-center gap-3 mt-6">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: `${theme.accent}66` }} />
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.accent }} />
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: `${theme.accent}66` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div 
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4"
                style={{ backgroundColor: theme.bg }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-px" style={{ backgroundColor: theme.accent }} />
                  <div 
                    className="w-1.5 h-1.5 rotate-45"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <div className="w-8 h-px" style={{ backgroundColor: theme.accent }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      <motion.div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{ 
          opacity: hasAnimatedIn ? scrollFade : 0,
          transition: 'opacity 0.15s ease-out'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5 transition-colors duration-300"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <motion.div 
            className="w-1 h-1.5 rounded-full transition-colors duration-300"
            style={{ backgroundColor: `${theme.text}66` }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
