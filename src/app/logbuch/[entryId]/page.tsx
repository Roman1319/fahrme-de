// Server Component - no 'use client' here
import { getLogbookEntryById, getCommentsForEntry } from '@/lib/logbook-detail-supabase';
import LogbookEntryDetailClient from './LogbookEntryDetailClient';
import { notFound } from 'next/navigation';

type Props = { 
  params: { entryId: string } 
};

export default async function LogbookEntryDetailPage({ params }: Props) {
  const { entryId } = params;
  
  // UUID validation regex
  const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Check if entryId is valid UUID
  if (!entryId || entryId === 'undefined' || typeof entryId !== 'string' || !UUID_RX.test(entryId)) {
    notFound();
  }

  // Server-side data loading
  const entry = await getLogbookEntryById(entryId);
  const comments = entry ? await getCommentsForEntry(entryId) : [];

  if (!entry) {
    notFound();
  }

  return (
    <LogbookEntryDetailClient 
      entry={entry} 
      comments={comments} 
      entryId={entryId} 
    />
  );
}