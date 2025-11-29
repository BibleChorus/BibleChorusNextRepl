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
import { useTheme } from 'next-themes';

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    inputBg: isDark ? '#0f0f0f' : '#f8f5f0',
  };

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
      <DialogContent 
        className="sm:max-w-[450px] h-[80vh] flex flex-col p-0 rounded-none"
        style={{
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`,
          color: theme.text,
        }}
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle 
            className="text-xl tracking-wide"
            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
          >
            Edit Playlist
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details" className="flex-1 flex flex-col">
          <div className="px-6">
            <TabsList 
              className="grid w-full grid-cols-2 gap-1 h-auto p-1 rounded-none"
              style={{
                backgroundColor: theme.hoverBg,
                border: `1px solid ${theme.border}`,
              }}
            >
              <TabsTrigger 
                value="details"
                className="rounded-none text-xs tracking-[0.15em] uppercase font-medium py-2.5 transition-all data-[state=active]:shadow-none"
                style={{ color: theme.textSecondary }}
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="songs"
                className="rounded-none text-xs tracking-[0.15em] uppercase font-medium py-2.5 transition-all data-[state=active]:shadow-none"
                style={{ color: theme.textSecondary }}
              >
                Remove Songs
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 relative mt-4">
            <TabsContent 
              value="details" 
              className="absolute inset-0 flex flex-col px-6"
            >
              <ScrollArea className="flex-1">
                <div className="space-y-6 pr-4">
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-xs tracking-[0.15em] uppercase font-medium mb-2"
                      style={{ color: theme.textSecondary }}
                    >
                      Name
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-none text-sm"
                      style={{
                        backgroundColor: theme.inputBg,
                        border: `1px solid ${theme.border}`,
                        color: theme.text,
                      }}
                    />
                  </div>
                  <div>
                    <label 
                      htmlFor="description" 
                      className="block text-xs tracking-[0.15em] uppercase font-medium mb-2"
                      style={{ color: theme.textSecondary }}
                    >
                      Description
                    </label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-none text-sm min-h-[100px]"
                      style={{
                        backgroundColor: theme.inputBg,
                        border: `1px solid ${theme.border}`,
                        color: theme.text,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <label 
                      htmlFor="public" 
                      className="block text-xs tracking-[0.15em] uppercase font-medium"
                      style={{ color: theme.textSecondary }}
                    >
                      Public
                    </label>
                    <Switch
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                      id="public"
                      className="data-[state=checked]:bg-[#d4af37]"
                    />
                  </div>
                </div>
              </ScrollArea>
              <div className="py-6">
                <Button 
                  onClick={handleSaveDetails} 
                  className="w-full h-12 rounded-none text-xs tracking-[0.2em] uppercase font-medium"
                  style={{
                    backgroundColor: theme.accent,
                    color: isDark ? '#050505' : '#ffffff',
                  }}
                >
                  Save Details
                </Button>
              </div>
            </TabsContent>

            <TabsContent 
              value="songs" 
              className="absolute inset-0 flex flex-col px-6"
            >
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {songs.map((song) => (
                    <div 
                      key={song.id} 
                      className="flex items-start space-x-3 p-3 transition-colors duration-300"
                      style={{
                        backgroundColor: selectedSongs.includes(song.id) ? theme.hoverBg : 'transparent',
                        border: `1px solid ${selectedSongs.includes(song.id) ? theme.borderHover : theme.border}`,
                      }}
                    >
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
                        className="mt-1 accent-[#d4af37]"
                        style={{ accentColor: theme.accent }}
                      />
                      <div className="flex-grow">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <label 
                              htmlFor={`song-${song.id}`} 
                              className="text-sm cursor-pointer"
                              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                            >
                              {song.title}
                            </label>
                            {song.bible_verses && song.bible_verses.length > 0 && (
                              <>
                                <Separator 
                                  orientation="vertical" 
                                  className="h-4"
                                  style={{ backgroundColor: theme.border }}
                                />
                                <span 
                                  className="text-xs font-light"
                                  style={{ color: theme.textMuted }}
                                >
                                  {formatBibleVerses(song.bible_verses)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {song.genres && song.genres.map((genre) => (
                              <Badge 
                                key={genre} 
                                variant="secondary" 
                                className="text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-none font-medium"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: theme.textMuted,
                                  border: `1px solid ${theme.border}`,
                                }}
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="py-6">
                <Button 
                  onClick={handleRemoveSongs} 
                  disabled={selectedSongs.length === 0} 
                  className="w-full h-12 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-opacity"
                  style={{
                    backgroundColor: selectedSongs.length > 0 ? '#dc2626' : theme.border,
                    color: selectedSongs.length > 0 ? '#ffffff' : theme.textMuted,
                    opacity: selectedSongs.length === 0 ? 0.5 : 1,
                  }}
                >
                  Remove Selected Songs ({selectedSongs.length})
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
