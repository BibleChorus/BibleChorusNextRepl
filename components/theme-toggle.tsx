"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: 'transparent',
            borderColor: theme.border,
            color: theme.accent,
          }}
        >
          <Sun 
            className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" 
            style={{ color: theme.accent }}
          />
          <Moon 
            className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" 
            style={{ color: theme.accent }}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
        }}
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="cursor-pointer transition-colors duration-200"
          style={{ color: theme.text }}
        >
          <Sun className="mr-2 h-4 w-4" style={{ color: theme.accent }} />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="cursor-pointer transition-colors duration-200"
          style={{ color: theme.text }}
        >
          <Moon className="mr-2 h-4 w-4" style={{ color: theme.accent }} />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="cursor-pointer transition-colors duration-200"
          style={{ color: theme.text }}
        >
          <span className="mr-2 h-4 w-4 flex items-center justify-center" style={{ color: theme.accent }}>⚙</span>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
