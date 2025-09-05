'use client';

import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
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
  const { makes, getModels, isLoading } = useCarData();
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
    story: car.story || '',
    ownerAge: car.ownerAge || 0,
    ownerCity: car.ownerCity || '',
    previousCar: car.previousCar || ''
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
    setImages(prev => [...prev, ...newImages]);
  };

  const handleImageRemove = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-glass w-full max-w-lg max-h-[90vh] overflow-y-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Bearbeiten</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Marke *</label>
              <AutoCompleteInput
                value={formData.make}
                onChange={(value) => setFormData(prev => ({ ...prev, make: value, model: '' }))}
                options={makes.map(make => make.name)}
                placeholder="z.B. BMW, Audi, Mercedes"
                maxSuggestions={66}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Modell *</label>
              <AutoCompleteInput
                value={formData.model}
                onChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                options={filteredModels}
                placeholder="z.B. 3er, A4, C-Klasse"
                maxSuggestions={50}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Fahrzeugname</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Mein BMW, Rote Schönheit"
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Baujahr *</label>
              <AutoCompleteInput
                value={formData.year === 0 ? '' : formData.year.toString()}
                onChange={(value) => setFormData(prev => ({ ...prev, year: value ? parseInt(value) : 0 }))}
                options={yearOptions}
                placeholder="z.B. 2020"
                maxSuggestions={50}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Farbe</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="z.B. Schwarz, Weiß, Blau"
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Leistung (PS)</label>
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
              <label className="block text-xs font-medium mb-1 opacity-80">Motor</label>
              <input
                type="text"
                value={formData.engine}
                onChange={(e) => setFormData(prev => ({ ...prev, engine: e.target.value }))}
                placeholder="z.B. 2.0 TDI, V6, Elektro"
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Hubraum</label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                placeholder="z.B. 2.0L, 3.0L"
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Getriebe</label>
              <input
                type="text"
                value={formData.gearbox}
                onChange={(e) => setFormData(prev => ({ ...prev, gearbox: e.target.value }))}
                placeholder="z.B. Automatik, Schaltgetriebe"
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Antrieb</label>
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
              <label className="block text-xs font-medium mb-1 opacity-80">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kurze Beschreibung Ihres Autos..."
                rows={3}
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">Geschichte</label>
              <textarea
                value={formData.story}
                onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                placeholder="Erzählen Sie die Geschichte Ihres Autos..."
                rows={4}
                className="form-input"
              />
            </div>
          </div>

          {/* Owner Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium opacity-80">Информация о владельце</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 opacity-80">Возраст</label>
                <input
                  type="number"
                  value={formData.ownerAge || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerAge: parseInt(e.target.value) || 0 }))}
                  placeholder="32"
                  min="16"
                  max="100"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-80">Город</label>
                <input
                  type="text"
                  value={formData.ownerCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerCity: e.target.value }))}
                  placeholder="Мюнхен"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-80">Предыдущий автомобиль</label>
                <input
                  type="text"
                  value={formData.previousCar}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousCar: e.target.value }))}
                  placeholder="Audi Q3"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-medium mb-1 opacity-80">Fotos</label>
            <ImageUpload
              images={images}
              onImagesChange={handleImageUpload}
              maxImages={10}
              className="mb-3"
            />
            
            {/* Display current images */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-16 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              {isSubmitting ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}