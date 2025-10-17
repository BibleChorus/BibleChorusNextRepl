import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface NewCommentFormProps {
  songId: number;
  onCommentAdded: (comment: any) => void;
  parentCommentId?: number;
}

export const NewCommentForm: React.FC<NewCommentFormProps> = ({ songId, onCommentAdded, parentCommentId }) => {
  const { user, getAuthToken } = useAuth();
  const [content, setContent] = useState('');

  const handleAddComment = async () => {
    if (!user) {
      toast.error('You must be logged in to add a comment');
      return;
    }

    const token = await getAuthToken();

    if (!token) {
      toast.error('Your session has expired. Please log in again.');
      return;
    }

    try {
      const response = await axios.post(
        `/api/songs/${songId}/comments`,
        {
          comment: content,
          parent_comment_id: parentCommentId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onCommentAdded(response.data);
      setContent('');
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('You must be logged in to add a comment');
        return;
      }
      toast.error('Failed to add comment');
    }
  };

  const isContentEmpty = useMemo(() => {
    if (!content) {
      return true;
    }

    const textContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return textContent.length === 0;
  }, [content]);

  return (
    <div className="mb-6">
      <div className="border rounded-md mb-2">
        <ReactQuill
          value={content}
          onChange={setContent}
          className="[&_.ql-editor]:min-h-[100px]"
        />
      </div>
      <Button onClick={handleAddComment} disabled={isContentEmpty}>
        {parentCommentId ? 'Reply' : 'Add Comment'}
      </Button>
    </div>
  );
};
