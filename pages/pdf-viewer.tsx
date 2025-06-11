import { useRouter } from 'next/router';
import Head from 'next/head';
import { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Maximize, Minimize } from 'lucide-react';

interface PdfViewerPageType extends React.FC {
  disableLayout?: boolean;
}

export const PdfViewerPage: PdfViewerPageType = () => {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [isFullscreen]);

  const { file } = router.query;
  const fileParam = Array.isArray(file) ? file[0] : file;
  const src = fileParam
    ? `/pdfreader/doqment-main/src/pdfjs/web/viewer.html?file=${encodeURIComponent(fileParam)}`
    : '/pdfreader/doqment-main/src/pdfjs/web/viewer.html';

  const toggleFullscreen = async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      if (!document.fullscreenElement) {
        const target =
          typeof (iframe as any).requestFullscreen === 'function'
            ? iframe
            : iframe.contentDocument?.documentElement;
        if (target && target.requestFullscreen) {
          await target.requestFullscreen();
          toast.success('Entered fullscreen');
        } else {
          throw new Error('Fullscreen not supported');
        }
      } else {
        await document.exitFullscreen();
        toast.success('Exited fullscreen');
      }
    } catch (error) {
      console.warn('Failed to toggle fullscreen', error);
      toast.error('Failed to toggle fullscreen');
    }
  };

  return (
    <>
      <Head>
        <title>PDF Viewer</title>
      </Head>
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 w-screen h-screen bg-background'
            : 'relative w-full h-screen'
        }
      >
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full h-full border-none"
          allow="fullscreen"
          allowFullScreen
        />
        <button
          aria-label="Toggle fullscreen"
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 z-10 bg-background/70 border border-border rounded-md p-1"
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </button>
      </div>
    </>
  );
};

(PdfViewerPage as any).disableLayout = true;

export default PdfViewerPage;
