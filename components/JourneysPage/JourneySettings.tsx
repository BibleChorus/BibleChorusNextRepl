"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";
import { Eye, Globe, Link2, Loader2, Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { JourneyProfile, UpdateJourneyProfileRequest } from "@/types/journey";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeExternalUrl } from "./journey-utils";

interface JourneySettingsProps {
  profile: JourneyProfile;
  onProfileUpdate: (profile: JourneyProfile) => void;
}

export const JourneySettings: React.FC<JourneySettingsProps> = ({
  profile,
  onProfileUpdate,
}) => {
  const { getAuthToken } = useAuth();
  const initial = useMemo(
    () => ({
      title: profile.title || "",
      subtitle: profile.subtitle || "",
      bio: profile.bio || "",
      cover_image_url: profile.cover_image_url || "",
      notebook_lm_url: profile.notebook_lm_url || "",
      is_public: profile.is_public,
      show_song_dates: profile.show_song_dates,
      show_play_counts: profile.show_play_counts,
      layout_style: profile.layout_style,
    }),
    [profile],
  );
  const [form, setForm] = useState<UpdateJourneyProfileRequest>(initial);
  const [saving, setSaving] = useState(false);
  const changed = Object.keys(initial).some(
    (key) =>
      form[key as keyof UpdateJourneyProfileRequest] !==
      initial[key as keyof typeof initial],
  );

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error("Give your journey a title");
      return;
    }
    const editedCover =
      form.cover_image_url !== initial.cover_image_url
        ? form.cover_image_url
        : undefined;
    const editedNotebook =
      form.notebook_lm_url !== initial.notebook_lm_url
        ? form.notebook_lm_url
        : undefined;
    for (const value of [editedNotebook, editedCover]) {
      if (value?.trim() && !safeExternalUrl(value.trim())) {
        toast.error("Links must be valid http:// or https:// URLs");
        return;
      }
    }
    setSaving(true);
    try {
      const token = await getAuthToken();
      const data = {
        ...form,
        title: form.title.trim(),
        cover_image_url: form.cover_image_url?.trim() || "",
        notebook_lm_url: form.notebook_lm_url?.trim() || "",
      };
      const response = await axios.put<JourneyProfile>(
        "/api/journeys/profile",
        data,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onProfileUpdate(response.data);
      setForm({ ...data });
      toast.success("Journey settings saved");
    } catch (error) {
      console.error("Error saving journey settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-serif text-2xl">Introduce your journey</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Give visitors a sense of the story they are stepping into.
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="journey-title">Journey title</Label>
              <Input
                id="journey-title"
                value={form.title}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    title: event.target.value,
                  }))
                }
                placeholder="My musical journey"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journey-subtitle">Subtitle</Label>
              <Input
                id="journey-subtitle"
                value={form.subtitle}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    subtitle: event.target.value,
                  }))
                }
                placeholder="A story told through scripture songs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journey-bio">About your journey</Label>
              <Textarea
                id="journey-bio"
                value={form.bio}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    bio: event.target.value,
                  }))
                }
                placeholder="Share what has shaped your music and your faith…"
                className="min-h-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journey-cover">Cover image URL</Label>
              <Input
                id="journey-cover"
                value={form.cover_image_url}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    cover_image_url: event.target.value,
                  }))
                }
                type="url"
                placeholder="https://…"
              />
              <p className="text-xs text-muted-foreground">
                Use a link to an image for the cover of your journey.
              </p>
            </div>
          </div>
        </section>
        <section className="surface-card p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-serif text-2xl">Visibility & presentation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose what you share and how the story unfolds.
              </p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {[
              {
                key: "is_public" as const,
                title: "Public journey",
                description:
                  "Let anyone explore your journey and find it in the community.",
              },
              {
                key: "show_song_dates" as const,
                title: "Song dates",
                description: "Show when each song belongs in your story.",
              },
              {
                key: "show_play_counts" as const,
                title: "Play counts",
                description: "Show how many times your songs have been played.",
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between gap-5 py-4 first:pt-0"
              >
                <div className="space-y-1">
                  <Label htmlFor={setting.key} className="text-sm font-medium">
                    {setting.title}
                  </Label>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  id={setting.key}
                  checked={Boolean(form[setting.key])}
                  onCheckedChange={(checked) =>
                    setForm((previous) => ({
                      ...previous,
                      [setting.key]: checked,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-border pt-5">
            <Label htmlFor="journey-layout">Season layout</Label>
            <Select
              value={form.layout_style}
              onValueChange={(value: JourneyProfile["layout_style"]) =>
                setForm((previous) => ({ ...previous, layout_style: value }))
              }
            >
              <SelectTrigger id="journey-layout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="cards">Season cards</SelectItem>
                <SelectItem value="grid">Season grid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
        <section className="surface-card p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-2xl">Explore further</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notebook-link">Google NotebookLM link</Label>
            <Input
              id="notebook-link"
              value={form.notebook_lm_url}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  notebook_lm_url: event.target.value,
                }))
              }
              placeholder="https://notebooklm.google.com/notebook/…"
              type="url"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Link a shared notebook so visitors can explore your journey&apos;s
              songs and scripture with AI.
            </p>
          </div>
        </section>
      </div>
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="surface-card p-6">
          <Settings className="mb-4 h-5 w-5 text-primary" />
          <h3 className="font-serif text-xl">Make it your own</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your journey stays private until you choose to make it public. You
            can hide individual seasons in the season editor.
          </p>
          <div className="mt-6 border-t border-border pt-5">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || !changed}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <p
              className="mt-3 text-center text-xs text-muted-foreground"
              aria-live="polite"
            >
              {changed ? "You have unsaved changes" : "All changes saved"}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};
