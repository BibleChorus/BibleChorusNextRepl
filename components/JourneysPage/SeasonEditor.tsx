'use client';

import React, { useState, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Season, SeasonSong, ImportantDate } from '@/types/journey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SongSelector } from './SongSelector';
import { 
  Plus, Pencil, Trash2, Music, ChevronDown, ChevronUp, 
  Calendar, Save, X, Sparkles, Heart, Upload, Loader2
} from 'lucide-react';
import { FaEye as Eye, FaEyeSlash as EyeOff, FaExternalLinkAlt, FaLink, FaCamera } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile } from '@/lib/uploadUtils';

interface SeasonEditorProps {
  seasons: Season[];
  onSeasonsChange: (seasons: Season[]) => void;
  onRefresh: () => void;
}


const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '/';
const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
  if (baseUrl) return `${baseUrl}${path}`;
  return path.startsWith('/') ? path : `/${path}`;
};

interface SeasonFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  reflection: string;
  scripture_reference: string;
}

interface SeasonFormProps {
  formData: SeasonFormData;
  setFormData: React.Dispatch<React.SetStateAction<SeasonFormData>>;
  isNew: boolean;
  seasonId?: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

const SeasonForm = memo(function SeasonForm({
  formData,
  setFormData,
  isNew,
  seasonId,
  isSubmitting,
  onSubmit,
  onCancel,
}: SeasonFormProps) {
  const handleChange = useCallback((field: keyof SeasonFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Season Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Season of Growth"
          className="bg-white dark:bg-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            className="bg-white dark:bg-slate-800"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End Date (optional)</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            className="bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe or Reflect upon this Season (sentences or paragraph(s))"
          className="bg-white dark:bg-slate-800 min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scripture">Scripture Reference</Label>
        <Input
          id="scripture"
          value={formData.scripture_reference}
          onChange={(e) => handleChange('scripture_reference', e.target.value)}
          placeholder="e.g., Psalm 23:1-6"
          className="bg-white dark:bg-slate-800"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reflection">Short Quote About Season</Label>
        <Textarea
          id="reflection"
          value={formData.reflection}
          onChange={(e) => handleChange('reflection', e.target.value)}
          placeholder="Provide a Short Quote About this Season to be Highlighted (one or two sentences)"
          className="bg-white dark:bg-slate-800 min-h-[80px]"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {isNew ? 'Create Season' : 'Save Changes'}
        </Button>
      </div>
    </motion.div>
  );
});

export const SeasonEditor: React.FC<SeasonEditorProps> = ({
  seasons,
  onSeasonsChange,
  onRefresh,
}) => {
  const { getAuthToken, user } = useAuth();
  const [expandedSeasons, setExpandedSeasons] = useState<number[]>([]);
  const [isAddingNewSeason, setIsAddingNewSeason] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<number | null>(null);
  const [songSelectorSeasonId, setSongSelectorSeasonId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingSong, setEditingSong] = useState<{ seasonId: number; song: SeasonSong } | null>(null);
  const [songEditFormData, setSongEditFormData] = useState({
    personal_note: '',
    source_url: '',
  });
  
  const [importantDateDialogSeasonId, setImportantDateDialogSeasonId] = useState<number | null>(null);
  const [editingImportantDate, setEditingImportantDate] = useState<ImportantDate | null>(null);
  const [importantDateFormData, setImportantDateFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    photo_url: '',
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<SeasonFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    reflection: '',
    scripture_reference: '',
  });

  const toggleExpanded = useCallback((seasonId: number) => {
    setExpandedSeasons(prev => 
      prev.includes(seasonId) 
        ? prev.filter(id => id !== seasonId)
        : [...prev, seasonId]
    );
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      reflection: '',
      scripture_reference: '',
    });
    setIsAddingNewSeason(false);
    setEditingSeasonId(null);
  }, []);

  const handleCreateSeason = useCallback(async () => {
    if (!formData.title || !formData.start_date) {
      toast.error('Title and start date are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      await axios.post('/api/journeys/seasons', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Season created successfully');
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error creating season:', error);
      toast.error('Failed to create season');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, resetForm, onRefresh, getAuthToken]);

  const handleUpdateSeason = useCallback(async (seasonId: number) => {
    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      await axios.put(`/api/journeys/seasons/${seasonId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Season updated successfully');
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error updating season:', error);
      toast.error('Failed to update season');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, resetForm, onRefresh, getAuthToken]);

  const handleDeleteSeason = useCallback(async (seasonId: number) => {
    if (!confirm('Are you sure you want to delete this season and all its songs?')) return;

    try {
      const token = await getAuthToken();
      await axios.delete(`/api/journeys/seasons/${seasonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Season deleted');
      onRefresh();
    } catch (error) {
      console.error('Error deleting season:', error);
      toast.error('Failed to delete season');
    }
  }, [onRefresh, getAuthToken]);

  const handleToggleVisibility = useCallback(async (season: Season) => {
    try {
      const token = await getAuthToken();
      await axios.put(`/api/journeys/seasons/${season.id}`, {
        is_visible: !season.is_visible,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    }
  }, [onRefresh, getAuthToken]);

  const handleRemoveSong = useCallback(async (seasonId: number, songId: number) => {
    try {
      const token = await getAuthToken();
      await axios.delete(`/api/journeys/seasons/${seasonId}/songs/${songId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Song removed from season');
      onRefresh();
    } catch (error) {
      console.error('Error removing song:', error);
      toast.error('Failed to remove song');
    }
  }, [onRefresh, getAuthToken]);

  const startEditingSong = useCallback((seasonId: number, song: SeasonSong) => {
    setEditingSong({ seasonId, song });
    setSongEditFormData({
      personal_note: song.personal_note || '',
      source_url: song.source_url || '',
    });
  }, []);

  const validateSourceUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleUpdateSong = useCallback(async () => {
    if (!editingSong) return;

    const trimmedUrl = songEditFormData.source_url.trim();
    if (trimmedUrl && !validateSourceUrl(trimmedUrl)) {
      toast.error('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      await axios.put(
        `/api/journeys/seasons/${editingSong.seasonId}/songs/${editingSong.song.song_id}`,
        {
          personal_note: songEditFormData.personal_note.trim(),
          source_url: trimmedUrl || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Song updated successfully');
      setEditingSong(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating song:', error);
      toast.error('Failed to update song');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingSong, songEditFormData, onRefresh, getAuthToken]);

  const startEditing = useCallback((season: Season) => {
    setFormData({
      title: season.title,
      description: season.description || '',
      start_date: season.start_date?.split('T')[0] || '',
      end_date: season.end_date?.split('T')[0] || '',
      reflection: season.reflection || '',
      scripture_reference: season.scripture_reference || '',
    });
    setEditingSeasonId(season.id);
    setIsAddingNewSeason(false);
  }, []);

  const startNewSeason = useCallback(() => {
    resetForm();
    setIsAddingNewSeason(true);
  }, [resetForm]);

  const resetImportantDateForm = useCallback(() => {
    setImportantDateFormData({
      title: '',
      description: '',
      event_date: '',
      photo_url: '',
    });
    setEditingImportantDate(null);
    setImportantDateDialogSeasonId(null);
  }, []);

  const openAddImportantDateDialog = useCallback((seasonId: number) => {
    setImportantDateFormData({
      title: '',
      description: '',
      event_date: '',
      photo_url: '',
    });
    setEditingImportantDate(null);
    setImportantDateDialogSeasonId(seasonId);
  }, []);

  const openEditImportantDateDialog = useCallback((seasonId: number, date: ImportantDate) => {
    setImportantDateFormData({
      title: date.title,
      description: date.description || '',
      event_date: date.event_date?.split('T')[0] || '',
      photo_url: date.photo_url || '',
    });
    setEditingImportantDate(date);
    setImportantDateDialogSeasonId(seasonId);
  }, []);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to upload images');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const result = await uploadFile(file, 'image', user.id, 'song_art');
      if (typeof result === 'string') {
        toast.error(result);
      } else {
        setImportantDateFormData(prev => ({ ...prev, photo_url: result.fileKey }));
        toast.success('Photo uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  }, [user?.id]);

  const handleCreateImportantDate = useCallback(async () => {
    if (!importantDateDialogSeasonId) return;

    if (!importantDateFormData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!importantDateFormData.event_date) {
      toast.error('Event date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      await axios.post(
        `/api/journeys/seasons/${importantDateDialogSeasonId}/important-dates`,
        {
          title: importantDateFormData.title.trim(),
          description: importantDateFormData.description.trim() || undefined,
          event_date: importantDateFormData.event_date,
          photo_url: importantDateFormData.photo_url || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Important date added');
      resetImportantDateForm();
      onRefresh();
    } catch (error) {
      console.error('Error creating important date:', error);
      toast.error('Failed to add important date');
    } finally {
      setIsSubmitting(false);
    }
  }, [importantDateDialogSeasonId, importantDateFormData, resetImportantDateForm, onRefresh, getAuthToken]);

  const handleUpdateImportantDate = useCallback(async () => {
    if (!importantDateDialogSeasonId || !editingImportantDate) return;

    if (!importantDateFormData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!importantDateFormData.event_date) {
      toast.error('Event date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      await axios.put(
        `/api/journeys/seasons/${importantDateDialogSeasonId}/important-dates/${editingImportantDate.id}`,
        {
          title: importantDateFormData.title.trim(),
          description: importantDateFormData.description.trim() || null,
          event_date: importantDateFormData.event_date,
          photo_url: importantDateFormData.photo_url || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Important date updated');
      resetImportantDateForm();
      onRefresh();
    } catch (error) {
      console.error('Error updating important date:', error);
      toast.error('Failed to update important date');
    } finally {
      setIsSubmitting(false);
    }
  }, [importantDateDialogSeasonId, editingImportantDate, importantDateFormData, resetImportantDateForm, onRefresh, getAuthToken]);

  const handleDeleteImportantDate = useCallback(async (seasonId: number, dateId: number) => {
    if (!confirm('Are you sure you want to delete this important date?')) return;

    try {
      const token = await getAuthToken();
      await axios.delete(
        `/api/journeys/seasons/${seasonId}/important-dates/${dateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Important date deleted');
      onRefresh();
    } catch (error) {
      console.error('Error deleting important date:', error);
      toast.error('Failed to delete important date');
    }
  }, [onRefresh, getAuthToken]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Your Seasons</h2>
        {!isAddingNewSeason && (
          <Button onClick={startNewSeason} className="bg-gradient-to-r from-indigo-500 to-purple-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Season
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAddingNewSeason && (
          <SeasonForm
            formData={formData}
            setFormData={setFormData}
            isNew={true}
            isSubmitting={isSubmitting}
            onSubmit={handleCreateSeason}
            onCancel={resetForm}
          />
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {seasons.map((season) => (
          <motion.div
            key={season.id}
            layout
            className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border ${
              season.is_visible 
                ? 'border-white/20 dark:border-slate-700/40' 
                : 'border-slate-300/50 dark:border-slate-600/50 opacity-60'
            } overflow-hidden`}
          >
            <div className="p-4 flex items-center gap-4">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => toggleExpanded(season.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    {season.title}
                  </h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {season.songs?.length || 0} songs
                  </span>
                </div>
                {season.start_date && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(season.start_date), 'MMM yyyy')}
                    {season.end_date && ` - ${format(parseISO(season.end_date), 'MMM yyyy')}`}
                    {!season.end_date && ' - Present'}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleVisibility(season)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {season.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEditing(season)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSeason(season.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleExpanded(season.id)}
                >
                  {expandedSeasons.includes(season.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {editingSeasonId === season.id && (
                <div className="px-4 pb-4">
                  <SeasonForm
                    formData={formData}
                    setFormData={setFormData}
                    isNew={false}
                    seasonId={season.id}
                    isSubmitting={isSubmitting}
                    onSubmit={() => handleUpdateSeason(season.id)}
                    onCancel={resetForm}
                  />
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {expandedSeasons.includes(season.id) && editingSeasonId !== season.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4 border-t border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Songs in this season
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSongSelectorSeasonId(season.id)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Song
                      </Button>
                    </div>

                    {season.songs && season.songs.length > 0 ? (
                      <div className="space-y-2">
                        {season.songs.map((ss) => (
                          <div
                            key={ss.id}
                            className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                              {ss.song?.song_art_url ? (
                                <Image
                                  src={getImageUrl(ss.song.song_art_url)}
                                  alt={ss.song.title}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                                {ss.song?.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="truncate">{ss.song?.artist}</span>
                                {ss.personal_note && (
                                  <span className="text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                                    <span className="text-[10px]">Has note</span>
                                  </span>
                                )}
                                {ss.source_url && (
                                  <FaExternalLinkAlt className="w-3 h-3 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:text-indigo-600 flex-shrink-0"
                              onClick={() => startEditingSong(season.id, ss)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 flex-shrink-0"
                              onClick={() => handleRemoveSong(season.id, ss.song_id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No songs added yet</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Important Dates in this season
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddImportantDateDialog(season.id)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Date
                      </Button>
                    </div>

                    {season.important_dates && season.important_dates.length > 0 ? (
                      <div className="space-y-2">
                        {season.important_dates.map((date) => (
                          <div
                            key={date.id}
                            className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                              {date.photo_url ? (
                                <Image
                                  src={getImageUrl(date.photo_url)}
                                  alt={date.title}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Heart className="w-4 h-4 text-rose-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                                {date.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(parseISO(date.event_date), 'MMM d, yyyy')}
                                </span>
                                {date.description && (
                                  <span className="text-indigo-500 dark:text-indigo-400 text-[10px]">
                                    Has description
                                  </span>
                                )}
                                {date.photo_url && (
                                  <FaCamera className="w-3 h-3 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:text-indigo-600 flex-shrink-0"
                              onClick={() => openEditImportantDateDialog(season.id, date)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 flex-shrink-0"
                              onClick={() => handleDeleteImportantDate(season.id, date.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No important dates added yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {seasons.length === 0 && !isAddingNewSeason && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="relative mb-6 inline-block">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />
            <div className="relative p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl">
              <Sparkles className="w-12 h-12 text-indigo-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-3">
            Start Your Journey
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Create your first season to begin sharing your musical journey with the world.
          </p>
          <Button onClick={startNewSeason} className="bg-gradient-to-r from-indigo-500 to-purple-500">
            <Plus className="w-4 h-4 mr-2" />
            Create First Season
          </Button>
        </motion.div>
      )}

      <Dialog open={songSelectorSeasonId !== null} onOpenChange={(open) => !open && setSongSelectorSeasonId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Songs to Season</DialogTitle>
          </DialogHeader>
          {songSelectorSeasonId && (
            <SongSelector
              seasonId={songSelectorSeasonId}
              onSongAdded={() => {
                setSongSelectorSeasonId(null);
                onRefresh();
              }}
              onClose={() => setSongSelectorSeasonId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editingSong !== null} onOpenChange={(open) => !open && setEditingSong(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit Song Details
            </DialogTitle>
            <DialogDescription>
              {editingSong?.song?.song?.title && (
                <span className="font-medium">{editingSong.song.song.title}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_personal_note">Personal Note / Description</Label>
              <Textarea
                id="edit_personal_note"
                value={songEditFormData.personal_note}
                onChange={(e) => {
                  if (e.target.value.length <= 2000) {
                    setSongEditFormData(prev => ({ ...prev, personal_note: e.target.value }));
                  }
                }}
                placeholder="Add a personal note or description for this song..."
                className="bg-white dark:bg-slate-800 min-h-[100px]"
                maxLength={2000}
              />
              <div className="flex justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This note will appear below the song on your journey page
                </p>
                <p className={`text-xs ${songEditFormData.personal_note.length > 1800 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {songEditFormData.personal_note.length}/2000
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_source_url" className="flex items-center gap-2">
                <FaLink className="w-3.5 h-3.5" />
                Source Hyperlink
              </Label>
              <Input
                id="edit_source_url"
                type="url"
                value={songEditFormData.source_url}
                onChange={(e) => setSongEditFormData(prev => ({ ...prev, source_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-white dark:bg-slate-800"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Link to the original source (YouTube, SoundCloud, etc.)
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingSong(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSong}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importantDateDialogSeasonId !== null} onOpenChange={(open) => !open && resetImportantDateForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              {editingImportantDate ? 'Edit Important Date' : 'Add Important Date'}
            </DialogTitle>
            <DialogDescription>
              {editingImportantDate 
                ? 'Update the details for this important date.'
                : 'Add a meaningful date to this season of your journey.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="important_date_title">Title *</Label>
              <Input
                id="important_date_title"
                value={importantDateFormData.title}
                onChange={(e) => setImportantDateFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="E.g., Date of baptism, marriage, birth of child, or other important date"
                className="bg-white dark:bg-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="important_date_event_date">Event Date *</Label>
              <Input
                id="important_date_event_date"
                type="date"
                value={importantDateFormData.event_date}
                onChange={(e) => setImportantDateFormData(prev => ({ ...prev, event_date: e.target.value }))}
                className="bg-white dark:bg-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="important_date_description">Description</Label>
              <Textarea
                id="important_date_description"
                value={importantDateFormData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setImportantDateFormData(prev => ({ ...prev, description: e.target.value }));
                  }
                }}
                placeholder="Add a description or reflection about this date..."
                className="bg-white dark:bg-slate-800 min-h-[80px]"
                maxLength={500}
              />
              <div className="flex justify-end">
                <p className={`text-xs ${importantDateFormData.description.length > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {importantDateFormData.description.length}/500
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FaCamera className="w-3.5 h-3.5" />
                Photo
              </Label>
              
              {importantDateFormData.photo_url ? (
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <Image
                      src={getImageUrl(importantDateFormData.photo_url)}
                      alt="Important date photo"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={() => setImportantDateFormData(prev => ({ ...prev, photo_url: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={photoInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="important_date_photo"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-full"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Optional. Max 5MB. JPG, PNG, or WebP.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={resetImportantDateForm}
                disabled={isSubmitting || isUploadingPhoto}
              >
                Cancel
              </Button>
              <Button
                onClick={editingImportantDate ? handleUpdateImportantDate : handleCreateImportantDate}
                disabled={isSubmitting || isUploadingPhoto}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingImportantDate ? 'Saving...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingImportantDate ? 'Save Changes' : 'Add Date'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
