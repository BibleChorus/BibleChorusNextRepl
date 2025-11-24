import React from 'react';
import { Song } from '@/types';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { motion } from 'framer-motion';
import { Play, Pause, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SongItemProps {
    song: Song;
    index: number;
}

const SongItem: React.FC<SongItemProps> = ({ song, index }) => {
    const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
    const isCurrentSong = currentSong?.id === song.id;
    const isSongPlaying = isCurrentSong && isPlaying;

    const handlePlayClick = () => {
        if (isCurrentSong) {
            if (isPlaying) {
                pause();
            } else {
                resume();
            }
        } else {
            playSong({
                id: song.id,
                title: song.title,
                artist: song.artist,
                audioUrl: song.audio_url,
                coverArtUrl: song.song_art_url,
                duration: song.duration,
                uploaded_by: song.uploaded_by,
                audio_url: song.audio_url,
            });
        }
    };

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative flex items-center justify-between py-4 border-b border-white/10 hover:bg-white/5 transition-colors px-4 rounded-lg"
        >
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={handlePlayClick}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all group-hover:scale-110"
                >
                    {isSongPlaying ? (
                        <Pause size={16} fill="currentColor" />
                    ) : (
                        <Play size={16} fill="currentColor" className="ml-1" />
                    )}
                </button>

                <div className="flex flex-col">
                    <h3 className={`font-medium text-lg ${isCurrentSong ? 'text-primary' : 'text-white'}`}>
                        {song.title}
                    </h3>
                    <span className="text-sm text-white/50">
                        {format(new Date(song.created_at), 'MMMM d, yyyy')}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6 text-white/50 text-sm">
                {song.artist && <span className="hidden sm:block">{song.artist}</span>}
                <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatDuration(song.duration)}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default SongItem;
