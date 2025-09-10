'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Upload, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { createLogbookEntry, uploadLogbookMedia } from '@/lib/logbook';
import { getCar } from '@/lib/cars';
import { LOGBOOK_TOPICS, getTopicLabel, getTopicIcon } from '@/lib/logbook-topics';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function NewLogbookEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const carId = params.carId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [car, setCar] = useState<{ brand: string; model: string; year: number } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topic: '',
    allow_comments: true
  });
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Load car data
  useEffect(() => {
    if (carId) {
      getCar(carId)
        .then(carData => {
          setCar(carData);
        })
        .catch(error => {
          console.error('Error loading car:', error);
        });
    }
  }, [carId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTopicDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.topic-dropdown')) {
          setShowTopicDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTopicDropdown]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    setIsSaving(true);
    
    createLogbookEntry({
      car_id: carId,
      title: formData.title,
      content: formData.content,
      topic: formData.topic || undefined,
      allow_comments: formData.allow_comments
    }, user.id)
    .then(async (entry) => {
        // Upload files if any
        if (selectedFiles.length > 0) {
          setUploadingFiles(true);
          const uploadPromises = selectedFiles.map(file => 
            uploadLogbookMedia(entry.id, file, user.id)
          );
          Promise.all(uploadPromises)
            .then(() => {
              setUploadingFiles(false);
            })
            .catch(error => {
              console.error('Error uploading files:', error);
              setUploadingFiles(false);
            });
        }

      // Redirect to the new entry
      router.push(`/logbuch/${entry.id}`);
    })
    .catch(error => {
      console.error('Error creating logbook entry:', error);
      alert('Fehler beim Erstellen des Eintrags. Bitte versuchen Sie es erneut.');
    })
    .finally(() => {
      setIsSaving(false);
    });
  };

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
        
        {car && (
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <p className="text-sm text-white/70">
              Eintrag für: <span className="font-semibold text-white">{car.brand} {car.model} ({car.year})</span>
            </p>
          </div>
        )}

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Titel des Eintrags..."
                disabled={isSaving}
              />
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Thema
              </label>
              <div className="relative topic-dropdown">
                <button
                  type="button"
                  onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                  className="w-full px-4 py-2 section text-ink placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent flex items-center justify-between"
                  disabled={isSaving}
                >
                  <span className="flex items-center gap-2">
                    {formData.topic ? (
                      <>
                        <span>{getTopicIcon(formData.topic)}</span>
                        <span>{getTopicLabel(formData.topic)}</span>
                      </>
                    ) : (
                      <span className="text-white/50">Thema auswählen...</span>
                    )}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${showTopicDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showTopicDropdown && (
                  <div className="absolute z-10 w-full mt-1 section max-h-60 overflow-y-auto">
                    {LOGBOOK_TOPICS.map((topic) => (
                      <button
                        key={topic.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, topic: topic.value }));
                          setShowTopicDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 dark:hover:bg-white/5 flex items-center gap-3 transition-colors rounded-lg"
                      >
                        <span className="text-lg">{topic.icon}</span>
                        <span className="text-ink">{topic.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Inhalt *
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Beschreiben Sie Ihren Eintrag..."
              />
            </div>

            {/* Comments toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allow_comments"
                checked={formData.allow_comments}
                onChange={(e) => setFormData(prev => ({ ...prev, allow_comments: e.target.checked }))}
                className="w-4 h-4 text-accent bg-white/10 border-white/20 rounded focus:ring-accent"
                disabled={isSaving}
              />
              <label htmlFor="allow_comments" className="text-sm text-white/90">
                Kommentare erlauben
              </label>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bilder hinzufügen
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={isSaving}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload size={24} className="text-white/50" />
                  <span className="text-sm text-white/70">
                    Klicken Sie hier, um Bilder hochzuladen
                  </span>
                </label>
              </div>

              {/* Selected files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <span className="text-sm text-white/90">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                        disabled={isSaving}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving || uploadingFiles || !formData.title.trim() || !formData.content.trim()}
                className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Erstelle
                  </>
                ) : uploadingFiles ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Lade hoch
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Eintrag erstellen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}