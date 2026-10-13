import "../lib/polyfills";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "../components/layout";
import { useRouter } from "next/router";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
const FloatingMusicPlayer = dynamic(
  () => import("@/components/MusicPlayer/FloatingMusicPlayer"),
  { ssr: false },
);
function PlayerDock() {
  const { currentSong } = useMusicPlayer();
  return currentSong ? <FloatingMusicPlayer /> : null;
}
import { SidebarProvider } from "@/contexts/SidebarContext";

const LoadingWrapper = ({ children }) => {
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => setIsRouteChanging(true);
    const handleComplete = () => setIsRouteChanging(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  const isLoading = isRouteChanging;

  return (
    <>
      {isLoading && <LoadingSpinner />}
      {children}
    </>
  );
};

function MyApp({ Component, pageProps }: AppProps & { Component: any }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  const router = useRouter();
  const isBarePage = Component.disableLayout;

  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <AuthProvider>
          <MusicPlayerProvider>
            <SidebarProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
              >
                <TooltipProvider>
                  <LoadingWrapper>
                    {isBarePage ? (
                      <Component {...pageProps} />
                    ) : (
                      <Layout>
                        <Component {...pageProps} />
                      </Layout>
                    )}
                  </LoadingWrapper>
                  <PlayerDock />
                </TooltipProvider>
              </ThemeProvider>
            </SidebarProvider>
          </MusicPlayerProvider>
        </AuthProvider>
        <Toaster />
      </QueryClientProvider>
    </MotionConfig>
  );
}

export default MyApp;
