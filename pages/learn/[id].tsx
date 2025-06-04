import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TeachingPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data } = useSWR(id ? `/api/teachings/${id}` : null, fetcher);
  const [numPages, setNumPages] = useState<number>();

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{data.title}</h1>
      {data.reference && (
        <p className="mb-2 text-sm text-gray-600">
          Based on {data.based_on_type}: {data.reference}
        </p>
      )}
      {data.tags?.length && (
        <p className="mb-2 text-sm text-gray-600">Tags: {data.tags.join(', ')}</p>
      )}
      {data.ai_generated && (
        <p className="mb-2 text-sm text-gray-600">
          Created with AI{data.ai_model_used ? ` (${data.ai_model_used})` : ''}
        </p>
      )}
      <Document
        file={data.pdf_url}
        className="border"
        onLoadSuccess={(info) => setNumPages(info.numPages)}
      >
        {Array.from(new Array(numPages || 1), (_, i) => (
          <Page key={i} pageNumber={i + 1} />
        ))}
      </Document>
    </div>
  );
}
