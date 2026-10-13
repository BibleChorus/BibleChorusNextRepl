import PlaylistSection from "@/components/PlaylistsPage/PlaylistSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchPlaylists } from "@/lib/api/playlists";
import { BIBLE_BOOKS } from "@/lib/constants";
import { Playlist } from "@/types";
import {
  BookOpen,
  Heart,
  Library,
  Music,
  RefreshCw,
  Users,
} from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";

interface PlaylistGroup {
  title: string;
  shortTitle: string;
  description: string;
  value: string;
  icon: React.ElementType;
  playlists: Playlist[];
}

const sortPlaylists = (playlists: Playlist[], order: string[]) =>
  [...playlists].sort((a, b) => {
    const first = order.indexOf(a.name);
    const second = order.indexOf(b.name);
    if (first === -1 && second === -1) return a.name.localeCompare(b.name);
    if (first === -1) return 1;
    if (second === -1) return -1;
    return first - second;
  });

export default function PlaylistsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<PlaylistGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchPlaylists();
      setGroups([
        {
          title: "Always discovering",
          shortTitle: "Featured",
          description:
            "Automatic collections that grow as the community shares new music.",
          value: "auto",
          icon: Music,
          playlists: data.autoPlaylists,
        },
        {
          title: "The Old Testament",
          shortTitle: "Old Testament",
          description:
            "From creation to the prophets. Explore songs in the order of Scripture.",
          value: "old-testament",
          icon: BookOpen,
          playlists: sortPlaylists(data.oldTestamentPlaylists, [
            "Old Testament",
            ...BIBLE_BOOKS.slice(0, 39),
          ]),
        },
        {
          title: "The New Testament",
          shortTitle: "New Testament",
          description:
            "The life of Jesus, the early church, and the hope of things to come.",
          value: "new-testament",
          icon: Heart,
          playlists: sortPlaylists(data.newTestamentPlaylists, [
            "New Testament",
            ...BIBLE_BOOKS.slice(39),
          ]),
        },
        {
          title: "Made by the community",
          shortTitle: "Community",
          description:
            "Personal collections for worship, reflection, and everything in between.",
          value: "user",
          icon: Users,
          playlists: data.userPlaylists,
        },
      ]);
    } catch (failure) {
      console.error("Error fetching playlists:", failure);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  return (
    <>
      <Head>
        <title>Playlists · BibleChorus</title>
        <meta
          name="description"
          content="Discover Scripture in music through curated and community playlists."
        />
      </Head>
      <main className="page-shell">
        <header className="page-header">
          <div>
            <p className="page-eyebrow flex items-center gap-2">
              <Library className="h-4 w-4" /> Your next listening ritual
            </p>
            <h1 className="page-title">A collection for every chapter.</h1>
            <p className="page-description">
              Follow a book of the Bible, find a new favorite, or listen to a
              collection made by someone like you.
            </p>
          </div>
        </header>
        {loading ? (
          <div
            role="status"
            aria-label="Loading playlists"
            className="grid grid-cols-2 gap-6 md:grid-cols-4"
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="surface-card flex flex-col items-center gap-4 px-6 py-16 text-center"
          >
            <Library className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-xl font-semibold">
              We couldn’t load the collections.
            </h2>
            <p className="text-muted-foreground">
              Please try again in a moment.
            </p>
            <Button onClick={loadPlaylists} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Try again
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="auto" className="space-y-8">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1.5 sm:grid-cols-4">
              {groups.map((group) => (
                <TabsTrigger
                  key={group.value}
                  value={group.value}
                  className="rounded-xl px-3 py-3 text-xs sm:text-sm"
                >
                  <group.icon className="mr-2 hidden h-4 w-4 sm:block" />
                  {group.shortTitle}
                  <span className="ml-2 text-xs opacity-60">
                    {group.playlists.length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {groups.map((group) => (
              <TabsContent
                key={group.value}
                value={group.value}
                className="space-y-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <group.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {group.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  </div>
                </div>
                {group.playlists.length ? (
                  <PlaylistSection
                    title=""
                    playlists={group.playlists}
                    onPlaylistClick={(id) => router.push(`/playlists/${id}`)}
                  />
                ) : (
                  <div className="surface-card px-6 py-16 text-center">
                    <group.icon className="mx-auto mb-4 h-9 w-9 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">
                      A new collection is on its way.
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      There are no playlists in this category yet. Explore
                      another collection above.
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </>
  );
}
