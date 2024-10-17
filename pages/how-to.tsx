import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
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
import { CheckCircle, Music, UploadCloud, FileText, Book, Sparkles, PenTool, Download, List, User, Headphones } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HowTo() {
  const [activeTab, setActiveTab] = useState('lyrics')

  return (
    <>
      <Head>
        <title>BibleChorus - How To Create and Upload Songs</title>
      </Head>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">How to Create and Upload Songs</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid grid-cols-3 sm:flex sm:flex-row">
            <TabsTrigger value="lyrics" className="flex items-center justify-center">
              <FileText className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Generate</span> Lyrics
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center justify-center">
              <Music className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Generate</span> Music
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center justify-center">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Song
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lyrics">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-yellow-500" />
              Generate Lyrics Using Scripture and AI
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="step1">
                <AccordionTrigger>
                  <Book className="mr-2 h-4 w-4 text-blue-500" />
                  Step 1: Choose a Scripture Passage
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Select a Bible passage that inspires you. Or, view the progress map on BibleChorus.com to select a passage that has yet to be turned into a song.</p>
                  <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <AlertDescription>
                      Example: Psalm 23
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step2">
                <AccordionTrigger>
                  <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                  Step 2: Use an AI Assistant
                </AccordionTrigger>
                <AccordionContent>
                  <p>Utilize an AI language model (like OpenAI's GPT-4) to help generate lyrics based on your chosen scripture.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step3">
                <AccordionTrigger>
                  <PenTool className="mr-2 h-4 w-4 text-green-500" />
                  Step 3: Craft Your Prompt
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">
                    Write a detailed prompt for the AI, including the scripture reference, scripture adherence, and any specific instructions.
                  </p>
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>
                      Example Prompt: "Make the following into a song in the style of George Herbert, but with language that a modern listener would understand. Use verses, chorus, bridge, and outro. Stay as close to the passage of Scripture as possible. Use a rhyming scheme that is suitable for song."
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step4">
                <AccordionTrigger>
                  <CheckCircle className="mr-2 h-4 w-4 text-red-500" />
                  Step 4: Refine the Generated Lyrics
                </AccordionTrigger>
                <AccordionContent>
                  <p>Review the AI-generated lyrics and make any necessary edits to get they lyrics just right.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="music">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center">
              <Music className="mr-2 h-5 w-5 text-indigo-500" />
              Generate Music Using AI Platforms
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="step1">
                <AccordionTrigger>
                  <List className="mr-2 h-4 w-4 text-blue-500" />
                  Step 1: Choose an AI Music Platform
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">
                    Platforms like Suno or Udio can help you generate music.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-blue-500 bg-blue-100">
                      <a
                        href="https://www.suno.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Suno
                      </a>
                    </Badge>
                    <Badge variant="secondary" className="text-purple-500 bg-purple-100">
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
              <AccordionItem value="step2">
                <AccordionTrigger>
                  <PenTool className="mr-2 h-4 w-4 text-green-500" />
                  Step 2: Prepare Your Music Prompt
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Describe the style, genre, mood, and any instruments you want in your music.</p>
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>
                      Example Prompt: "gentle acoustic guitar melody, soft piano accompaniment; calm, uplifting, Psalm."
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step3">
                <AccordionTrigger>
                  <Download className="mr-2 h-4 w-4 text-orange-500" />
                  Step 3: Generate and Download the Music
                </AccordionTrigger>
                <AccordionContent>
                  <p>Use the AI platform to generate the music. Listen to the result, iterate, and when satisfied, download the audio file. Only pick the best generation to upload to BibleChorus.com so as not to water down the quality of content.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="upload">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center">
              <UploadCloud className="mr-2 h-5 w-5 text-teal-500" />
              Upload Your Song to BibleChorus.com
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="step1">
                <AccordionTrigger>
                  <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                  Step 1: Prepare Your Files
                </AccordionTrigger>
                <AccordionContent>
                  <p>Ensure you have your music files ready for upload, along with metadata such as lyrics, prompts used, genre information, etc. Also create song art for your song using GPT-4o or another AI image creator.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step2">
                <AccordionTrigger>
                  <UploadCloud className="mr-2 h-4 w-4 text-purple-500" />
                  Step 2: Go to the Upload Page
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">
                    Navigate to the Upload Page on BibleChorus.com.
                  </p>
                  <Link href="/upload" className="text-blue-500 hover:underline flex items-center">
                    <UploadCloud className="mr-1 h-4 w-4" /> Go to Upload Page
                  </Link>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step3">
                <AccordionTrigger>
                  <User className="mr-2 h-4 w-4 text-green-500" />
                  Step 3: Fill in Song Details
                </AccordionTrigger>
                <AccordionContent>
                  <p>Provide the song title, scripture adherence, bible verses covered, and any other required information.</p>
                  <Alert className="bg-green-50 text-green-800 border-green-200 mt-2">
                    <AlertDescription>
                      Example: <br />
                      Title: "The Lord, My Shepherd" <br />
                      Genres: Pop, Indie, Folk
                      Etc.
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step4">
                <AccordionTrigger>
                  <Headphones className="mr-2 h-4 w-4 text-red-500" />
                  Step 4: Upload Files
                </AccordionTrigger>
                <AccordionContent>
                  <p>Upload your audio file and song art.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step5">
                <AccordionTrigger>
                  <CheckCircle className="mr-2 h-4 w-4 text-orange-500" />
                  Step 5: Submit for the BibleChorus Community to Enjoy
                </AccordionTrigger>
                <AccordionContent>
                  <p>Once all information and files are uploaded, submit your song for the BibleChorus community to enjoy. Engage with other users by commenting on songs, voting, and creating playlists.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
