import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface ThemeColors {
  bg: string;
  bgAlt: string;
  bgCard: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  borderLight: string;
  borderHover: string;
  hoverBg: string;
  cardBorder: string;
}

interface NewCommentFormProps {
  pdfId: number;
  onCommentAdded: (comment: any) => void;
  parentCommentId?: number;
  theme: ThemeColors;
  isDark: boolean;
}

export const NewCommentForm: React.FC<NewCommentFormProps> = ({ 
  pdfId, 
  onCommentAdded, 
  parentCommentId,
  theme,
  isDark
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [page, setPage] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <style jsx global>{`
        .pdf-comment-editor .ql-toolbar {
          border: 1px solid ${theme.border} !important;
          border-bottom: none !important;
          background: ${theme.bgAlt} !important;
        }
        .pdf-comment-editor .ql-container {
          border: 1px solid ${theme.border} !important;
          background: transparent !important;
          font-family: 'Manrope', sans-serif !important;
        }
        .pdf-comment-editor .ql-editor {
          min-height: 120px !important;
          color: ${theme.text} !important;
          font-size: 0.9375rem !important;
          line-height: 1.6 !important;
        }
        .pdf-comment-editor .ql-editor.ql-blank::before {
          color: ${theme.textMuted} !important;
          font-style: normal !important;
        }
        .pdf-comment-editor .ql-stroke {
          stroke: ${theme.textSecondary} !important;
        }
        .pdf-comment-editor .ql-fill {
          fill: ${theme.textSecondary} !important;
        }
        .pdf-comment-editor .ql-picker {
          color: ${theme.textSecondary} !important;
        }
        .pdf-comment-editor .ql-picker-options {
          background: ${theme.bgCard} !important;
          border: 1px solid ${theme.border} !important;
        }
        .pdf-comment-editor .ql-toolbar button:hover .ql-stroke,
        .pdf-comment-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: ${theme.accent} !important;
        }
        .pdf-comment-editor .ql-toolbar button:hover .ql-fill,
        .pdf-comment-editor .ql-toolbar button.ql-active .ql-fill {
          fill: ${theme.accent} !important;
        }
      `}</style>
      
      <div className="pdf-comment-editor">
        <ReactQuill
          value={content}
          onChange={setContent}
          placeholder="Share your thoughts..."
          modules={{
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link'],
              ['clean']
            ]
          }}
        />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <label 
            className="block text-[10px] tracking-[0.15em] uppercase mb-1.5"
            style={{ color: theme.textMuted }}
          >
            Page Reference
          </label>
          <Input
            type="number"
            value={page}
            onChange={(e) => setPage(e.target.value ? Number(e.target.value) : '')}
            placeholder="#"
            className="w-20 h-10 rounded-none bg-transparent text-center"
            style={{
              borderColor: theme.border,
              color: theme.text,
            }}
          />
        </div>
        
        <div className="flex-1 flex justify-end items-end">
          <Button 
            onClick={handleAddComment} 
            disabled={!content.trim() || isSubmitting}
            className="h-10 px-6 rounded-none text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300 disabled:opacity-50"
            style={{
              backgroundColor: theme.accent,
              color: isDark ? '#050505' : '#ffffff',
            }}
          >
            <ArrowRight className="w-3.5 h-3.5 mr-2" />
            {parentCommentId ? 'Reply' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
};
