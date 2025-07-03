import React, { useState, useEffect } from 'react';
import { Comment } from '@/types';
import { NewCommentForm } from './NewCommentForm';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactHtmlParser from 'html-react-parser';
import { cn } from "@/lib/utils";
import { VoteButtons } from './VoteButtons';

interface CommentListProps {
  comments: Comment[];
  topicId: number;
  onCommentAdded: (comment: Comment) => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  topicId,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedComments, setLikedComments] = useState<number[]>([]);

  useEffect(() => {
    const fetchLikes = async () => {
      if (comments.length === 0) return;

      try {
        const response = await axios.get('/api/likes/comments/likes-count', {
          params: {
            commentIds: comments.map((comment) => comment.id).join(','),
            commentType: 'forum_comment'  // Add this line
          },
        });
        setLikes(response.data);

        if (user) {
          const userLikesResponse = await axios.get(
            `/api/users/${user.id}/likes`,
            {
              params: {
                likeable_type: 'forum_comment',
              },
            }
          );
          setLikedComments(
            userLikesResponse.data.map((like: any) => like.likeable_id)
          );
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
        toast.error('Failed to load comment likes');
      }
    };

    fetchLikes();
  }, [comments, user]);

  const handleLike = async (commentId: number) => {
    if (!user) {
      toast.error('You must be logged in to like comments');
      return;
    }

    try {
      if (likedComments.includes(commentId)) {
        await axios.delete('/api/likes', {
          data: {
            user_id: user.id,
            likeable_type: 'forum_comment',
            likeable_id: commentId,
          },
        });
        setLikedComments(likedComments.filter((id) => id !== commentId));
      } else {
        await axios.post('/api/likes', {
          user_id: user.id,
          likeable_type: 'forum_comment',
          likeable_id: commentId,
        });
        setLikedComments([...likedComments, commentId]);
      }

      const response = await axios.get('/api/likes/comments/likes-count', {
        params: {
          commentIds: commentId,
          commentType: 'forum_comment'  // Add this line
        },
      });
      setLikes({ ...likes, [commentId]: response.data[commentId] });
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const renderComments = (
    commentList: Comment[],
    parentId: number | null = null,
    depth: number = 0
  ) => {
    return commentList
      .filter((comment) => comment.parent_comment_id === parentId)
      .map((comment) => (
        <div
          key={comment.id}
          className={`p-4 bg-card rounded-lg shadow-sm ${
            depth > 0 ? 'ml-4 mt-2' : 'mt-4'
          }`}
        >
          <p className="text-sm text-muted-foreground mb-2">
            {comment.username} •{' '}
            {new Date(comment.created_at).toLocaleString()}
          </p>
          <div className={richTextStyles.prose}>
            {ReactHtmlParser(comment.content)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setReplyingTo(replyingTo === comment.id ? null : comment.id)
            }
            className="mt-2"
          >
            {replyingTo === comment.id ? 'Cancel Reply' : 'Reply'}
          </Button>
          {replyingTo === comment.id && (
            <NewCommentForm
              topicId={topicId}
              onCommentAdded={(newComment) => {
                onCommentAdded(newComment);
                setReplyingTo(null);
              }}
              parentCommentId={comment.id}
            />
          )}
          <div className="flex items-center gap-4 mt-2">
            <VoteButtons
              itemId={comment.id}
              itemType="comment"
              initialUpvotes={comment.upvotes || 0}
              initialDownvotes={comment.downvotes || 0}
              initialUserVote={comment.userVote}
              orientation="horizontal"
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
      "prose-ol:pl-4 prose-ul:pl-4"
    )
  };

  return <div className="space-y-4">{renderComments(comments)}</div>;
};
