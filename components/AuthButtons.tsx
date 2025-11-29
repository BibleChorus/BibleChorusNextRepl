import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from "@/components/icons";
import { useTheme } from 'next-themes';

export function AuthButtons() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
  };

  return (
    <div className="flex space-x-2">
      <Link href="/login?view=login">
        <Button 
          variant="outline" 
          className="sm:w-auto transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: 'transparent',
            borderColor: theme.border,
            color: theme.text,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.borderHover;
            e.currentTarget.style.color = theme.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.color = theme.text;
          }}
        >
          <Icons.login className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Login</span>
        </Button>
      </Link>
      <Link href="/login?view=signup">
        <Button 
          className="sm:w-auto transition-all duration-300 hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
            color: isDark ? '#050505' : '#ffffff',
            border: 'none',
          }}
        >
          <Icons.userPlus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Sign Up</span>
        </Button>
      </Link>
    </div>
  );
}
