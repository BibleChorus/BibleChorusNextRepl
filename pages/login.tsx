import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from 'next/router'

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { UserAuthForm } from "@/components/LoginPage/user-auth-form"
import { ScriptureScroll } from "@/components/LoginPage/scripture-scroll"
import { TermsDialog } from "@/components/LoginPage/terms-dialog"
import { PrivacyDialog } from "@/components/LoginPage/privacy-dialog"

// Define metadata as a constant (not exported)
const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
}

export default function AuthenticationPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    const view = router.query.view as string
    if (view === 'signup') {
      setIsLogin(false)
    } else if (view === 'login') {
      setIsLogin(true)
    }
  }, [router.query.view])

  useEffect(() => {
    // Check if there's a redirect path stored
    const redirectPath = localStorage.getItem('loginRedirectPath')
    if (redirectPath) {
      // Remove it from storage
      localStorage.removeItem('loginRedirectPath')
      // Store it in state or ref to use after successful login
      setRedirectPath(redirectPath)
    }
  }, [])

  const toggleView = () => {
    setIsLogin(!isLogin)
    router.push(`/login?view=${isLogin ? 'signup' : 'login'}`, undefined, { shallow: true })
  }

  const handleLoginSuccess = () => {
    if (redirectPath) {
      router.push(redirectPath)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="container relative min-h-screen flex flex-col items-center justify-center lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-2 top-2 md:right-4 md:top-4"
        )}
      >
        Home
      </Link>
      <div className="relative hidden h-full flex-col bg-lavender-100 dark:bg-zinc-800 p-10 text-gray-800 dark:text-white dark:border-r lg:flex rounded-lg">
        <div className="absolute inset-0 bg-lavender-100 dark:bg-zinc-800 rounded-lg" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Image
            src="/biblechorus-icon.png"
            alt="BibleChorus"
            width={40}
            height={40}
            className="mr-2"
          />
          BibleChorus
        </div>
        <div className="relative z-20 flex-grow mt-4" style={{ height: 'calc(100% - 60px)' }}>
          <ScriptureScroll />
        </div>
      </div>
      <div className="w-full px-2 sm:px-4 md:px-6 lg:p-8 xl:p-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isLogin ? "Sign in to your account" : "Create an account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin 
                ? "Enter your email below to sign in to your account"
                : "Enter your details below to create your account"}
            </p>
          </div>
          <UserAuthForm isLogin={isLogin} onLoginSuccess={handleLoginSuccess} />
          <p className="px-8 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleView}
              className="underline underline-offset-4 hover:text-primary"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <TermsDialog>
              <button className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </button>
            </TermsDialog>
            {" "}and{" "}
            <PrivacyDialog>
              <button className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </button>
            </PrivacyDialog>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
