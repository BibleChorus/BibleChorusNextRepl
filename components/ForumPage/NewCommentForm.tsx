import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NewCommentFormProps {
  topicId: number;
  onCommentAdded: (comment: any) => void;
  parentCommentId?: number;
}

export const NewCommentForm: React.FC<NewCommentFormProps> = ({ topicId, onCommentAdded, parentCommentId }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const handleAddComment = async () => {
    try {
      const response = await axios.post(`/api/forum/topics/${topicId}/comments`, {
        content,
        user_id: user?.id,
        parent_comment_id: parentCommentId,
      });
      onCommentAdded(response.data);
      setContent('');
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
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mb-2"
      />
      <Button onClick={handleAddComment} disabled={!content}>
        {parentCommentId ? 'Reply' : 'Add Comment'}
      </Button>
    </div>
  );
};
