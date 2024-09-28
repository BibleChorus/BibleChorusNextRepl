import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Layout from '../components/layout'
import { useRouter } from 'next/router'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryClient, QueryClientProvider, useIsFetching } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Router from 'next/router'

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
    Router.events.on('routeChangeStart', () => {})
    Router.events.on('routeChangeComplete', () => {})
    Router.events.on('routeChangeError', () => {})
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LoadingWrapper>
            {isHomePage ? (
              <Component {...pageProps} />
            ) : (
              <Layout>
                <Component {...pageProps} />
              </Layout>
            )}
          </LoadingWrapper>
        </ThemeProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  )
}

export default MyApp
