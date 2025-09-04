"use client";

import { useState, useEffect } from "react";
import { Plus, Car, Edit, Trash2 } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import ImageUpload from "@/components/ui/ImageUpload";

interface MyCar {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  images?: string[];
  description?: string;
  story?: string;
  isFormerCar: boolean;
  isMainVehicle?: boolean;
  engine?: string;
  volume?: string;
  gearbox?: string;
  drive?: string;
  power?: number;
  addedDate: string;
}

export default function MyCarsPage() {
  const [cars, setCars] = useState<MyCar[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

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
  };

  // Добавляем новую машину
  const addCar = (carData: Omit<MyCar, 'id' | 'addedDate'>) => {
    const newCar: MyCar = {
      ...carData,
      id: Date.now().toString(),
      addedDate: new Date().toISOString(),
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

  return (
    <RequireAuth>
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
                className="btn-primary text-base px-6 py-3"
              >
                Erstes Auto hinzufügen
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {cars.map((car) => (
                <div key={car.id} className="section p-4">
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-neutral-100 dark:bg-neutral-800">
                    {car.images && car.images.length > 0 ? (
                      <img
                        src={car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car size={32} className="opacity-50" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">
                          {car.make} {car.model}
                        </h3>
                        <p className="text-sm opacity-70">
                          {car.year}
                        </p>
                      </div>
                      {car.isFormerCar && (
                        <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">
                          Ehemalig
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm opacity-70">
                      {car.color && <p className="truncate">Farbe: {car.color}</p>}
                      {car.engine && <p className="truncate">Motor: {car.engine}</p>}
                      {car.power && <p className="truncate">Leistung: {car.power} PS</p>}
                    </div>

                    {car.images && car.images.length > 1 && (
                      <p className="text-xs opacity-60">
                        +{car.images.length - 1} weitere Fotos
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs opacity-60">
                        {new Date(car.addedDate).toLocaleDateString('de-DE')}
                      </span>
                      <div className="flex gap-1">
                        <button className="icon-btn" title="Bearbeiten">
                          <Edit size={14} />
                        </button>
                        <button 
                          className="icon-btn text-red-500 hover:text-red-600" 
                          onClick={() => deleteCar(car.id)}
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Форма добавления машины */}
          {showAddForm && (
            <AddCarForm
              onAdd={(carData) => {
                addCar(carData);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </div>
      </main>
    </RequireAuth>
  );
}

// Компонент формы добавления машины
function AddCarForm({ 
  onAdd, 
  onCancel 
}: { 
  onAdd: (car: Omit<MyCar, 'id' | 'addedDate'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
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
    power: 100
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.make && formData.model) {
      onAdd(formData);
    }
  };


  return (
    <div className="space-y-6">
      <div className="section">
        <h2 className="h2 mb-4">Auto hinzufügen</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Основная информация о машине */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Auto</h3>
              <p className="text-sm opacity-70 mb-4">
                Erzählen Sie uns von Ihrem Auto. Falls Ihr Modell nicht aufgeführt ist, 
                <a href="/contact" className="text-primary hover:underline ml-1">schreiben Sie uns</a>.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label">Marke *</label>
                <input
                  className="form-input"
                  value={formData.make}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
                  placeholder="z.B. BMW"
                  required
                />
              </div>
              <div>
                <label className="form-label">Modell *</label>
                <input
                  className="form-input"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  placeholder="z.B. 3er"
                  required
                />
              </div>
              <div>
                <label className="form-label">Baujahr</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  min="1900"
                  max={new Date().getFullYear() + 1}
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
            </div>

            {/* Переключатели */}
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

          {/* Фотографии */}
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

          {/* Рассказ о машине */}
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

          {/* Характеристики */}
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
                  type="number"
                  className="form-input"
                  value={formData.power}
                  onChange={(e) => setFormData({...formData, power: parseInt(e.target.value) || 0})}
                  min="0"
                  max="2000"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              Auto hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
