import React, { useState, useEffect } from 'react';
import { SongComment } from '@/types';
import { NewCommentForm } from './NewCommentForm';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactHtmlParser from 'html-react-parser';

interface CommentListProps {
  comments: SongComment[];
  songId: number;
  onCommentAdded: (comment: SongComment) => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  songId,
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
            commentType: 'song_comment'
          },
        });
        setLikes(response.data);

        if (user) {
          const userLikesResponse = await axios.get(
            `/api/users/${user.id}/likes`,
            {
              params: {
                likeable_type: 'song_comment',
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
            likeable_type: 'song_comment',
            likeable_id: commentId,
          },
        });
        setLikedComments(likedComments.filter((id) => id !== commentId));
      } else {
        await axios.post('/api/likes', {
          user_id: user.id,
          likeable_type: 'song_comment',
          likeable_id: commentId,
        });
        setLikedComments([...likedComments, commentId]);
      }

      const response = await axios.get('/api/likes/comments/likes-count', {
        params: {
          commentIds: commentId,
          commentType: 'song_comment'
        },
      });
      setLikes({ ...likes, [commentId]: response.data[commentId] });
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const renderComments = (
    commentList: SongComment[],
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
          <div className="prose">{ReactHtmlParser(comment.comment)}</div>
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
              songId={songId}
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
