import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Comment } from "@/types";
import axios from "axios";
import ReactHtmlParser from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { NewCommentForm } from "./NewCommentForm";
import { VoteButtons } from "./VoteButtons";

interface CommentListProps {
  comments: Comment[];
  topicId: number;
  onCommentAdded: (comment: Comment) => void;
  canReply?: boolean;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  topicId,
  onCommentAdded,
  canReply = true,
}) => {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedComments, setLikedComments] = useState<number[]>([]);

  useEffect(() => {
    const fetchLikes = async () => {
      if (comments.length === 0) return;

      try {
        const response = await axios.get("/api/likes/comments/likes-count", {
          params: {
            commentIds: comments.map((comment) => comment.id).join(","),
            commentType: "forum_comment", // Add this line
          },
        });
        setLikes(response.data);

        if (user) {
          const userLikesResponse = await axios.get(
            `/api/users/${user.id}/likes`,
            {
              params: {
                likeable_type: "forum_comment",
              },
            },
          );
          setLikedComments(
            userLikesResponse.data.map((like: any) => like.likeable_id),
          );
        }
      } catch (error) {
        console.error("Error fetching likes:", error);
        toast.error("Failed to load comment likes");
      }
    };

    fetchLikes();
  }, [comments, user]);

  const handleLike = async (commentId: number) => {
    if (!user) {
      toast.error("You must be logged in to like comments");
      return;
    }

    try {
      if (likedComments.includes(commentId)) {
        await axios.delete("/api/likes", {
          data: {
            user_id: user.id,
            likeable_type: "forum_comment",
            likeable_id: commentId,
          },
        });
        setLikedComments(likedComments.filter((id) => id !== commentId));
      } else {
        await axios.post("/api/likes", {
          user_id: user.id,
          likeable_type: "forum_comment",
          likeable_id: commentId,
        });
        setLikedComments([...likedComments, commentId]);
      }

      const response = await axios.get("/api/likes/comments/likes-count", {
        params: {
          commentIds: commentId,
          commentType: "forum_comment", // Add this line
        },
      });
      setLikes({ ...likes, [commentId]: response.data[commentId] });
    } catch (error) {
      console.error("Error updating like:", error);
      toast.error("Failed to update like");
    }
  };

  const renderComments = (
    commentList: Comment[],
    parentId: number | null = null,
    depth: number = 0,
  ) => {
    return commentList
      .filter((comment) => comment.parent_comment_id === parentId)
      .map((comment) => (
        <div
          key={comment.id}
          className={cn(
            "surface-card p-4 sm:p-5",
            depth > 0
              ? "ml-1 mt-4 border-l-2 border-l-primary/20 sm:ml-3"
              : "mt-4",
          )}
        >
          <p className="text-sm text-muted-foreground mb-2">
            {comment.username} • {new Date(comment.created_at).toLocaleString()}
          </p>
          <div className={richTextStyles.prose}>
            {ReactHtmlParser(DOMPurify.sanitize(comment.content || ""))}
          </div>
          {user && canReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setReplyingTo(replyingTo === comment.id ? null : comment.id)
              }
              className="mt-2"
            >
              {replyingTo === comment.id ? "Cancel Reply" : "Reply"}
            </Button>
          )}
          {user && canReply && replyingTo === comment.id && (
            <NewCommentForm
              topicId={topicId}
              onCommentAdded={(newComment) => {
                onCommentAdded(newComment);
                setReplyingTo(null);
              }}
              parentCommentId={comment.id}
            />
          )}
          <div className="flex items-center gap-2 mt-2">
            <VoteButtons
              itemId={comment.id}
              itemType="comment"
              initialUpvotes={comment.upvotes || 0}
              initialDownvotes={comment.downvotes || 0}
              initialUserVote={comment.userVote}
            />
          </div>
          <div className="mt-2">
            {renderComments(commentList, comment.id, depth + 1)}
          </div>
        </div>
      ));
  };

  const richTextStyles = {
    prose: cn(
      "prose dark:prose-invert",
      // Links
      "prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-500",
      // Lists
      "prose-ol:list-decimal prose-ul:list-disc",
      // Headings
      "prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4",
      "prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3",
      "prose-h3:text-lg prose-h3:font-bold prose-h3:mb-2",
      // Add spacing for lists
      "prose-ol:my-4 prose-ul:my-4",
      // Ensure proper list indentation
      "prose-ol:pl-4 prose-ul:pl-4",
    ),
  };

  return <div className="space-y-4">{renderComments(comments)}</div>;
};
