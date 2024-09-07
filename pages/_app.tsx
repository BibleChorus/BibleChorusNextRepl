import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'
import { ThemeProvider } from 'next-themes'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isHomePage = router.pathname === '/'

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {isHomePage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </ThemeProvider>
  )
}

export default MyApp
