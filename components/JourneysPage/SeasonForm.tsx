"use client";

import React, { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface SeasonFormData {
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

export const SeasonForm = memo(function SeasonForm({
  formData,
  setFormData,
  isNew,
  isSubmitting,
  onSubmit,
  onCancel,
}: SeasonFormProps) {
  const handleChange = useCallback(
    (field: keyof SeasonFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData],
  );

  return (
    <motion.form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-muted/50 rounded-2xl p-6 space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Season Title *</Label>
        <Input
          id="title"
          required
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g., Season of Growth"
          className="bg-background"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            required
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange("start_date", e.target.value)}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End Date (optional)</Label>
          <Input
            id="end_date"
            min={formData.start_date || undefined}
            type="date"
            value={formData.end_date}
            onChange={(e) => handleChange("end_date", e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Describe or Reflect upon this Season (sentences or paragraph(s))"
          className="bg-background min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scripture">Scripture Reference</Label>
        <Input
          id="scripture"
          value={formData.scripture_reference}
          onChange={(e) => handleChange("scripture_reference", e.target.value)}
          placeholder="e.g., Psalm 23:1-6"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reflection">Short Quote About Season</Label>
        <Textarea
          id="reflection"
          value={formData.reflection}
          onChange={(e) => handleChange("reflection", e.target.value)}
          placeholder="Provide a Short Quote About this Season to be Highlighted (one or two sentences)"
          className="bg-background min-h-[80px]"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="w-4 h-4 mr-2" />
          {isNew ? "Create Season" : "Save Changes"}
        </Button>
      </div>
    </motion.form>
  );
});
