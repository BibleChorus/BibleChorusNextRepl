import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ModeToggle } from '../components/mode-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButtons } from '@/components/AuthButtons';
import { UserDropdown } from '@/components/UserDropdown';
import { useRouter } from 'next/router';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/progress');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
      <Head>
        <title>BibleChorus - Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="text-center">
        <div className="absolute top-4 right-4 flex items-center space-x-4">
          {user ? (
            <UserDropdown user={user} />
          ) : (
            <AuthButtons />
          )}
          <ModeToggle />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-8"
        >
          Welcome to BibleChorus
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-600 dark:text-gray-300 mb-8"
        >
          Explore, sing, and share your favorite Bible songs
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-purple-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-purple-700 transition-colors duration-300"
          onClick={handleGetStarted}
        >
          Get Started
        </motion.button>
      </main>
    </div>
  );
}