import React from 'react';
import { Season } from '@/lib/journeys-data';
import { Song } from '@/types';
import SongItem from './SongItem';
import { motion, useScroll, useTransform } from 'framer-motion';

interface SeasonSectionProps {
    season: Season;
    songs: Song[];
}

const SeasonSection: React.FC<SeasonSectionProps> = ({ season, songs }) => {
    const { scrollYProgress } = useScroll();

    return (
        <section className="min-h-screen relative py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Sticky Sidebar / Header */}
                <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="text-8xl font-bold opacity-10 mb-4 font-serif tracking-tighter">
                            {season.yearLabel}
                        </div>
                        <h2
                            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
                            style={{
                                backgroundImage: `linear-gradient(to right, ${season.theme?.primaryColor || '#fff'}, ${season.theme?.secondaryColor || '#fff'})`
                            }}
                        >
                            {season.title}
                        </h2>
                        <p className="text-lg text-white/70 leading-relaxed max-w-md">
                            {season.description}
                        </p>

                        <div className="mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-white/20 to-transparent" />
                    </motion.div>
                </div>

                {/* Songs List */}
                <div className="lg:col-span-8 space-y-2">
                    {songs.length > 0 ? (
                        songs.map((song, index) => (
                            <SongItem key={song.id} song={song} index={index} />
                        ))
                    ) : (
                        <div className="text-white/30 italic py-10">
                            No songs found for this season.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default SeasonSection;
