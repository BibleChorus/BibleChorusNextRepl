import '../lib/polyfills'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Layout from '../components/layout'
import { useRouter } from 'next/router'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryClient, QueryClientProvider, useIsFetching } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext'
import FloatingMusicPlayer from '@/components/MusicPlayer/FloatingMusicPlayer'
import { SidebarProvider } from '@/contexts/SidebarContext'

const queryClient = new QueryClient()

const LoadingWrapper = ({ children }) => {
  const isFetching = useIsFetching()
  const [isRouteChanging, setIsRouteChanging] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleStart = () => setIsRouteChanging(true)
    const handleComplete = () => setIsRouteChanging(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  const isLoading = isRouteChanging || isFetching > 0

  return (
    <>
      {isLoading && <LoadingSpinner />}
      {children}
    </>
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isHomePage = router.pathname === '/'

  useEffect(() => {
    // Disable the default loading indicator
    const handleRouteChange = () => {}
    router.events.on('routeChangeStart', handleRouteChange)
    router.events.on('routeChangeComplete', handleRouteChange)
    router.events.on('routeChangeError', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
      router.events.off('routeChangeComplete', handleRouteChange)
      router.events.off('routeChangeError', handleRouteChange)
    }
  }, [router])

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthProvider>
        <MusicPlayerProvider>
          <SidebarProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <TooltipProvider>
                <LoadingWrapper>
                  {isHomePage ? (
                    <Component {...pageProps} />
                  ) : (
                    <Layout>
                      <Component {...pageProps} />
                    </Layout>
                  )}
                </LoadingWrapper>
                <FloatingMusicPlayer />
              </TooltipProvider>
            </ThemeProvider>
          </SidebarProvider>
        </MusicPlayerProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  )
}

export default MyApp