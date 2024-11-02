import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/router'

interface LoginPromptDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function LoginPromptDialog({
  isOpen,
  onClose,
  title = "Login Required",
  description = "Please login to access this feature."
}: LoginPromptDialogProps) {
  const router = useRouter()

  const handleLogin = () => {
    // Store the current URL to redirect back after login
    const currentPath = router.asPath
    localStorage.setItem('loginRedirectPath', currentPath)
    router.push('/login')
  }

  const handleClose = () => {
    onClose();
    // Redirect to home page when user cancels
    router.push('/');
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-4 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleLogin}>
            Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 