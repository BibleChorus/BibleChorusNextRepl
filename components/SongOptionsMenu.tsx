import React, { useState, useEffect, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Heart,
  Share2,
  ListPlus,
  Vote,
  Music,
  BookOpen,
  Star,
  MessageCircle,
  Flag,
  ThumbsUp,
  ThumbsDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { Song, SongComment } from '@/types';
import { ReportDialog } from '@/components/ReportDialog';
import { AddToPlaylistDialog } from '@/components/ListenPage/AddToPlaylistDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CommentList } from '@/components/SongComments/CommentList';
import { NewCommentForm } from '@/components/SongComments/NewCommentForm';

export const SongOptionsMenu: React.FC<{ song: Song }> = ({ song }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isAddToPlaylistDialogOpen, setIsAddToPlaylistDialogOpen] = useState(false);
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false);
  const [selectedVoteType, setSelectedVoteType] = useState('');
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [comments, setComments] = useState<SongComment[]>([]);
  const [localCommentsCount, setLocalCommentsCount] = useState(song.comments_count || 0);
  const [voteStates, setVoteStates] = useState({});
  const [voteCounts, setVoteCounts] = useState({});
  const [likeStates, setLikeStates] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [isCommentsFetching, setIsCommentsFetching] = useState(false);

  // Fetch initial data (votes, likes, comments)
  useEffect(() => {
    // Fetch votes
    const fetchVotes = async () => {
      try {
        const response = await axios.get(`/api/users/${user?.id}/votes`);
        const userVotes = response.data;
        const newVoteStates = {};
        userVotes.forEach((vote: any) => {
          if (!newVoteStates[vote.song_id]) {
            newVoteStates[vote.song_id] = {};
          }
          newVoteStates[vote.song_id][vote.vote_type] = vote.vote_value;
        });
        setVoteStates(newVoteStates);
      } catch (error) {
        console.error('Error fetching user votes:', error);
      }
    };

    // Fetch likes
    const fetchLikes = async () => {
      try {
        const response = await axios.get(`/api/users/${user?.id}/likes`);
        const userLikes = response.data;
        const newLikeStates = {};
        userLikes.forEach((like: any) => {
          if (like.likeable_type === 'song') {
            newLikeStates[like.likeable_id] = true;
          }
        });
        setLikeStates(newLikeStates);
      } catch (error) {
        console.error('Error fetching user likes:', error);
      }
    };

    // Fetch comments count
    const fetchCommentsCount = async () => {
      try {
        const response = await axios.get(`/api/songs/${song.id}/comments/count`);
        setLocalCommentsCount(response.data.count);
      } catch (error) {
        console.error('Error fetching comments count:', error);
      }
    };

    if (user) {
      fetchVotes();
      fetchLikes();
    }
    fetchCommentsCount();
  }, [user, song.id]);

  const handleLike = useCallback(async () => {
    if (!user) {
      toast.error('You need to be logged in to like a song');
      return;
    }

    try {
      const isLiked = likeStates[song.id];
      if (isLiked) {
        await axios.delete(`/api/likes`, {
          data: { user_id: user.id, likeable_type: 'song', likeable_id: song.id },
        });
      } else {
        await axios.post('/api/likes', {
          user_id: user.id,
          likeable_type: 'song',
          likeable_id: song.id,
        });
      }

      setLikeStates((prev) => ({
        ...prev,
        [song.id]: !isLiked,
      }));

      setLikeCounts((prev) => ({
        ...prev,
        [song.id]: (prev[song.id] || 0) + (isLiked ? -1 : 1),
      }));

      toast.success(isLiked ? 'Song unliked' : 'Song liked');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  }, [user, likeStates, song]);

  const handleVoteClick = (voteType: string) => {
    if (!user) {
      toast.error('You need to be logged in to vote');
      return;
    }
    setSelectedVoteType(voteType);
    setIsVoteDialogOpen(true);
  };

  const handleVote = async (voteValue: number) => {
    if (!user) {
      toast.error('You need to be logged in to vote');
      return;
    }

    try {
      await axios.post('/api/votes', {
        user_id: user.id,
        song_id: song.id,
        vote_type: selectedVoteType,
        vote_value: voteValue,
      });

      setVoteStates((prev) => ({
        ...prev,
        [song.id]: {
          ...prev[song.id],
          [selectedVoteType]: voteValue,
        },
      }));

      // Update vote counts accordingly
      setVoteCounts((prev) => ({
        ...prev,
        [song.id]: {
          ...(prev[song.id] || {}),
          [selectedVoteType]:
            (prev[song.id]?.[selectedVoteType] || 0) + voteValue - (voteStates[song.id]?.[selectedVoteType] || 0),
        },
      }));

      toast.success('Vote submitted successfully');
      setIsVoteDialogOpen(false);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
    }
  };

  const getCurrentVote = (voteType: string) => {
    return voteStates[song.id]?.[voteType] || 0;
  };

  const handleComment = () => {
    setIsCommentsDialogOpen(true);
  };

  const handleCommentAdded = (newComment: SongComment) => {
    setComments((prevComments) => [newComment, ...prevComments]);
  };

  const handleShare = useCallback(async () => {
    // Get the correct artist attribution, with fallbacks
    const artistAttribution = song.username;
    
    const songUrl = `${window.location.origin}/Songs/${song.id}`;
    const shareTitle = `${song.title} by ${artistAttribution}`;
    const shareText = `Check out "${song.title}" by ${artistAttribution} on BibleChorus`;
    
    const shareData = {
      title: shareTitle,
      text: shareText,
      url: songUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Song shared successfully');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing song:', error);
          toast.error('Failed to share song');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${songUrl}`);
        toast.success('Song link copied to clipboard');
      } catch (error) {
        console.error('Error copying song link:', error);
        toast.error('Failed to copy song link');
      }
    }
  }, [song.id, song.title, song.username]);

  // Fetch comments when the comments dialog is opened
  const fetchComments = useCallback(async () => {
    try {
      const response = await axios.get(`/api/songs/${song.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [song.id]);

  useEffect(() => {
    if (isCommentsDialogOpen) {
      fetchComments();
    }
  }, [isCommentsDialogOpen, fetchComments]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLike}>
            <Heart className="mr-2 h-4 w-4" />
            <span>{likeStates[song.id] ? 'Unlike' : 'Like'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            <span>Share</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsAddToPlaylistDialogOpen(true)}>
            <ListPlus className="mr-2 h-4 w-4" />
            <span>Add to Playlist</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Vote className="mr-2 h-4 w-4" />
              <span>Vote</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleVoteClick('Best Musically')}>
                <Music className="mr-2 h-4 w-4" />
                <span>Best Musically</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleVoteClick('Best Lyrically')}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Best Lyrically</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleVoteClick('Best Overall')}>
                <Star className="mr-2 h-4 w-4" />
                <span>Best Overall</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={handleComment}>
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>Comment</span>
          </DropdownMenuItem>
          {user && (
            <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
              <Flag className="mr-2 h-4 w-4" />
              <span>Report</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Vote Dialog */}
      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">Vote for {selectedVoteType}</DialogTitle>
            <DialogDescription className="text-center">{song.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Voting options */}
            {getCurrentVote(selectedVoteType) !== 1 && (
              <Button onClick={() => handleVote(1)} variant="outline" className="w-full sm:w-auto">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Upvote
              </Button>
            )}
            {getCurrentVote(selectedVoteType) !== -1 && (
              <Button onClick={() => handleVote(-1)} variant="outline" className="w-full sm:w-auto">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Downvote
              </Button>
            )}
            {getCurrentVote(selectedVoteType) !== 0 && (
              <Button onClick={() => handleVote(0)} variant="outline" className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Remove Vote
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Join the discussion about this song.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-4">
            {user ? (
              <NewCommentForm songId={song.id} onCommentAdded={handleCommentAdded} />
            ) : (
              <p>Please log in to add a comment.</p>
            )}
            {isCommentsFetching ? (
              <p>Loading comments...</p>
            ) : (
              <CommentList 
                comments={comments} 
                songId={song.id} 
                onCommentAdded={handleCommentAdded}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        songId={song.id}
        userId={user?.id.toString() || ''}
        username={user?.username || ''}
        userEmail={user?.email || ''}
      />

      <AddToPlaylistDialog
        isOpen={isAddToPlaylistDialogOpen}
        onClose={() => setIsAddToPlaylistDialogOpen(false)}
        songId={song.id}
      />
    </>
  );
}; 