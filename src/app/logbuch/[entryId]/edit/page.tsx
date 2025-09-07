'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { LogbookEntry } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { 
  getLogbookEntryById, 
  updateLogbookEntry, 
  isEntryOwner 
} from '@/lib/logbook-detail';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function EditLogbookEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const entryId = params.entryId as string;
  
  const [entry, setEntry] = useState<LogbookEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    type: 'general' as const,
    images: [] as string[]
  });

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  const loadEntry = () => {
    const foundEntry = getLogbookEntryById(entryId);
    if (foundEntry) {
      setEntry(foundEntry);
      setFormData({
        title: foundEntry.title || '',
        text: (foundEntry as any).text || foundEntry.content || '',
        type: 'general', // Always use 'general' for compatibility
        images: (foundEntry as any).images || []
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!entry || !user || !isEntryOwner(entry, user.id)) return;
    
    setIsSaving(true);
    
    try {
      const updated = updateLogbookEntry(entryId, {
        title: formData.title,
        // text: formData.text, // TODO: Add text field to LogbookEntry or use content
        // type: formData.type, // TODO: Add type field to LogbookEntry interface
        // images: formData.images, // TODO: Add images field to LogbookEntry interface
        updated_at: new Date().toISOString()
      });
      
      if (updated) {
        console.info('Eintrag erfolgreich aktualisiert');
        router.push(`/logbuch/${entryId}`);
      } else {
        console.warn('Fehler beim Aktualisieren des Eintrags');
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextChange = (text: string) => {
    setFormData(prev => ({ ...prev, text }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!entry || !user || !isEntryOwner(entry, user.id)) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Zugriff verweigert</h1>
          <button 
            onClick={() => router.push('/')}
            className="btn-accent"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/logbuch/${entryId}`)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Zurück
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg transition-colors text-white"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/5 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-white mb-6">
            Eintrag bearbeiten
          </h1>

          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-white/70 text-sm font-medium mb-2">
              Titel
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Titel eingeben..."
            />
          </div>

          {/* Type Selection */}
          <div className="mb-6">
            <label className="block text-white/70 text-sm font-medium mb-2">
              Kategorie
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="maintenance">Wartung</option>
              <option value="repair">Reparatur</option>
              <option value="tuning">Tuning</option>
              <option value="trip">Fahrt</option>
              <option value="event">Event</option>
              <option value="general">Allgemein</option>
            </select>
          </div>

          {/* Rich Text Editor */}
          <div className="mb-6">
            <label className="block text-white/70 text-sm font-medium mb-2">
              Inhalt
            </label>
            <RichTextEditor
              value={formData.text}
              onChange={handleTextChange}
              images={formData.images}
              onImagesChange={handleImagesChange}
              placeholder="Schreiben Sie hier Ihren Eintrag..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
            <button
              onClick={() => router.push(`/logbuch/${entryId}`)}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-accent flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSaving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
