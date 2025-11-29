import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Sparkles, LogIn, UserPlus, ArrowLeft } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { UserAuthForm } from "@/components/LoginPage/user-auth-form"
import { ScriptureScroll } from "@/components/LoginPage/scripture-scroll"
import { TermsDialog } from "@/components/LoginPage/terms-dialog"
import { PrivacyDialog } from "@/components/LoginPage/privacy-dialog"

const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
}

const FilmGrainOverlay: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-[0.015]"
      style={{
        zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  );
};

interface AmbientOrbsOverlayProps {
  isDark: boolean;
}

const AmbientOrbsOverlay: React.FC<AmbientOrbsOverlayProps> = ({ isDark }) => {
  const orbColors = {
    primary: isDark ? 'rgba(212, 175, 55, 0.06)' : 'rgba(191, 161, 48, 0.05)',
    secondary: isDark ? 'rgba(160, 160, 160, 0.04)' : 'rgba(100, 100, 100, 0.03)',
    tertiary: isDark ? 'rgba(229, 229, 229, 0.02)' : 'rgba(50, 50, 50, 0.02)',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full"
        style={{
          background: orbColors.primary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: orbColors.secondary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div 
        className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full"
        style={{
          background: orbColors.tertiary,
          filter: 'blur(100px)'
        }}
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
    </div>
  );
};

export default function AuthenticationPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  }

  useEffect(() => {
    const view = router.query.view as string
    if (view === 'signup') {
      setIsLogin(false)
    } else if (view === 'login') {
      setIsLogin(true)
    }
  }, [router.query.view])

  useEffect(() => {
    const redirectPath = localStorage.getItem('loginRedirectPath')
    if (redirectPath) {
      localStorage.removeItem('loginRedirectPath')
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

  if (!mounted) {
    return (
      <div 
        className="min-h-screen opacity-0" 
        style={{ fontFamily: "'Manrope', sans-serif" }} 
      />
    )
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        backgroundColor: theme.bg,
        fontFamily: "'Manrope', sans-serif"
      }}
    >
      <style jsx global>{`
        html, body {
          background-color: ${theme.bg} !important;
        }
      `}</style>

      <AmbientOrbsOverlay isDark={isDark} />
      <FilmGrainOverlay />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-4 right-4 z-50"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-300"
          style={{
            backgroundColor: 'transparent',
            color: theme.textSecondary,
            border: `1px solid ${theme.border}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.borderHover;
            e.currentTarget.style.color = theme.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.color = theme.textSecondary;
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </motion.div>

      <div className="container relative min-h-screen flex flex-col items-center justify-center lg:grid lg:max-w-none lg:grid-cols-2 lg:px-4" style={{ zIndex: 2 }}>
        
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative hidden h-full flex-col p-10 lg:flex"
          style={{ color: theme.text }}
        >
          <div 
            className="absolute inset-4 backdrop-blur-sm"
            style={{
              backgroundColor: theme.bgCard,
              border: `1px solid ${theme.border}`,
            }}
          />
          
          <div className="relative z-20 flex items-center mb-8">
            <div 
              className="p-2 mr-3 flex items-center justify-center"
              style={{ border: `1px solid ${theme.border}` }}
            >
              <Image
                src="/biblechorus-icon.png"
                alt="BibleChorus"
                width={32}
                height={32}
              />
            </div>
            <span 
              className="text-xl tracking-wide"
              style={{ 
                fontFamily: "'Italiana', serif",
                color: theme.accent
              }}
            >
              BibleChorus
            </span>
          </div>

          <div className="relative z-20 flex-grow overflow-hidden">
            <ScriptureScroll theme={theme} />
          </div>

        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full px-4 sm:px-6 lg:p-8 xl:p-12 relative z-10"
        >
          <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col space-y-6 text-center"
            >
              <div className="mb-4">
                <span 
                  className="inline-flex items-center gap-2.5 px-5 py-2 text-xs tracking-[0.2em] uppercase"
                  style={{
                    border: `1px solid ${theme.border}`,
                    color: theme.accent,
                    fontFamily: "'Manrope', sans-serif"
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
                  <span>Welcome to BibleChorus</span>
                </span>
              </div>

              <h1 className="mb-2">
                <span 
                  className="block text-5xl sm:text-6xl tracking-tight mb-2"
                  style={{ 
                    fontFamily: "'Italiana', serif",
                    color: theme.text 
                  }}
                >
                  {isLogin ? "Welcome" : "Join Our"}
                </span>
                <span 
                  className="block text-5xl sm:text-6xl tracking-tight italic"
                  style={{ 
                    fontFamily: "'Italiana', serif",
                    color: theme.text,
                    opacity: 0.9
                  }}
                >
                  {isLogin ? "Back" : "Community"}
                </span>
              </h1>

              <p 
                className="text-base max-w-md mx-auto leading-relaxed font-light"
                style={{ color: theme.textSecondary }}
              >
                {isLogin 
                  ? "Sign in to continue your journey with Bible-inspired music"
                  : "Create your account and discover a world of spiritual melodies"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="p-8"
              style={{
                backgroundColor: theme.bgCard,
                border: `1px solid ${theme.border}`,
              }}
            >
              <UserAuthForm isLogin={isLogin} onLoginSuccess={handleLoginSuccess} theme={theme} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p 
                  className="mb-3 text-sm font-light"
                  style={{ color: theme.textSecondary }}
                >
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </p>
                <button
                  onClick={toggleView}
                  className="group inline-flex items-center gap-2 px-6 py-3 text-xs tracking-[0.15em] uppercase transition-all duration-300"
                  style={{
                    border: `1px solid ${theme.border}`,
                    color: theme.textSecondary,
                    backgroundColor: 'transparent',
                    fontFamily: "'Manrope', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.borderHover;
                    e.currentTarget.style.color = theme.accent;
                    e.currentTarget.style.backgroundColor = theme.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.color = theme.textSecondary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {isLogin ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isLogin ? "Create Account" : "Sign In"}
                </button>
              </div>

              <p 
                className="text-center text-xs leading-relaxed"
                style={{ color: theme.textSecondary }}
              >
                By continuing, you agree to our{" "}
                <TermsDialog>
                  <button 
                    className="underline underline-offset-2 transition-colors"
                    style={{ color: theme.accent }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.accentHover}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.accent}
                  >
                    Terms of Service
                  </button>
                </TermsDialog>
                {" "}and{" "}
                <PrivacyDialog>
                  <button 
                    className="underline underline-offset-2 transition-colors"
                    style={{ color: theme.accent }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.accentHover}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.accent}
                  >
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
