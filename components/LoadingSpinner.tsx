/** Route progress stays out of the way of playback and background data refreshes. */
export default function LoadingSpinner() {
  return <div role="progressbar" aria-label="Loading page" className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-1 overflow-hidden bg-primary/15"><div className="h-full w-1/3 animate-pulse rounded-r-full bg-primary" /></div>;
}
