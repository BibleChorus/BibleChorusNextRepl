"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import axios from "axios";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  Music,
  Play,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { JourneyWithSeasons } from "@/types/journey";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  journeyDate,
  journeyMediaUrl,
  journeyPlayerSong,
  safeExternalUrl,
} from "./journey-utils";

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* Fall through to the manual selection fallback. */
  }
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}

export const JourneyHero: React.FC<{ journey: JourneyWithSeasons }> = ({
  journey,
}) => {
  const { getAuthToken, user } = useAuth();
  const { playSong } = useMusicPlayer();
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [includeOriginals, setIncludeOriginals] = useState(false);
  const [exportedData, setExportedData] = useState("");
  const exportRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    exportRequest.current?.abort();
    setExportedData("");
    setCopied(false);
    setShowCopy(false);
    setShowExportOptions(false);
    setIncludeOriginals(false);
    setIsCopying(false);
    return () => exportRequest.current?.abort();
  }, [journey.username, user?.id]);
  const cover = journeyMediaUrl(journey.cover_image_url);
  const avatar = journeyMediaUrl(journey.profile_image_url);
  const notebook = safeExternalUrl(journey.notebook_lm_url);
  const songs = [...journey.seasons]
    .sort(
      (a, b) =>
        (journeyDate(a.start_date)?.getTime() || 0) -
        (journeyDate(b.start_date)?.getTime() || 0),
    )
    .flatMap((season) => season.songs || []);
  const queue = songs.flatMap((item) =>
    item.song ? [journeyPlayerSong(item.song)] : [],
  );

  const handleExport = async () => {
    if (isCopying) return;
    const controller = new AbortController();
    exportRequest.current = controller;
    setIsCopying(true);
    try {
      const token = await getAuthToken();
      const response = await axios.get("/api/journeys/export-for-llm", {
        params: {
          username: journey.username,
          ...(includeOriginals ? { includeOriginals: "true" } : {}),
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const data = JSON.stringify(response.data, null, 2);
      setExportedData(data);
      setShowExportOptions(false);
      if (await copyToClipboard(data)) {
        setCopied(true);
        toast.success(
          "Journey copied. Paste it into your favorite AI assistant.",
        );
      } else setShowCopy(true);
    } catch (error) {
      if (controller.signal.aborted) return;
      toast.error("Could not export this journey. Please try again.");
    } finally {
      if (exportRequest.current === controller) setIsCopying(false);
    }
  };

  const handleShare = async () => {
    if (await copyToClipboard(window.location.href))
      toast.success("Journey link copied");
    else
      toast.info(
        "Copy the link from your browser address bar to share this journey.",
      );
  };

  return (
    <header className="mb-12 overflow-hidden rounded-[2rem] border border-border bg-card sm:mb-16">
      <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <div className="px-6 py-8 sm:p-10 lg:p-12">
          <p className="page-eyebrow mb-5">A musical journey of faith</p>
          <h1 className="break-words font-serif text-4xl leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
            {journey.title}
          </h1>
          {journey.subtitle && (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {journey.subtitle}
            </p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-primary">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  journey.username.slice(0, 1).toUpperCase()
                )}
              </div>
              <span>
                By{" "}
                <span className="font-medium text-foreground">
                  {journey.username}
                </span>
              </span>
            </div>
            <span>
              {songs.length} {songs.length === 1 ? "song" : "songs"}
            </span>
            <span>
              {journey.seasons.length}{" "}
              {journey.seasons.length === 1 ? "season" : "seasons"}
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {queue.length > 0 && (
              <Button onClick={() => playSong(queue[0], queue)}>
                <Play className="mr-2 h-4 w-4" />
                Listen to this journey
              </Button>
            )}
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
              disabled={isCopying}
              onClick={() => {
                setIncludeOriginals(false);
                setShowExportOptions(true);
              }}
            >
              {isCopying ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : copied ? (
                <Check className="mr-2 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-2 h-3.5 w-3.5" />
              )}
              {isCopying
                ? "Copying…"
                : copied
                  ? "Copied for AI"
                  : "Copy for AI"}
            </Button>
            {notebook && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                asChild
              >
                <a href={notebook} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="mr-2 h-3.5 w-3.5" />
                  NotebookLM
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setShowHelp(true)}
              aria-label="Learn about journey AI features"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative min-h-[260px] overflow-hidden border-t border-border bg-primary/10 lg:border-l lg:border-t-0">
          {cover ? (
            <Image
              src={cover}
              alt={`${journey.title} cover`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
          ) : (
            <div className="relative flex h-full min-h-[260px] items-center justify-center px-8 py-12">
              <div className="absolute h-72 w-72 rounded-full border border-primary/15" />
              <div className="absolute h-56 w-56 rounded-full border border-primary/15" />
              <div className="flex h-40 w-40 items-center justify-center rounded-full border border-primary/20 bg-background/50 text-primary">
                <Music className="h-14 w-14 stroke-[1]" />
              </div>
            </div>
          )}
        </div>
      </div>
      {journey.bio && (
        <div className="border-t border-border bg-muted/25 px-6 py-7 sm:px-10 lg:px-12">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            The story so far
          </p>
          <div className="max-w-3xl space-y-4">
            {journey.bio
              .split(/\*{3,}|\n{2,}/)
              .filter((section) => section.trim())
              .map((section, index) => (
                <p
                  key={index}
                  className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground"
                >
                  {section.trim()}
                </p>
              ))}
          </div>
        </div>
      )}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Explore the journey with AI</DialogTitle>
            <DialogDescription>
              Take the songs, scripture, and story into a deeper conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 text-sm leading-relaxed">
            <div>
              <h3 className="mb-1 font-medium">Copy for AI</h3>
              <p className="text-muted-foreground">
                Copy the journey&apos;s seasons, songs, important dates, and
                Bible verses in the LSB translation. Paste the data into your
                preferred AI assistant to explore themes or ask questions.
              </p>
            </div>
            {notebook && (
              <div>
                <h3 className="mb-1 font-medium">NotebookLM</h3>
                <p className="text-muted-foreground">
                  Visit the creator&apos;s shared Google NotebookLM notebook to
                  explore connections, ask questions, or generate summaries.
                </p>
              </div>
            )}
          </div>
          <Button onClick={() => setShowHelp(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={showCopy} onOpenChange={setShowCopy}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Copy journey data</DialogTitle>
            <DialogDescription>
              Select the text below and press Cmd+C on Mac or Ctrl+C on Windows.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            aria-label="Journey data for AI"
            value={exportedData}
            className="h-[45vh] resize-none font-mono text-xs"
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button
            onClick={async () => {
              if (await copyToClipboard(exportedData)) {
                toast.success("Journey copied");
                setShowCopy(false);
                setCopied(true);
              }
            }}
          >
            Copy to clipboard
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={showExportOptions} onOpenChange={setShowExportOptions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Copy this journey for AI</DialogTitle>
            <DialogDescription>
              Copy songs, scripture, reflections, dates, and existing source links.
              Originals are excluded unless you choose to include them.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/25 p-4">
            <Checkbox
              id="export-originals"
              checked={includeOriginals}
              onCheckedChange={(checked) => setIncludeOriginals(checked === true)}
              disabled={isCopying}
              aria-describedby="export-originals-description"
            />
            <div className="min-w-0 space-y-2">
              <Label htmlFor="export-originals" className="leading-5">
                Include originals I can access
              </Label>
              <p id="export-originals-description" className="text-sm leading-relaxed text-muted-foreground">
                Includes journal text and attachment details. File links still require
                access to the journey. Your own private journals can be included;
                review them before pasting into another service.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setShowExportOptions(false)} disabled={isCopying}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isCopying}>
              {isCopying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
              {isCopying ? "Preparing…" : "Copy journey"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};
