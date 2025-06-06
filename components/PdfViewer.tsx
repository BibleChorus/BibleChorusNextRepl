"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useEffect, useState } from "react";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  fileUrl: string;
  page: number;
  onDocumentLoad?: (numPages: number) => void;
}

export default function PdfViewer({ fileUrl, page, onDocumentLoad }: PdfViewerProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById("pdf-container");
      if (container) {
        setWidth(container.clientWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div id="pdf-container" className="w-full h-full flex justify-center overflow-auto">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => onDocumentLoad?.(numPages)}
        loading="Loading PDF..."
      >
        <Page pageNumber={page} width={width} />
      </Document>
    </div>
  );
}
