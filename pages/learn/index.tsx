import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TeachingsIndex() {
  const { data } = useSWR('/api/teachings', fetcher);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teachings</h1>
      <Link href="/learn/upload"><Button>Upload Teaching</Button></Link>
      <ul className="mt-6 space-y-4">
        {data?.map((t: any) => (
          <li key={t.id} className="border p-4 rounded">
            <Link href={`/learn/${t.id}`} className="font-medium underline">
              {t.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
