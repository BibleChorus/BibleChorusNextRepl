import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  BookOpen,
  Loader2,
  Music,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PublicJourneyListItem } from "@/types/journey";
import { PublicJourneyCard } from "@/components/JourneysPage/PublicJourneyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JourneyCheckResponse {
  hasJourney: boolean;
  hasContent: boolean;
  profile: {
    id: number;
    title: string;
    subtitle: string | null;
    is_public: boolean;
  } | null;
}
type ListedJourney = PublicJourneyListItem & { is_liked: boolean };

export default function JourneysIndex() {
  const router = useRouter();
  const { user, getAuthToken } = useAuth();
  const [journeyStatus, setJourneyStatus] =
    useState<JourneyCheckResponse | null>(null);
  const [journeys, setJourneys] = useState<ListedJourney[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [likingId, setLikingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const generation = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoadingStatus(Boolean(user));
    if (!user) {
      setJourneyStatus(null);
      return;
    }
    const checkJourney = async () => {
      try {
        const token = await getAuthToken();
        const response = await fetch("/api/journeys/check", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.ok && !cancelled) setJourneyStatus(await response.json());
      } catch (err) {
        console.error("Error checking journey:", err);
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    };
    void checkJourney();
    return () => {
      cancelled = true;
    };
  }, [user, getAuthToken]);

  const fetchJourneys = useCallback(
    async (offset = 0) => {
      const requestGeneration = generation.current;
      if (offset === 0) setLoadingJourneys(true);
      else setLoadingMore(true);
      setError(false);
      try {
        const token = user ? await getAuthToken() : null;
        const response = await fetch(
          `/api/journeys/public?limit=20&offset=${offset}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (!response.ok) throw new Error("Could not load journeys");
        const data: { journeys: ListedJourney[]; total: number } =
          await response.json();
        if (requestGeneration !== generation.current) return;
        setJourneys((previous) =>
          offset === 0
            ? data.journeys
            : [
                ...previous,
                ...data.journeys.filter(
                  (item) =>
                    !previous.some((existing) => existing.id === item.id),
                ),
              ],
        );
        setTotal(data.total);
      } catch (err) {
        if (requestGeneration !== generation.current) return;
        console.error("Error loading journeys:", err);
        setError(true);
      } finally {
        if (requestGeneration === generation.current) {
          setLoadingJourneys(false);
          setLoadingMore(false);
        }
      }
    },
    [user, getAuthToken],
  );

  useEffect(() => {
    generation.current += 1;
    void fetchJourneys();
    return () => {
      generation.current += 1;
    };
  }, [fetchJourneys]);

  const handleLike = async (journey: ListedJourney) => {
    if (!user) {
      void router.push("/login");
      return;
    }
    if (likingId !== null) return;
    setLikingId(journey.id);
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/journeys/like", {
        method: journey.is_liked ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ journey_id: journey.id }),
      });
      if (!response.ok) throw new Error("Like failed");
      const data = await response.json();
      setJourneys((previous) =>
        previous.map((item) =>
          item.id === journey.id
            ? { ...item, is_liked: data.liked, likes_count: data.likes_count }
            : item,
        ),
      );
    } catch (err) {
      console.error("Error liking journey:", err);
      toast.error("Could not update your like. Please try again.");
    } finally {
      setLikingId(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return journeys.filter((journey) =>
      `${journey.title} ${journey.subtitle || ""} ${journey.username}`
        .toLowerCase()
        .includes(query),
    );
  }, [journeys, search]);

  return (
    <>
      <Head>
        <title>Journeys | BibleChorus</title>
        <meta
          name="description"
          content="Discover the songs, scripture, and stories that shape a life of faith. Explore musical journeys on BibleChorus."
        />
      </Head>
      <main className="page-shell">
        <header className="page-header grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)] lg:items-center">
          <div>
            <p className="page-eyebrow">Songs with a story</p>
            <h1 className="page-title">
              Every life has
              <br />
              <span className="italic text-primary">a soundtrack.</span>
            </h1>
            <p className="page-description">
              Walk through seasons of faith, told through music, scripture, and
              the moments that matter.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {!user ? (
                <Button size="lg" asChild>
                  <Link href="/login">
                    Start your journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : loadingStatus ? (
                <div
                  className="flex h-11 items-center gap-2 text-sm text-muted-foreground"
                  role="status"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding your journey…
                </div>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/journeys/edit">
                      {journeyStatus?.hasContent ? (
                        <Pencil className="mr-2 h-4 w-4" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      {journeyStatus?.hasContent
                        ? "Edit your journey"
                        : "Create your journey"}
                    </Link>
                  </Button>
                  {journeyStatus?.hasContent && (
                    <Button variant="outline" size="lg" asChild>
                      <Link
                        href={`/journeys/${encodeURIComponent(user.username)}`}
                      >
                        View your journey
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-primary/5 p-7 sm:p-8">
            <BookOpen className="mb-5 h-7 w-7 stroke-[1.25] text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl">
              The story behind the songs.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A journey brings your music and memories together. Collect songs
              into seasons, share your reflections, and remember God&apos;s
              faithfulness along the way.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-primary">
              {["Music", "Scripture", "Reflections", "Milestones"].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-full border border-primary/20 bg-background/65 px-3 py-1.5"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          </div>
        </header>
        <section
          aria-labelledby="public-journeys-title"
          className="mt-12 sm:mt-16"
        >
          <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="page-eyebrow mb-2">From our community</p>
              <h2 id="public-journeys-title" className="font-serif text-3xl">
                Explore journeys
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Personal stories. Shared encouragement.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="bg-card pl-10"
                placeholder="Search loaded journeys…"
                aria-label="Search loaded journeys by title or creator"
              />
            </div>
          </div>
          {loadingJourneys ? (
            <div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              role="status"
              aria-label="Loading journeys"
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="surface-card overflow-hidden motion-safe:animate-pulse"
                >
                  <div className="aspect-[16/10] bg-muted" />
                  <div className="space-y-3 p-6">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-6 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : error && journeys.length === 0 ? (
            <div className="surface-card p-10 text-center">
              <h3 className="font-serif text-2xl">
                Journeys could not be loaded
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Please try again in a moment.
              </p>
              <Button
                className="mt-6"
                variant="outline"
                onClick={() => void fetchJourneys()}
              >
                Try again
              </Button>
            </div>
          ) : filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((journey) => (
                <PublicJourneyCard
                  key={journey.id}
                  journey={journey}
                  isLiking={likingId === journey.id}
                  onLike={() => void handleLike(journey)}
                />
              ))}
            </div>
          ) : (
            <div className="surface-card p-10 text-center">
              <Music className="mx-auto mb-4 h-7 w-7 text-primary" />
              <h3 className="font-serif text-2xl">
                {search
                  ? "No matching journeys"
                  : "The first stories are still unfolding"}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {search
                  ? "Try another title or creator, or load more journeys below."
                  : "Share your musical journey and give someone a little encouragement."}
              </p>
              {search && (
                <Button
                  className="mt-5"
                  variant="outline"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
          {!loadingJourneys && journeys.length < total && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                disabled={loadingMore}
                onClick={() => void fetchJourneys(journeys.length)}
              >
                {loadingMore && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {error ? "Try loading more again" : "Load more journeys"}
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                {journeys.length} of {total} journeys loaded
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
