'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Music } from 'lucide-react';
import { BIBLE_BOOKS, BOLLS_LIFE_API_BIBLE_TRANSLATIONS } from '@/lib/constants';
import axios from 'axios';
import DOMPurify from 'isomorphic-dompurify';

interface JourneyLyricsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: any;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-void/90 backdrop-blur-xl z-[100]"
            onClick={onClose}
            data-journey-dialog
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="fixed inset-4 md:inset-12 lg:inset-20 bg-[#0a0a0a] border border-white/10 z-[101] overflow-hidden flex flex-col"
            style={{ fontFamily: "'Manrope', sans-serif" }}
            data-journey-dialog
          >
            <div className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-white/10">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: easeOutExpo }}
                  className="text-2xl md:text-3xl text-silk font-serif italic"
                  style={{ fontFamily: "'Italiana', serif" }}
                >
                  {song?.title}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-mist text-sm mt-1"
                >
                  {song?.artist}
                </motion.p>
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-mist hover:text-silk hover:border-white/40 transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center justify-center gap-1 py-4 border-b border-white/5"
            >
              {hasLyrics && (
                <button
                  onClick={() => setViewOption('lyrics')}
                  className={`px-5 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
                    viewOption === 'lyrics' 
                      ? 'text-gold border-b border-gold' 
                      : 'text-mist hover:text-silk'
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
                      ? 'text-gold border-b border-gold' 
                      : 'text-mist hover:text-silk'
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
                      ? 'text-gold border-b border-gold' 
                      : 'text-mist hover:text-silk'
                  }`}
                >
                  Side by Side
                </button>
              )}
            </motion.div>

            {hasVerses && viewOption !== 'lyrics' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center justify-center gap-3 py-3 border-b border-white/5"
              >
                <span className="text-xs text-mist/60 tracking-wide">Translation:</span>
                <select
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className="bg-transparent border border-white/10 text-silk text-xs px-3 py-1.5 rounded-none focus:outline-none focus:border-gold/50 transition-colors"
                >
                  {BOLLS_LIFE_API_BIBLE_TRANSLATIONS.map((t) => (
                    <option key={t.shortName} value={t.shortName} className="bg-[#0a0a0a]">
                      {t.shortName}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}

            <div className="flex-1 overflow-hidden">
              {viewOption === 'both' && hasLyrics && hasVerses ? (
                <div className="h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                  <div className="overflow-y-auto p-6 md:p-10">
                    <h3 className="text-xs tracking-[0.3em] text-gold uppercase mb-6 flex items-center gap-2">
                      <Music className="w-3 h-3" />
                      Lyrics
                    </h3>
                    <p className="text-silk/90 whitespace-pre-wrap leading-8 font-light text-sm md:text-base">
                      {song.lyrics}
                    </p>
                  </div>
                  <div className="overflow-y-auto p-6 md:p-10">
                    <h3 className="text-xs tracking-[0.3em] text-gold uppercase mb-6 flex items-center gap-2">
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
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5, ease: easeOutExpo }}
                          >
                            <p className="text-gold/80 text-xs tracking-wider mb-2 font-medium">
                              {verse.book} {verse.chapter}:{verse.verse}
                            </p>
                            <div 
                              className="text-silk/80 leading-7 font-light text-sm md:text-base font-serif italic"
                              style={{ fontFamily: "'Italiana', serif" }}
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(verse.text) }}
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : viewOption === 'lyrics' ? (
                <div className="h-full overflow-y-auto p-6 md:p-10">
                  <h3 className="text-xs tracking-[0.3em] text-gold uppercase mb-6 flex items-center gap-2">
                    <Music className="w-3 h-3" />
                    Lyrics
                  </h3>
                  <p className="text-silk/90 whitespace-pre-wrap leading-8 font-light text-sm md:text-base max-w-2xl">
                    {song?.lyrics || 'No lyrics available.'}
                  </p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-6 md:p-10">
                  <h3 className="text-xs tracking-[0.3em] text-gold uppercase mb-6 flex items-center gap-2">
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
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.5, ease: easeOutExpo }}
                        >
                          <p className="text-gold/80 text-xs tracking-wider mb-2 font-medium">
                            {verse.book} {verse.chapter}:{verse.verse}
                          </p>
                          <div 
                            className="text-silk/80 leading-7 font-light text-sm md:text-base font-serif italic"
                            style={{ fontFamily: "'Italiana', serif" }}
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(verse.text) }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-mist/60 italic">No scripture verses available.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default JourneyLyricsDialog;
