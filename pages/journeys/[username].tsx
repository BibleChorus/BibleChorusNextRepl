import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";
import {
  ArrowLeft,
  EyeOff,
  Loader2,
  Lock,
  Music,
  Pencil,
  Plus,
} from "lucide-react";
import { JourneyWithSeasons } from "@/types/journey";
import { JourneyHero } from "@/components/JourneysPage/JourneyHero";
import { JourneyTimeline } from "@/components/JourneysPage/JourneyTimeline";
import { formatJourneyDate } from "@/components/JourneysPage/journey-utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function JourneyPage() {
  const router = useRouter();
  const username =
    typeof router.query.username === "string" ? router.query.username : null;
  const { user, getAuthToken, isLoading: authLoading } = useAuth();
  const [journey, setJourney] = useState<JourneyWithSeasons | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{
    status?: number;
    message: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const isOwner = Boolean(username && user?.username === username);

  useEffect(() => {
    if (!username) return;
    if (authLoading) return;
    let cancelled = false;
    const fetchJourney = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getAuthToken();
        const response = await axios.get<JourneyWithSeasons>(
          `/api/journeys/${encodeURIComponent(username)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (!cancelled) setJourney(response.data);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching journey:", err);
        const status = axios.isAxiosError(err)
          ? err.response?.status
          : undefined;
        setJourney(null);
        setError({
          status,
          message:
            status === 403
              ? "This journey is private"
              : status === 404
                ? "Journey not found"
                : "We could not load this journey",
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchJourney();
    return () => {
      cancelled = true;
    };
  }, [username, getAuthToken, user?.id, authLoading, retry]);

  if (isLoading)
    return (
      <>
        <Head>
          <title>Journey | BibleChorus</title>
        </Head>
        <div
          className="page-shell flex min-h-[60vh] flex-col items-center justify-center gap-4"
          role="status"
        >
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading the journey…</p>
        </div>
      </>
    );

  if (error || !journey) {
    const canStart = isOwner && error?.status === 404;
    return (
      <>
        <Head>
          <title>
            {canStart
              ? "Start your journey"
              : error?.message || "Journey not found"}{" "}
            | BibleChorus
          </title>
        </Head>
        <div className="page-shell">
          <div className="surface-card mx-auto flex max-w-xl flex-col items-center px-6 py-14 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              {canStart ? (
                <Music className="h-7 w-7" />
              ) : (
                <Lock className="h-7 w-7" />
              )}
            </div>
            <h1 className="font-serif text-3xl">
              {canStart
                ? "Every journey begins with a song"
                : error?.message || "Journey not found"}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              {canStart
                ? "Create seasons, collect the songs that shaped them, and tell your story of faith."
                : error?.status === 403
                  ? "The creator has chosen to keep this journey private."
                  : error?.status === 404
                    ? "This journey may have moved or has not been created yet."
                    : "Please try again in a moment."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/journeys">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Explore journeys
                </Link>
              </Button>
              {canStart ? (
                <Button asChild>
                  <Link href="/journeys/edit">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your journey
                  </Link>
                </Button>
              ) : (
                ![403, 404].includes(error?.status || 0) && (
                  <Button onClick={() => setRetry((value) => value + 1)}>
                    Try again
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  const seasons = [...journey.seasons].sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  );
  return (
    <>
      <Head>
        <title>
          {journey.title} | {journey.username}&apos;s Journey | BibleChorus
        </title>
        <meta
          name="description"
          content={
            journey.subtitle ||
            `Explore ${journey.username}'s musical journey through scripture songs`
          }
        />
        <meta
          property="og:title"
          content={`${journey.title} | ${journey.username}'s Journey`}
        />
        <meta
          property="og:description"
          content={
            journey.subtitle || `Explore ${journey.username}'s musical journey`
          }
        />
        <meta property="og:type" content="profile" />
        {journey.cover_image_url && (
          <meta property="og:image" content={journey.cover_image_url} />
        )}
      </Head>
      <div className="page-shell">
        <nav
          aria-label="Journey navigation"
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <Button
            variant="ghost"
            className="-ml-3 text-muted-foreground"
            asChild
          >
            <Link href="/journeys">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All journeys
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            {isOwner && !journey.is_public && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <EyeOff className="h-3.5 w-3.5" />
                Private journey
              </span>
            )}
            {seasons.length > 0 && (
              <Select
                onValueChange={(value) => {
                  document
                    .getElementById(`season-${value}`)
                    ?.scrollIntoView({
                      behavior: window.matchMedia(
                        "(prefers-reduced-motion: reduce)",
                      ).matches
                        ? "auto"
                        : "smooth",
                      block: "start",
                    });
                  window.history.replaceState(null, "", `#season-${value}`);
                }}
              >
                <SelectTrigger
                  className="w-[180px] bg-card"
                  aria-label="Jump to a season"
                >
                  <SelectValue placeholder="Jump to a season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={String(season.id)}>
                      {formatJourneyDate(season.start_date, "yyyy")} ·{" "}
                      {season.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isOwner && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/journeys/edit">
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit journey
                </Link>
              </Button>
            )}
          </div>
        </nav>
        <JourneyHero journey={journey} />
        <main id="seasons">
          {seasons.length > 0 ? (
            <JourneyTimeline journey={journey} isPreview={isOwner} />
          ) : (
            <div className="surface-card px-6 py-12 text-center">
              <Music className="mx-auto mb-4 h-8 w-8 text-primary" />
              <h2 className="font-serif text-2xl">
                {isOwner
                  ? "Your first season awaits"
                  : "A story is taking shape"}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                {isOwner
                  ? "Start with a season of your life, then add the songs, scripture, and moments that tell its story."
                  : "This journey does not have any seasons to explore yet."}
              </p>
              {isOwner && (
                <Button className="mt-6" asChild>
                  <Link href="/journeys/edit">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first season
                  </Link>
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
