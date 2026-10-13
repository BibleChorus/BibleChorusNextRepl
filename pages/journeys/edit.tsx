import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Calendar, Eye, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { JourneyProfile, Season } from "@/types/journey";
import { SeasonEditor } from "@/components/JourneysPage/SeasonEditor";
import { JourneySettings } from "@/components/JourneysPage/JourneySettings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";

export default function EditJourneyPage() {
  const router = useRouter();
  const { user, getAuthToken, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<JourneyProfile | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("seasons");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoading(false);
      return;
    }
    setShowLoginPrompt(false);
    setIsLoading(true);
    setFailed(false);
    const fetchData = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          if (!cancelled) setShowLoginPrompt(true);
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const [profileResponse, seasonsResponse] = await Promise.all([
          axios.get<JourneyProfile>("/api/journeys/profile", { headers }),
          axios.get<Season[]>("/api/journeys/seasons", { headers }),
        ]);
        if (!cancelled) {
          setProfile(profileResponse.data);
          setSeasons(seasonsResponse.data);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Error fetching journey data:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401)
          setShowLoginPrompt(true);
        else {
          setFailed(true);
          toast.error("Failed to load your journey");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [user, getAuthToken, authLoading, retry]);

  const refreshSeasons = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get<Season[]>("/api/journeys/seasons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSeasons(response.data);
    } catch (error) {
      console.error("Error refreshing seasons:", error);
      toast.error("Could not refresh your seasons. Please reload the page.");
    }
  }, [getAuthToken]);

  return (
    <>
      <Head>
        <title>Edit your journey | BibleChorus</title>
        <meta
          name="description"
          content="Curate the songs, seasons, and stories of your musical journey."
        />
      </Head>
      <main className="page-shell">
        {showLoginPrompt ? (
          <LoginPromptDialog
            isOpen
            onClose={() => void router.push("/journeys")}
            title="Sign in to tell your story"
            description="Sign in to create and manage your musical journey."
          />
        ) : isLoading ? (
          <div
            className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
            role="status"
          >
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading your journey…
            </p>
          </div>
        ) : failed ? (
          <div className="surface-card p-10 text-center">
            <h1 className="font-serif text-3xl">
              We could not load your journey
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Your content is still there. Please try again in a moment.
            </p>
            <Button
              className="mt-6"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              className="-ml-3 mb-6 text-muted-foreground"
              asChild
            >
              <Link href="/journeys">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All journeys
              </Link>
            </Button>
            <header className="page-header flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="page-eyebrow">Your story, your way</p>
                <h1 className="page-title">{profile?.title || "My journey"}</h1>
                <p className="page-description">
                  Build the seasons of your life with songs, reflections,
                  scripture, and meaningful moments.
                </p>
              </div>
              {user && (
                <Button
                  variant="outline"
                  className="shrink-0 self-start"
                  asChild
                >
                  <Link href={`/journeys/${encodeURIComponent(user.username)}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview journey
                  </Link>
                </Button>
              )}
            </header>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-8 space-y-7"
            >
              <TabsList className="h-auto rounded-xl border border-border bg-muted/60 p-1.5">
                <TabsTrigger value="seasons" className="rounded-lg px-5 py-2.5">
                  <Calendar className="mr-2 h-4 w-4" />
                  Seasons
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-lg px-5 py-2.5"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Profile & settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="seasons">
                <SeasonEditor
                  seasons={seasons}
                  onSeasonsChange={setSeasons}
                  onRefresh={refreshSeasons}
                />
              </TabsContent>
              <TabsContent value="settings">
                {profile && (
                  <JourneySettings
                    profile={profile}
                    onProfileUpdate={setProfile}
                  />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </>
  );
}
