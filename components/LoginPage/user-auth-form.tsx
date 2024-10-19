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

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  isLogin: boolean
}

export function UserAuthForm({ className, isLogin, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
  })
  const router = useRouter()
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        // Check if both user and token are present in the response
        if (data.user && data.token) {
          login(data.user, data.token);
          router.push('/profile')
        } else {
          console.error('Invalid response format')
        }
      } else {
        console.error('Authentication failed')
      }
    } catch (error) {
      console.error('Error during authentication:', error)
    }

    setIsLoading(false)
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          {!isLogin && (
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Username"
                type="text"
                autoCapitalize="words"
                autoComplete="username"
                autoCorrect="off"
                disabled={isLoading}
                onChange={handleInputChange}
              />
            </div>
          )}
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="Password"
              type="password"
              autoCapitalize="none"
              autoComplete={isLogin ? "current-password" : "new-password"}
              autoCorrect="off"
              disabled={isLoading}
              onChange={handleInputChange}
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={isLoading} onClick={() => signIn('google')}>
        {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : <Icons.google className="mr-2 h-4 w-4" />}
        Google
      </Button>
    </div>
  )
}
