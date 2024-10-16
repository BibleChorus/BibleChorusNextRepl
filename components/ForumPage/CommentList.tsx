import React, { useState } from 'react';
import { Comment } from '@/types';
import { NewCommentForm } from './NewCommentForm';
import { Button } from '@/components/ui/button';

interface CommentListProps {
  comments: Comment[];
  topicId: number;
  onCommentAdded: (comment: Comment) => void;
}

export const CommentList: React.FC<CommentListProps> = ({ comments, topicId, onCommentAdded }) => {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

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
          {/* Render replies */}
          <div className="mt-2">
            {renderComments(commentList, comment.id, depth + 1)}
          </div>
        </div>
      ));
  };

  return <div className="space-y-4">{renderComments(comments)}</div>;
};
