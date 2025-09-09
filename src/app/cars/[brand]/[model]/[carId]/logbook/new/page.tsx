'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

// TODO: This component needs to be updated to use Supabase instead of localStorage
export default function NewLogbookEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const carId = params.carId as string;

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Bitte anmelden</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sie müssen angemeldet sein, um einen Logbuch-Eintrag zu erstellen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="btn-secondary flex items-center gap-2 px-4 py-2"
          >
            <ArrowLeft size={16} />
            Zurück
          </button>
          <h1 className="text-2xl font-bold">Neuer Logbuch-Eintrag</h1>
        </div>
        
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-4">In Entwicklung</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Diese Seite wird derzeit aktualisiert, um Supabase anstelle von localStorage zu verwenden.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Die Logbuch-Funktionalität wird in Kürze wieder verfügbar sein.
          </p>
        </div>
      </div>
    </div>
  );
}