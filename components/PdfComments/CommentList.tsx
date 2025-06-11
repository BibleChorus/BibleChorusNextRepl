import React, { useState } from 'react';
import { PdfComment } from '@/types';
import { NewCommentForm } from './NewCommentForm';
import { Button } from '@/components/ui/button';
import ReactHtmlParser from 'html-react-parser';
import { cn } from '@/lib/utils';

interface CommentListProps {
  comments: PdfComment[];
  pdfId: number;
  fileUrl: string;
  onCommentAdded: (comment: PdfComment) => void;
}

export const CommentList: React.FC<CommentListProps> = ({ comments, pdfId, fileUrl, onCommentAdded }) => {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const renderComments = (
    commentList: PdfComment[],
    parentId: number | null = null,
    depth: number = 0
  ) => {
    return commentList
      .filter((comment) => comment.parent_comment_id === parentId)
      .map((comment) => (
        <div
          key={comment.id}
          className={`p-4 bg-card rounded-lg shadow-sm ${depth > 0 ? 'ml-4 mt-2' : 'mt-4'}`}
        >
          <p className="text-sm text-muted-foreground mb-2">
            {comment.username} • {new Date(comment.created_at).toLocaleString()}
            {comment.page_number && (
              <>
                {' '}•{' '}
                <a
                  href={`${fileUrl}#page=${comment.page_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Page {comment.page_number}
                </a>
              </>
            )}
          </p>
          <div className={richTextStyles.prose}>{ReactHtmlParser(comment.comment)}</div>
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
              pdfId={pdfId}
              onCommentAdded={(newComment) => {
                onCommentAdded(newComment);
                setReplyingTo(null);
              }}
              parentCommentId={comment.id}
            />
          )}
          <div className="mt-2">{renderComments(commentList, comment.id, depth + 1)}</div>
        </div>
      ));
  };

  const richTextStyles = {
    prose: cn(
      'prose dark:prose-invert',
      'prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-500',
      'prose-ol:list-decimal prose-ul:list-disc',
      'prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4',
      'prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3',
      'prose-h3:text-lg prose-h3:font-bold prose-h3:mb-2',
      'prose-ol:my-4 prose-ul:my-4',
      'prose-ol:pl-4 prose-ul:pl-4'
    ),
  };

  return <div className="space-y-4">{renderComments(comments)}</div>;
};
