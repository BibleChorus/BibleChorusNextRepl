'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, BookOpen, Music } from 'lucide-react';
import { BIBLE_BOOKS, BOLLS_LIFE_API_BIBLE_TRANSLATIONS } from '@/lib/constants';
import axios from 'axios';
import DOMPurify from 'isomorphic-dompurify';

interface JourneyLyricsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: any;
}

const JourneyLyricsDialog: React.FC<JourneyLyricsDialogProps> = ({ isOpen, onClose, song }) => {
  const [viewOption, setViewOption] = useState<'both' | 'lyrics' | 'verses'>('both');
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [translation, setTranslation] = useState(() => {
    const validTranslations = BOLLS_LIFE_API_BIBLE_TRANSLATIONS.map(t => t.shortName);
    return validTranslations.includes(song?.bible_translation_used)
      ? song.bible_translation_used
      : 'NASB';
  });

  useEffect(() => {
    if (isOpen && song?.bible_verses && song.bible_verses.length > 0) {
      fetchVerses();
    }
  }, [isOpen, translation]);

  const fetchVerses = async () => {
    if (!song?.bible_verses) return;
    setIsLoadingVerses(true);
    try {
      const versesToFetch = song.bible_verses.map((verse: any) => ({
        translation,
        book: BIBLE_BOOKS.indexOf(verse.book) + 1,
        chapter: verse.chapter,
        verses: [verse.verse],
      }));
      const response = await axios.post('/api/fetch-verses', versesToFetch);
      const fetchedVerses = response.data.flat().map((verse: any) => ({
        book: BIBLE_BOOKS[verse.book - 1],
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
      }));
      setVerses(fetchedVerses);
    } catch (error) {
      console.error('Error fetching verses:', error);
    } finally {
      setIsLoadingVerses(false);
    }
  };

  const hasLyrics = song?.lyrics && song.lyrics.trim().length > 0;
  const hasVerses = song?.bible_verses && song.bible_verses.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-4xl w-[95vw] max-h-[85vh] p-0 border-white/10 bg-[#0a0a0a] text-[#e5e5e5] overflow-hidden"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        <DialogHeader className="px-6 md:px-10 py-6 border-b border-white/10">
          <DialogTitle 
            className="text-2xl md:text-3xl font-normal italic text-[#e5e5e5]"
            style={{ fontFamily: "'Italiana', serif" }}
          >
            {song?.title}
          </DialogTitle>
          <p className="text-[#a0a0a0] text-sm mt-1">
            {song?.artist}
          </p>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1 py-4 border-b border-white/5">
          {hasLyrics && (
            <button
              onClick={() => setViewOption('lyrics')}
              className={`px-5 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
                viewOption === 'lyrics' 
                  ? 'text-[#d4af37] border-b border-[#d4af37]' 
                  : 'text-[#a0a0a0] hover:text-[#e5e5e5]'
              }`}
            >
              <Music className="w-3 h-3 inline-block mr-2" />
              Lyrics
            </button>
          )}
          {hasVerses && (
            <button
              onClick={() => setViewOption('verses')}
              className={`px-5 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
                viewOption === 'verses' 
                  ? 'text-[#d4af37] border-b border-[#d4af37]' 
                  : 'text-[#a0a0a0] hover:text-[#e5e5e5]'
              }`}
            >
              <BookOpen className="w-3 h-3 inline-block mr-2" />
              Scripture
            </button>
          )}
          {hasLyrics && hasVerses && (
            <button
              onClick={() => setViewOption('both')}
              className={`px-5 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
                viewOption === 'both' 
                  ? 'text-[#d4af37] border-b border-[#d4af37]' 
                  : 'text-[#a0a0a0] hover:text-[#e5e5e5]'
              }`}
            >
              Side by Side
            </button>
          )}
        </div>

        {hasVerses && viewOption !== 'lyrics' && (
          <div className="flex items-center justify-center gap-3 py-3 border-b border-white/5">
            <span className="text-xs text-[#a0a0a0]/60 tracking-wide">Translation:</span>
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="bg-transparent border border-white/10 text-[#e5e5e5] text-xs px-3 py-1.5 rounded-sm focus:outline-none focus:border-[#d4af37]/50 transition-colors cursor-pointer"
            >
              {BOLLS_LIFE_API_BIBLE_TRANSLATIONS.map((t) => (
                <option key={t.shortName} value={t.shortName} className="bg-[#0a0a0a]">
                  {t.shortName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {viewOption === 'both' && hasLyrics && hasVerses ? (
            <div className="h-[400px] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <ScrollArea className="h-full">
                <div className="p-6 md:p-10">
                  <h3 className="text-xs tracking-[0.3em] text-[#d4af37] uppercase mb-6 flex items-center gap-2">
                    <Music className="w-3 h-3" />
                    Lyrics
                  </h3>
                  <p className="text-[#e5e5e5]/90 whitespace-pre-wrap leading-8 font-light text-sm md:text-base">
                    {song.lyrics}
                  </p>
                </div>
              </ScrollArea>
              <ScrollArea className="h-full">
                <div className="p-6 md:p-10">
                  <h3 className="text-xs tracking-[0.3em] text-[#d4af37] uppercase mb-6 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    Scripture
                  </h3>
                  {isLoadingVerses ? (
                    <div className="space-y-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 w-24 bg-white/10 rounded mb-3" />
                          <div className="h-4 w-full bg-white/5 rounded mb-2" />
                          <div className="h-4 w-3/4 bg-white/5 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {verses.map((verse, index) => (
                        <div key={index}>
                          <p className="text-[#d4af37]/80 text-xs tracking-wider mb-2 font-medium">
                            {verse.book} {verse.chapter}:{verse.verse}
                          </p>
                          <div 
                            className="text-[#e5e5e5]/80 leading-7 font-light text-sm md:text-base italic"
                            style={{ fontFamily: "'Italiana', serif" }}
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(verse.text) }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : viewOption === 'lyrics' ? (
            <ScrollArea className="h-[400px]">
              <div className="p-6 md:p-10">
                <h3 className="text-xs tracking-[0.3em] text-[#d4af37] uppercase mb-6 flex items-center gap-2">
                  <Music className="w-3 h-3" />
                  Lyrics
                </h3>
                <p className="text-[#e5e5e5]/90 whitespace-pre-wrap leading-8 font-light text-sm md:text-base max-w-2xl">
                  {song?.lyrics || 'No lyrics available.'}
                </p>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="p-6 md:p-10">
                <h3 className="text-xs tracking-[0.3em] text-[#d4af37] uppercase mb-6 flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  Scripture
                </h3>
                {isLoadingVerses ? (
                  <div className="space-y-6 max-w-2xl">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 w-24 bg-white/10 rounded mb-3" />
                        <div className="h-4 w-full bg-white/5 rounded mb-2" />
                        <div className="h-4 w-3/4 bg-white/5 rounded" />
                      </div>
                    ))}
                  </div>
                ) : verses.length > 0 ? (
                  <div className="space-y-8 max-w-2xl">
                    {verses.map((verse, index) => (
                      <div key={index}>
                        <p className="text-[#d4af37]/80 text-xs tracking-wider mb-2 font-medium">
                          {verse.book} {verse.chapter}:{verse.verse}
                        </p>
                        <div 
                          className="text-[#e5e5e5]/80 leading-7 font-light text-sm md:text-base italic"
                          style={{ fontFamily: "'Italiana', serif" }}
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(verse.text) }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#a0a0a0]/60 italic">No scripture verses available.</p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyLyricsDialog;
