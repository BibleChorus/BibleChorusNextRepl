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
      <div className="flex items-center gap-1 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-full border border-white/20 dark:border-white/10 px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleVote(1)}
          disabled={isVoting}
          className={cn(
            "h-6 w-6 p-0 rounded-full transition-all duration-300",
            userVote === 1
              ? "text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow"
              : "hover:bg-white/10 dark:hover:bg-white/5"
          )}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>

        <span
          className={cn(
            "text-xs font-bold min-w-[1.5rem] text-center transition-all duration-300",
            score > 0 &&
              "text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text",
            score < 0 &&
              "text-transparent bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text",
            score === 0 && "text-muted-foreground"
          )}
        >
          {score}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleVote(-1)}
          disabled={isVoting}
          className={cn(
            "h-6 w-6 p-0 rounded-full transition-all duration-300",
            userVote === -1
              ? "text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow"
              : "hover:bg-white/10 dark:hover:bg-white/5"
          )}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      <LoginPromptDialog
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </>
  );
};