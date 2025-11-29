"use client"

import { useState } from 'react'
import { useRouter } from 'next/router'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from 'next-themes'

export function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()
  const { resolvedTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    borderFocus: isDark ? 'rgba(212, 175, 55, 0.5)' : 'rgba(191, 161, 48, 0.5)',
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push({
        pathname: '/listen',
        query: { search: searchTerm.trim() },
      })
      setSearchTerm('')
    }
  }

  const isSmallScreen = useMediaQuery('(max-width: 768px)')
  const placeholderText = isSmallScreen
    ? 'Search...'
    : 'Search songs by passage, lyrics, AI prompt, genre...'

  return (
    <form onSubmit={handleSearch} className="w-full max-w-md">
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300"
          style={{ 
            color: isFocused ? theme.accent : theme.textSecondary 
          }}
        />
        <Input
          type="text"
          placeholder={placeholderText}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-10 pr-4 py-2 w-full transition-all duration-300"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: isFocused ? theme.borderFocus : theme.border,
            color: theme.text,
            boxShadow: isFocused ? `0 0 0 2px ${theme.borderHover}` : 'none',
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 md:hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Search 
                  className="h-5 w-5 transition-colors duration-300" 
                  style={{ color: theme.textSecondary }}
                />
              </TooltipTrigger>
              <TooltipContent
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.border,
                  color: theme.text,
                }}
              >
                <p>Search songs by passage, lyrics, AI prompt, genre...</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </form>
  )
}
