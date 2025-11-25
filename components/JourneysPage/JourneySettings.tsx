'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { JourneyProfile, UpdateJourneyProfileRequest } from '@/types/journey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { FaEye as Eye, FaEyeSlash as EyeOff, FaPalette as Palette, FaGlobe as Globe, FaCog as Settings } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface JourneySettingsProps {
  profile: JourneyProfile;
  onProfileUpdate: (profile: JourneyProfile) => void;
}

const themeColors = [
  { value: 'indigo', label: 'Indigo', gradient: 'from-indigo-500 to-blue-500' },
  { value: 'purple', label: 'Purple', gradient: 'from-purple-500 to-pink-500' },
  { value: 'pink', label: 'Pink', gradient: 'from-pink-500 to-rose-500' },
  { value: 'amber', label: 'Amber', gradient: 'from-amber-500 to-orange-500' },
  { value: 'emerald', label: 'Emerald', gradient: 'from-emerald-500 to-teal-500' },
  { value: 'cyan', label: 'Cyan', gradient: 'from-cyan-500 to-sky-500' },
];

const layoutStyles = [
  { value: 'timeline', label: 'Timeline', description: 'Elegant vertical timeline with year markers' },
  { value: 'grid', label: 'Grid', description: 'Modern grid layout with cards' },
  { value: 'cards', label: 'Cards', description: 'Full-width season cards' },
];

export const JourneySettings: React.FC<JourneySettingsProps> = ({
  profile,
  onProfileUpdate,
}) => {
  const { getAuthToken } = useAuth();
  const [formData, setFormData] = useState<UpdateJourneyProfileRequest>({
    title: profile.title || '',
    subtitle: profile.subtitle || '',
    bio: profile.bio || '',
    theme_color: profile.theme_color || 'indigo',
    is_public: profile.is_public,
    show_song_dates: profile.show_song_dates,
    show_play_counts: profile.show_play_counts,
    layout_style: profile.layout_style,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = 
      formData.title !== profile.title ||
      formData.subtitle !== (profile.subtitle || '') ||
      formData.bio !== (profile.bio || '') ||
      formData.theme_color !== profile.theme_color ||
      formData.is_public !== profile.is_public ||
      formData.show_song_dates !== profile.show_song_dates ||
      formData.show_play_counts !== profile.show_play_counts ||
      formData.layout_style !== profile.layout_style;
    setHasChanges(changed);
  }, [formData, profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getAuthToken();
      const response = await axios.put('/api/journeys/profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onProfileUpdate(response.data);
      toast.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const currentTheme = themeColors.find(t => t.value === formData.theme_color) || themeColors[0];

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/20 dark:border-slate-700/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-r ${currentTheme.gradient}`}>
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Journey Settings</CardTitle>
              <CardDescription>Customize how your journey appears to visitors</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Globe className="w-4 h-4" />
              Basic Information
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Journey Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="My Musical Journey"
                  className="bg-white dark:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="A story told through scripture songs"
                  className="bg-white dark:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">About Your Journey</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Share a bit about your musical journey and what drives you to create..."
                  className="bg-white dark:bg-slate-800 min-h-[120px]"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Palette className="w-4 h-4" />
              Appearance
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme Color</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {themeColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData(prev => ({ ...prev, theme_color: color.value }))}
                      className={`relative p-3 rounded-xl transition-all ${
                        formData.theme_color === color.value 
                          ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-105' 
                          : 'hover:scale-105'
                      }`}
                    >
                      <div className={`h-8 rounded-lg bg-gradient-to-r ${color.gradient}`} />
                      <span className="block text-xs mt-1 text-slate-600 dark:text-slate-400">
                        {color.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Layout Style</Label>
                <Select
                  value={formData.layout_style}
                  onValueChange={(value: 'timeline' | 'grid' | 'cards') => 
                    setFormData(prev => ({ ...prev, layout_style: value }))
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {layoutStyles.map((layout) => (
                      <SelectItem key={layout.value} value={layout.value}>
                        <div>
                          <div className="font-medium">{layout.label}</div>
                          <div className="text-xs text-slate-500">{layout.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Eye className="w-4 h-4" />
              Visibility & Privacy
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <Label htmlFor="is_public" className="text-base">Make Journey Public</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Allow anyone to view your journey
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <Label htmlFor="show_dates" className="text-base">Show Song Dates</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Display when each song was created
                  </p>
                </div>
                <Switch
                  id="show_dates"
                  checked={formData.show_song_dates}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_song_dates: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <Label htmlFor="show_plays" className="text-base">Show Play Counts</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Display how many times each song has been played
                  </p>
                </div>
                <Switch
                  id="show_plays"
                  checked={formData.show_play_counts}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_play_counts: checked }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: hasChanges ? 1 : 0, y: hasChanges ? 0 : 20 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          size="lg"
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-2xl shadow-indigo-500/25"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </motion.div>
    </div>
  );
};
