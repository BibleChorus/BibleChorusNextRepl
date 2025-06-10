import { useRouter } from 'next/router';
import Head from 'next/head';
import { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

interface PdfViewerPageType extends React.FC {
  disableLayout?: boolean;
}

export const PdfViewerPage: PdfViewerPageType = () => {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const { file } = router.query;
  const fileParam = Array.isArray(file) ? file[0] : file;
  const src = fileParam
    ? `/pdfreader/doqment-main/src/pdfjs/web/viewer.html?file=${encodeURIComponent(fileParam)}`
    : '/pdfreader/doqment-main/src/pdfjs/web/viewer.html';

  const toggleFullscreen = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (!document.fullscreenElement) {
      iframe.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <>
      <Head>
        <title>PDF Viewer</title>
      </Head>
      <div className="relative w-full h-screen">
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full h-full border-none"
          allow="fullscreen"
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
