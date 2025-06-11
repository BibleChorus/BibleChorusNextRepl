import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface NewCommentFormProps {
  pdfId: number;
  onCommentAdded: (comment: any) => void;
  parentCommentId?: number;
}

export const NewCommentForm: React.FC<NewCommentFormProps> = ({ pdfId, onCommentAdded, parentCommentId }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [page, setPage] = useState<number | ''>('');

  const handleAddComment = async () => {
    try {
      const response = await axios.post(`/api/pdfs/${pdfId}/comments`, {
        comment: content,
        user_id: user?.id,
        parent_comment_id: parentCommentId,
        page_number: page || null,
      });
      onCommentAdded(response.data);
      setContent('');
      setPage('');
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="mb-6">
      <div className="border rounded-md mb-2">
        <ReactQuill
          value={content}
          onChange={setContent}
          className="[&_.ql-editor]:min-h-[100px]"
        />
      </div>
      <Input
        value={page}
        onChange={(e) => setPage(e.target.value ? Number(e.target.value) : '')}
        placeholder="Page # (optional)"
        className="w-32 mb-2"
      />
      <Button onClick={handleAddComment} disabled={!content}>
        {parentCommentId ? 'Reply' : 'Add Comment'}
      </Button>
    </div>
  );
};
