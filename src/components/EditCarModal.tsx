'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { MyCar } from '@/lib/types';
import ImageUpload from '@/components/ui/ImageUpload';
import AutoCompleteInput from '@/components/ui/AutoCompleteInput';
import { useCarData } from '@/hooks/useCarData';

interface EditCarModalProps {
  car: MyCar;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCar: MyCar) => void;
}

export default function EditCarModal({ car, isOpen, onClose, onSave }: EditCarModalProps) {
  const { makes, getModels } = useCarData();
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
    description: car.description || '',
    story: car.story || ''
  });
  const [images, setImages] = useState<string[]>(car.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Генерируем опции для года
  const yearOptions = Array.from({ length: 125 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  // Получаем модели для выбранной марки
  const filteredModels = formData.make ? getModels(formData.make) : [];

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
      story: formData.story || undefined,
      images: images
    };

    onSave(updatedCar);
    setIsSubmitting(false);
  };

  const handleImageUpload = (newImages: string[]) => {
    setImages(newImages);
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
                options={filteredModels}
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
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="z.B. Schwarz, Weiß, Blau"
                className="form-input"
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
              <input
                type="text"
                value={formData.engine}
                onChange={(e) => setFormData(prev => ({ ...prev, engine: e.target.value }))}
                placeholder="z.B. 2.0 TDI, V6, Elektro"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Hubraum</label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                placeholder="z.B. 2.0L, 3.0L"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Getriebe</label>
              <input
                type="text"
                value={formData.gearbox}
                onChange={(e) => setFormData(prev => ({ ...prev, gearbox: e.target.value }))}
                placeholder="z.B. Automatik, Schaltgetriebe"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Antrieb</label>
              <input
                type="text"
                value={formData.drive}
                onChange={(e) => setFormData(prev => ({ ...prev, drive: e.target.value }))}
                placeholder="z.B. Frontantrieb, Heckantrieb, Allrad"
                className="form-input"
              />
            </div>
          </div>

          {/* Description and Story */}
          <div className="space-y-4">
            <div>
              <label className="form-label">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kurze Beschreibung Ihres Autos..."
                rows={3}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Geschichte</label>
              <textarea
                value={formData.story}
                onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                placeholder="Erzählen Sie die Geschichte Ihres Autos..."
                rows={4}
                className="form-input"
              />
            </div>
          </div>


          {/* Photo Upload */}
          <div>
            <label className="form-label">Fotos</label>
            <ImageUpload
              images={images}
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
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}