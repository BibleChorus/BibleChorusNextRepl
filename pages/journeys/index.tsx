import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { seasons, Season } from '@/lib/journeys-data';
import { Song } from '@/types';
import SeasonSection from '@/components/journeys/SeasonSection';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import db from '@/db';

interface JourneysPageProps {
    seasonsWithSongs: {
        season: Season;
        songs: Song[];
    }[];
}

export default function JourneysPage({ seasonsWithSongs }: JourneysPageProps) {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
            <Head>
                <title>Journeys | BibleChorus</title>
                <meta name="description" content="A musical journey through seasons of creation." />
            </Head>

            <Navbar />

            <main>
                {/* Hero Section */}
                <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-50" />

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="z-10 text-center px-4"
                    >
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Journeys
                        </h1>
                        <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
                            A collection of musical seasons, marking time through sound and spirit.
                        </p>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
                    >
                        <span className="text-xs uppercase tracking-widest">Explore</span>
                        <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
                    </motion.div>
                </section>

                {/* Seasons */}
                <div className="relative z-10">
                    {seasonsWithSongs.map(({ season, songs }) => (
                        <SeasonSection key={season.id} season={season} songs={songs} />
                    ))}
                </div>

                {/* Footer / End */}
                <section className="py-32 text-center text-white/20">
                    <p>The journey continues...</p>
                </section>
            </main>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    try {
        // Fetch all songs ordered by date
        const allSongs = await db('songs')
            .select('*')
            .orderBy('created_at', 'desc');

        // Group songs by season
        const seasonsWithSongs = seasons.map((season) => {
            const seasonStart = new Date(season.startDate).getTime();
            const seasonEnd = new Date(season.endDate).getTime();

            const seasonSongs = allSongs.filter((song: any) => {
                const songDate = new Date(song.created_at).getTime();
                return songDate >= seasonStart && songDate <= seasonEnd;
            });

            // Sort songs within season by date (descending or ascending? User said "date order", usually implies chronological for a journey, or reverse chronological for latest first. "Journey" implies chronological usually, but portfolios often show newest first. Let's go with Descending (newest first) as it's standard for blogs/feeds, but "Journey" might imply Ascending. The user said "view different seasons marked by year... lists their songs created during that season, in date order."
            // Let's stick to the order from DB (descending) for now, or explicitly sort.
            // If it's a "Journey" starting from "The Beginning", maybe Ascending is better?
            // "The Beginning" is 2023. "Growth" is 2024.
            // If I scroll down, I see 2023 then 2024? Or 2025 then 2024?
            // Usually "Journeys" go from start to finish (Ascending seasons).
            // But the config has 2023 first.
            // If I map seasons in order of the array, it will be 2023 -> 2024 -> 2025.
            // So as I scroll down, I go forward in time.
            // So songs should probably be Ascending too?
            // "lists their songs created during that season, in date order."
            // Let's sort songs Ascending (oldest to newest) within the season to match the "Journey" forward in time feel.

            const sortedSongs = seasonSongs.sort((a: any, b: any) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            // Map to Song type (ensure dates are strings if needed)
            const serializedSongs = sortedSongs.map((song: any) => ({
                ...song,
                created_at: song.created_at.toISOString(),
                // Ensure other date fields are strings if they exist
            }));

            return {
                season,
                songs: serializedSongs,
            };
        });

        return {
            props: {
                seasonsWithSongs,
            },
        };
    } catch (error) {
        console.error('Error fetching journeys data:', error);
        return {
            props: {
                seasonsWithSongs: [],
            },
        };
    }
};

JourneysPage.disableLayout = true;
