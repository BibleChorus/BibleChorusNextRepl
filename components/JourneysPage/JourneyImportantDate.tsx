"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Calendar, ImageIcon } from "lucide-react";
import { ImportantDate } from "@/types/journey";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatJourneyDate, journeyMediaUrl } from "./journey-utils";

interface JourneyImportantDateProps {
  importantDate: ImportantDate;
  theme?: Record<string, string>;
}

export const JourneyImportantDate: React.FC<JourneyImportantDateProps> = ({
  importantDate,
}) => {
  const [showPhoto, setShowPhoto] = useState(false);
  const photo = journeyMediaUrl(importantDate.photo_url);
  const date = formatJourneyDate(importantDate.event_date);
  return (
    <article className="relative rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background text-primary">
          <Calendar className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            A moment to remember
          </p>
          <h3 className="font-serif text-xl">{importantDate.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{date}</p>
          {importantDate.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {importantDate.description}
            </p>
          )}
          {photo && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => setShowPhoto(true)}
            >
              <ImageIcon className="mr-2 h-3.5 w-3.5" />
              View photo
            </Button>
          )}
        </div>
        {photo && (
          <button
            onClick={() => setShowPhoto(true)}
            className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
            aria-label={`View photo of ${importantDate.title}`}
          >
            <Image
              src={photo}
              alt={importantDate.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        )}
      </div>
      <Dialog open={showPhoto} onOpenChange={setShowPhoto}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{importantDate.title}</DialogTitle>
            <DialogDescription>{date}</DialogDescription>
          </DialogHeader>
          {photo && (
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={photo}
                alt={importantDate.title}
                fill
                sizes="(max-width: 768px) 90vw, 750px"
                className="object-contain"
              />
            </div>
          )}
          {importantDate.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {importantDate.description}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
};
