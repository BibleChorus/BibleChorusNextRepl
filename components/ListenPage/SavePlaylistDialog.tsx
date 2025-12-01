import React, { useState, useEffect, useImperativeHandle } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import {
  FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { ImageCropper, CropResultMetadata } from '@/components/UploadPage/ImageCropper';
import { Trash2, ListMusic, Save } from 'lucide-react';
import Image from 'next/image';
import { getExtensionFromMimeType, stripFileExtension } from '@/lib/imageUtils';
import { useTheme } from 'next-themes';

// Define the Song type
type Song = {
  id: number;
  title: string;
  // Add other properties as needed
};

// Define the User type
type User = {
  id: string;
  username: string;
  // Add other properties as needed
};

// Define the FilterOptions type
type FilterOptions = {
  // Add properties as needed
};

type SavePlaylistDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  filterOptions: FilterOptions;
  playlists: any[]; // Adjust type as necessary
  user: User | null;
  onImageCropComplete: (croppedFile: File) => void;
  openImageCropper: () => void;
  formRef: React.RefObject<ReturnType<typeof useForm<FormValues>>>;
};

type FormValues = {
  action: 'create' | 'add';
  playlistId?: string;
  name?: string;
  description?: string;
  isPublic: boolean;
  coverArtFile?: File;
  cover_art_url?: string;
};

export default function SavePlaylistDialog({
  isOpen, onClose, songs, playlists: initialPlaylists, user, onImageCropComplete, openImageCropper, formRef,
}: SavePlaylistDialogProps) {
  const [step, setStep] = useState(1);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [pendingImageDetails, setPendingImageDetails] = useState<{ name?: string; type?: string } | null>(null);
  const [playlists, setPlaylists] = useState<any[]>(initialPlaylists);

  const form = useForm<FormValues>({
    defaultValues: {
      action: 'create',
      isPublic: false,
      name: '',
      description: '',
      playlistId: '',
      coverArtFile: undefined,
      cover_art_url: '',
    },
  });

  const { handleSubmit, watch, setValue, control } = form;
  const action = watch('action');
  const router = useRouter();
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const theme = {
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    accentBgLight: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.1)',
  };

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      form.reset({
        action: 'create',
        isPublic: false,
        name: '',
        description: '',
        playlistId: '',
        coverArtFile: undefined,
        cover_art_url: '',
      });
      setCroppedImageUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
      setPendingImageDetails(null);
    }
  }, [isOpen, form]);

  useEffect(() => {
    return () => {
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
    };
  }, [croppedImageUrl]);

  useEffect(() => {
    if (isOpen && user) {
      // Fetch only user-created playlists when the dialog opens
      axios.get(`/api/users/${user.id}/playlists?createdOnly=true`)
        .then(response => {
          setPlaylists(response.data);
        })
        .catch(error => {
          console.error('Error fetching user playlists:', error);
          toast.error('Failed to fetch playlists');
        });
    }
  }, [isOpen, user]);

  useImperativeHandle(formRef, () => form);

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('You need to be logged in to save playlists');
      return;
    }

    try {
      if (data.action === 'create') {
        // Handle creating new playlist
        const playlistData = {
          name: data.name,
          description: data.description,
          is_public: data.isPublic,
          cover_art_url: data.cover_art_url,
          song_ids: songs.map((song) => song.id),
          user_id: user.id, // Include the user_id in the request
        };

        const response = await axios.post('/api/playlists', playlistData);
        if (response.status === 201) {
          toast.success('Playlist created successfully');
          onClose();
          router.push(`/playlists/${response.data.id}`);
        } else {
          throw new Error('Failed to create playlist');
        }
      } else if (data.action === 'add') {
        // Handle adding songs to existing playlist
        const playlistId = data.playlistId;
        if (!playlistId) {
          toast.error('Please select a playlist');
          return;
        }
        const response = await axios.post(`/api/playlists/${playlistId}/songs`, {
          song_ids: songs.map((song) => song.id),
        });
        if (response.status === 200) {
          toast.success('Songs added to playlist');
          onClose();
        } else {
          throw new Error('Failed to add songs to playlist');
        }
      }
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast.error('Failed to save playlist');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCropImageUrl(event.target.result as string);
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
      setPendingImageDetails({ name: file.name, type: file.type });
    }
  };

  const buildFileName = (originalName: string | undefined, mimeType: string) => {
    const extension = getExtensionFromMimeType(mimeType);
    if (originalName && originalName.trim().length > 0) {
      const base = stripFileExtension(originalName);
      return `${base}.${extension}`;
    }
    return `playlist-cover-${Date.now()}.${extension}`;
  };

  const handleCropComplete = (blob: Blob, metadata?: CropResultMetadata) => {
    const mimeType = metadata?.mimeType || blob.type || pendingImageDetails?.type || 'image/jpeg';
    const originalName = metadata?.originalFileName || pendingImageDetails?.name;
    const fileName = metadata?.suggestedFileName || buildFileName(originalName, mimeType);
    const croppedFile = new File([blob], fileName, { type: mimeType });

    onImageCropComplete(croppedFile);
    setCroppedImageUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return URL.createObjectURL(croppedFile);
    });
    setValue('coverArtFile', croppedFile, { shouldValidate: true });
    setValue('cover_art_url', '');
    setIsCropperOpen(false);
    setCropImageUrl(null);
    setPendingImageDetails(null);
  };

  const removeCoverArt = async () => {
    try {
      await axios.post('/api/delete-file', {
        fileKey: form.getValues('cover_art_url'),
      });
      setCroppedImageUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
      setValue('cover_art_url', '');
      setValue('coverArtFile', undefined, { shouldValidate: true });
      toast.success('Cover art removed');
      setPendingImageDetails(null);
    } catch (error) {
      console.error('Error removing cover art:', error);
      toast.error('Failed to remove cover art');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Playlist</DialogTitle>
            <DialogDescription>Select an option to save your playlist</DialogDescription>
          </DialogHeader>

          <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant={watch('action') === 'create' ? 'default' : 'outline'}
                      onClick={() => setValue('action', 'create')}
                    >
                      Create New Playlist
                    </Button>
                    <Button
                      type="button"
                      variant={watch('action') === 'add' ? 'default' : 'outline'}
                      onClick={() => setValue('action', 'add')}
                    >
                      Add to Existing Playlist
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!watch('action')}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && action === 'create' && (
                <>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Playlist name is required' }}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Playlist Name" {...field} />
                        </FormControl>
                        <FormMessage>{fieldState.error?.message}</FormMessage>
                      </FormItem>
                    )}
                  />
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Playlist Description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="isPublic"
                    control={control}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Public</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="coverArtFile"
                    control={control}
                    render={() => (
                      <FormItem>
                        <FormLabel>Cover Art</FormLabel>
                        <FormControl>
                          {croppedImageUrl ? (
                            <div className="flex items-center space-x-2">
                              <Image
                                src={croppedImageUrl}
                                alt="Cover Art Preview"
                                width={64}
                                height={64}
                                className="object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={removeCoverArt}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="submit">Save</Button>
                  </div>
                </>
              )}

              {step === 2 && action === 'add' && (
                <>
                  <Controller
                    name="playlistId"
                    control={control}
                    rules={{ required: 'Please select a playlist' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Playlist</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger 
                              className="w-full transition-all duration-300 h-12"
                              style={{
                                backgroundColor: theme.bgCard,
                                border: `1px solid ${theme.border}`,
                                color: theme.text,
                              }}
                            >
                              <SelectValue placeholder="Select a playlist" />
                            </SelectTrigger>
                            <SelectContent
                              side="bottom"
                              align="start"
                              className="max-h-[300px] overflow-y-auto"
                              style={{
                                backgroundColor: theme.bgCard,
                                border: `1px solid ${theme.border}`,
                              }}
                            >
                              {playlists?.map((playlist: any) => (
                                <SelectItem 
                                  key={playlist.id} 
                                  value={playlist.id.toString()}
                                  className="transition-all duration-200 cursor-pointer"
                                  style={{
                                    ['--hover-bg' as string]: theme.accentBgLight,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = theme.accentBgLight;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <div className="flex items-center">
                                    <ListMusic className="w-4 h-4 mr-2" />
                                    {playlist.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="submit">Add Songs</Button>
                  </div>
                </>
              )}
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crop Cover Image</DialogTitle>
            <DialogDescription>Adjust the image to fit the playlist cover</DialogDescription>
          </DialogHeader>
          {cropImageUrl && (
            <ImageCropper
              imageUrl={cropImageUrl}
              onCropComplete={handleCropComplete}
              onCancel={() => {
                setIsCropperOpen(false);
                setCropImageUrl(null);
              }}
              maxHeight={300} // Add this line with an appropriate value
              originalFileName={pendingImageDetails?.name}
              originalMimeType={pendingImageDetails?.type}
              outputMimeType={pendingImageDetails?.type}
              desiredFileName={pendingImageDetails?.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
