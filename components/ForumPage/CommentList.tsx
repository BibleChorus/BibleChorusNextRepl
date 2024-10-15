import React from 'react';
import { Comment } from '@/types';

interface CommentListProps {
  comments: Comment[];
}

export const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="p-4 bg-card rounded-lg shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">
            {comment.username} • {new Date(comment.created_at).toLocaleString()}
          </p>
          <p>{comment.content}</p>
        </div>
      ))}
    </div>
  );
};