import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { Flag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songId: number;
  userId: string;
  username: string;
  userEmail: string;
}

export function ReportDialog({ isOpen, onClose, songId }: ReportDialogProps) {
  const [reportText, setReportText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (!isOpen) setReportText("");
  }, [isOpen]);
  const submit = async () => {
    if (!reportText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // The server derives reporter attribution from the authenticated session.
      await axios.post("/api/report-song", { songId, reportText });
      toast.success("Report submitted. Thank you for helping the community.");
      onClose();
    } catch (failure) {
      console.error(
        "Error submitting report:",
        failure instanceof Error ? failure.message : "Unknown error",
      );
      toast.error("Could not submit the report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Report a song
          </DialogTitle>
          <DialogDescription>
            Tell us what needs attention: a description, a Scripture connection,
            or something that doesn’t belong in the community.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label
            htmlFor={`song-report-${songId}`}
            className="text-sm font-medium"
          >
            What would you like us to review?
          </label>
          <Textarea
            id={`song-report-${songId}`}
            value={reportText}
            onChange={(event) => setReportText(event.target.value)}
            placeholder="Share enough detail for us to understand the concern…"
            className="min-h-[140px]"
            maxLength={10000}
            disabled={isSubmitting}
          />
        </div>
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!reportText.trim() || isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
