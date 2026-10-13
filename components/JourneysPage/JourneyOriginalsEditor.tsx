"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import axios from "axios";
import { ArrowDown, ArrowUp, Check, Loader2, Lock, Pencil, Plus, Share2, Trash2, Upload, X } from "lucide-react";
import type { JourneyOriginal, SeasonSong } from "@/types/journey";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JourneyOriginalPreview, originalIcons, originalNames } from "./JourneyOriginalsViewer";
import { matchesOriginalFile, ORIGINAL_ACCEPT, ORIGINAL_LIMITS, originalError, originalFileSize, OriginalsResponse, OriginalKind, OriginalUpload, validateOriginalFile } from "./originals-client";

interface JourneyOriginalsEditorProps {
  entry: SeasonSong;
  onChanged: () => void;
}

export function JourneyOriginalsEditor(props: JourneyOriginalsEditorProps) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p role="status" className="text-sm text-muted-foreground">Loading your session…</p>;
  if (!user) return <p className="text-sm text-muted-foreground">Sign in to manage journey originals.</p>;
  return <OriginalsEditorSession key={`${user.id}:${props.entry.id}`} {...props} />;
}

function OriginalsEditorSession({ entry, onChanged }: JourneyOriginalsEditorProps) {
  const { getAuthToken } = useAuth();
  const prefix = useId();
  const [originals, setOriginals] = useState<JourneyOriginal[]>([]);
  const [storage, setStorage] = useState<OriginalsResponse["storage"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [composer, setComposer] = useState(false);
  const [kind, setKind] = useState<OriginalKind>("journal");
  const [label, setLabel] = useState("");
  const [journal, setJournal] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [retryOriginal, setRetryOriginal] = useState<JourneyOriginal | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editJournal, setEditJournal] = useState("");
  const [sharing, setSharing] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [visited, setVisited] = useState<number[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [createAttempted, setCreateAttempted] = useState(false);
  const alive = useRef(true);
  const request = useRef<AbortController | null>(null);
  const reserving = useRef(false);
  const intentId = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; request.current?.abort(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const token = await getAuthToken();
        if (controller.signal.aborted) return;
        const response = await axios.get<OriginalsResponse>("/api/journeys/originals", {
          params: { entryId: entry.id },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setOriginals(response.data.originals);
        setStorage(response.data.storage);
      } catch (cause) {
        if (!controller.signal.aborted) setError(originalError(cause, "Could not load originals. Try again."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [entry.id, getAuthToken, loadAttempt]);

  const upsert = (original: JourneyOriginal) => setOriginals(items => {
    const found = items.some(item => item.id === original.id);
    return found ? items.map(item => item.id === original.id ? original : item) : [...items, original];
  });
  const resetComposer = () => {
    setComposer(false);
    setRetryOriginal(null);
    setFile(null);
    setLabel("");
    setJournal("");
    setProgress(null);
    intentId.current = null;
    setCreateAttempted(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const mutate = async (action: (config: { headers: Record<string, string>; signal: AbortSignal }) => Promise<void | boolean>, changed = true) => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const token = await getAuthToken();
      if (controller.signal.aborted || !alive.current) return;
      const saved = await action({ headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal });
      if (saved !== false && changed && alive.current && !controller.signal.aborted) onChanged();
    } catch (cause) {
      if (alive.current) {
        if (controller.signal.aborted) setNotice("Upload paused. Choose the same file to resume your private pending original.");
        else setError(originalError(cause, "Could not save this original. Your changes are still here; try again."));
        if (reserving.current) {
          setLoading(true);
          setLoadAttempt(value => value + 1);
          setNotice("Saving was interrupted. Checking your saved originals; retry this same original or resume an unfinished upload from the list.");
        }
      }
    } finally {
      if (alive.current) {
        setBusy(false);
        setProgress(null);
      }
      if (request.current === controller) request.current = null;
      reserving.current = false;
    }
  };

  const upload = async (config: { headers: Record<string, string>; signal: AbortSignal }) => {
    if (!label.trim()) { setError("Give your original a label."); return false; }
    if (kind === "journal") {
      if (!journal.trim()) { setError("Write a journal entry before saving."); return false; }
      intentId.current ||= crypto.randomUUID();
      setCreateAttempted(true);
      reserving.current = true;
      const response = await axios.post<{ original: JourneyOriginal }>("/api/journeys/originals", { requestId: intentId.current, entryId: entry.id, kind, label: label.trim(), journal_text: journal }, config);
      if (config.signal.aborted || !alive.current) return;
      upsert(response.data.original);
      resetComposer();
      setNotice("Journal saved privately. Share it when you are ready.");
      return;
    }
    if (!file) { setError("Choose a file to upload."); return false; }
    const invalid = validateOriginalFile(file, kind);
    if (invalid) { setError(invalid); return false; }
    if (retryOriginal && !matchesOriginalFile(retryOriginal, file)) {
      setError("Choose the same file with the original name, type, and size to resume this upload."); return false;
    }
    reserving.current = !retryOriginal;
    if (!retryOriginal) { intentId.current ||= crypto.randomUUID(); setCreateAttempted(true); }
    const response = retryOriginal
      ? await axios.post<{ original: JourneyOriginal; upload?: OriginalUpload; upload_error?: string }>(`/api/journeys/originals/${retryOriginal.id}/upload-url`, {}, config)
      : await axios.post<{ original: JourneyOriginal; upload?: OriginalUpload; upload_error?: string }>("/api/journeys/originals", { requestId: intentId.current, entryId: entry.id, kind, label: label.trim(), file_name: file.name, mime_type: file.type, byte_size: file.size }, config);
    if (config.signal.aborted || !alive.current) return;
    const reserved = response.data.original;
    upsert(reserved);
    setRetryOriginal(reserved);
    reserving.current = false;
    if (!response.data.upload) {
      setError(response.data.upload_error || "Upload preparation was interrupted. Your private pending original is saved; try resuming it.");
      return;
    }
    setProgress(0);
    await axios.put(response.data.upload.url, file, {
      headers: response.data.upload.headers,
      signal: config.signal,
      onUploadProgress: event => {
        if (alive.current && !config.signal.aborted) setProgress(Math.round((event.loaded / (event.total || file.size)) * 100));
      },
    });
    if (config.signal.aborted || !alive.current) return;
    const finished = await axios.post<{ original: JourneyOriginal }>(`/api/journeys/originals/${reserved.id}/finalize`, {}, config);
    if (config.signal.aborted || !alive.current) return;
    upsert(finished.data.original);
    resetComposer();
    setNotice("Original saved privately. Preview it, then share it when you are ready.");
  };

  const saveEdit = (original: JourneyOriginal) => void mutate(async config => {
    if (!editLabel.trim() || (original.kind === "journal" && !editJournal.trim())) {
      setError("A label and journal text are required."); return false;
    }
    const response = await axios.patch<{ original: JourneyOriginal }>(`/api/journeys/originals/${original.id}`, {
      label: editLabel.trim(), ...(original.kind === "journal" ? { journal_text: editJournal } : {}),
    }, config);
    if (config.signal.aborted || !alive.current) return;
    upsert(response.data.original);
    setEditing(null);
    setNotice("Original updated.");
  });
  const startEdit = (original: JourneyOriginal) => void mutate(async config => {
    const response = await axios.get<{ original: JourneyOriginal }>(`/api/journeys/originals/${original.id}`, config);
    if (config.signal.aborted || !alive.current) return;
    setEditing(original.id);
    setEditLabel(response.data.original.label);
    setEditJournal(response.data.original.journal_text || "");
  }, false);
  const changeSharing = (original: JourneyOriginal, shared: boolean) => void mutate(async config => {
    const response = await axios.patch<{ original: JourneyOriginal }>(`/api/journeys/originals/${original.id}`, { is_shared: shared }, config);
    if (config.signal.aborted || !alive.current) return;
    upsert(response.data.original);
    setSharing(null);
    setNotice(shared ? "Original shared with people who can view this journey and season." : "Original is private again.");
  });
  const remove = (original: JourneyOriginal) => void mutate(async config => {
    await axios.delete(`/api/journeys/originals/${original.id}`, config);
    if (config.signal.aborted || !alive.current) return;
    setOriginals(items => items.filter(item => item.id !== original.id));
    setRemoving(null);
    if (retryOriginal?.id === original.id) resetComposer();
    setNotice("Original removed from this journey entry.");
  });
  const sorted = [...originals].sort((a, b) => a.display_order - b.display_order || a.id - b.id);
  const move = (index: number, direction: -1 | 1) => void mutate(async config => {
    const reordered = [...sorted];
    [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
    const response = await axios.post<{ originals: JourneyOriginal[] }>("/api/journeys/originals/reorder", { entryId: entry.id, originalIds: reordered.map(item => item.id) }, config);
    if (config.signal.aborted || !alive.current) return;
    setOriginals(response.data.originals);
    setNotice(`${sorted[index].label} moved ${direction < 0 ? "up" : "down"}.`);
  });

  return <div className="min-w-0 space-y-5">
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="flex items-center gap-2 text-sm font-medium"><Lock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />New originals are private</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Only you can see a new original. Share each one explicitly to make it visible alongside the song. Sharing is always limited by your journey and season visibility.</p>
    </div>
    {error && <div role="alert" className="rounded-xl border border-destructive/40 bg-background p-3 text-sm text-destructive">{error}{!storage && !loading && <Button variant="outline" size="sm" className="mt-2 block" onClick={() => setLoadAttempt(value => value + 1)}>Try loading again</Button>}</div>}
    {notice && <p role="status" className="text-sm leading-relaxed text-foreground">{notice}</p>}
    {loading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading originals…</p>}
    {storage && !storage.enabled && <p className="rounded-xl border border-border bg-background p-3 text-sm leading-relaxed text-muted-foreground">{storage.message || "File uploads are temporarily unavailable while private storage is verified. You can still add a private journal entry."}</p>}
    <ol className="space-y-3" aria-label="Originals in display order">
      {sorted.map((original, index) => {
        const Icon = originalIcons[original.kind];
        const open = preview === original.id;
        return <li key={original.id} className="min-w-0 rounded-xl border border-border bg-background p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <Icon className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{original.label}</h3><p className="mt-1 break-words text-xs text-muted-foreground">{originalNames[original.kind]}{original.byte_size ? ` · ${originalFileSize(original.byte_size)}` : ""}</p><p className="mt-1 text-xs font-medium text-foreground">{original.status === "pending" ? "Upload unfinished · Private" : original.is_shared ? "Shared within journey visibility" : "Private · Only you"}</p></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {original.status === "ready" ? <Button variant="outline" size="sm" disabled={busy} aria-expanded={open} aria-controls={`${prefix}-preview-${original.id}`} onClick={() => {
              setPreview(open ? null : original.id);
              if (!visited.includes(original.id)) setVisited(items => [...items, original.id]);
            }}>{open ? "Close preview" : "Preview"}</Button> : <>
              <Button variant="outline" size="sm" disabled={busy || !storage?.enabled} onClick={() => {
                resetComposer();
                setRetryOriginal(original); setKind(original.kind); setLabel(original.label); setFile(null); setComposer(true); setError("");
                if (fileInput.current) fileInput.current.value = "";
              }}><Upload className="mr-1.5 h-3.5 w-3.5" />Resume upload</Button>
              <Button variant="ghost" size="sm" disabled={busy || !storage?.enabled} onClick={() => void mutate(async config => {
                const response = await axios.post<{ original: JourneyOriginal }>(`/api/journeys/originals/${original.id}/finalize`, {}, config);
                if (config.signal.aborted || !alive.current) return;
                upsert(response.data.original); setNotice("Completed upload verified and saved privately.");
              })}>Check completed upload</Button>
            </>}
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => startEdit(original)} aria-label={`Edit ${original.label}`}><Pencil className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
            {original.status === "ready" && <Button variant="ghost" size="sm" disabled={busy} onClick={() => original.is_shared ? changeSharing(original, false) : setSharing(original.id)}>{original.is_shared ? <Lock className="mr-1.5 h-3.5 w-3.5" /> : <Share2 className="mr-1.5 h-3.5 w-3.5" />}{original.is_shared ? "Make private" : "Share"}</Button>}
            <Button variant="ghost" size="icon" className="h-9 w-9" disabled={busy || index === 0} aria-label={`Move ${original.label} up`} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" disabled={busy || index === sorted.length - 1} aria-label={`Move ${original.label} down`} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" disabled={busy} aria-label={`Remove ${original.label}`} onClick={() => setRemoving(original.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
          {sharing === original.id && <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-3"><p className="text-sm leading-relaxed">Share “{original.label}” with anyone who can see this journey and season? It may become public when both are public.</p><div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => changeSharing(original, true)}><Check className="mr-1.5 h-4 w-4" />Share original</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setSharing(null)}>Keep private</Button></div></div>}
          {removing === original.id && <div className="mt-3 space-y-3 rounded-lg border border-border p-3"><p className="text-sm">Remove this original? Your finished song, reflection, and source link will be kept.</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(original)}>Remove original</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setRemoving(null)}>Keep original</Button></div></div>}
          {editing === original.id && <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={event => { event.preventDefault(); saveEdit(original); }}>
            <div className="space-y-2"><Label htmlFor={`${prefix}-edit-label-${original.id}`}>Label</Label><Input id={`${prefix}-edit-label-${original.id}`} maxLength={120} value={editLabel} disabled={busy} onChange={event => setEditLabel(event.target.value)} required /></div>
            {original.kind === "journal" && <div className="space-y-2"><Label htmlFor={`${prefix}-edit-journal-${original.id}`}>Journal text</Label><Textarea id={`${prefix}-edit-journal-${original.id}`} maxLength={50000} value={editJournal} disabled={busy} onChange={event => setEditJournal(event.target.value)} className="min-h-40" required /></div>}
            <div className="flex flex-wrap gap-2"><Button type="submit" size="sm" disabled={busy}>Save original</Button><Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setEditing(null)}>Cancel edit</Button></div>
          </form>}
          <div id={`${prefix}-preview-${original.id}`} hidden={!open} className="mt-4 min-w-0 border-t border-border pt-4">{visited.includes(original.id) && original.status === "ready" && <JourneyOriginalPreview original={original} active={open} />}</div>
        </li>;
      })}
    </ol>
    {!loading && !originals.length && <p className="py-3 text-center text-sm leading-relaxed text-muted-foreground">Keep a first recording, a journal page, or an image close to the song it inspired.</p>}
    {composer ? <form className="min-w-0 space-y-4 rounded-xl border border-primary/25 bg-muted/20 p-4" onSubmit={event => { event.preventDefault(); void mutate(upload); }}>
      <h3 className="font-serif text-xl">{retryOriginal ? "Resume your original" : "Add an original"}</h3>
      {!retryOriginal && <fieldset disabled={busy || createAttempted} className="space-y-2"><legend className="text-sm font-medium">Original type</legend><div className="flex flex-wrap gap-2">{(["journal", "audio", "image", "pdf"] as const).map(value => <label key={value} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm"><input type="radio" name={`${prefix}-kind`} value={value} checked={kind === value} disabled={value !== "journal" && !storage?.enabled} onChange={() => { setKind(value); setFile(null); setError(""); }} />{originalNames[value]}</label>)}</div></fieldset>}
      <div className="space-y-2"><Label htmlFor={`${prefix}-new-label`}>Label</Label><Input id={`${prefix}-new-label`} maxLength={120} value={label} disabled={busy || createAttempted || Boolean(retryOriginal)} onChange={event => setLabel(event.target.value)} placeholder="A first recording, a page from my journal…" required /></div>
      {kind === "journal" ? <div className="space-y-2"><Label htmlFor={`${prefix}-new-journal`}>Journal text</Label><Textarea id={`${prefix}-new-journal`} value={journal} onChange={event => setJournal(event.target.value)} maxLength={50000} disabled={busy || createAttempted} className="min-h-40" placeholder="Write the memory in your own words…" required /><p className="text-xs text-muted-foreground">Plain text · {journal.length.toLocaleString()} / 50,000 characters</p></div> : <div className="space-y-2">
        <Label htmlFor={`${prefix}-new-file`}>{retryOriginal ? "Choose the same file again" : "Choose a file"}</Label>
        <Input ref={fileInput} id={`${prefix}-new-file`} type="file" accept={ORIGINAL_ACCEPT[kind]} aria-describedby={`${prefix}-file-help`} disabled={busy || !storage?.enabled || (createAttempted && !retryOriginal)} className="h-auto min-h-11 min-w-0 w-full py-2 text-xs file:mr-2 file:text-xs" onChange={event => {
          const selected = event.target.files?.[0] || null; setFile(selected); setError("");
          if (selected) {
            const invalid = validateOriginalFile(selected, kind); if (invalid) { setError(invalid); setFile(null); }
            else if (retryOriginal && !matchesOriginalFile(retryOriginal, selected)) { setError("Choose the same file with the original name, type, and size."); setFile(null); }
            else if (!label.trim()) setLabel(selected.name.replace(/\.[^.]+$/, "").slice(0, 120));
          }
        }} required />
        <p id={`${prefix}-file-help`} className="break-words text-xs leading-relaxed text-muted-foreground">{ORIGINAL_ACCEPT[kind].replaceAll(".", "").toUpperCase().replaceAll(",", ", ")} · up to {ORIGINAL_LIMITS[kind]} MB.{retryOriginal && ` Original file: ${retryOriginal.file_name} (${originalFileSize(retryOriginal.byte_size)}).`}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">An interrupted upload stays private and can be resumed from this list. After closing or reloading, choose the file again.</p>
      </div>}
      {createAttempted && !busy && !retryOriginal && <p className="text-xs leading-relaxed text-muted-foreground">Retrying keeps the same label and content to prevent duplicate originals. Cancel to start a different original.</p>}
      {progress !== null && <div className="space-y-2"><progress value={progress} max={100} aria-label="Original file upload progress" className="h-2 w-full" /><p role="status" className="text-xs text-muted-foreground">{progress === 100 ? "Verifying uploaded file…" : `Uploading ${progress}%…`}</p></div>}
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={loading || busy || (kind !== "journal" && !storage?.enabled)}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}{busy ? "Saving…" : retryOriginal ? "Resume upload" : "Save privately"}</Button>{busy && kind !== "journal" ? <Button type="button" variant="outline" onClick={() => request.current?.abort()}><X className="mr-1.5 h-4 w-4" />Pause upload</Button> : <Button type="button" variant="outline" disabled={busy} onClick={resetComposer}>Cancel</Button>}</div>
    </form> : <Button variant="outline" disabled={loading || busy || !storage || originals.length >= 20} onClick={() => { setComposer(true); setKind("journal"); setError(""); }}><Plus className="mr-2 h-4 w-4" />Add original</Button>}
    <p className="text-xs leading-relaxed text-muted-foreground">Up to 20 originals per song entry. Nothing is transcribed automatically. Each original saves separately from the song’s reflection and source hyperlink.</p>
  </div>;
}
