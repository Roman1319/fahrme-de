"use client";

import { useState, useEffect } from "react";
import { Plus, Car, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import Guard from "@/components/auth/Guard";
import ImageUpload from "@/components/ui/ImageUpload";
import AutoCompleteInput from "@/components/ui/AutoCompleteInput";
import EditCarModal from "@/components/EditCarModal";
import { useCarData } from "@/hooks/useCarData";
import { MyCar } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

export default function MyCarsPage() {
  const { user } = useAuth();
  const [cars, setCars] = useState<MyCar[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCar, setEditingCar] = useState<MyCar | null>(null);

  // Загружаем машины из localStorage
  useEffect(() => {
    const savedCars = localStorage.getItem('fahrme:my-cars');
    if (savedCars) {
      try {
        setCars(JSON.parse(savedCars));
      } catch (error) {
        console.error('Error loading cars:', error);
      }
    }
  }, []);

  // Сохраняем машины в localStorage
  const saveCars = (newCars: MyCar[]) => {
    setCars(newCars);
    localStorage.setItem('fahrme:my-cars', JSON.stringify(newCars));
    // Отправляем событие об изменении основного автомобиля
    window.dispatchEvent(new CustomEvent('mainVehicleChanged'));
  };

  // Добавляем новую машину
  const addCar = (carData: Omit<MyCar, 'id' | 'addedDate' | 'ownerId'>) => {
    if (!user) {
      console.error('Пользователь не авторизован');
      return;
    }
    
    const newCar: MyCar = {
      ...carData,
      name: carData.name || `${carData.make} ${carData.model}`, // Генерируем имя по умолчанию
      id: Date.now().toString(),
      addedDate: new Date().toISOString(),
      ownerId: user.id, // Всегда устанавливаем ID текущего пользователя как владельца
    };
    saveCars([...cars, newCar]);
    setShowAddForm(false);
  };

  // Удаляем машину
  const deleteCar = (id: string) => {
    if (confirm('Möchten Sie dieses Auto wirklich löschen?')) {
      saveCars(cars.filter(car => car.id !== id));
    }
  };

  // Устанавливаем главный автомобиль
  const setMainVehicle = (id: string) => {
    const updatedCars = cars.map(car => ({
      ...car,
      isMainVehicle: car.id === id
    }));
    saveCars(updatedCars);
  };

  // Сохраняем отредактированную машину
  const handleSaveEditedCar = (updatedCar: MyCar) => {
    const updatedCars = cars.map(car => 
      car.id === updatedCar.id ? updatedCar : car
    );
    saveCars(updatedCars);
    setEditingCar(null);
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

          {/* Список машин */}
          {cars.length === 0 ? (
            <div className="section text-center py-16">
              <Car size={64} className="mx-auto mb-6 opacity-50" />
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
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {cars.map((car) => (
                <div key={car.id} className="section p-2 group">
                  <Link href={`/car/${car.id}`} className="block">
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-neutral-100 dark:bg-neutral-800 cursor-pointer">
                      {car.images && car.images.length > 0 ? (
                        <img
                          src={car.images[0]}
                          alt={car.name || `${car.make} ${car.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car size={20} className="opacity-50" />
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-xs leading-tight">
                          {car.name || `${car.make} ${car.model}`}
                        </h3>
                        <p className="text-xs opacity-70">
                          {car.make} {car.model} • {car.year}
                        </p>
                      </div>
                      {car.isFormerCar && (
                        <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded-full">
                          Ehemalig
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-0.5 text-xs opacity-70">
                      {car.color && <p className="truncate">Farbe: {car.color}</p>}
                      {car.engine && <p className="truncate">Motor: {car.engine}</p>}
                      {car.power && <p className="truncate">Leistung: {car.power} PS</p>}
                    </div>

                    {car.images && car.images.length > 1 && (
                      <p className="text-xs opacity-60">
                        +{car.images.length - 1} weitere Fotos
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs opacity-60">
                        {new Date(car.addedDate).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>

                  {/* Кнопки действий одинакового размера */}
                  <div className="flex gap-1 mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingCar(car);
                      }}
                      className="flex-1 px-2 py-1 text-xs text-white border border-[#868E96] rounded-full hover:bg-[#343A40] transition-colors"
                    >
                      Bearbeiten
                    </button>
                    {!car.isMainVehicle ? (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setMainVehicle(car.id);
                        }}
                        className="flex-1 px-2 py-1 text-xs text-white border border-[#868E96] rounded-full hover:bg-[#343A40] transition-colors"
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
                      onClick={(e) => {
                        e.preventDefault();
                        deleteCar(car.id);
                      }}
                      className="flex-1 px-2 py-1 text-xs text-[#6A3FFB] border border-[#6A3FFB] rounded-full hover:bg-[#343A40] transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Форма добавления машины */}
          {showAddForm && (
            <AddCarForm
              user={user}
              onAdd={(carData) => {
                addCar(carData);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Edit Car Modal */}
          {editingCar && (
            <EditCarModal
              car={editingCar}
              isOpen={!!editingCar}
              onClose={() => setEditingCar(null)}
              onSave={handleSaveEditedCar}
            />
          )}
        </div>
      </main>
    </Guard>
  );
}

// Компонент формы добавления машины
function AddCarForm({ 
  user,
  onAdd, 
  onCancel 
}: { 
  user: any;
  onAdd: (car: Omit<MyCar, 'id' | 'addedDate'>) => void;
  onCancel: () => void;
}) {
  const { makes, getModels, isLoading: carDataLoading } = useCarData();
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '', // Имя машины
    make: '',
    model: '',
    year: 0, // Пустое значение для года
    color: '',
    description: '',
    story: '',
    images: [] as string[],
    isFormerCar: false,
    isMainVehicle: false,
    engine: '',
    volume: '',
    gearbox: '',
    drive: '',
    power: 0,
    ownerId: '' // Будет установлен при отправке
  });

  // Безопасное обновление доступных моделей при изменении марки
  useEffect(() => {
    try {
      if (formData.make && makes.length > 0) {
        const models = getModels(formData.make);
        setAvailableModels(models);
        
        // Сбрасываем модель, если она не доступна для выбранной марки
        if (formData.model && !models.includes(formData.model)) {
          setFormData(prev => ({ ...prev, model: '' }));
        }
      } else {
        setAvailableModels([]);
        if (!formData.make) {
          setFormData(prev => ({ ...prev, model: '' }));
        }
      }
    } catch (error) {
      console.warn('Error updating models:', error);
      setAvailableModels([]);
    }
  }, [formData.make, getModels, makes.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.name && formData.make && formData.model && formData.year > 0 && user) {
      onAdd({
        ...formData,
        ownerId: user.id
      });
    }
  };

  // Обработчик выбора марки
  const handleMakeSelect = (make: string) => {
    setFormData(prev => ({ ...prev, make, model: '' }));
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
                  value={formData.make}
                  onChange={(value) => setFormData({...formData, make: value})}
                  onSelect={handleMakeSelect}
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
                  disabled={!formData.make || carDataLoading}
                />
                {!formData.make && (
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
                    checked={formData.isFormerCar}
                    onChange={(e) => setFormData({...formData, isFormerCar: e.target.checked})}
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
                    checked={formData.isMainVehicle}
                    onChange={(e) => setFormData({...formData, isMainVehicle: e.target.checked})}
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

          {/* Fotos */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Fotos</h3>
              <p className="text-sm opacity-70 mb-4">
                Wir zuschneiden im 16:9 Format. Format — JPEG. Mindestgröße — 480×270 Pixel.
              </p>
            </div>

            <ImageUpload
              images={formData.images}
              onImagesChange={(images) => setFormData({...formData, images})}
              maxImages={10}
              maxSize={5}
              minWidth={480}
              minHeight={270}
            />

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

          {/* Eigenschaften */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Eigenschaften</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label">Motor</label>
                <select
                  className="form-input"
                  value={formData.engine}
                  onChange={(e) => setFormData({...formData, engine: e.target.value})}
                >
                  <option value="">Auswählen</option>
                  <option value="Benzin">Benzin</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Elektro">Elektro</option>
                  <option value="Gas">Gas</option>
                </select>
              </div>
              <div>
                <label className="form-label">Hubraum</label>
                <select
                  className="form-input"
                  value={formData.volume}
                  onChange={(e) => setFormData({...formData, volume: e.target.value})}
                >
                  <option value="">Auswählen</option>
                  <option value="1.0L">1.0L</option>
                  <option value="1.2L">1.2L</option>
                  <option value="1.4L">1.4L</option>
                  <option value="1.6L">1.6L</option>
                  <option value="1.8L">1.8L</option>
                  <option value="2.0L">2.0L</option>
                  <option value="2.5L">2.5L</option>
                  <option value="3.0L">3.0L</option>
                  <option value="3.5L">3.5L</option>
                  <option value="4.0L+">4.0L+</option>
                </select>
              </div>
              <div>
                <label className="form-label">Getriebe</label>
                <select
                  className="form-input"
                  value={formData.gearbox}
                  onChange={(e) => setFormData({...formData, gearbox: e.target.value})}
                >
                  <option value="">Auswählen</option>
                  <option value="Schaltgetriebe">Schaltgetriebe</option>
                  <option value="Automatik">Automatik</option>
                  <option value="CVT">CVT</option>
                  <option value="DSG">DSG</option>
                  <option value="Tiptronic">Tiptronic</option>
                </select>
              </div>
              <div>
                <label className="form-label">Antrieb</label>
                <select
                  className="form-input"
                  value={formData.drive}
                  onChange={(e) => setFormData({...formData, drive: e.target.value})}
                >
                  <option value="">Auswählen</option>
                  <option value="Vorderradantrieb">Vorderradantrieb</option>
                  <option value="Hinterradantrieb">Hinterradantrieb</option>
                  <option value="Allradantrieb">Allradantrieb</option>
                </select>
              </div>
              <div>
                <label className="form-label">Leistung (PS)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.power === 0 ? '' : formData.power.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setFormData({...formData, power: 0});
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 9999) {
                        setFormData({...formData, power: numValue});
                      }
                    }
                  }}
                  placeholder="z.B. 150"
                />
              </div>
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
