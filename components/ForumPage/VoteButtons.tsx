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
  const { user, getAuthToken } = useAuth();
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

      const token = await getAuthToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post(endpoint, { vote: newVote }, config);
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
      <div className="flex flex-col items-center gap-1 bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-full p-1 border border-white/10 dark:border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote(1)}
          disabled={isVoting}
          className={cn(
            "h-8 w-8 p-0 rounded-full transition-all duration-300 hover:scale-110",
            userVote === 1 
              ? "text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg" 
              : "hover:bg-white/10 dark:hover:bg-white/5"
          )}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        
        <span className={cn(
          "text-sm font-bold min-w-[2rem] text-center transition-all duration-300",
          score > 0 && "text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text",
          score < 0 && "text-transparent bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text",
          score === 0 && "text-muted-foreground"
        )}>
          {score}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote(-1)}
          disabled={isVoting}
          className={cn(
            "h-8 w-8 p-0 rounded-full transition-all duration-300 hover:scale-110",
            userVote === -1 
              ? "text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg" 
              : "hover:bg-white/10 dark:hover:bg-white/5"
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