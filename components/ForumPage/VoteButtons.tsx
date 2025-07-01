import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPromptDialog } from '@/components/LoginPromptDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoteButtonsProps {
  itemId: number;
  itemType: 'topic' | 'comment';
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote?: number;
  onVoteUpdate?: (upvotes: number, downvotes: number, userVote: number) => void;
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({
  itemId,
  itemType,
  initialUpvotes,
  initialDownvotes,
  initialUserVote = 0,
  onVoteUpdate
}) => {
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleVote = async (voteValue: number) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    const newVote = userVote === voteValue ? 0 : voteValue;

    try {
      const endpoint = itemType === 'topic' 
        ? `/api/forum/topics/${itemId}/vote`
        : `/api/forum/comments/${itemId}/vote`;

      const response = await axios.post(endpoint, { vote: newVote });
      const { upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote } = response.data;

      setUpvotes(newUpvotes);
      setDownvotes(newDownvotes);
      setUserVote(newUserVote);

      if (onVoteUpdate) {
        onVoteUpdate(newUpvotes, newDownvotes, newUserVote);
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to register vote');
    } finally {
      setIsVoting(false);
    }
  };

  const score = upvotes - downvotes;

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote(1)}
          disabled={isVoting}
          className={cn(
            "h-8 w-8 p-0",
            userVote === 1 && "text-primary bg-primary/10 hover:bg-primary/20"
          )}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        
        <span className={cn(
          "text-sm font-medium min-w-[2rem] text-center",
          score > 0 && "text-primary",
          score < 0 && "text-destructive"
        )}>
          {score}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote(-1)}
          disabled={isVoting}
          className={cn(
            "h-8 w-8 p-0",
            userVote === -1 && "text-destructive bg-destructive/10 hover:bg-destructive/20"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <LoginPromptDialog
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </>
  );
};