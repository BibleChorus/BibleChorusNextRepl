import {
  RichTextEditor,
  richTextHasContent,
} from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface ThemeColors {
  bg: string;
  bgAlt: string;
  bgCard: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  borderLight: string;
  borderHover: string;
  hoverBg: string;
  cardBorder: string;
}

interface NewCommentFormProps {
  pdfId: number;
  onCommentAdded: (comment: any) => void;
  parentCommentId?: number;
  theme: ThemeColors;
  isDark: boolean;
}

export const NewCommentForm: React.FC<NewCommentFormProps> = ({
  pdfId,
  onCommentAdded,
  parentCommentId,
  theme,
  isDark,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [page, setPage] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (
      !user ||
      !richTextHasContent(content) ||
      isSubmitting ||
      (page !== "" && (!Number.isInteger(page) || page <= 0))
    )
      return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`/api/pdfs/${pdfId}/comments`, {
        comment: content,
        user_id: user?.id,
        parent_comment_id: parentCommentId,
        page_number: page || null,
      });
      onCommentAdded(response.data);
      setContent("");
      setPage("");
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error(
        "Error adding comment:",
        error instanceof Error ? error.message : "Unknown error",
      );
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="pdf-comment-editor">
        <RichTextEditor
          label="Your comment on this study resource"
          readOnly={isSubmitting}
          value={content}
          onChange={setContent}
          placeholder="Share your thoughts..."
          modules={{
            toolbar: [
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link"],
              ["clean"],
            ],
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <label
            htmlFor={`pdf-comment-page-${pdfId}-${parentCommentId || "new"}`}
            className="block text-[10px] tracking-[0.15em] uppercase mb-1.5"
            style={{ color: theme.textMuted }}
          >
            Page Reference
          </label>
          <Input
            id={`pdf-comment-page-${pdfId}-${parentCommentId || "new"}`}
            min={1}
            step={1}
            type="number"
            value={page}
            onChange={(e) =>
              setPage(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="#"
            className="w-20 h-10 rounded-xl bg-transparent text-center"
            style={{
              borderColor: theme.border,
              color: theme.text,
            }}
          />
        </div>

        <div className="flex-1 flex justify-end items-end">
          <Button
            onClick={handleAddComment}
            disabled={
              !richTextHasContent(content) ||
              isSubmitting ||
              (page !== "" && (!Number.isInteger(page) || page <= 0))
            }
            className="h-10 px-6 rounded-xl text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300 disabled:opacity-50"
            style={{
              backgroundColor: theme.accent,
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <ArrowRight className="w-3.5 h-3.5 mr-2" />
            {isSubmitting
              ? "Posting…"
              : parentCommentId
                ? "Reply"
                : "Post comment"}
          </Button>
        </div>
      </div>
    </div>
  );
};
