"use client";

import { ArrowUpRight } from "lucide-react";

interface CarOfTheDayProps {
  yesterdayCar: {
    id: string;
    make: string;
    model: string;
    year: number;
    image: string;
    description: string;
    votes: number;
  };
  todayCars: {
    id: string;
    make: string;
    model: string;
    image: string;
  }[];
  onVote?: (carId: string) => void;
}

export default function CarOfTheDay({ yesterdayCar, todayCars, onVote }: CarOfTheDayProps) {
  return (
    <div className="car-of-the-day">
      {/* Header с Filter кнопкой */}
      <div className="flex items-center justify-between mb-4">
        <div className="ribbon text-lg px-4 py-2">Feed</div>
        <button className="flex items-center gap-2 px-3 py-1.5 btn-secondary text-sm font-medium">
          Filter
          <ArrowUpRight size={14} className="rotate-90" />
        </button>
      </div>

      {/* Основной блок с автомобилем дня и выбором */}
      <div className="section">
        {/* Вчерашний автомобиль дня */}
        <div className="mb-6">
          <h3 className="h2 mb-4">Fahrzeug des Tages (Gestern)</h3>
          <div className="relative rounded-xl overflow-hidden">
            <div className="relative h-64 md:h-80">
              <img 
                src={yesterdayCar.image} 
                alt={`${yesterdayCar.make} ${yesterdayCar.model}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay с информацией */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              
              {/* Информация об автомобиле */}
              <div className="absolute bottom-4 left-4 right-4">
                <h4 className="text-xl font-bold text-white mb-1">
                  {yesterdayCar.make} {yesterdayCar.model} {yesterdayCar.year}
                </h4>
                <p className="text-white/80 text-sm mb-2">
                  {yesterdayCar.description}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span className="text-white/80 text-sm">
                      {yesterdayCar.votes} Stimmen gewonnen
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Выбор сегодняшнего автомобиля дня */}
        <div>
          <h3 className="h2 mb-4">Wähle das Fahrzeug des Tages (Heute)</h3>
          <p className="opacity-70 text-sm mb-4">
            Stimme für deinen Favoriten ab! Die Wahl endet in 23h 45m.
          </p>
          
          {/* Сетка автомобилей для выбора */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {todayCars.map((car) => (
              <button
                key={car.id}
                onClick={() => onVote?.(car.id)}
                className="group relative aspect-square rounded-xl overflow-hidden hover:scale-105 transition-all duration-200"
              >
                <img 
                  src={car.image} 
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay при наведении */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="bg-brand rounded-lg px-3 py-1.5">
                    <span className="text-white text-sm font-medium">
                      {car.make} {car.model}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Кнопка "Wahl des Autos des Tages" */}
          <div className="mt-4 flex justify-center">
            <button 
              onClick={() => onVote?.('all')}
              className="btn-primary flex items-center gap-2"
            >
              Wahl des Autos des Tages
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
