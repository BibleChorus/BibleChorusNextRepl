'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface JourneyThemeProps {
  children: React.ReactNode;
}

const darkPalette = {
  bg: '#050505',
  bgAlt: '#0a0a0a',
  bgCard: '#0f0f0f',
  text: '#e5e5e5',
  textSecondary: '#a0a0a0',
  textMuted: '#6f6f6f',
  accent: '#d4af37',
  accentHover: '#e5c349',
  border: 'rgba(255, 255, 255, 0.1)',
  borderHover: 'rgba(255, 255, 255, 0.2)',
  orbPrimary: 'rgba(212, 175, 55, 0.08)',
  orbSecondary: 'rgba(160, 160, 160, 0.05)',
  orbTertiary: 'rgba(229, 229, 229, 0.03)',
  scrollbar: '#333',
  scrollbarTrack: '#0a0a0a',
  selection: '#ffffff',
  selectionText: '#000000',
};

const lightPalette = {
  bg: '#f8f5f0',
  bgAlt: '#f0ede6',
  bgCard: '#ffffff',
  text: '#161616',
  textSecondary: '#4a4a4a',
  textMuted: '#6f6f6f',
  accent: '#bfa130',
  accentHover: '#d4af37',
  border: 'rgba(0, 0, 0, 0.1)',
  borderHover: 'rgba(0, 0, 0, 0.2)',
  orbPrimary: 'rgba(191, 161, 48, 0.06)',
  orbSecondary: 'rgba(100, 100, 100, 0.04)',
  orbTertiary: 'rgba(50, 50, 50, 0.02)',
  scrollbar: '#ccc',
  scrollbarTrack: '#f0ede6',
  selection: '#161616',
  selectionText: '#ffffff',
};

export const JourneyTheme: React.FC<JourneyThemeProps> = ({ children }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const palette = resolvedTheme === 'dark' ? darkPalette : lightPalette;
  const isDark = resolvedTheme === 'dark';

  const cssVariables = `
    :root {
      --journey-bg: ${palette.bg};
      --journey-bg-alt: ${palette.bgAlt};
      --journey-bg-card: ${palette.bgCard};
      --journey-text: ${palette.text};
      --journey-text-secondary: ${palette.textSecondary};
      --journey-text-muted: ${palette.textMuted};
      --journey-accent: ${palette.accent};
      --journey-accent-hover: ${palette.accentHover};
      --journey-border: ${palette.border};
      --journey-border-hover: ${palette.borderHover};
      --journey-orb-primary: ${palette.orbPrimary};
      --journey-orb-secondary: ${palette.orbSecondary};
      --journey-orb-tertiary: ${palette.orbTertiary};
      --journey-scrollbar: ${palette.scrollbar};
      --journey-scrollbar-track: ${palette.scrollbarTrack};
      --journey-selection: ${palette.selection};
      --journey-selection-text: ${palette.selectionText};
    }
  `;

  if (!mounted) {
    return (
      <div 
        className="min-h-screen bg-[#050505]"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {children}
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      <div 
        className="min-h-screen antialiased"
        style={{ 
          fontFamily: "'Manrope', sans-serif",
          backgroundColor: 'var(--journey-bg)',
          color: 'var(--journey-text)',
        }}
        data-journey-theme={isDark ? 'dark' : 'light'}
      >
        <style jsx global>{`
          [data-journey-theme] ::selection {
            background: var(--journey-selection);
            color: var(--journey-selection-text);
          }
          
          [data-journey-theme] ::-webkit-scrollbar {
            width: 6px;
          }
          [data-journey-theme] ::-webkit-scrollbar-track {
            background: var(--journey-scrollbar-track);
          }
          [data-journey-theme] ::-webkit-scrollbar-thumb {
            background: var(--journey-scrollbar);
            border-radius: 3px;
          }
        `}</style>
        {children}
      </div>
    </>
  );
};

export const useJourneyTheme = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const palette = isDark ? darkPalette : lightPalette;
  
  return {
    isDark,
    palette,
  };
};

export { darkPalette, lightPalette };
