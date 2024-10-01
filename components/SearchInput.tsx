"use client"

import { useState } from 'react'
import { useRouter } from 'next/router'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Navigate to /listen with the search query
      router.push({
        pathname: '/listen',
        query: { search: searchTerm.trim() },
      })
      setSearchTerm('')
    }
  }

  const isSmallScreen = useMediaQuery('(max-width: 768px)')
  const placeholderText = isSmallScreen
    ? 'Search songs...'
    : 'Search songs by passage, lyrics, AI prompt, genre...'

  return (
    <form onSubmit={handleSearch} className="w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholderText}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
        />
        {/* Tooltip for mobile views */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 md:hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Search className="h-5 w-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Search songs by passage, lyrics, AI prompt, genre...</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </form>
  )
}