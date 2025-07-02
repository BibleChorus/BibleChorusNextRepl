import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Music, UploadCloud, FileText, Book, Sparkles, PenTool, Download, List, User, Headphones, BookOpen, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HowTo() {
  const [activeTab, setActiveTab] = useState('lyrics')

  return (
    <>
      <Head>
        <title>BibleChorus - How To Create and Upload Songs</title>
        <meta name="description" content="Learn how to create and upload Bible-inspired music" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-emerald-950/50 dark:via-slate-900 dark:to-teal-950/30">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.06] to-cyan-500/[0.08] dark:from-emerald-500/[0.15] dark:via-teal-500/[0.12] dark:to-cyan-500/[0.15]"></div>
            <div className="absolute top-0 -left-8 w-96 h-96 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-12 -right-8 w-80 h-80 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-12 left-32 w-96 h-96 bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),rgba(255,255,255,0))]"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20 backdrop-blur-md border border-emerald-500/20 dark:border-emerald-500/30 shadow-lg">
                  <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent font-semibold">
                    Creator&apos;s Guide
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
              >
                <span className="block text-slate-900 dark:text-white mb-2">Create &</span>
                <span className="block relative">
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Upload
                  </span>
                  <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-full scale-x-0 animate-scale-x"></div>
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 text-xl text-slate-600 dark:text-slate-300 sm:text-2xl max-w-3xl mx-auto leading-relaxed"
              >
                Learn how to transform 
                <span className="font-semibold text-slate-900 dark:text-white"> Scripture into song</span> using 
                <span className="font-semibold text-slate-900 dark:text-white"> AI tools and creativity</span>
              </motion.p>
            </div>

            {/* Enhanced Stats/Steps Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <FileText className="relative w-10 h-10 mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent mb-2">Step 1</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Generate Lyrics</div>
              </div>
              
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <Music className="relative w-10 h-10 mx-auto mb-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent mb-2">Step 2</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Generate Music</div>
              </div>
              
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <UploadCloud className="relative w-10 h-10 mx-auto mb-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-2xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent mb-2">Step 3</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Upload Song</div>
              </div>
            </motion.div>
            
            {/* Enhanced Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute top-16 right-16 hidden xl:block"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl backdrop-blur-sm animate-float shadow-xl"></div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute bottom-16 left-16 hidden xl:block"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl backdrop-blur-sm animate-float animation-delay-2000 shadow-xl"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-12 relative z-20 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 md:p-10"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-10 grid grid-cols-3 p-1.5 bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-white/20 dark:border-slate-600/50 rounded-2xl shadow-xl h-16">
                <TabsTrigger 
                  value="lyrics"
                  className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:via-teal-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 data-[state=active]:scale-[1.02] h-12 font-medium text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-600/40"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Generate</span> Lyrics
                </TabsTrigger>
                <TabsTrigger 
                  value="music"
                  className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:via-teal-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 data-[state=active]:scale-[1.02] h-12 font-medium text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-600/40"
                >
                  <Music className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Generate</span> Music
                </TabsTrigger>
                <TabsTrigger 
                  value="upload"
                  className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:via-teal-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 data-[state=active]:scale-[1.02] h-12 font-medium text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-600/40"
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Song
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lyrics">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="mb-8 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/30">
                        <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">Generate Lyrics Using Scripture and AI</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">Transform Biblical passages into beautiful song lyrics with the help of AI</p>
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="step1" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <Book className="mr-3 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-lg font-semibold">Step 1: Choose a Scripture Passage</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="mb-4 text-slate-600 dark:text-slate-300">Select a Bible passage that inspires you. Or, view the progress map on BibleChorus.com to select a passage that has yet to be turned into a song.</p>
                        <Alert className="bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 backdrop-blur-sm">
                          <AlertDescription>
                            <strong>Example:</strong> Psalm 23
                          </AlertDescription>
                        </Alert>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step2" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <Sparkles className="mr-3 h-5 w-5 text-teal-600 dark:text-teal-400" />
                          <span className="text-lg font-semibold">Step 2: Use an AI Assistant</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="text-slate-600 dark:text-slate-300">Utilize an AI language model (like OpenAI&apos;s GPT-4) to help generate lyrics based on your chosen scripture.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step3" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <PenTool className="mr-3 h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                          <span className="text-lg font-semibold">Step 3: Craft Your Prompt</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="mb-4 text-slate-600 dark:text-slate-300">
                          Write a detailed prompt for the AI, including the scripture reference, scripture adherence, and any specific instructions.
                        </p>
                        <Alert className="bg-teal-50/80 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800 backdrop-blur-sm">
                          <AlertDescription>
                            <strong>Example Prompt:</strong> &quot;Make the following into a song in the style of George Herbert, but with language that a modern listener would understand. Use verses, chorus, bridge, and outro. Stay as close to the passage of Scripture as possible. Use a rhyming scheme that is suitable for song.&quot;
                          </AlertDescription>
                        </Alert>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step4" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <CheckCircle className="mr-3 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-lg font-semibold">Step 4: Refine the Generated Lyrics</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="text-slate-600 dark:text-slate-300">Review the AI-generated lyrics and make any necessary edits to get the lyrics just right.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </motion.div>
              </TabsContent>

              <TabsContent value="music">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="mb-8 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl backdrop-blur-sm border border-teal-500/20 dark:border-teal-500/30">
                        <Music className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">Generate Music Using AI Platforms</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">Create beautiful melodies and arrangements for your lyrics</p>
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="step1" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <List className="mr-3 h-5 w-5 text-teal-600 dark:text-teal-400" />
                          <span className="text-lg font-semibold">Step 1: Choose an AI Music Platform</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="mb-4 text-slate-600 dark:text-slate-300">
                          Platforms like Suno or Udio can help you generate music.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="secondary" className="text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 backdrop-blur-sm hover:bg-teal-200/60 dark:hover:bg-teal-900/40 transition-all duration-300">
                            <a
                              href="https://www.suno.ai"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Suno
                            </a>
                          </Badge>
                          <Badge variant="secondary" className="text-cyan-600 dark:text-cyan-400 bg-cyan-100/60 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 backdrop-blur-sm hover:bg-cyan-200/60 dark:hover:bg-cyan-900/40 transition-all duration-300">
                            <a
                              href="https://udio.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Udio
                            </a>
                          </Badge>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step2" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <PenTool className="mr-3 h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                          <span className="text-lg font-semibold">Step 2: Prepare Your Music Prompt</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="mb-4 text-slate-600 dark:text-slate-300">Describe the style, genre, mood, and any instruments you want in your music.</p>
                        <Alert className="bg-cyan-50/80 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800 backdrop-blur-sm">
                          <AlertDescription>
                            <strong>Example Prompt:</strong> &quot;gentle acoustic guitar melody, soft piano accompaniment; calm, uplifting, Psalm.&quot;
                          </AlertDescription>
                        </Alert>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step3" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <Download className="mr-3 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-lg font-semibold">Step 3: Generate and Download the Music</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="text-slate-600 dark:text-slate-300">Use the AI platform to generate the music. Listen to the result, iterate, and when satisfied, download the audio file. Only pick the best generation to upload to BibleChorus.com so as not to water down the quality of content.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </motion.div>
              </TabsContent>

              <TabsContent value="upload">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="mb-8 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl backdrop-blur-sm border border-cyan-500/20 dark:border-cyan-500/30">
                        <UploadCloud className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">Upload Your Song to BibleChorus.com</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">Share your creation with the BibleChorus community</p>
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="step1" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <CheckCircle className="mr-3 h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                          <span className="text-lg font-semibold">Step 1: Prepare Your Files</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="text-slate-600 dark:text-slate-300">Ensure you have your music files ready for upload, along with metadata such as lyrics, prompts used, genre information, etc. Also create song art for your song using GPT-4o or another AI image creator.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step2" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <UploadCloud className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-lg font-semibold">Step 2: Go to the Upload Page</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="mb-4 text-slate-600 dark:text-slate-300">
                          Navigate to the Upload Page on BibleChorus.com.
                        </p>
                        <Link href="/upload" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg">
                          <UploadCloud className="mr-2 h-4 w-4" />
                          Go to Upload Page
                        </Link>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step3" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <User className="mr-3 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-lg font-semibold">Step 3: Fill in Song Details</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="mb-4 text-slate-600 dark:text-slate-300">Provide the song title, scripture adherence, bible verses covered, and any other required information.</p>
                        <Alert className="bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 backdrop-blur-sm">
                          <AlertDescription>
                            <strong>Example:</strong><br />
                            Title: &apos;The Lord, My Shepherd&apos;<br />
                            Genres: Pop, Indie, Folk<br />
                            Etc.
                          </AlertDescription>
                        </Alert>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step4" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <Headphones className="mr-3 h-5 w-5 text-teal-600 dark:text-teal-400" />
                          <span className="text-lg font-semibold">Step 4: Upload Files</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="text-slate-600 dark:text-slate-300">Upload your audio file and song art.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step5" className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl px-6 py-2 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-300">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <CheckCircle className="mr-3 h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                          <span className="text-lg font-semibold">Step 5: Submit for the BibleChorus Community to Enjoy</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="text-slate-600 dark:text-slate-300">Once all information and files are uploaded, submit your song for the BibleChorus community to enjoy. Engage with other users by commenting on songs, voting, and creating playlists.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </>
  )
}
