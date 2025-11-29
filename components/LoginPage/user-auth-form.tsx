"use client"

import * as React from "react"
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from 'next-auth/react';

interface Theme {
  bg: string;
  bgCard: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  border: string;
  borderHover: string;
  hoverBg: string;
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  isLogin: boolean
  onLoginSuccess?: () => void
  theme?: Theme
}

export function UserAuthForm({ className, isLogin, onLoginSuccess, theme, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()
  const { login } = useAuth();

  const defaultTheme: Theme = {
    bg: '#050505',
    bgCard: '#0a0a0a',
    text: '#e5e5e5',
    textSecondary: '#a0a0a0',
    accent: '#d4af37',
    accentHover: '#e5c349',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(212, 175, 55, 0.3)',
    hoverBg: 'rgba(255, 255, 255, 0.03)',
  }

  const t = theme || defaultTheme;

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const target = event.target as typeof event.target & {
      email: { value: string }
      password: { value: string }
      username?: { value: string }
    }

    const email = target.email.value
    const password = target.password.value
    const username = target.username?.value

    try {
      const response = await fetch(`/api/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email, password } : { username, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      login(data.user, data.token)
      router.push('/')

      if (isLogin && onLoginSuccess) {
        onLoginSuccess()
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setError((error as Error).message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: `1px solid ${t.border}`,
    color: t.text,
    fontFamily: "'Manrope', sans-serif",
    fontSize: '14px',
    padding: '12px 16px',
    borderRadius: '0',
    transition: 'all 0.3s ease',
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          {!isLogin && (
            <div className="grid gap-1">
              <Label 
                className="sr-only" 
                htmlFor="username"
              >
                Username
              </Label>
              <input
                id="username"
                placeholder="Username"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={isLoading}
                style={inputStyle}
                className="focus:outline-none placeholder:text-[#6f6f6f]"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = t.borderHover;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = t.border;
                }}
              />
            </div>
          )}
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">Email</Label>
            <input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              style={inputStyle}
              className="focus:outline-none placeholder:text-[#6f6f6f]"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = t.borderHover;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = t.border;
              }}
            />
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">Password</Label>
            <input
              id="password"
              placeholder="Password"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isLoading}
              style={inputStyle}
              className="focus:outline-none placeholder:text-[#6f6f6f]"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = t.borderHover;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = t.border;
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300 flex items-center justify-center"
            style={{
              backgroundColor: t.accent,
              color: t.bg,
              border: 'none',
              fontFamily: "'Manrope', sans-serif",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = t.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = t.accent;
            }}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span 
            className="w-full" 
            style={{ borderTop: `1px solid ${t.border}` }}
          />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span 
            className="px-2 tracking-[0.15em]"
            style={{ 
              backgroundColor: t.bgCard, 
              color: t.textSecondary,
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            Or continue with
          </span>
        </div>
      </div>
      
      <button
        type="button"
        disabled={isLoading}
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="h-12 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300 flex items-center justify-center gap-3"
        style={{
          backgroundColor: 'transparent',
          color: t.textSecondary,
          border: `1px solid ${t.border}`,
          fontFamily: "'Manrope', sans-serif",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = t.borderHover;
          e.currentTarget.style.color = t.text;
          e.currentTarget.style.backgroundColor = t.hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = t.border;
          e.currentTarget.style.color = t.textSecondary;
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {isLoading ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="h-4 w-4" />
        )}
        Google
      </button>

      {error && (
        <p 
          className="text-sm mt-2 text-center"
          style={{ color: '#ef4444' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
