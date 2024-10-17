import React, { useState, useEffect } from 'react';
import { Comment } from '@/types';
import { NewCommentForm } from './NewCommentForm';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import qs from 'qs';
import ReactHtmlParser from 'html-react-parser';

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
          },
        });
        const likesData: Record<string, number> = {};

        Object.entries(response.data).forEach(([likeableId, count]) => {
          likesData[likeableId] = Number(count) || 0;
        });
        setLikes(likesData);

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
        toast.error('Failed to load likes. Please try refreshing the page.');
      }
    };

    fetchLikes();
  }, [comments, user]);

  const handleLike = async (commentId: number) => {
    if (!user) {
      toast.error('Please log in to like comments.');
      return;
    }

    try {
      const hasLiked = likedComments.includes(commentId);
      let response;

      if (hasLiked) {
        // User wants to unlike the comment
        response = await axios.delete('/api/likes', {
          data: {
            user_id: user.id,
            likeable_type: 'forum_comment',
            likeable_id: commentId,
          },
        });
        setLikedComments(likedComments.filter((id) => id !== commentId));
      } else {
        // User wants to like the comment
        response = await axios.post('/api/likes', {
          user_id: user.id,
          likeable_type: 'forum_comment',
          likeable_id: commentId,
        });
        setLikedComments([...likedComments, commentId]);
      }

      // Update the likes count with the new value from the server
      setLikes((prevLikes) => ({
        ...prevLikes,
        [commentId.toString()]: Number(response.data.count) || 0,
      }));
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to update like');
    }
  };

  // Recursive function to render nested comments
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
          <div className="prose">{ReactHtmlParser(comment.content)}</div>
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
          <div className="flex items-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLike(comment.id)}
            >
              {likedComments.includes(comment.id) ? '👎 Unlike' : '👍 Like'} (
              {likes[comment.id.toString()] || 0})
            </Button>
          </div>
          <div className="mt-2">
            {renderComments(commentList, comment.id, depth + 1)}
          </div>
        </div>
      ));
  };

  return <div className="space-y-4">{renderComments(comments)}</div>;
};
