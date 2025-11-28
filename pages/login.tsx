import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Sparkles, LogIn, UserPlus, ArrowLeft } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/24 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/24">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/[0.08] via-purple-400/[0.06] to-pink-400/[0.08] dark:from-indigo-400/[0.13] dark:via-purple-400/[0.1] dark:to-pink-400/[0.13]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
      </div>

      {/* Home Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-4 right-4 z-50"
      >
        <Link
          href="/"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/12 dark:border-slate-700/40 rounded-xl shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 hover:scale-105 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </motion.div>

      <div className="container relative min-h-screen flex flex-col items-center justify-center lg:grid lg:max-w-none lg:grid-cols-2 lg:px-4">
        
        {/* Left Panel - Scripture Scroll */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative hidden h-full flex-col p-10 text-slate-800 dark:text-white lg:flex"
        >
          <div className="absolute inset-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl shadow-2xl" />
          
          {/* Logo and Brand */}
          <div className="relative z-20 flex items-center text-xl font-bold mb-8">
            <div className="p-2 bg-gradient-to-br from-indigo-400/12 to-purple-400/12 rounded-2xl backdrop-blur-sm border border-indigo-400/14 dark:border-indigo-400/18 mr-3">
              <Image
                src="/biblechorus-icon.png"
                alt="BibleChorus"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              BibleChorus
            </span>
          </div>

          {/* Scripture Scroll Container */}
          <div className="relative z-20 flex-grow overflow-hidden rounded-2xl">
            <ScriptureScroll />
          </div>

        </motion.div>

        {/* Right Panel - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full px-4 sm:px-6 lg:p-8 xl:p-12 relative z-10"
        >
          <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
            
            {/* Enhanced Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col space-y-6 text-center"
            >
              {/* Badge */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-400/12 via-purple-400/12 to-pink-400/12 dark:from-indigo-400/16 dark:via-purple-400/16 dark:to-pink-400/16 backdrop-blur-md border border-indigo-400/14 dark:border-indigo-400/18 shadow-lg">
                  <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent font-semibold">
                    Welcome to BibleChorus
                  </span>
                </span>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                <span className="block text-slate-900 dark:text-white mb-2">
                  {isLogin ? "Welcome" : "Join Our"}
                </span>
                <span className="block relative">
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    {isLogin ? "Back" : "Community"}
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full scale-x-0 animate-scale-x"></div>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                {isLogin 
                  ? "Sign in to continue your journey with Bible-inspired music"
                  : "Create your account and discover a world of spiritual melodies"}
              </p>
            </motion.div>

            {/* Enhanced Form Container */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl shadow-2xl p-8"
            >
              <UserAuthForm isLogin={isLogin} onLoginSuccess={handleLoginSuccess} />
            </motion.div>

            {/* Enhanced Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="space-y-6"
            >
              {/* Toggle View */}
              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </p>
                <button
                  onClick={toggleView}
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-400/14 to-purple-400/14 hover:from-indigo-400/18 hover:to-purple-400/18 dark:from-indigo-400/18 dark:to-purple-400/18 dark:hover:from-indigo-400/22 dark:hover:to-purple-400/22 backdrop-blur-sm border border-indigo-400/16 dark:border-indigo-400/18 rounded-xl transition-all duration-300 hover:scale-105 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  {isLogin ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isLogin ? "Create Account" : "Sign In"}
                </button>
              </div>

              {/* Terms and Privacy */}
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                By continuing, you agree to our{" "}
                <TermsDialog>
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2 font-medium transition-colors">
                    Terms of Service
                  </button>
                </TermsDialog>
                {" "}and{" "}
                <PrivacyDialog>
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2 font-medium transition-colors">
                    Privacy Policy
                  </button>
                </PrivacyDialog>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
