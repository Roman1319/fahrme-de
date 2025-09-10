// Server Component - no 'use client' here
import { getLogbookEntry } from '@/lib/logbook-operations';
import { getComments } from '@/lib/logbook';
import EntryPageClient from './EntryPageClient';
import Link from 'next/link';

type Props = { 
  params: { 
    brand: string; 
    model: string; 
    carId: string; 
    entryId: string; 
  } 
};

export default async function Page({ params }: Props) {
  const { entryId } = params;

  // Server-side data loading - this is allowed
  const entry = await getLogbookEntry(entryId);
  const comments = entry ? await getComments(entryId) : [];

  if (!entry) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Eintrag nicht gefunden</h1>
          <p className="text-white/70 mb-4">Der angeforderte Logbuch-Eintrag existiert nicht.</p>
          <Link href="/" className="btn-accent">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EntryPageClient
      entryId={entryId}
      initialEntry={entry}
      initialComments={comments}
    />
  );
}