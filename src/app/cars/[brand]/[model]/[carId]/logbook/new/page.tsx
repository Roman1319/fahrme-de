'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Send, Plus, X, Trash2 } from 'lucide-react';
import { MyCar, LogbookDraft, LogbookEntry } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { 
  addLogbookEntry, 
  getLogbookDraft, 
  saveLogbookDraft, 
  createLogbookDraft,
  deleteLogbookDraft,
  getLogbookEntries,
  saveLogbookEntries
} from '@/lib/interactions';
import { isCarOwnerByCar } from '@/lib/ownership';
import PhotoUpload from '@/components/ui/PhotoUpload';
import RichTextEditor from '@/components/ui/RichTextEditor';

const LOGBOOK_TYPES = [
  { value: 'maintenance', label: 'Wartung' },
  { value: 'repair', label: 'Reparatur' },
  { value: 'tuning', label: 'Tuning' },
  { value: 'trip', label: 'Fahrt' },
  { value: 'event', label: 'Event' },
  { value: 'general', label: 'Allgemein' }
] as const;

const CURRENCIES = [
  { value: 'RUB', label: '₽' },
  { value: 'UAH', label: 'гривна' },
  { value: 'BYN', label: 'бел. руб.' },
  { value: 'KZT', label: '〒' },
  { value: 'USD', label: '$' },
  { value: 'EUR', label: '€' }
] as const;

const LANGUAGES = [
  { value: 'Deutsch', label: 'Deutsch' },
  { value: 'English', label: 'English' },
  { value: 'Русский', label: 'Русский' }
] as const;

export default function NewLogbookEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const carId = params.carId as string;
  const brand = params.brand as string;
  const model = params.model as string;
  const editEntryId = searchParams.get('edit');
  
  const [car, setCar] = useState<MyCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    type: 'general' as const,
    images: [] as string[],
    additionalImages: [] as string[],
    mileage: '',
    mileageUnit: 'km' as const,
    cost: '',
    currency: 'EUR' as const,
    poll: {
      question: '',
      options: [''] as string[]
    },
    allowComments: true,
    pinToCarPage: false,
    publishDate: new Date().toISOString().split('T')[0],
    language: 'Deutsch'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  useEffect(() => {
    loadCar();
    if (editEntryId) {
      loadEntryForEdit();
    } else {
      loadDraft();
    }
  }, [carId, user, editEntryId]);

  // Auto-save draft when form data changes
  useEffect(() => {
    if (formData.title || formData.text) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData]);

  // Save draft before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (formData.title || formData.text) {
        saveDraft();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData]);

  const loadCar = () => {
    const savedCars = localStorage.getItem('fahrme:my-cars');
    if (savedCars) {
      try {
        const cars: MyCar[] = JSON.parse(savedCars);
        const foundCar = cars.find(c => c.id === carId);
        setCar(foundCar || null);
      } catch (error) {
        console.error('Error loading car:', error);
        setCar(null);
      }
    }
    setIsLoading(false);
  };

  const loadDraft = () => {
    if (!user?.id) return;
    
    const draft = getLogbookDraft(carId, user.id);
    if (draft) {
      setDraftId(draft.id);
      setIsDraft(true);
      setFormData({
        title: draft.title,
        text: draft.text,
        type: draft.type,
        images: [], // Images in text will be handled by RichTextEditor
        additionalImages: draft.images || [],
        mileage: draft.mileage?.toString() || '',
        mileageUnit: draft.mileageUnit || 'km',
        cost: draft.cost?.toString() || '',
        currency: draft.currency || 'EUR',
        poll: draft.poll || { question: '', options: [''] },
        allowComments: draft.allowComments,
        pinToCarPage: draft.pinToCarPage,
        publishDate: draft.publishDate.split('T')[0],
        language: draft.language
      });
    }
  };

  const loadEntryForEdit = () => {
    if (!editEntryId || !user?.id) return;
    
    const entries = getLogbookEntries(carId);
    const entry = entries.find(e => e.id === editEntryId);
    
    if (entry && entry.userId === user.id) {
      setFormData({
        title: entry.title || '',
        text: entry.content || entry.text || '',
        type: entry.topic === 'service' ? 'maintenance' :
              entry.topic === 'repair' ? 'repair' :
              entry.topic === 'tuning' ? 'tuning' :
              entry.topic === 'trip' ? 'trip' :
              entry.topic === 'other' ? 'general' :
              entry.type || 'general',
        images: [], // Images in text will be handled by RichTextEditor
        additionalImages: entry.photos || entry.images || [],
        mileage: entry.mileage?.toString() || '',
        mileageUnit: entry.mileageUnit === 'mi' ? 'miles' : 'km',
        cost: entry.cost?.toString() || '',
        currency: entry.currency || 'EUR',
        poll: entry.poll || { question: '', options: [''] },
        allowComments: entry.allowComments ?? true,
        pinToCarPage: entry.pinOnCar ?? false,
        publishDate: entry.publishedAt ? new Date(entry.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        language: entry.language || 'Deutsch'
      });
    } else {
      // Entry not found or user doesn't own it
      router.push(`/car/${carId}`);
    }
  };

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }
    
    if (!formData.text.trim()) {
      newErrors.text = 'Text ist erforderlich';
    }
    
    if (formData.poll.question && formData.poll.options.filter(opt => opt.trim()).length < 2) {
      newErrors.poll = 'Mindestens 2 Antwortoptionen erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDraft = async () => {
    if (!user?.id || !car) return;
    
    const draftData: LogbookDraft = {
      id: draftId || Date.now().toString(),
      carId,
      userId: user.id,
      title: formData.title,
      text: formData.text,
      type: formData.type,
      images: [...formData.images, ...formData.additionalImages],
      mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
      mileageUnit: formData.mileageUnit,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      currency: formData.currency,
      poll: formData.poll.question ? formData.poll : undefined,
      allowComments: formData.allowComments,
      pinToCarPage: formData.pinToCarPage,
      publishDate: new Date(formData.publishDate).toISOString(),
      language: formData.language,
      createdAt: isDraft ? new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveLogbookDraft(draftData);
    setDraftId(draftData.id);
    setIsDraft(true);
    
    // Show notification
    setShowDraftSaved(true);
    setTimeout(() => setShowDraftSaved(false), 3000);
  };

  const handlePublish = async () => {
    if (!validateForm() || !user || !car) return;
    
    setIsSaving(true);
    
    try {
      // Delete draft if exists
      if (draftId) {
        deleteLogbookDraft(user.id, carId);
        setDraftId(null);
        setIsDraft(false);
      }
      
      const now = new Date().toISOString();
      const entries = getLogbookEntries(carId);
      
      if (editEntryId) {
        // Update existing entry
        const entryIndex = entries.findIndex(e => e.id === editEntryId);
        if (entryIndex !== -1) {
          const updatedEntry: LogbookEntry = {
            ...entries[entryIndex],
            title: formData.title,
            content: formData.text,
            topic: formData.type === 'maintenance' ? 'service' : 
                   formData.type === 'repair' ? 'repair' :
                   formData.type === 'tuning' ? 'tuning' :
                   formData.type === 'trip' ? 'trip' : 'other',
            photos: [...formData.images, ...formData.additionalImages],
            mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
            mileageUnit: formData.mileageUnit === 'miles' ? 'mi' : 'km',
            cost: formData.cost ? parseFloat(formData.cost) : undefined,
            currency: formData.currency,
            poll: formData.poll.question ? {
              question: formData.poll.question,
              options: formData.poll.options.filter(opt => opt.trim())
            } : undefined,
            allowComments: formData.allowComments,
            pinOnCar: formData.pinToCarPage,
            language: formData.language,
            updatedAt: now,
            
            // Legacy fields for backward compatibility
            text: formData.text,
            type: formData.type,
            images: [...formData.images, ...formData.additionalImages],
            mileageUnit: formData.mileageUnit,
            poll: formData.poll.question ? formData.poll : undefined,
            allowComments: formData.allowComments,
            pinToCarPage: formData.pinToCarPage,
            publishDate: new Date(formData.publishDate).toISOString(),
            language: formData.language
          };
          
          entries[entryIndex] = updatedEntry;
          saveLogbookEntries(carId, entries);
          
          // Show success message
          alert('Eintrag wurde aktualisiert');
        }
      } else {
        // Create new logbook entry with new data model
        const entryId = `entry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
        
        const newEntry: LogbookEntry = {
          id: entryId,
          userId: user.id,
          carId,
          title: formData.title,
          content: formData.text,
          topic: formData.type === 'maintenance' ? 'service' : 
                 formData.type === 'repair' ? 'repair' :
                 formData.type === 'tuning' ? 'tuning' :
                 formData.type === 'trip' ? 'trip' : 'other',
          photos: [...formData.images, ...formData.additionalImages],
          mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
          mileageUnit: formData.mileageUnit === 'miles' ? 'mi' : 'km',
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          currency: formData.currency,
          poll: formData.poll.question ? {
            question: formData.poll.question,
            options: formData.poll.options.filter(opt => opt.trim())
          } : undefined,
          allowComments: formData.allowComments,
          pinOnCar: formData.pinToCarPage,
          language: formData.language,
          status: 'published',
          createdAt: now,
          publishedAt: now,
          
          // Legacy fields for backward compatibility
          author: user.name || user.email,
          authorEmail: user.email,
          text: formData.text,
          timestamp: new Date().toLocaleString('de-DE'),
          likes: 0,
          type: formData.type,
          images: [...formData.images, ...formData.additionalImages],
          mileageUnit: formData.mileageUnit,
          poll: formData.poll.question ? formData.poll : undefined,
          allowComments: formData.allowComments,
          pinToCarPage: formData.pinToCarPage,
          publishDate: new Date(formData.publishDate).toISOString(),
          language: formData.language
        };
        
        entries.push(newEntry);
        saveLogbookEntries(carId, entries);
        
        // Show success message
        alert('Eintrag wurde veröffentlicht');
      }
      
      // Redirect to car page with logbook anchor
      router.push(`/car/${carId}#logbook`);
    } catch (error) {
      console.error('Error publishing logbook entry:', error);
      alert('Fehler beim Veröffentlichen des Eintrags');
    } finally {
      setIsSaving(false);
    }
  };

  const addPollOption = () => {
    if (formData.poll.options.length < 10) {
      updateFormData('poll', {
        ...formData.poll,
        options: [...formData.poll.options, '']
      });
    }
  };

  const removePollOption = (index: number) => {
    if (formData.poll.options.length > 1) {
      updateFormData('poll', {
        ...formData.poll,
        options: formData.poll.options.filter((_, i) => i !== index)
      });
    }
  };

  const updatePollOption = (index: number, value: string) => {
    updateFormData('poll', {
      ...formData.poll,
      options: formData.poll.options.map((opt, i) => i === index ? value : opt)
    });
  };

  if (isLoading) {
    return (
      <main className="pb-12">
        <div className="section text-center py-16">
          <div className="text-xl">Lade...</div>
        </div>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="pb-12">
        <div className="section text-center py-16">
          <div className="text-xl">Auto nicht gefunden</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="pb-12">
        <div className="section text-center py-16">
          <div className="text-xl mb-4">Bitte melden Sie sich an, um Logbuch-Einträge zu erstellen</div>
          <button 
            onClick={() => router.push('/login')}
            className="btn-primary"
          >
            Anmelden
          </button>
        </div>
      </main>
    );
  }

  if (!isCarOwnerByCar(car, user.id, user.email)) {
    return (
      <main className="pb-12">
        <div className="section text-center py-16">
          <div className="text-xl">Nur der Besitzer kann Logbuch-Einträge erstellen</div>
          <button 
            onClick={() => router.push(`/car/${carId}`)}
            className="btn-secondary mt-4"
          >
            Zurück zur Fahrzeugseite
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-12">
      {/* Draft saved notification */}
      {showDraftSaved && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Entwurf gespeichert ✓
        </div>
      )}
      
      <section className="space-y-4">
        <div className="section">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="h1">{editEntryId ? 'Logbuch-Eintrag bearbeiten' : 'Neuer Logbuch-Eintrag'}</h1>
            <p className="opacity-70 text-sm">
              {car.make} {car.model} • {car.year}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Заголовок записи */}
          <div>
            <h2 className="text-lg font-bold mb-4">Заголовок записи</h2>
            
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Выберите тему записи
              </label>
              <select
                value={formData.type}
                onChange={(e) => updateFormData('type', e.target.value)}
                className="form-input"
              >
                {LOGBOOK_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Input */}
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="form-input"
                placeholder="Введите заголовок записи..."
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>
          </div>

          {/* Текст записи */}
          <div>
            <h2 className="text-lg font-bold mb-4">Текст записи</h2>
            <RichTextEditor
              value={formData.text}
              onChange={(value) => updateFormData('text', value)}
              placeholder="Опишите, что вы сделали..."
              images={formData.images}
              onImagesChange={(images) => updateFormData('images', images)}
            />
            {errors.text && <p className="text-red-400 text-sm mt-1">{errors.text}</p>}
          </div>

          {/* Фотографии */}
          <div>
            <h2 className="text-lg font-bold mb-4">Фотографии</h2>
            <PhotoUpload
              images={formData.additionalImages}
              onChange={(images) => updateFormData('additionalImages', images)}
              maxImages={10}
            />
          </div>

          {/* Пробег и цена вопроса */}
          <div>
            <h2 className="text-lg font-bold mb-4">Пробег и цена вопроса</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Пробег
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => updateFormData('mileage', e.target.value)}
                    className="form-input flex-1"
                    placeholder="123456"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => updateFormData('mileageUnit', 'km')}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        formData.mileageUnit === 'km' 
                          ? 'bg-accent text-black' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      КМ
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData('mileageUnit', 'miles')}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        formData.mileageUnit === 'miles' 
                          ? 'bg-accent text-black' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      МЛ
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Цена вопроса
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => updateFormData('cost', e.target.value)}
                    className="form-input flex-1"
                    placeholder="150.00"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {CURRENCIES.map(currency => (
                      <button
                        key={currency.value}
                        type="button"
                        onClick={() => updateFormData('currency', currency.value)}
                        className={`px-2 py-2 text-sm rounded-lg transition-colors ${
                          formData.currency === currency.value 
                            ? 'bg-accent text-black' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {currency.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Опрос */}
          <div>
            <h2 className="text-lg font-bold mb-4">Опрос</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ваш вопрос
                </label>
                <input
                  type="text"
                  value={formData.poll.question}
                  onChange={(e) => updateFormData('poll', { ...formData.poll, question: e.target.value })}
                  className="form-input"
                  placeholder="Введите ваш вопрос..."
                />
              </div>
              
              {formData.poll.question && (
                <div className="space-y-2">
                  <label className="text-sm opacity-70">Варианты ответов:</label>
                  {formData.poll.options.map((option, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        className="form-input flex-1"
                        placeholder="Вариант ответа"
                      />
                      {formData.poll.options.length > 1 && (
                        <button
                          onClick={() => removePollOption(index)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.poll.options.length < 10 && (
                    <button
                      onClick={addPollOption}
                      className="flex items-center gap-2 text-sm text-accent hover:opacity-80"
                    >
                      <Plus size={16} />
                      Добавить вариант
                    </button>
                  )}
                  <p className="text-xs text-white/50">Максимум 10 вариантов ответа</p>
                </div>
              )}
            </div>
            {errors.poll && <p className="text-red-400 text-sm mt-1">{errors.poll}</p>}
          </div>

          {/* Настройки публикации */}
          <div>
            <h2 className="text-lg font-bold mb-4">Настройки публикации</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Разрешить комментарии</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowComments}
                    onChange={(e) => updateFormData('allowComments', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Закрепить на странице машины</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pinToCarPage}
                    onChange={(e) => updateFormData('pinToCarPage', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => updateFormData('publishDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Язык
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => updateFormData('language', e.target.value)}
                    className="form-input"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-white/50 mt-1">Укажите, на каком языке написан текст записи</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-white/10">
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Send size={16} />
              {isSaving ? (editEntryId ? 'Speichere...' : 'Veröffentliche...') : (editEntryId ? 'Speichern' : 'Veröffentlichen')}
            </button>
            
            <button
              onClick={saveDraft}
              className="btn-secondary flex items-center gap-2 px-6 py-3"
            >
              <Save size={16} />
              {isDraft ? 'Обновить черновик' : 'Сохранить черновик'}
            </button>
          </div>
        </div>
        </div>
      </section>
    </main>
  );
}
