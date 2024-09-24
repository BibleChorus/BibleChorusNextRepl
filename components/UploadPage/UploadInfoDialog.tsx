import React from 'react';
import { InfoIcon } from 'lucide-react';
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
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <InfoIcon className="h-5 w-5" />
          <span className="sr-only">Upload Information</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Why We Ask for Detailed Information</DialogTitle>
          <DialogDescription>
            Your detailed submissions enhance the BibleChorus experience for everyone. Here's how:
          </DialogDescription>
        </DialogHeader>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Powerful Search and Filtering</AccordionTrigger>
            <AccordionContent>
              Detailed information allows users to <strong>find songs by specific Bible verses, genres, or adherence to Scripture</strong>. This precision helps listeners discover exactly what they're looking for, whether it's for personal devotion, study, or worship planning.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Personalized Playlists</AccordionTrigger>
            <AccordionContent>
              With comprehensive metadata, users can <strong>create custom playlists</strong> based on specific books of the Bible, method of creation, or musical styles. This feature enhances the listening experience and supports focused study or worship sessions.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Transparency and Attribution</AccordionTrigger>
            <AccordionContent>
              By detailing the creative process, including AI assistance, we ensure <strong>proper credit is given</strong> to all contributors. This transparency builds trust within our community and respects the creative efforts of all artists.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Community Collaboration</AccordionTrigger>
            <AccordionContent>
              Sharing details about your creative process, including AI tools or prompts, <strong>inspires other artists</strong> and fosters a collaborative environment. This knowledge-sharing helps our community grow and innovate together.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Enhanced User Experience</AccordionTrigger>
            <AccordionContent>
              Detailed submissions allow us to develop <strong>advanced features like requested collections</strong>. This creates a more engaging and tailored experience for each user on BibleChorus.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>Biblical Study Resource</AccordionTrigger>
            <AccordionContent>
              Your contributions help build a <strong>comprehensive musical database of scripture</strong>. This resource becomes invaluable for those studying the Bible, allowing them to explore and memorize scripture through music.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <p className="mt-4 text-sm text-muted-foreground">
          By providing detailed information, you're not just uploading a song – you're <strong>empowering users to engage deeply with scripture through music</strong>. Your thoroughness helps make BibleChorus a more valuable resource for everyone.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UploadInfoDialog;