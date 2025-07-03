import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

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
      <div className="rounded-xl overflow-hidden border border-white/20 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md mb-2">
        <ReactQuill
          value={content}
          onChange={setContent}
          className="[&_.ql-editor]:min-h-[120px] [&_.ql-editor]:bg-transparent"
        />
      </div>
      <Button onClick={handleAddComment} disabled={!content} size="sm" className="mt-2">
        {parentCommentId ? 'Reply' : 'Add Comment'}
      </Button>
    </div>
  );
};
