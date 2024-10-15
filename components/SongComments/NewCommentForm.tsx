import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NewCommentFormProps {
  songId: number;
  onCommentAdded: (comment: any) => void;
  parentCommentId?: number;
}

export const NewCommentForm: React.FC<NewCommentFormProps> = ({ songId, onCommentAdded, parentCommentId }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = async () => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }

    try {
      const response = await axios.post(`/api/songs/${songId}/comments`, {
        comment: commentText,
        parent_comment_id: parentCommentId || null,
      });
      onCommentAdded(response.data);
      setCommentText('');
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="mb-6">
      <Textarea
        placeholder="Write your comment here..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        className="mb-2"
      />
      <Button onClick={handleAddComment} disabled={!commentText}>
        {parentCommentId ? 'Reply' : 'Add Comment'}
      </Button>
    </div>
  );
};
