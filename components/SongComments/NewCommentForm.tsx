import {
  RichTextEditor,
  richTextHasContent,
} from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import React, { useState } from "react";
import { toast } from "sonner";

interface NewCommentFormProps {
  songId: number;
  onCommentAdded: (comment: any) => void;
  parentCommentId?: number;
}

export const NewCommentForm: React.FC<NewCommentFormProps> = ({
  songId,
  onCommentAdded,
  parentCommentId,
}) => {
  const { user, getAuthToken } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!richTextHasContent(content) || isSubmitting) return;
    if (!user) {
      toast.error("You must be logged in to add a comment");
      return;
    }

    const token = await getAuthToken();

    if (!token) {
      toast.error("Your session has expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `/api/songs/${songId}/comments`,
        {
          comment: content,
          parent_comment_id: parentCommentId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      onCommentAdded(response.data);
      setContent("");
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error(
        "Error adding comment:",
        error instanceof Error ? error.message : "Unknown error",
      );
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("You must be logged in to add a comment");
        return;
      }
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="mb-2">
        <RichTextEditor
          label="Your comment on this song"
          readOnly={isSubmitting}
          value={content}
          onChange={setContent}
          className="[&_.ql-editor]:min-h-[100px]"
        />
      </div>
      <Button
        onClick={handleAddComment}
        disabled={!richTextHasContent(content) || isSubmitting}
      >
        {isSubmitting ? "Posting…" : parentCommentId ? "Reply" : "Add comment"}
      </Button>
    </div>
  );
};
