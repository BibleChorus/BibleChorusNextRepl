import { CommentList } from "@/components/ForumPage/CommentList";
import { NewCommentForm } from "@/components/ForumPage/NewCommentForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import axios from "axios";
import ReactHtmlParser from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";
import { ArrowLeft, Lock, MessageSquare, Pause, Play } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";
const getImageUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : CDN_URL ? `${CDN_URL}${path}` : `/${path}`;

export default function TopicPage() {
  const {
    query: { id },
  } = useRouter();
  const { user } = useAuth();
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const [topic, setTopic] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setTopic(null);
    setLoadError(false);
    axios
      .get(`/api/forum/topics/${id}`, { signal: controller.signal })
      .then((response) => {
        setTopic(response.data);
        setIsLocked(response.data.is_locked);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          console.error("Error fetching topic:", failure);
          setLoadError(true);
        }
      });
    return () => controller.abort();
  }, [id, refreshKey]);

  const handlePlayClick = () => {
    if (!topic?.song) return;
    if (currentSong?.id === topic.song.id) {
      if (isPlaying) pause();
      else resume();
      return;
    }
    playSong({
      id: topic.song.id,
      title: topic.song.title,
      artist: topic.song.artist || topic.song.username,
      audioUrl: topic.song.audio_url,
      audio_url: topic.song.audio_url,
      coverArtUrl: topic.song.song_art_url,
      duration: topic.song.duration,
      uploaded_by: topic.song.uploaded_by,
    });
  };
  const handleCommentAdded = (comment: any) =>
    setTopic((previous: any) => ({
      ...previous,
      comments: [comment, ...(previous.comments || [])],
    }));
  const handleLockTopic = async () => {
    setIsLocking(true);
    try {
      await axios.patch(`/api/forum/topics/${id}/lock`);
      setIsLocked(true);
      toast.success("Conversation locked");
    } catch (failure) {
      console.error("Error locking topic:", failure);
      toast.error("Could not lock the conversation");
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <>
      <Head>
        <title>
          {topic ? `${topic.title} · Community` : "Community"} · BibleChorus
        </title>
      </Head>
      <main className="page-shell max-w-5xl">
        <Button asChild variant="ghost" className="mb-6 -ml-3">
          <Link href="/forum">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to the conversation
          </Link>
        </Button>
        {loadError ? (
          <div role="alert" className="surface-card p-10 text-center">
            <h1 className="text-xl font-semibold">
              This conversation couldn’t load.
            </h1>
            <p className="mb-5 mt-2 text-muted-foreground">
              It may be unavailable. You can try again or return to the
              community.
            </p>
            <Button
              variant="outline"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Try again
            </Button>
          </div>
        ) : !topic ? (
          <div
            role="status"
            aria-label="Loading conversation"
            className="space-y-6"
          >
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        ) : (
          <>
            <header className="page-header">
              <div className="mb-4 flex items-center gap-2">
                {topic.category && (
                  <Badge variant="secondary" className="rounded-full">
                    {topic.category}
                  </Badge>
                )}
                {isLocked && (
                  <Badge variant="outline" className="gap-1 rounded-full">
                    <Lock className="h-3 w-3" /> Locked
                  </Badge>
                )}
              </div>
              <h1 className="page-title">{topic.title}</h1>
              <p className="mt-4 text-sm text-muted-foreground">
                Shared by{" "}
                <span className="font-medium text-foreground">
                  {topic.username}
                </span>
                <span className="mx-2">·</span>
                <time dateTime={topic.created_at}>
                  {new Date(topic.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </p>
            </header>
            <article className="surface-card p-6 sm:p-8">
              <div className="prose max-w-none break-words dark:prose-invert prose-a:text-primary prose-headings:text-foreground">
                {ReactHtmlParser(DOMPurify.sanitize(topic.content || ""))}
              </div>
              {topic.song && (
                <div className="mt-8 flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={
                        topic.song.song_art_url
                          ? getImageUrl(topic.song.song_art_url)
                          : "/biblechorus-icon.png"
                      }
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs text-muted-foreground">
                      A song for this conversation
                    </p>
                    <Link
                      href={`/Songs/${topic.song.id}`}
                      className="line-clamp-2 font-semibold hover:text-primary"
                    >
                      {topic.song.title}
                    </Link>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {topic.song.artist || topic.song.username}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-full"
                    onClick={handlePlayClick}
                    aria-label={
                      currentSong?.id === topic.song.id && isPlaying
                        ? `Pause ${topic.song.title}`
                        : `Play ${topic.song.title}`
                    }
                  >
                    {currentSong?.id === topic.song.id && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </article>
            <section className="mt-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <MessageSquare className="h-5 w-5 text-primary" /> Join the
                  conversation{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({topic.comments?.length || 0})
                  </span>
                </h2>
                {user?.is_moderator && !isLocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLocking}
                    onClick={handleLockTopic}
                  >
                    <Lock className="mr-2 h-4 w-4" />{" "}
                    {isLocking ? "Locking…" : "Lock topic"}
                  </Button>
                )}
              </div>
              {isLocked ? (
                <p className="mb-6 rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                  This conversation is locked. You can still read the discussion
                  below.
                </p>
              ) : user ? (
                <NewCommentForm
                  topicId={topic.id}
                  onCommentAdded={handleCommentAdded}
                />
              ) : (
                <div className="surface-card mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
                  <p className="text-sm text-muted-foreground">
                    Sign in to share your thoughts with the community.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/login">Sign in to reply</Link>
                  </Button>
                </div>
              )}
              <CommentList
                comments={topic.comments || []}
                topicId={topic.id}
                onCommentAdded={handleCommentAdded}
                canReply={!isLocked}
              />
            </section>
          </>
        )}
      </main>
    </>
  );
}
