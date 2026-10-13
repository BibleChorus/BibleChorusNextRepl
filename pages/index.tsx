import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Map,
  Music,
  Play,
  Pause,
  Upload,
  ListMusic,
  MessageSquare,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { mediaUrl } from "@/lib/media";
import type { Song } from "@/types";

const destinations = [
  {
    title: "A song for every season",
    description:
      "Walk through stories of faith, told through music and reflection.",
    href: "/journeys",
    icon: Map,
    label: "Explore journeys",
  },
  {
    title: "Make it your own",
    description:
      "Gather the songs that speak to you into a collection worth returning to.",
    href: "/playlists",
    icon: ListMusic,
    label: "Discover playlists",
  },
  {
    title: "A growing body of music",
    description:
      "See the passages already set to song, and the ones waiting for a melody.",
    href: "/progress",
    icon: TrendingUp,
    label: "View scripture coverage",
  },
];

export default function Home() {
  const { user } = useAuth();
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const stats = useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => (await axios.get("/api/stats")).data,
  });
  const songsQuery = useQuery<{ songs: Song[] }>({
    queryKey: ["home-songs"],
    queryFn: async () =>
      (
        await axios.get("/api/songs", {
          params: { limit: 4, sortBy: "mostRecent" },
        })
      ).data,
  });
  const songs = songsQuery.data?.songs ?? [];
  const asPlayerSong = (song: Song) => ({
    ...song,
    artist: song.artist || song.username,
    audioUrl: mediaUrl(song.audio_url),
    audio_url: mediaUrl(song.audio_url),
    coverArtUrl: mediaUrl(song.song_art_url),
  });
  const listen = (song: Song) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) pause();
      else resume();
    } else playSong(asPlayerSong(song), songs.map(asPlayerSong));
  };

  return (
    <>
      <Head>
        <title>BibleChorus — Scripture, set to song</title>
        <meta
          name="description"
          content="Discover scripture-inspired music, share your songs, and follow journeys of faith. A place for the Word to become part of your everyday listening."
        />
      </Head>
      <div className="page-shell">
        <section className="grid items-center gap-10 pb-6 pt-3 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:py-10">
          <div>
            <p className="page-eyebrow flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Scripture, set to song
            </p>
            <h1 className="max-w-3xl text-5xl leading-[1.1] sm:text-6xl xl:text-7xl">
              Let the Word
              <br />
              find <em className="font-normal text-primary">a melody.</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Music to carry with you. Stories to grow through. Discover a
              community turning Scripture and the seasons of faith into song.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/listen">
                  <Headphones className="mr-2 h-4 w-4" />
                  Start listening
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                <Link href="/journeys">
                  Explore journeys
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted-foreground">
              {stats.data ? (
                <>
                  <span>
                    <strong className="text-foreground">
                      {Number(stats.data.totalSongs).toLocaleString()}
                    </strong>{" "}
                    songs shared
                  </span>
                  <span>
                    <strong className="text-foreground">
                      {Number(stats.data.totalUsers).toLocaleString()}
                    </strong>{" "}
                    community members
                  </span>
                  <span>
                    <strong className="text-foreground">
                      {Number(stats.data.totalListens).toLocaleString()}
                    </strong>{" "}
                    listens
                  </span>
                </>
              ) : (
                <span>Listen freely. Share what moves you.</span>
              )}
            </div>
          </div>
          <div
            className="hero-art relative flex aspect-[1.08] items-center justify-center overflow-hidden rounded-[2rem] border border-border"
            aria-hidden="true"
          >
            <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full border border-primary/15" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full border border-primary/15" />
            <div className="relative w-[76%] -rotate-6 rounded-2xl border border-border bg-card p-7 shadow-xl sm:p-10">
              <div className="mb-7 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.2em] text-muted-foreground">
                <span>BibleChorus</span>
                <Music className="h-4 w-4 text-primary" />
              </div>
              <div className="relative mx-auto flex aspect-square w-[78%] items-center justify-center rounded-full bg-foreground shadow-lg">
                <div className="absolute inset-3 rounded-full border border-background/10" />
                <div className="absolute inset-7 rounded-full border border-background/10" />
                <div className="absolute inset-11 rounded-full border border-background/10" />
                <div className="flex h-[40%] w-[40%] items-center justify-center rounded-full bg-primary">
                  <BookOpen className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <p className="mt-7 font-serif text-2xl text-foreground">
                A new song.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                An ancient truth. A voice of your own.
              </p>
              <div className="mt-5 flex h-6 items-center gap-[5px]">
                {[
                  10, 18, 13, 24, 16, 8, 20, 14, 22, 12, 18, 8, 15, 24, 12, 18,
                  10, 20, 16, 8, 22, 12, 18, 24, 10, 14, 20, 8,
                ].map((height, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-full bg-primary/40"
                    style={{ height }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute bottom-5 right-4 flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-sm sm:bottom-10 sm:right-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Headphones className="h-4 w-4 text-primary" />
              </span>
              <span className="text-xs font-medium">
                A place to listen. A place to belong.
              </span>
            </div>
          </div>
        </section>
        <section className="border-t border-border pt-9">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="page-eyebrow">From the community</p>
              <h2 className="text-3xl sm:text-4xl">
                Fresh voices, timeless words.
              </h2>
            </div>
            <Link
              href="/listen"
              className="flex shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              All music
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {songsQuery.isPending ? (
            <div
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
              aria-label="Loading songs"
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-[1.25] animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          ) : songsQuery.isError ? (
            <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
              <p className="text-sm text-muted-foreground">
                The latest songs couldn’t load just now.
              </p>
              <Button variant="outline" onClick={() => songsQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : songs.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {songs.map((song) => (
                <article
                  key={song.id}
                  className="surface-card group overflow-hidden"
                >
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={mediaUrl(song.song_art_url, "/default-cover.jpg")}
                      alt={`Artwork for ${song.title}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 25vw"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => listen(song)}
                      aria-label={`${currentSong?.id === song.id && isPlaying ? "Pause" : "Play"} ${song.title}`}
                      className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform hover:scale-105"
                    >
                      {currentSong?.id === song.id && isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="p-5">
                    <Link
                      href={`/Songs/${song.id}`}
                      className="line-clamp-1 font-semibold hover:text-primary"
                    >
                      {song.title}
                    </Link>
                    <Link
                      href={`/profile?id=${song.uploaded_by}`}
                      className="mt-1 block truncate text-sm text-muted-foreground hover:text-primary"
                    >
                      {song.artist || song.username}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-card p-8">
              <p className="text-muted-foreground">
                Every collection begins with a song.
              </p>
              <Button asChild className="mt-4">
                <Link href="/upload">Share yours</Link>
              </Button>
            </div>
          )}
        </section>
        <section className="grid gap-5 py-4 lg:grid-cols-3">
          {destinations.map(
            ({ title, description, href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="surface-card group flex flex-col p-7 transition-colors hover:border-primary/40"
              >
                <Icon className="mb-6 h-6 w-6 text-primary" />
                <h2 className="text-2xl">{title}</h2>
                <p className="mb-7 mt-3 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
                <span className="mt-auto flex items-center gap-2 text-sm font-semibold text-primary">
                  {label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ),
          )}
        </section>
        <section className="grid gap-8 rounded-3xl bg-muted/60 p-7 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="page-eyebrow">Bring your voice</p>
            <h2 className="text-3xl sm:text-4xl">Your song belongs here.</h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              A scripture song, a testimony, a melody from a hard-won season.
              Share it, talk about it, and help someone else find words for
              their faith.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link href={user ? "/upload" : "/login?view=signup"}>
                <Upload className="mr-2 h-4 w-4" />
                {user ? "Share a song" : "Join the community"}
              </Link>
            </Button>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <Link
              href="/forum"
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <MessageSquare className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">Keep the conversation going</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Stories, questions, and encouragement in the forum.
                </p>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pdfs"
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">
                  Spend a little longer in the Word
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Study resources, notes, and scripture connections.
                </p>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
