import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { FileText, Lock, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PdfNote } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Older responses may expose a content alias; storage and writes use note. */
interface CompatiblePdfNote extends PdfNote {
  content?: string | null;
}

interface NotesSectionProps {
  initialNotes: PdfNote[];
  pdfId: number;
  theme: Record<string, string>;
  isDark: boolean;
}

/** A keyed child clears private notes and drafts immediately when the account changes. */
export function NotesSection({ initialNotes, pdfId }: NotesSectionProps) {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return (
      <p role="status" className="py-6 text-sm text-muted-foreground">
        Loading your personal notes…
      </p>
    );
  if (!user)
    return (
      <div className="rounded-xl border border-border p-8 text-center">
        <Lock className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
        <p className="mb-4 text-sm text-muted-foreground">
          Sign in to create and view your personal notes.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  return (
    <PersonalNotes
      key={`${user.id}:${pdfId}`}
      userId={user.id}
      pdfId={pdfId}
      initialNotes={initialNotes.filter(
        (note) =>
          Number(note.user_id) === user.id && Number(note.pdf_id) === pdfId,
      )}
    />
  );
}

function PersonalNotes({
  initialNotes,
  pdfId,
  userId,
}: {
  initialNotes: PdfNote[];
  pdfId: number;
  userId: number;
}) {
  const [notes, setNotes] = useState<CompatiblePdfNote[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [page, setPage] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const validPage = page === "" || (Number.isInteger(page) && page > 0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    axios
      .get<CompatiblePdfNote[]>(`/api/pdfs/${pdfId}/notes`, {
        signal: controller.signal,
      })
      .then((response) => {
        setNotes(
          response.data.filter(
            (note) =>
              Number(note.user_id) === userId && Number(note.pdf_id) === pdfId,
          ),
        );
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          console.error(
            "Error loading personal notes:",
            failure instanceof Error ? failure.message : "Unknown error",
          );
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [pdfId, userId, refreshKey]);

  const addNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || !draft.trim() || !validPage || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await axios.post<CompatiblePdfNote>(
        `/api/pdfs/${pdfId}/notes`,
        {
          note: draft,
          page_number: page || null,
        },
      );
      setNotes((previous) => [response.data, ...previous]);
      setDraft("");
      setPage("");
      toast.success("Note saved");
    } catch (failure) {
      console.error(
        "Error adding note:",
        failure instanceof Error ? failure.message : "Unknown error",
      );
      toast.error("Could not save your note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const deleteNote = async (id: number) => {
    if (loading || deletingId !== null) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/pdfs/${pdfId}/notes/${id}`);
      setNotes((previous) => previous.filter((note) => note.id !== id));
      toast.success("Note deleted");
    } catch (failure) {
      console.error(
        "Error deleting note:",
        failure instanceof Error ? failure.message : "Unknown error",
      );
      toast.error("Could not delete your note. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={addNote}
        className="rounded-xl border border-border bg-muted/40 p-5"
      >
        <label
          htmlFor={`pdf-note-${pdfId}`}
          className="mb-2 block text-sm font-medium"
        >
          A thought to return to
        </label>
        <Textarea
          id={`pdf-note-${pdfId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a personal insight about this resource…"
          className="min-h-[120px] resize-y bg-card"
          maxLength={100000}
          disabled={isSubmitting}
        />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <label
              htmlFor={`pdf-note-page-${pdfId}`}
              className="mb-1.5 block text-xs text-muted-foreground"
            >
              Page reference (optional)
            </label>
            <Input
              id={`pdf-note-page-${pdfId}`}
              type="number"
              min={1}
              step={1}
              value={page}
              onChange={(event) =>
                setPage(event.target.value ? Number(event.target.value) : "")
              }
              placeholder="#"
              className="h-10 w-24 bg-card"
              disabled={isSubmitting}
              aria-invalid={!validPage}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !draft.trim() || !validPage || isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving…" : "Save note"}
          </Button>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          These notes are just for you.
        </p>
      </form>
      {loadError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
        >
          <p className="text-sm text-muted-foreground">
            Your saved notes couldn’t load.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      )}
      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading saved notes…
        </p>
      )}
      {notes.length ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <article
              key={note.id}
              className="group rounded-xl border border-border p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {note.page_number && (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                        Page {note.page_number}
                      </span>
                    )}
                    <time dateTime={note.created_at}>
                      {new Date(note.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {note.content ?? note.note}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteNote(note.id)}
                  disabled={loading || deletingId !== null}
                  aria-label={`Delete note${note.page_number ? ` on page ${note.page_number}` : ""}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !loading &&
        !loadError && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No notes yet. Start with something you want to remember.
            </p>
          </div>
        )
      )}
    </div>
  );
}
