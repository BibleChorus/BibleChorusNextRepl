import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from 'axios';
import { toast } from "sonner";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songId: number;
  userId: string;
  username: string;
  userEmail: string;
}

export function ReportDialog({ isOpen, onClose, songId, userId, username, userEmail }: ReportDialogProps) {
  const [reportText, setReportText] = useState('');

  const handleSubmit = async () => {
    try {
      await axios.post('/api/report-song', {
        songId,
        userId,
        username,
        userEmail,
        reportText
      });
      toast.success('Report submitted successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Song</DialogTitle>
          <DialogDescription>
            Please provide details about why you're reporting this song.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder="Enter your report here..."
          className="min-h-[100px]"
        />
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit Report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
