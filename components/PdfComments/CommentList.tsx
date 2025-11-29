import React, { useState } from 'react';
import { PdfComment } from '@/types';
import { NewCommentForm } from './NewCommentForm';
import { Button } from '@/components/ui/button';
import ReactHtmlParser from 'html-react-parser';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

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

interface CommentListProps {
  comments: PdfComment[];
  pdfId: number;
  fileUrl: string;
  onCommentAdded: (comment: PdfComment) => void;
  theme: ThemeColors;
  isDark: boolean;
}

export const CommentList: React.FC<CommentListProps> = ({ 
  comments, 
  pdfId, 
  fileUrl, 
  onCommentAdded,
  theme,
  isDark
}) => {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const richTextStyles = {
    prose: cn(
      'prose dark:prose-invert max-w-none',
      'prose-a:underline',
      'prose-ol:list-decimal prose-ul:list-disc',
      'prose-h1:text-xl prose-h1:font-medium prose-h1:mb-3',
      'prose-h2:text-lg prose-h2:font-medium prose-h2:mb-2',
      'prose-h3:text-base prose-h3:font-medium prose-h3:mb-2',
      'prose-ol:my-3 prose-ul:my-3',
      'prose-ol:pl-4 prose-ul:pl-4',
      'prose-p:my-2'
    ),
  };

  const renderComments = (
    commentList: PdfComment[],
    parentId: number | null = null,
    depth: number = 0
  ) => {
    const filteredComments = commentList.filter((comment) => comment.parent_comment_id === parentId);
    
    if (filteredComments.length === 0) {
      return null;
    }

    return filteredComments.map((comment, index) => (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={`${depth > 0 ? 'ml-6 mt-4' : 'mt-6'}`}
      >
        <div 
          className="p-5"
          style={{ 
            border: `1px solid ${theme.borderLight}`,
            backgroundColor: depth > 0 ? theme.hoverBg : 'transparent'
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-8 h-8 flex items-center justify-center text-xs font-medium"
              style={{ 
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bgAlt,
                fontFamily: "'Italiana', serif",
                color: theme.accent
              }}
            >
              {comment.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <span 
                className="text-sm font-medium"
                style={{ color: theme.text }}
              >
                {comment.username}
              </span>
              <span 
                className="text-xs ml-2"
                style={{ color: theme.textMuted }}
              >
                {new Date(comment.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {comment.page_number && (
              <a
                href={`${fileUrl}#page=${comment.page_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-[10px] tracking-[0.1em] uppercase transition-all duration-300"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  color: theme.accent,
                }}
              >
                Page {comment.page_number}
              </a>
            )}
          </div>
          
          <div 
            className={richTextStyles.prose}
            style={{ 
              color: theme.textSecondary,
              fontSize: '0.9375rem',
              lineHeight: '1.6'
            }}
          >
            {ReactHtmlParser(comment.comment)}
          </div>
          
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="h-8 px-3 rounded-none text-[10px] tracking-[0.15em] uppercase font-medium transition-all duration-300"
              style={{ 
                border: `1px solid ${theme.border}`,
                color: theme.textMuted,
                backgroundColor: 'transparent'
              }}
            >
              <MessageSquare className="w-3 h-3 mr-2" />
              {replyingTo === comment.id ? 'Cancel' : 'Reply'}
            </Button>
          </div>
          
          {replyingTo === comment.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <NewCommentForm
                pdfId={pdfId}
                onCommentAdded={(newComment) => {
                  onCommentAdded(newComment);
                  setReplyingTo(null);
                }}
                parentCommentId={comment.id}
                theme={theme}
                isDark={isDark}
              />
            </motion.div>
          )}
        </div>
        
        <div className="border-l" style={{ borderColor: theme.borderLight }}>
          {renderComments(commentList, comment.id, depth + 1)}
        </div>
      </motion.div>
    ));
  };

  if (comments.length === 0) {
    return (
      <div 
        className="text-center py-12"
        style={{ border: `1px solid ${theme.borderLight}` }}
      >
        <MessageSquare 
          className="w-8 h-8 mx-auto mb-4" 
          style={{ color: theme.textMuted }} 
        />
        <p 
          className="text-sm font-light"
          style={{ color: theme.textMuted }}
        >
          No comments yet. Be the first to share your thoughts.
        </p>
      </div>
    );
  }

  return <div className="space-y-2">{renderComments(comments)}</div>;
};
