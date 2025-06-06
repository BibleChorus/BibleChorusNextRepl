import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Playlist, Song } from '@/types';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { formatBibleVerses } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface EditPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
  songs: Song[];
  onEditComplete: (updatedPlaylist: Playlist, updatedSongs: Song[]) => void;
}

export default function EditPlaylistDialog({
  isOpen,
  onClose,
  playlist,
  songs,
  onEditComplete,
}: EditPlaylistDialogProps) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || '');
  const [isPublic, setIsPublic] = useState(playlist.is_public);
  const [selectedSongs, setSelectedSongs] = useState<number[]>([]);

  const handleSaveDetails = async () => {
    try {
      const response = await axios.put(`/api/playlists/${playlist.id}`, {
        name,
        description,
        is_public: isPublic,
      });

      const updatedPlaylist = response.data;
      onEditComplete(updatedPlaylist, songs);
      toast.success('Playlist details updated successfully');
    } catch (error) {
      console.error('Error updating playlist details:', error);
      toast.error('Failed to update playlist details');
    }
  };

  const handleRemoveSongs = async () => {
    try {
      await axios.delete(`/api/playlists/${playlist.id}`, {
        data: { song_ids: selectedSongs },
      });

      const updatedSongs = songs.filter((song) => !selectedSongs.includes(song.id));
      onEditComplete(playlist, updatedSongs);
      setSelectedSongs([]);
      toast.success('Songs removed from playlist');
    } catch (error) {
      console.error('Error removing songs from playlist:', error);
      toast.error('Failed to remove songs from playlist');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Edit Playlist</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 px-6">
            <TabsTrigger value="details">Playlist Details</TabsTrigger>
            <TabsTrigger value="songs">Remove Songs</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 relative">
            <TabsContent 
              value="details" 
              className="absolute inset-0 flex flex-col px-6"
            >
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center">
                    <Switch
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                      id="public"
                    />
                    <label htmlFor="public" className="ml-2 block text-sm font-medium text-gray-700">
                      Public
                    </label>
                  </div>
                </div>
              </ScrollArea>
              <div className="py-4">
                <Button onClick={handleSaveDetails} className="w-full">
                  Save Details
                </Button>
              </div>
            </TabsContent>

            <TabsContent 
              value="songs" 
              className="absolute inset-0 flex flex-col px-6"
            >
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  {songs.map((song) => (
                    <div key={song.id} className="flex items-start space-x-2 pb-2">
                      <input
                        type="checkbox"
                        id={`song-${song.id}`}
                        checked={selectedSongs.includes(song.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSongs([...selectedSongs, song.id]);
                          } else {
                            setSelectedSongs(selectedSongs.filter((id) => id !== song.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-grow">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <label htmlFor={`song-${song.id}`} className="font-medium">{song.title}</label>
                            {song.bible_verses && song.bible_verses.length > 0 && (
                              <>
                                <Separator orientation="vertical" className="h-4" />
                                <span className="text-sm text-muted-foreground">
                                  {formatBibleVerses(song.bible_verses)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {song.genres && song.genres.map((genre) => (
                              <Badge key={genre} variant="secondary" className="text-xs">{genre}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="py-4">
                <Button 
                  onClick={handleRemoveSongs} 
                  disabled={selectedSongs.length === 0} 
                  className="w-full"
                >
                  Remove Selected Songs
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
