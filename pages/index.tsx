import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
      <Head>
        <title>BibleChorus - Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-bold text-gray-800 mb-8"
        >
          Welcome to BibleChorus
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-600 mb-8"
        >
          Explore, sing, and share your favorite Bible songs
        </motion.p>
        <Link href="/upload">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-purple-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-purple-700 transition-colors duration-300"
          >
            Get Started
          </motion.button>
        </Link>
      </main>
    </div>
  );
}