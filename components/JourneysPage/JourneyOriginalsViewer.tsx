"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BookOpen, ChevronDown, ChevronUp, FileText, ImageIcon, Loader2, Lock, Music } from "lucide-react";
import type { JourneyOriginal } from "@/types/journey";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Button } from "@/components/ui/button";
import { originalFileSize, prepareOriginalSession } from "./originals-client";

export const originalIcons = { audio: Music, journal: BookOpen, image: ImageIcon, pdf: FileText };
export const originalNames = { audio: "Audio recording", journal: "Journal entry", image: "Image", pdf: "PDF" };

function OriginalAudio({ url, label, active, onError }: { url: string; label: string; active: boolean; onError: () => void }) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { registerSourceAudio } = useMusicPlayer();
  useEffect(() => audio ? registerSourceAudio(audio) : undefined, [audio, registerSourceAudio]);
  useEffect(() => { if (!active) audio?.pause(); }, [audio, active]);
  useEffect(() => () => {
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }, [audio]);
  return <div className="space-y-2">
    <audio ref={setAudio} src={url} controls preload="none" className="w-full min-w-0 [color-scheme:light] dark:[color-scheme:dark]" aria-label={`Original recording: ${label}`} onError={onError} />
    <p className="text-xs leading-relaxed text-muted-foreground">Listening here pauses the finished song. Both listening positions are kept while you compare.</p>
  </div>;
}

export function JourneyOriginalPreview({ original, active = true }: { original: JourneyOriginal; active?: boolean }) {
  const { getAuthToken } = useAuth();
  const [detail, setDetail] = useState<JourneyOriginal | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const previewIdentity = useRef({ id: original.id, auth: getAuthToken, attempt });
  useEffect(() => {
    const controller = new AbortController();
    const previous = previewIdentity.current;
    if (previous.id !== original.id || previous.auth !== getAuthToken || previous.attempt !== attempt) setReady(false);
    previewIdentity.current = { id: original.id, auth: getAuthToken, attempt };
    setError("");
    void (async () => {
      try {
        const token = await getAuthToken();
        if (controller.signal.aborted) return;
        const response = await axios.get<{ original: JourneyOriginal }>(`/api/journeys/originals/${original.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (original.kind !== "journal") await prepareOriginalSession(token, controller.signal);
        if (!controller.signal.aborted) { setDetail(response.data.original); setReady(true); }
      } catch {
        if (!controller.signal.aborted) setError("This preview could not load. Check your connection and try again.");
      }
    })();
    return () => controller.abort();
  }, [original.id, original.kind, original.updated_at, getAuthToken, attempt]);

  if (error) return <div role="alert" className="space-y-2 text-sm"><p>{error}</p><Button variant="outline" size="sm" onClick={() => setAttempt(value => value + 1)}>Try preview again</Button></div>;
  if (!ready) return <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Preparing preview…</p>;
  if (original.kind === "journal") return <p tabIndex={0} aria-label={`Journal text: ${original.label}`} className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{detail?.journal_text}</p>;
  // Construct only the protected route; private originals must bypass image optimization/CDNs.
  const url = `/api/journeys/originals/${original.id}/file`;
  if (original.kind === "audio") return <OriginalAudio url={url} label={original.label} active={active} onError={() => setError("This recording is unavailable. Try again or ask the creator to check it.")} />;
  return <div className="space-y-3">
    {original.kind === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={original.label} loading="lazy" className="max-h-96 w-full rounded-lg object-contain" onError={() => setError("This image is unavailable. Try again or ask the creator to check it.")} />
    ) : <iframe src={url} title={`PDF preview: ${original.label}`} loading="lazy" className="h-80 w-full rounded-lg border border-border bg-background" />}
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open {original.kind === "pdf" ? "PDF" : "image"} in a new tab</a>
      {original.kind === "pdf" && <a href={`${url}?download=1`} className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Download PDF</a>}
    </div>
  </div>;
}

export function JourneyOriginalsViewer({ originals }: { originals: JourneyOriginal[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [visited, setVisited] = useState<number[]>([]);
  const readyOriginals = originals.filter(original => original.status === "ready");
  if (!readyOriginals.length) return null;
  return <section className="min-w-0 space-y-3 border-t border-border pt-4" aria-label="Journey originals">
    <div>
      <h4 className="font-serif text-lg text-foreground">Journey originals</h4>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">The recordings, pages, and memories behind the finished song.</p>
    </div>
    <div className="space-y-2">
      {[...readyOriginals].sort((a, b) => a.display_order - b.display_order).map(original => {
        const Icon = originalIcons[original.kind];
        const open = expanded === original.id;
        const panelId = `original-preview-${original.id}`;
        return <div key={original.id} className="min-w-0 rounded-xl border border-border bg-background/70">
          <button type="button" className="flex min-h-12 w-full items-start gap-3 rounded-xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={open} aria-controls={panelId} onClick={() => {
            setExpanded(open ? null : original.id);
            if (!visited.includes(original.id)) setVisited(items => [...items, original.id]);
          }}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium text-foreground">{original.label}</span><span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{originalNames[original.kind]}{original.byte_size ? ` · ${originalFileSize(original.byte_size)}` : ""}{!original.is_shared && <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" aria-hidden="true" />Private</span>}</span></span>
            {open ? <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />}
          </button>
          <div id={panelId} hidden={!open} className="min-w-0 border-t border-border p-3">
            {visited.includes(original.id) && <JourneyOriginalPreview original={original} active={open} />}
          </div>
        </div>;
      })}
    </div>
  </section>;
}
