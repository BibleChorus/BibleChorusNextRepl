import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ModeToggle } from '../components/mode-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButtons } from '@/components/AuthButtons';
import { UserDropdown } from '@/components/UserDropdown';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, BookOpen, Upload, Map, MessageSquare } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    // Update the redirection to the playlists page
    router.push('/playlists');
  };

  const features = [
    { title: 'Learn Scripture', description: 'Study "The Eternal Danger of Habitual Sin" with interactive lessons and quizzes.', icon: BookOpen, link: '/learn/habitual-sin' },
    { title: 'Listen to Bible Songs', description: 'Explore a growing collection of Bible-inspired music.', icon: Music, link: '/listen' },
    { title: 'Upload Your Songs', description: 'Share your own Bible-inspired compositions.', icon: Upload, link: '/upload' },
    { title: 'Track Progress', description: 'See which parts of the Bible have been put to music.', icon: Map, link: '/progress' },
    { title: 'Join Discussions', description: 'Engage with the community in our forum.', icon: MessageSquare, link: '/forum' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900">
      <Head>
        <title>BibleChorus - Explore Scripture Through Music</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <div className="flex items-center">
              <Image
                src="/biblechorus-icon.png"
                alt="BibleChorus Logo"
                width={40}
                height={40}
                className="mr-2"
              />
              <span className="text-2xl font-bold">BibleChorus</span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <UserDropdown user={user} />
            ) : (
              <AuthButtons />
            )}
            <ModeToggle />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            Explore Scripture Through Music
          </h1>
          <p className="text-xl mb-8">
            Discover, upload, and share Bible-inspired songs with BibleChorus
          </p>
          <Button onClick={handleGetStarted} size="lg">
            Get Started
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <feature.icon className="h-8 w-8 mb-2 text-primary" />
                  <Link href={feature.link} className="hover:underline">
                    <CardTitle>{feature.title}</CardTitle>
                  </Link>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-xl mb-8">
            Connect with fellow music lovers and Bible enthusiasts
          </p>
          {user ? (
            <Button variant="outline" size="lg" onClick={handleGetStarted}>
              Get Started
            </Button>
          ) : (
            <Link href="/login?view=signup">
              <Button variant="outline" size="lg">
                Sign Up Now
              </Button>
            </Link>
          )}
        </motion.div>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-800 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 BibleChorus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
