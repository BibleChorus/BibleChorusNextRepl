'use client';

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Season } from '@/types/journey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SongSelector } from './SongSelector';
import { 
  Plus, Pencil, Trash2, Music, GripVertical, ChevronDown, ChevronUp, 
  Calendar, Save, X, Sparkles 
} from 'lucide-react';
import { FaEye as Eye, FaEyeSlash as EyeOff } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface SeasonEditorProps {
  seasons: Season[];
  onSeasonsChange: (seasons: Season[]) => void;
  onRefresh: () => void;
}

const themeColors = [
  { value: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
  { value: 'amber', label: 'Amber', color: 'bg-amber-500' },
  { value: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
  { value: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
];

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

interface SeasonFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  theme_color: string;
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="theme">Theme Color</Label>
          <Select
            value={formData.theme_color}
            onValueChange={(value) => handleChange('theme_color', value)}
          >
            <SelectTrigger className="bg-white dark:bg-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themeColors.map(color => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color.color}`} />
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          placeholder="Describe what this season meant to you..."
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
        <Label htmlFor="reflection">Personal Reflection</Label>
        <Textarea
          id="reflection"
          value={formData.reflection}
          onChange={(e) => handleChange('reflection', e.target.value)}
          placeholder="Share a reflection or testimony from this season..."
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
  const { getAuthToken } = useAuth();
  const [expandedSeasons, setExpandedSeasons] = useState<number[]>([]);
  const [isAddingNewSeason, setIsAddingNewSeason] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<number | null>(null);
  const [songSelectorSeasonId, setSongSelectorSeasonId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<SeasonFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    theme_color: 'indigo',
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
      theme_color: 'indigo',
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

  const startEditing = useCallback((season: Season) => {
    setFormData({
      title: season.title,
      description: season.description || '',
      start_date: season.start_date?.split('T')[0] || '',
      end_date: season.end_date?.split('T')[0] || '',
      theme_color: season.theme_color || 'indigo',
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
              <div className="cursor-grab">
                <GripVertical className="w-5 h-5 text-slate-400" />
              </div>

              <div 
                className="flex-1 cursor-pointer"
                onClick={() => toggleExpanded(season.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-${season.theme_color || 'indigo'}-500`} />
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
                                  src={`${CDN_URL}${ss.song.song_art_url}`}
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
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {ss.song?.artist}
                              </p>
                            </div>
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
    </div>
  );
};
