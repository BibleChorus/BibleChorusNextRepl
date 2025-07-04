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

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songId: number;
}

export function AddToPlaylistDialog({ isOpen, onClose, songId }: AddToPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const { user, getAuthToken } = useAuth();

  // Memoize fetchUserPlaylists to prevent unnecessary re-creations
  const fetchUserPlaylists = useCallback(async () => {
    try {
      const token = await getAuthToken();
      console.log("Fetched token for playlists:", token); // Debug log
      if (!token) {
        console.error("No token available for fetching playlists"); // Debug log
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
  }, [getAuthToken, user?.id]); // Added dependencies to useCallback

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPlaylists();
    }
  }, [isOpen, user, fetchUserPlaylists]); // Included fetchUserPlaylists in dependencies

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      toast.error('Please select a playlist');
      return;
    }

    try {
      const token = await getAuthToken();
      console.log("Token for adding song:", token); // Debug log
      if (!token) {
        console.error("No token available for adding song"); // Debug log
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      const response = await axios.post(`/api/playlists/${selectedPlaylistId}/songs`, {
        song_ids: [songId],
        user_id: user?.id, // Add this line
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Add to playlist response:", response); // Debug log
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
          <SelectTrigger className="w-full bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl h-12">
            <SelectValue placeholder="Select a playlist" />
          </SelectTrigger>
          <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-xl">
            {playlists.map((playlist) => (
              <SelectItem 
                key={playlist.id} 
                value={playlist.id.toString()}
                className="hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-all duration-200 rounded-lg"
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
