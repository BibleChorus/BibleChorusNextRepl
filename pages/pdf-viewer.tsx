import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PdfViewerPage() {
  const router = useRouter();
  const { file } = router.query;
  const fileParam = Array.isArray(file) ? file[0] : file;
  const src = fileParam
    ? `/pdfreader/doqment-main/src/pdfjs/web/viewer.html?file=${encodeURIComponent(fileParam)}`
    : '/pdfreader/doqment-main/src/pdfjs/web/viewer.html';

  return (
    <>
      <Head>
        <title>PDF Viewer</title>
      </Head>
      <iframe src={src} className="w-full h-screen border-none" />
    </>
  );
}
