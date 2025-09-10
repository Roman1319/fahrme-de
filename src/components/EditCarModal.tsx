'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MyCar } from '@/lib/types';
import ImageUpload from '@/components/ui/ImageUpload';
import AutoCompleteInput from '@/components/ui/AutoCompleteInput';
import { useSupabaseCarData } from '@/hooks/useSupabaseCarData';

interface EditCarModalProps {
  car: MyCar;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCar: MyCar) => void;
  isSaving?: boolean;
}

export default function EditCarModal({ car, isOpen, onClose, onSave, isSaving = false }: EditCarModalProps) {
  const { makes, getModels } = useSupabaseCarData();
  const [formData, setFormData] = useState({
    name: car.name || '',
    make: car.make || '',
    model: car.model || '',
    year: car.year || 0,
    color: car.color || '',
    power: car.power || 0,
    engine: car.engine || '',
    volume: car.volume || '',
    gearbox: car.gearbox || '',
    drive: car.drive || '',
    description: car.description || car.story || ''
  });
  const [newImages, setNewImages] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(car.images || []);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Генерируем опции для года
  const yearOptions = Array.from({ length: 125 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  // Загружаем модели для выбранной марки
  useEffect(() => {
    const loadModels = () => {
      if (formData.make) {
        getModels(formData.make)
          .then(models => {
            setAvailableModels(models);
          })
          .catch(error => {
            console.error('Error loading models:', error);
            setAvailableModels([]);
          });
      } else {
        setAvailableModels([]);
      }
    };

    loadModels();
  }, [formData.make, getModels]);

  // Опции для выпадающих списков
  const engineOptions = [
    'Benzin',
    'Diesel', 
    'Elektro',
    'Hybrid'
  ];

  const volumeOptions = [
    '1.0L', '1.2L', '1.4L', '1.5L', '1.6L', '1.8L', '2.0L', '2.2L', '2.5L', '2.7L', '3.0L', '3.2L', '3.5L', '4.0L', '4.2L', '4.4L', '5.0L', '6.0L', '6.2L'
  ];

  const gearboxOptions = [
    'Automatik',
    'Schaltgetriebe'
  ];

  const driveOptions = [
    'Frontantrieb',
    'Heckantrieb', 
    'Allrad'
  ];

  const colorOptions = [
    'Schwarz', 'Weiß', 'Silber', 'Grau', 'Blau', 'Rot', 'Grün', 'Gelb', 'Orange', 'Braun', 'Beige', 'Gold', 'Bronze'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make || !formData.model || formData.year === 0) {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setIsSubmitting(true);

    const updatedCar: MyCar = {
      ...car,
      name: formData.name || `${formData.make} ${formData.model}`,
      make: formData.make,
      model: formData.model,
      year: formData.year,
      color: formData.color,
      power: formData.power || undefined,
      engine: formData.engine || undefined,
      volume: formData.volume || undefined,
      gearbox: formData.gearbox || undefined,
      drive: formData.drive || undefined,
      description: formData.description || undefined,
      story: formData.description || undefined, // Сохраняем описание в оба поля для совместимости
      images: [...existingImageUrls, ...newImages] // Объединяем существующие и новые изображения
    };

    onSave(updatedCar);
    setIsSubmitting(false);
  };

  const handleImageUpload = (images: string[]) => {
    setNewImages(images);
  };

  const handleDeleteExistingImage = (index: number) => {
    const imageToDelete = existingImageUrls[index];
    setDeletedImageUrls(prev => [...prev, imageToDelete]);
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto section p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="h2">Auto bearbeiten</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Marke *</label>
              <AutoCompleteInput
                value={formData.make}
                onChange={(value) => setFormData(prev => ({ ...prev, make: value, model: '' }))}
                options={makes.map(make => make.name)}
                placeholder="z.B. BMW, Audi, Mercedes"
                maxSuggestions={66}
              />
            </div>
            
            <div>
              <label className="form-label">Modell *</label>
              <AutoCompleteInput
                value={formData.model}
                onChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                options={availableModels}
                placeholder="z.B. 3er, A4, C-Klasse"
                maxSuggestions={50}
              />
            </div>

            <div>
              <label className="form-label">Fahrzeugname</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Mein BMW, Rote Schönheit"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Baujahr *</label>
              <AutoCompleteInput
                value={formData.year === 0 ? '' : formData.year.toString()}
                onChange={(value) => setFormData(prev => ({ ...prev, year: value ? parseInt(value) : 0 }))}
                options={yearOptions}
                placeholder="z.B. 2020"
                maxSuggestions={50}
              />
            </div>

            <div>
              <label className="form-label">Farbe</label>
              <AutoCompleteInput
                value={formData.color}
                onChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                options={colorOptions}
                placeholder="z.B. Schwarz, Weiß, Blau"
                maxSuggestions={20}
              />
            </div>

            <div>
              <label className="form-label">Leistung (PS)</label>
              <input
                type="text"
                value={formData.power === 0 ? '' : formData.power.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData(prev => ({ ...prev, power: 0 }));
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue <= 9999) {
                      setFormData(prev => ({ ...prev, power: numValue }));
                    }
                  }
                }}
                placeholder="z.B. 150"
                className="form-input"
              />
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Motor</label>
              <AutoCompleteInput
                value={formData.engine}
                onChange={(value) => setFormData(prev => ({ ...prev, engine: value }))}
                options={engineOptions}
                placeholder="z.B. Benzin, Diesel, Elektro"
                maxSuggestions={10}
              />
            </div>

            <div>
              <label className="form-label">Hubraum</label>
              <AutoCompleteInput
                value={formData.volume}
                onChange={(value) => setFormData(prev => ({ ...prev, volume: value }))}
                options={volumeOptions}
                placeholder="z.B. 2.0L, 3.0L"
                maxSuggestions={20}
              />
            </div>

            <div>
              <label className="form-label">Getriebe</label>
              <AutoCompleteInput
                value={formData.gearbox}
                onChange={(value) => setFormData(prev => ({ ...prev, gearbox: value }))}
                options={gearboxOptions}
                placeholder="z.B. Automatik, Schaltgetriebe"
                maxSuggestions={5}
              />
            </div>

            <div>
              <label className="form-label">Antrieb</label>
              <AutoCompleteInput
                value={formData.drive}
                onChange={(value) => setFormData(prev => ({ ...prev, drive: value }))}
                options={driveOptions}
                placeholder="z.B. Frontantrieb, Heckantrieb, Allrad"
                maxSuggestions={5}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Erzählen Sie alles über Ihr Auto: Geschichte, особенности, впечатления от вождения..."
              rows={8}
              className="form-input resize-y"
            />
          </div>


          {/* Existing Photos */}
          {existingImageUrls.length > 0 && (
            <div>
              <label className="form-label">Bestehende Fotos</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {existingImageUrls.map((imageUrl, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <div className="aspect-video rounded-xl overflow-hidden bg-white/5">
                      <img
                        src={imageUrl}
                        alt={`Existing photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-lg text-center">
                        Vorhanden {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="form-label">Neue Fotos hinzufügen</label>
            <ImageUpload
              images={newImages}
              onImagesChange={handleImageUpload}
              maxImages={10}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSaving}
              className="btn-primary"
            >
              {isSubmitting || isSaving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}