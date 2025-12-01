import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from "sonner";
import { ListMusic } from 'lucide-react';
import { useTheme } from 'next-themes';

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songId: number;
}

export function AddToPlaylistDialog({ isOpen, onClose, songId }: AddToPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const { user, getAuthToken } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    accentBgLight: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.1)',
  };

  const fetchUserPlaylists = useCallback(async () => {
    try {
      const token = await getAuthToken();
      console.log("Fetched token for playlists:", token);
      if (!token) {
        console.error("No token available for fetching playlists");
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      const response = await axios.get(`/api/users/${user?.id}/playlists?createdOnly=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      toast.error('Failed to fetch playlists');
    }
  }, [getAuthToken, user?.id]);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPlaylists();
    }
  }, [isOpen, user, fetchUserPlaylists]);

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      toast.error('Please select a playlist');
      return;
    }

    try {
      const token = await getAuthToken();
      console.log("Token for adding song:", token);
      if (!token) {
        console.error("No token available for adding song");
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      const response = await axios.post(`/api/playlists/${selectedPlaylistId}/songs`, {
        song_ids: [songId],
        user_id: user?.id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Add to playlist response:", response);
      toast.success('Song added to playlist');
      onClose();
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      toast.error('Failed to add song to playlist');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
          <DialogDescription>
            Select a playlist to add this song to.
          </DialogDescription>
        </DialogHeader>
        <Select onValueChange={setSelectedPlaylistId} value={selectedPlaylistId}>
          <SelectTrigger 
            className="w-full h-12 transition-all duration-300"
            style={{
              backgroundColor: theme.bgCard,
              border: `1px solid ${theme.border}`,
            }}
          >
            <SelectValue placeholder="Select a playlist" />
          </SelectTrigger>
          <SelectContent 
            style={{
              backgroundColor: theme.bgCard,
              border: `1px solid ${theme.border}`,
            }}
          >
            {playlists.map((playlist) => (
              <SelectItem 
                key={playlist.id} 
                value={playlist.id.toString()}
                className="transition-all duration-200 rounded-none focus:bg-[rgba(191,161,48,0.1)] dark:focus:bg-[rgba(212,175,55,0.1)]"
              >
                <div className="flex items-center">
                  <ListMusic className="w-4 h-4 mr-2" />
                  {playlist.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAddToPlaylist}>Add to Playlist</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
