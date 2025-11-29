import React from 'react';
import { InfoIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const UploadInfoDialog = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    border: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.2)',
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="rounded-none transition-all duration-300 hover:bg-transparent"
          style={{ color: theme.accent }}
        >
          <InfoIcon className="h-5 w-5" />
          <span className="sr-only">Upload Information</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-none"
        style={{ 
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`,
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="text-xl tracking-wide"
            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
          >
            Why We Ask for Detailed Information
          </DialogTitle>
          <DialogDescription 
            className="text-sm mt-2"
            style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
          >
            Your detailed submissions enhance the BibleChorus experience for everyone. Here&apos;s how:
          </DialogDescription>
        </DialogHeader>
        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem 
            value="item-1" 
            className="border-b-0"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <AccordionTrigger 
              className="text-sm py-4 hover:no-underline"
              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
            >
              Powerful Search and Filtering
            </AccordionTrigger>
            <AccordionContent 
              className="text-sm pb-4"
              style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
            >
              Detailed information allows users to <strong style={{ color: theme.accent }}>find songs by specific Bible verses, genres, or adherence to Scripture</strong>. This precision helps listeners discover exactly what they&apos;re looking for, whether it&apos;s for personal devotion, study, or worship planning.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem 
            value="item-2"
            className="border-b-0"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <AccordionTrigger 
              className="text-sm py-4 hover:no-underline"
              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
            >
              Personalized Playlists
            </AccordionTrigger>
            <AccordionContent 
              className="text-sm pb-4"
              style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
            >
              With comprehensive metadata, users can <strong style={{ color: theme.accent }}>create custom playlists</strong> based on specific books of the Bible, method of creation, or musical styles. This feature enhances the listening experience and supports focused study or worship sessions.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem 
            value="item-3"
            className="border-b-0"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <AccordionTrigger 
              className="text-sm py-4 hover:no-underline"
              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
            >
              Transparency and Attribution
            </AccordionTrigger>
            <AccordionContent 
              className="text-sm pb-4"
              style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
            >
              By detailing the creative process, including AI assistance, we ensure <strong style={{ color: theme.accent }}>proper credit is given</strong> to all contributors. This transparency builds trust within our community and respects the creative efforts of all artists.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem 
            value="item-4"
            className="border-b-0"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <AccordionTrigger 
              className="text-sm py-4 hover:no-underline"
              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
            >
              Community Collaboration
            </AccordionTrigger>
            <AccordionContent 
              className="text-sm pb-4"
              style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
            >
              Sharing details about your creative process, including AI tools or prompts, <strong style={{ color: theme.accent }}>inspires other artists</strong> and fosters a collaborative environment. This knowledge-sharing helps our community grow and innovate together.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem 
            value="item-5"
            className="border-b-0"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <AccordionTrigger 
              className="text-sm py-4 hover:no-underline"
              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
            >
              Enhanced User Experience
            </AccordionTrigger>
            <AccordionContent 
              className="text-sm pb-4"
              style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
            >
              Detailed submissions allow us to develop <strong style={{ color: theme.accent }}>advanced features like requested collections</strong>. This creates a more engaging and tailored experience for each user on BibleChorus.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem 
            value="item-6"
            className="border-b-0"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <AccordionTrigger 
              className="text-sm py-4 hover:no-underline"
              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
            >
              Biblical Study Resource
            </AccordionTrigger>
            <AccordionContent 
              className="text-sm pb-4"
              style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
            >
              Your contributions help build a <strong style={{ color: theme.accent }}>comprehensive musical database of scripture</strong>. This resource becomes invaluable for those studying the Bible, allowing them to explore and memorize scripture through music.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <p 
          className="mt-6 text-sm leading-relaxed"
          style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
        >
          By providing detailed information, you&apos;re not just uploading a song – you&apos;re <strong style={{ color: theme.accent }}>empowering users to engage deeply with scripture through music</strong>. Your thoroughness helps make BibleChorus a more valuable resource for everyone.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UploadInfoDialog;
