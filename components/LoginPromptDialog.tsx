import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogIn } from "lucide-react";
import { useRouter } from "next/router";

interface LoginPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}
export function LoginPromptDialog({
  isOpen,
  onClose,
  title = "Join the conversation",
  description = "Sign in to save your favorites, share your thoughts, and make this space your own.",
}: LoginPromptDialogProps) {
  const router = useRouter();
  const signIn = () => {
    try {
      localStorage.setItem("loginRedirectPath", router.asPath);
    } catch {
      /* Sign-in remains available when storage is disabled. */
    }
    onClose();
    void router.push("/login");
  };
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Keep exploring
          </Button>
          <Button onClick={signIn}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
