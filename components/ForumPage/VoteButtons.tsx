import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPromptDialog } from '@/components/LoginPromptDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

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
  const { resolvedTheme } = useTheme();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    accentGlow: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.12)',
    downvote: isDark ? '#b91c1c' : '#dc2626',
    downvoteGlow: isDark ? 'rgba(185, 28, 28, 0.15)' : 'rgba(220, 38, 38, 0.12)',
  };

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
      <div 
        className="flex items-center gap-1 backdrop-blur-sm rounded-full px-2 py-1"
        style={{
          backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          border: `1px solid ${theme.border}`
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleVote(1)}
          disabled={isVoting}
          className={cn(
            "h-7 w-7 p-0 rounded-full transition-all duration-300"
          )}
          style={{
            backgroundColor: userVote === 1 ? theme.accent : 'transparent',
            color: userVote === 1 ? '#ffffff' : theme.textSecondary
          }}
          onMouseEnter={(e) => {
            if (userVote !== 1) {
              e.currentTarget.style.backgroundColor = theme.hoverBg;
              e.currentTarget.style.color = theme.accent;
            }
          }}
          onMouseLeave={(e) => {
            if (userVote !== 1) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.textSecondary;
            }
          }}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        <span
          className="text-sm font-bold min-w-[1.5rem] text-center transition-all duration-300"
          style={{
            color: score > 0 ? theme.accent : score < 0 ? theme.downvote : theme.textSecondary,
            fontFamily: "'Manrope', sans-serif"
          }}
        >
          {score}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleVote(-1)}
          disabled={isVoting}
          className={cn(
            "h-7 w-7 p-0 rounded-full transition-all duration-300"
          )}
          style={{
            backgroundColor: userVote === -1 ? theme.downvote : 'transparent',
            color: userVote === -1 ? '#ffffff' : theme.textSecondary
          }}
          onMouseEnter={(e) => {
            if (userVote !== -1) {
              e.currentTarget.style.backgroundColor = theme.hoverBg;
              e.currentTarget.style.color = theme.downvote;
            }
          }}
          onMouseLeave={(e) => {
            if (userVote !== -1) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.textSecondary;
            }
          }}
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
