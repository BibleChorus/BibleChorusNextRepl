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
  topicId: number;
  onCommentAdded: (comment: any) => void;
  parentCommentId?: number;
}

export const NewCommentForm: React.FC<NewCommentFormProps> = ({
  topicId,
  onCommentAdded,
  parentCommentId,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!richTextHasContent(content) || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `/api/forum/topics/${topicId}/comments`,
        {
          content,
          user_id: user?.id,
          parent_comment_id: parentCommentId,
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
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="mb-2">
        <RichTextEditor
          label="Your reply to this conversation"
          readOnly={isSubmitting}
          value={content}
          onChange={setContent}
          className="[&_.ql-editor]:min-h-[120px] [&_.ql-editor]:bg-transparent"
        />
      </div>
      <Button
        onClick={handleAddComment}
        disabled={!richTextHasContent(content) || isSubmitting}
        size="sm"
        className="mt-2"
      >
        {isSubmitting ? "Posting…" : parentCommentId ? "Reply" : "Add comment"}
      </Button>
    </div>
  );
};
