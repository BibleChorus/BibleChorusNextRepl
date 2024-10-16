import React, { useState, useEffect } from 'react';
import { Comment } from '@/types';
import { NewCommentForm } from './NewCommentForm';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CommentListProps {
  comments: Comment[];
  topicId: number;
  onCommentAdded: (comment: Comment) => void;
}

export const CommentList: React.FC<CommentListProps> = ({ comments, topicId, onCommentAdded }) => {
  const { user } = useAuth(); // Get the current user
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [likes, setLikes] = useState<Record<number, number>>({});
  const [likedComments, setLikedComments] = useState<number[]>([]); // Track liked comments by the user

  // Fetch likes counts and user's liked comments when the component mounts
  useEffect(() => {
    const fetchLikes = async () => {
      if (comments.length === 0) return;

      try {
        // Fetch likes counts for comments
        const response = await axios.get('/api/likes/comments/likes-count', {
          params: {
            commentIds: comments.map(comment => comment.id),
          },
        });
        setLikes(response.data);

        if (user) {
          // Fetch comments liked by the user
          const userLikesResponse = await axios.get(`/api/users/${user.id}/likes`, {
            params: {
              likeable_type: 'forum_comment',
            },
          });
          setLikedComments(userLikesResponse.data.map((like: any) => like.likeable_id));
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
      if (hasLiked) {
        // Unlike the comment
        await axios.delete('/api/likes', {
          data: {
            user_id: user.id,
            likeable_type: 'forum_comment',
            likeable_id: commentId,
          },
        });
        setLikedComments(likedComments.filter(id => id !== commentId));
        setLikes(prevLikes => ({
          ...prevLikes,
          [commentId]: (prevLikes[commentId] || 1) - 1,
        }));
      } else {
        // Like the comment
        await axios.post('/api/likes', {
          user_id: user.id,
          likeable_type: 'forum_comment',
          likeable_id: commentId,
        });
        setLikedComments([...likedComments, commentId]);
        setLikes(prevLikes => ({
          ...prevLikes,
          [commentId]: (prevLikes[commentId] || 0) + 1,
        }));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to update like');
    }
  };

  const renderComments = (commentList: Comment[], parentId: number | null = null, depth: number = 0) => {
    return commentList
      .filter((comment) => comment.parent_comment_id === parentId)
      .map((comment) => (
        <div key={comment.id} className={`p-4 bg-card rounded-lg shadow-sm ${depth > 0 ? 'ml-4 mt-2' : 'mt-4'}`}>
          <p className="text-sm text-muted-foreground mb-2">
            {comment.username} • {new Date(comment.created_at).toLocaleString()}
          </p>
          <p>{comment.content}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
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
            <Button variant="ghost" size="sm" onClick={() => handleLike(comment.id)}>
              {likedComments.includes(comment.id) ? '👎 Unlike' : '👍 Like'} ({likes[comment.id] || 0})
            </Button>
          </div>
          {/* Render replies */}
          <div className="mt-2">
            {renderComments(commentList, comment.id, depth + 1)}
          </div>
        </div>
      ));
  };

  return <div className="space-y-4">{renderComments(comments)}</div>;
};
