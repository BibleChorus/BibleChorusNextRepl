import { uiTheme } from "@/lib/design-system";
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Music,
  UploadCloud,
  FileText,
  Book,
  Sparkles,
  PenTool,
  Download,
  List,
  User,
  Headphones,
  Info,
} from "lucide-react";

export default function HowTo() {
  const [activeTab, setActiveTab] = useState("lyrics");
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const theme = uiTheme;

  if (!mounted) {
    return (
      <>
        <Head>
          <title>BibleChorus - How To Create and Upload Songs</title>
          <meta
            name="description"
            content="Learn how to create and upload Bible-inspired music"
          />
        </Head>
        <div
          className="min-h-screen opacity-0"
          style={{ fontFamily: "var(--font-sans)" }}
        />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>BibleChorus - How To Create and Upload Songs</title>
        <meta
          name="description"
          content="Learn how to create and upload Bible-inspired music"
        />
      </Head>

      <div
        className="page-shell editorial-page relative"
        style={{
          backgroundColor: theme.bg,
          color: theme.text,
          fontFamily: "var(--font-sans)",
        }}
      >
        <div className="relative" style={{ zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden border-b border-border pb-8 pt-2"
          >
            <div className="mx-auto w-full">
              <div className="text-center max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="mb-8"
                >
                  <span
                    className="inline-flex items-center gap-2.5 px-5 py-2 text-xs tracking-[0.3em] uppercase"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: theme.accent,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <Info className="w-4 h-4" style={{ color: theme.accent }} />
                    Creator&apos;s Guide
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mb-8"
                >
                  <span
                    className="block text-4xl sm:text-5xl tracking-tight mb-2"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: theme.text,
                    }}
                  >
                    Create &
                  </span>
                  <span
                    className="block text-4xl sm:text-5xl italic font-light"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: theme.text,
                      opacity: 0.9,
                    }}
                  >
                    Upload
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light"
                  style={{ color: theme.textSecondary }}
                >
                  Learn how to transform{" "}
                  <span style={{ color: theme.text, fontWeight: 500 }}>
                    Scripture into song
                  </span>{" "}
                  using{" "}
                  <span style={{ color: theme.text, fontWeight: 500 }}>
                    AI tools and creativity
                  </span>
                </motion.p>
              </div>
            </div>
          </motion.div>

          <div className="mx-auto w-full pb-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div
                className="grid md:grid-cols-3 gap-px max-w-5xl mx-auto"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <motion.div
                  whileHover={{ backgroundColor: theme.hoverBg }}
                  className="group relative p-8 md:p-10 text-center transition-all duration-500"
                  style={{
                    borderRight: `1px solid ${theme.border}`,
                    backgroundColor: theme.bgCard,
                  }}
                >
                  <div className="relative mb-6">
                    <div
                      className="w-14 h-14 mx-auto flex items-center justify-center"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <FileText
                        className="w-6 h-6"
                        style={{ color: theme.accent }}
                      />
                    </div>
                  </div>
                  <div
                    className="text-lg mb-2 tracking-wide"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: theme.accent,
                    }}
                  >
                    Step 1
                  </div>
                  <h3
                    className="relative text-lg mb-3 tracking-wide"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: theme.text,
                    }}
                  >
                    Generate Lyrics
                  </h3>
                  <p
                    className="relative text-sm font-light leading-relaxed"
                    style={{ color: theme.textSecondary }}
                  >
                    Transform scripture into beautiful song lyrics with AI
                    assistance.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ backgroundColor: theme.hoverBg }}
                  className="group relative p-8 md:p-10 text-center transition-all duration-500"
                  style={{
                    borderRight: `1px solid ${theme.border}`,
                    backgroundColor: theme.bgCard,
                  }}
                >
                  <div className="relative mb-6">
                    <div
                      className="w-14 h-14 mx-auto flex items-center justify-center"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <Music
                        className="w-6 h-6"
                        style={{ color: theme.accent }}
                      />
                    </div>
                  </div>
                  <div
                    className="text-lg mb-2 tracking-wide"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: theme.accent,
                    }}
                  >
                    Step 2
                  </div>
                  <h3
                    className="relative text-lg mb-3 tracking-wide"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: theme.text,
                    }}
                  >
                    Generate Music
                  </h3>
                  <p
                    className="relative text-sm font-light leading-relaxed"
                    style={{ color: theme.textSecondary }}
                  >
                    Create melodies and arrangements using AI music platforms.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ backgroundColor: theme.hoverBg }}
                  className="group relative p-8 md:p-10 text-center transition-all duration-500"
                  style={{ backgroundColor: theme.bgCard }}
                >
                  <div className="relative mb-6">
                    <div
                      className="w-14 h-14 mx-auto flex items-center justify-center"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <UploadCloud
                        className="w-6 h-6"
                        style={{ color: theme.accent }}
                      />
                    </div>
                  </div>
                  <div
                    className="text-lg mb-2 tracking-wide"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: theme.accent,
                    }}
                  >
                    Step 3
                  </div>
                  <h3
                    className="relative text-lg mb-3 tracking-wide"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: theme.text,
                    }}
                  >
                    Upload Song
                  </h3>
                  <p
                    className="relative text-sm font-light leading-relaxed"
                    style={{ color: theme.textSecondary }}
                  >
                    Share your creation with the BibleChorus community.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="mx-auto w-full pb-32 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="p-8 md:p-10"
              style={{
                backgroundColor: theme.bgCard,
                border: `1px solid ${theme.border}`,
              }}
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList
                  className="mb-10 grid grid-cols-3 p-1 h-14"
                  style={{
                    backgroundColor: "transparent",
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <TabsTrigger
                    value="lyrics"
                    className="h-12 font-medium text-sm tracking-wide transition-all duration-300 data-[state=active]:shadow-none rounded-xl"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color:
                        activeTab === "lyrics"
                          ? "hsl(var(--primary-foreground))"
                          : theme.textSecondary,
                      backgroundColor:
                        activeTab === "lyrics" ? theme.accent : "transparent",
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Generate</span> Lyrics
                  </TabsTrigger>
                  <TabsTrigger
                    value="music"
                    className="h-12 font-medium text-sm tracking-wide transition-all duration-300 data-[state=active]:shadow-none rounded-xl"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color:
                        activeTab === "music"
                          ? "hsl(var(--primary-foreground))"
                          : theme.textSecondary,
                      backgroundColor:
                        activeTab === "music" ? theme.accent : "transparent",
                      borderLeft: `1px solid ${theme.border}`,
                      borderRight: `1px solid ${theme.border}`,
                    }}
                  >
                    <Music className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Generate</span> Music
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="h-12 font-medium text-sm tracking-wide transition-all duration-300 data-[state=active]:shadow-none rounded-xl"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color:
                        activeTab === "upload"
                          ? "hsl(var(--primary-foreground))"
                          : theme.textSecondary,
                      backgroundColor:
                        activeTab === "upload" ? theme.accent : "transparent",
                    }}
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
                      <div className="flex items-center justify-center mb-6">
                        <div
                          className="w-16 h-16 flex items-center justify-center"
                          style={{ border: `1px solid ${theme.border}` }}
                        >
                          <Sparkles
                            className="w-7 h-7"
                            style={{ color: theme.accent }}
                          />
                        </div>
                      </div>
                      <h2
                        className="text-3xl mb-4 tracking-wide"
                        style={{
                          fontFamily: "var(--font-serif)",
                          color: theme.text,
                        }}
                      >
                        Generate Lyrics Using Scripture and AI
                      </h2>
                      <p
                        className="text-base max-w-2xl mx-auto font-light"
                        style={{ color: theme.textSecondary }}
                      >
                        Transform Biblical passages into beautiful song lyrics
                        with the help of AI
                      </p>
                    </div>

                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-4"
                    >
                      <AccordionItem
                        value="step1"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              1
                            </span>
                            <Book
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Choose a Scripture Passage
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="mb-4 font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Select a Bible passage that inspires you. Or, view
                            the progress map on BibleChorus.com to select a
                            passage that has yet to be turned into a song.
                          </p>
                          <div
                            className="p-4"
                            style={{
                              backgroundColor: isDark
                                ? "rgba(212, 175, 55, 0.08)"
                                : "rgba(191, 161, 48, 0.08)",
                              border: `1px solid ${theme.borderHover}`,
                            }}
                          >
                            <p style={{ color: theme.text }}>
                              <strong style={{ color: theme.accent }}>
                                Example:
                              </strong>{" "}
                              Psalm 23
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="step2"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              2
                            </span>
                            <Sparkles
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Use an AI Assistant
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Utilize an AI language model (like OpenAI&apos;s
                            GPT-4) to help generate lyrics based on your chosen
                            scripture.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="step3"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              3
                            </span>
                            <PenTool
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Craft Your Prompt
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="mb-4 font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Write a detailed prompt for the AI, including the
                            scripture reference, scripture adherence, and any
                            specific instructions.
                          </p>
                          <div
                            className="p-4"
                            style={{
                              backgroundColor: isDark
                                ? "rgba(212, 175, 55, 0.08)"
                                : "rgba(191, 161, 48, 0.08)",
                              border: `1px solid ${theme.borderHover}`,
                            }}
                          >
                            <p style={{ color: theme.text }}>
                              <strong style={{ color: theme.accent }}>
                                Example Prompt:
                              </strong>{" "}
                              &quot;Make the following into a song in the style
                              of George Herbert, but with language that a modern
                              listener would understand. Use verses, chorus,
                              bridge, and outro. Stay as close to the passage of
                              Scripture as possible. Use a rhyming scheme that
                              is suitable for song.&quot;
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="step4"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              4
                            </span>
                            <CheckCircle
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Refine the Generated Lyrics
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Review the AI-generated lyrics and make any
                            necessary edits to get the lyrics just right.
                          </p>
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
                      <div className="flex items-center justify-center mb-6">
                        <div
                          className="w-16 h-16 flex items-center justify-center"
                          style={{ border: `1px solid ${theme.border}` }}
                        >
                          <Music
                            className="w-7 h-7"
                            style={{ color: theme.accent }}
                          />
                        </div>
                      </div>
                      <h2
                        className="text-3xl mb-4 tracking-wide"
                        style={{
                          fontFamily: "var(--font-serif)",
                          color: theme.text,
                        }}
                      >
                        Generate Music Using AI Platforms
                      </h2>
                      <p
                        className="text-base max-w-2xl mx-auto font-light"
                        style={{ color: theme.textSecondary }}
                      >
                        Create beautiful melodies and arrangements for your
                        lyrics
                      </p>
                    </div>

                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-4"
                    >
                      <AccordionItem
                        value="step1"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              1
                            </span>
                            <List
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Choose an AI Music Platform
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="mb-4 font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Platforms like Suno or Udio can help you generate
                            music.
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <a
                              href="https://www.suno.ai"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm transition-all duration-300 hover:opacity-80"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                backgroundColor: isDark
                                  ? "rgba(212, 175, 55, 0.1)"
                                  : "rgba(191, 161, 48, 0.1)",
                              }}
                            >
                              Suno
                            </a>
                            <a
                              href="https://udio.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm transition-all duration-300 hover:opacity-80"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                backgroundColor: isDark
                                  ? "rgba(212, 175, 55, 0.1)"
                                  : "rgba(191, 161, 48, 0.1)",
                              }}
                            >
                              Udio
                            </a>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="step2"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              2
                            </span>
                            <PenTool
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Prepare Your Music Prompt
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="mb-4 font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Describe the style, genre, mood, and any instruments
                            you want in your music.
                          </p>
                          <div
                            className="p-4"
                            style={{
                              backgroundColor: isDark
                                ? "rgba(212, 175, 55, 0.08)"
                                : "rgba(191, 161, 48, 0.08)",
                              border: `1px solid ${theme.borderHover}`,
                            }}
                          >
                            <p style={{ color: theme.text }}>
                              <strong style={{ color: theme.accent }}>
                                Example Prompt:
                              </strong>{" "}
                              &quot;gentle acoustic guitar melody, soft piano
                              accompaniment; calm, uplifting, Psalm.&quot;
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="step3"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              3
                            </span>
                            <Download
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Generate and Download the Music
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Use the AI platform to generate the music. Listen to
                            the result, iterate, and when satisfied, download
                            the audio file. Only pick the best generation to
                            upload to BibleChorus.com so as not to water down
                            the quality of content.
                          </p>
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
                      <div className="flex items-center justify-center mb-6">
                        <div
                          className="w-16 h-16 flex items-center justify-center"
                          style={{ border: `1px solid ${theme.border}` }}
                        >
                          <UploadCloud
                            className="w-7 h-7"
                            style={{ color: theme.accent }}
                          />
                        </div>
                      </div>
                      <h2
                        className="text-3xl mb-4 tracking-wide"
                        style={{
                          fontFamily: "var(--font-serif)",
                          color: theme.text,
                        }}
                      >
                        Upload Your Song to BibleChorus.com
                      </h2>
                      <p
                        className="text-base max-w-2xl mx-auto font-light"
                        style={{ color: theme.textSecondary }}
                      >
                        Share your creation with the BibleChorus community
                      </p>
                    </div>

                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-4"
                    >
                      <AccordionItem
                        value="step1"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              1
                            </span>
                            <CheckCircle
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Prepare Your Files
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Ensure you have your music files ready for upload,
                            along with metadata such as lyrics, prompts used,
                            genre information, etc. Also create song art for
                            your song using GPT-4o or another AI image creator.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="step2"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              2
                            </span>
                            <UploadCloud
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Go to the Upload Page
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="mb-4 font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Navigate to the Upload Page on BibleChorus.com.
                          </p>
                          <Link
                            href="/upload"
                            className="inline-flex items-center px-6 py-3 text-sm tracking-wide transition-all duration-300 hover:opacity-90"
                            style={{
                              backgroundColor: theme.accent,
                              color: "hsl(var(--primary-foreground))",
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Go to Upload Page
                          </Link>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="step3"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              3
                            </span>
                            <User
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Fill in Song Details
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="mb-4 font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Provide the song title, scripture adherence, bible
                            verses covered, and any other required information.
                          </p>
                          <div
                            className="p-4"
                            style={{
                              backgroundColor: isDark
                                ? "rgba(212, 175, 55, 0.08)"
                                : "rgba(191, 161, 48, 0.08)",
                              border: `1px solid ${theme.borderHover}`,
                            }}
                          >
                            <p style={{ color: theme.text }}>
                              <strong style={{ color: theme.accent }}>
                                Example:
                              </strong>
                              <br />
                              Title: &apos;The Lord, My Shepherd&apos;
                              <br />
                              Genres: Pop, Indie, Folk
                              <br />
                              Etc.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="step4"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              4
                            </span>
                            <Headphones
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Upload Files
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Upload your audio file and song art.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="step5"
                        className="px-6 py-2 transition-all duration-300"
                        style={{
                          backgroundColor: theme.hoverBg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <span
                              className="w-8 h-8 flex items-center justify-center mr-4 text-sm"
                              style={{
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent,
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              5
                            </span>
                            <CheckCircle
                              className="mr-3 h-5 w-5"
                              style={{ color: theme.accent }}
                            />
                            <span
                              className="text-lg"
                              style={{
                                fontFamily: "var(--font-serif)",
                                color: theme.text,
                              }}
                            >
                              Submit for the Community to Enjoy
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pl-12">
                          <p
                            className="font-light"
                            style={{ color: theme.textSecondary }}
                          >
                            Once all information and files are uploaded, submit
                            your song for the BibleChorus community to enjoy.
                            Engage with other users by commenting on songs,
                            voting, and creating playlists.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
