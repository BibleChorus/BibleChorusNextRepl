import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FaUpload, FaSearch, FaMap, FaList, FaVoteYea } from 'react-icons/fa'

export default function Home() {
  const features = [
    { name: 'Upload Songs', icon: FaUpload, href: '/upload' },
    { name: 'Advanced Search', icon: FaSearch, href: '/search' },
    { name: 'Progress Map', icon: FaMap, href: '/progress' },
    { name: 'Playlists', icon: FaList, href: '/playlists' },
    { name: 'Vote on Songs', icon: FaVoteYea, href: '/vote' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
      <Head>
        <title>BibleChorus - Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center text-gray-800 mb-8"
        >
          Welcome to BibleChorus
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link href={feature.href} key={feature.name}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              >
                <feature.icon className="text-3xl text-purple-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">{feature.name}</h2>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}