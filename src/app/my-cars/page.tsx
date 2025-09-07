"use client";

import { useState, useEffect } from "react";
import { Plus, Car as CarIcon, Edit, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import Guard from "@/components/auth/Guard";
import ImageUpload from "@/components/ui/ImageUpload";
import AutoCompleteInput from "@/components/ui/AutoCompleteInput";
import EditCarModal from "@/components/EditCarModal";
import { useCarData } from "@/hooks/useCarData";
import { Car, MyCar } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { getCars, createCar, updateCar, deleteCar, getCarPhotos, uploadCarPhoto, deleteCarPhoto, getCarPhotoUrl } from "@/lib/cars";
import { CreateCarData } from "@/lib/cars";

export default function MyCarsPage() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cars from Supabase
  useEffect(() => {
    const loadCars = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userCars = await getCars(user.id);
        setCars(userCars);
      } catch (err) {
        console.error('[MyCars] Error loading cars:', err);
        setError('Fehler beim Laden der Autos');
      } finally {
        setLoading(false);
      }
    };

    loadCars();
  }, [user]);

  // Add new car
  const handleAddCar = async (carData: CreateCarData) => {
    if (!user) {
      alert('Fehler: Benutzer nicht angemeldet');
      return;
    }

    try {
      setLoading(true);
      const newCar = await createCar(carData, user.id);
      setCars(prev => [newCar, ...prev]);
      setShowAddForm(false);
    } catch (err) {
      console.error('[MyCars] Error adding car:', err);
      alert('Fehler beim Hinzufügen des Autos');
    } finally {
      setLoading(false);
    }
  };

  // Delete car
  const handleDeleteCar = async (id: string) => {
    if (!confirm('Möchten Sie dieses Auto wirklich löschen?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteCar(id);
      setCars(prev => prev.filter(car => car.id !== id));
    } catch (err) {
      console.error('[MyCars] Error deleting car:', err);
      alert('Fehler beim Löschen des Autos');
    } finally {
      setLoading(false);
    }
  };

  // Update car
  const handleUpdateCar = async (carData: CreateCarData & { id: string }) => {
    try {
      setLoading(true);
      const updatedCar = await updateCar(carData);
      setCars(prev => prev.map(car => car.id === updatedCar.id ? updatedCar : car));
      setEditingCar(null);
    } catch (err) {
      console.error('[MyCars] Error updating car:', err);
      alert('Fehler beim Aktualisieren des Autos');
    } finally {
      setLoading(false);
    }
  };

  // Set main vehicle
  const handleSetMainVehicle = async (id: string) => {
    try {
      setLoading(true);
      // First, unset all other main vehicles
      const otherCars = cars.filter(car => car.id !== id);
      for (const car of otherCars) {
        if (car.is_main_vehicle) {
          await updateCar({ id: car.id, is_main_vehicle: false });
        }
      }
      
      // Set the selected car as main vehicle
      await updateCar({ id, is_main_vehicle: true });
      
      // Update local state
      setCars(prev => prev.map(car => ({
        ...car,
        is_main_vehicle: car.id === id
      })));
    } catch (err) {
      console.error('[MyCars] Error setting main vehicle:', err);
      alert('Fehler beim Setzen des Hauptfahrzeugs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Guard>
      <main className="pb-12">
        <div className="space-y-6">
          {/* Заголовок и кнопка добавления */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h1">Meine Autos</h1>
              <p className="opacity-70 text-sm mt-1">
                Verwalten Sie Ihre Fahrzeuge und teilen Sie Ihre Erfahrungen
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Auto hinzufügen
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="section text-center py-16">
              <Loader2 size={32} className="mx-auto mb-4 animate-spin" />
              <p className="opacity-70">Lade Autos...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="section text-center py-16">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#6A3FFB] hover:bg-[#3F297A] text-white px-4 py-2 rounded-full"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Список машин */}
          {!loading && !error && cars.length === 0 ? (
            <div className="section text-center py-16">
              <CarIcon size={64} className="mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-semibold mb-3">Noch keine Autos hinzugefügt</h3>
              <p className="opacity-70 text-base mb-6 max-w-md mx-auto">
                Fügen Sie Ihr erstes Auto hinzu, um Ihre Erfahrungen zu teilen und andere Autoliebhaber zu inspirieren
              </p>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-[#6A3FFB] hover:bg-[#3F297A] text-white text-base px-6 py-3 rounded-full transition-colors"
              >
                Erstes Auto hinzufügen
              </button>
            </div>
          ) : !loading && !error && (
            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {cars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  onEdit={() => setEditingCar(car)}
                  onDelete={() => handleDeleteCar(car.id)}
                  onSetMain={() => handleSetMainVehicle(car.id)}
                  loading={loading}
                />
              ))}
            </div>
          )}

          {/* Форма добавления машины */}
          {showAddForm && (
            <AddCarForm
              user={user}
              onAdd={handleAddCar}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Edit Car Modal */}
          {editingCar && (
            <EditCarModal
              car={editingCar}
              isOpen={!!editingCar}
              onClose={() => setEditingCar(null)}
              onSave={handleUpdateCar}
            />
          )}
        </div>
      </main>
    </Guard>
  );
}

// Car Card Component
function CarCard({ 
  car, 
  onEdit, 
  onDelete, 
  onSetMain, 
  loading 
}: { 
  car: Car; 
  onEdit: () => void; 
  onDelete: () => void; 
  onSetMain: () => void; 
  loading: boolean;
}) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setPhotosLoading(true);
        const carPhotos = await getCarPhotos(car.id);
        const photoUrls = carPhotos.map(photo => getCarPhotoUrl(photo.storage_path));
        setPhotos(photoUrls);
      } catch (error) {
        console.error('Error loading car photos:', error);
      } finally {
        setPhotosLoading(false);
      }
    };

    loadPhotos();
  }, [car.id]);

  return (
    <div className="section p-2 group">
      <Link href={`/car/${car.id}`} className="block">
        <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-neutral-100 dark:bg-neutral-800 cursor-pointer">
          {photosLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 size={20} className="opacity-50 animate-spin" />
            </div>
          ) : photos.length > 0 ? (
            <img
              src={photos[0]}
              alt={car.name || `${car.brand} ${car.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CarIcon size={20} className="opacity-50" />
            </div>
          )}
        </div>
      </Link>
      
      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-xs leading-tight">
              {car.name || `${car.brand} ${car.model}`}
            </h3>
            <p className="text-xs opacity-70">
              {car.brand} {car.model} • {car.year}
            </p>
          </div>
          {car.is_former && (
            <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded-full">
              Ehemalig
            </span>
          )}
        </div>
        
        <div className="space-y-0.5 text-xs opacity-70">
          {car.color && <p className="truncate">Farbe: {car.color}</p>}
        </div>

        {photos.length > 1 && (
          <p className="text-xs opacity-60">
            +{photos.length - 1} weitere Fotos
          </p>
        )}
        
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs opacity-60">
            {new Date(car.created_at).toLocaleDateString('de-DE')}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1 mt-2">
        <button 
          onClick={onEdit}
          disabled={loading}
          className="flex-1 px-2 py-1 text-xs text-white border border-[#868E96] rounded-full hover:bg-[#343A40] transition-colors disabled:opacity-50"
        >
          Bearbeiten
        </button>
        {!car.is_main_vehicle ? (
          <button 
            onClick={onSetMain}
            disabled={loading}
            className="flex-1 px-2 py-1 text-xs text-white border border-[#868E96] rounded-full hover:bg-[#343A40] transition-colors disabled:opacity-50"
          >
            Hauptauto
          </button>
        ) : (
          <button 
            className="flex-1 px-2 py-1 text-xs text-black bg-[#33D49D] rounded-full"
            disabled
          >
            Hauptauto
          </button>
        )}
        <button 
          onClick={onDelete}
          disabled={loading}
          className="flex-1 px-2 py-1 text-xs text-[#6A3FFB] border border-[#6A3FFB] rounded-full hover:bg-[#343A40] transition-colors disabled:opacity-50"
        >
          Löschen
        </button>
      </div>
    </div>
  );
}

// Компонент формы добавления машины
function AddCarForm({ 
  user,
  onAdd, 
  onCancel 
}: { 
  user: any;
  onAdd: (car: CreateCarData) => void;
  onCancel: () => void;
}) {
  const { makes, getModels, isLoading: carDataLoading } = useCarData();
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: 0,
    name: '',
    color: '',
    description: '',
    story: '',
    is_main_vehicle: false,
    is_former: false
  });

  // Безопасное обновление доступных моделей при изменении марки
  useEffect(() => {
    try {
      if (formData.brand && makes.length > 0) {
        const models = getModels(formData.brand);
        setAvailableModels(models);
        
        // Сбрасываем модель, если она не доступна для выбранной марки
        if (formData.model && !models.includes(formData.model)) {
          setFormData(prev => ({ ...prev, model: '' }));
        }
      } else {
        setAvailableModels([]);
        if (!formData.brand) {
          setFormData(prev => ({ ...prev, model: '' }));
        }
      }
    } catch (error) {
      console.warn('Error updating models:', error);
      setAvailableModels([]);
    }
  }, [formData.brand, getModels, makes.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[AddCarForm] Form submitted with data:', formData);
    console.log('[AddCarForm] User:', user);
    console.log('[AddCarForm] Validation check:', {
      brand: !!formData.brand,
      model: !!formData.model,
      year: formData.year > 0,
      user: !!user
    });
    
    if (formData.brand && formData.model && formData.year > 0 && user) {
      console.log('[AddCarForm] Validation passed, calling onAdd');
      onAdd(formData);
    } else {
      console.error('[AddCarForm] Validation failed');
      alert('Bitte füllen Sie alle Pflichtfelder aus (Marke, Modell, Baujahr)');
    }
  };

  // Обработчик выбора марки
  const handleBrandSelect = (brand: string) => {
    setFormData(prev => ({ ...prev, brand, model: '' }));
  };

  // Обработчик выбора модели
  const handleModelSelect = (model: string) => {
    setFormData(prev => ({ ...prev, model }));
  };



  return (
    <div className="space-y-6">
      <div className="section">
        <h2 className="h2 mb-4">Auto hinzufügen</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Grundlegende Fahrzeuginformationen */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Fahrzeug</h3>
              <p className="text-sm opacity-70 mb-4">
                Erzählen Sie uns von Ihrem Auto. Falls Ihr Modell nicht aufgeführt ist, 
                <a href="/contact" className="text-primary hover:underline ml-1">schreiben Sie uns</a>.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label">Marke *</label>
                <AutoCompleteInput
                  value={formData.brand}
                  onChange={(value) => setFormData({...formData, brand: value})}
                  onSelect={handleBrandSelect}
                  placeholder="z.B. BMW"
                  options={makes.map(make => make.name)}
                  maxSuggestions={66}
                  disabled={carDataLoading}
                />
                {carDataLoading && (
                  <p className="text-xs text-neutral-500 mt-1">Lade Markendaten...</p>
                )}
              </div>
              <div>
                <label className="form-label">Modell *</label>
                <AutoCompleteInput
                  value={formData.model}
                  onChange={(value) => setFormData({...formData, model: value})}
                  onSelect={handleModelSelect}
                  placeholder="z.B. 3er"
                  options={availableModels}
                  maxSuggestions={20}
                  disabled={!formData.brand || carDataLoading}
                />
                {!formData.brand && (
                  <p className="text-xs text-neutral-500 mt-1">Wählen Sie zuerst eine Marke</p>
                )}
              </div>
              <div>
                <label className="form-label">Baujahr</label>
                <AutoCompleteInput
                  value={formData.year === 0 ? '' : formData.year.toString()}
                  onChange={(value) => {
                    if (value === '') {
                      setFormData({...formData, year: 0});
                    } else {
                      const year = parseInt(value);
                      if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1) {
                        setFormData({...formData, year});
                      }
                    }
                  }}
                  onSelect={(value) => {
                    const year = parseInt(value);
                    if (!isNaN(year)) {
                      setFormData({...formData, year});
                    }
                  }}
                  placeholder="z.B. 2020"
                  options={Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => (new Date().getFullYear() - i).toString())}
                  maxSuggestions={50}
                />
              </div>
              <div>
                <label className="form-label">Farbe</label>
                <input
                  className="form-input"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  placeholder="z.B. Schwarz"
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Fahrzeugname *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="z.B. Mein BMW, Rote Schönheit, Das Biest"
                />
              </div>
            </div>

            {/* Schalter */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_former}
                    onChange={(e) => setFormData({...formData, is_former: e.target.checked})}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Das ist mein ehemaliges Auto</span>
                </label>
                <p className="text-xs opacity-60">
                  Aktivieren Sie dies, wenn Sie ein Auto hinzufügen, das Sie früher gefahren sind
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_main_vehicle}
                    onChange={(e) => setFormData({...formData, is_main_vehicle: e.target.checked})}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Als Hauptfahrzeug setzen</span>
                </label>
                <p className="text-xs opacity-60">
                  Dieses Auto wird als Ihr Hauptfahrzeug markiert
                </p>
              </div>
            </div>
          </div>

          {/* Note about photos */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Fotos</h3>
              <p className="text-sm opacity-70 mb-4">
                Fotos können nach dem Erstellen des Autos hinzugefügt werden.
              </p>
            </div>
          </div>

          {/* Geschichte des Autos */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Geschichte des Autos</h3>
            </div>
            
            <div className="relative">
              <textarea
                className="form-input min-h-[120px] resize-y"
                value={formData.story}
                onChange={(e) => setFormData({...formData, story: e.target.value})}
                placeholder="Kaufgeschichte oder allgemeine Eindrücke."
                maxLength={25000}
              />
              <div className="absolute top-2 right-2 text-xs opacity-60">
                {formData.story.length}/25000
              </div>
            </div>

            {/* Панель форматирования */}
            <div className="flex items-center gap-2 text-sm">
              <button type="button" className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
                <strong>B</strong>
              </button>
              <button type="button" className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
                <em>I</em>
              </button>
              <button type="button" className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
                <s>S</s>
              </button>
              <button type="button" className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
                🔗
              </button>
              <a href="/markup-syntax" className="text-primary hover:underline ml-2">
                Markup-Syntax
              </a>
            </div>
          </div>


          <div className="flex gap-2 justify-end pt-4">
            <button type="button" className="bg-[#868E96] hover:bg-[#343A40] text-white px-4 py-2 rounded-full transition-colors" onClick={onCancel}>
              Abbrechen
            </button>
            <button type="submit" className="bg-[#6A3FFB] hover:bg-[#3F297A] text-white px-4 py-2 rounded-full transition-colors">
              Fahrzeug hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
