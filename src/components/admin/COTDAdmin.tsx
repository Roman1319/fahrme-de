'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useCOTD } from '@/hooks/useCOTD';
import { useAuth } from '@/components/AuthProvider';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  name?: string;
  owner_handle?: string;
}

export default function COTDAdmin() {
  const { user } = useAuth();
  const { 
    candidates, 
    isVotingOpen, 
    isLoading, 
    addCandidates, 
    closeDay, 
    refetch 
  } = useCOTD();

  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [selectedCars, setSelectedCars] = useState<string[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(false);
  const [isAddingCandidates, setIsAddingCandidates] = useState(false);
  const [isClosingDay, setIsClosingDay] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Загрузить доступные машины
  const loadAvailableCars = async () => {
    setIsLoadingCars(true);
    try {
      const response = await fetch('/api/cars');
      if (response.ok) {
        const cars = await response.json();
        setAvailableCars(cars);
      }
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setIsLoadingCars(false);
    }
  };

  useEffect(() => {
    loadAvailableCars();
  }, []);

  const handleAddCandidates = async () => {
    if (selectedCars.length === 0) {
      setMessage({ type: 'error', text: 'Выберите машины для добавления' });
      return;
    }

    setIsAddingCandidates(true);
    setMessage(null);

    const result = await addCandidates(selectedCars);
    
    if (result.success) {
      setMessage({ type: 'success', text: `Добавлено ${result.added_count} кандидатов` });
      setSelectedCars([]);
      await refetch();
    } else {
      setMessage({ type: 'error', text: result.error || 'Ошибка добавления кандидатов' });
    }

    setIsAddingCandidates(false);
  };

  const handleCloseDay = async () => {
    if (!confirm('Закрыть голосование и определить победителя?')) {
      return;
    }

    setIsClosingDay(true);
    setMessage(null);

    const result = await closeDay();
    
    if (result.success) {
      setMessage({ type: 'success', text: 'День закрыт, победитель определен' });
      await refetch();
    } else {
      setMessage({ type: 'error', text: result.error || 'Ошибка закрытия дня' });
    }

    setIsClosingDay(false);
  };

  const toggleCarSelection = (carId: string) => {
    setSelectedCars(prev => 
      prev.includes(carId) 
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  };

  if (!user) {
    return (
      <div className="section">
        <div className="text-center py-8">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-bold mb-2">Доступ запрещен</h2>
          <p className="text-sm opacity-70">Войдите в систему для доступа к админ-панели</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h2 className="text-lg font-bold mb-4">Управление "Машина дня"</h2>

      {/* Сообщения */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
            : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Статус голосования */}
      <div className="mb-6 p-3 bg-white/5 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Статус голосования</h3>
            <p className="text-sm opacity-70">
              {isVotingOpen ? 'Голосование открыто' : 'Голосование закрыто'}
            </p>
            <p className="text-xs opacity-50">
              Кандидатов: {candidates?.length || 0}
            </p>
          </div>
          {isVotingOpen && (
            <button
              onClick={handleCloseDay}
              disabled={isClosingDay}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isClosingDay ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <X size={16} />
              )}
              Закрыть голосование
            </button>
          )}
        </div>
      </div>

      {/* Добавление кандидатов */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Добавить кандидатов</h3>
        
        {isLoadingCars ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin opacity-50" />
            <span className="ml-2 opacity-70">Загрузка машин...</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableCars.map((car) => (
              <div
                key={car.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedCars.includes(car.id)
                    ? 'bg-[#6A3FFB]/20 border-[#6A3FFB]/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                onClick={() => toggleCarSelection(car.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">
                      {car.name || `${car.brand} ${car.model}`}
                    </div>
                    <div className="text-xs opacity-70">
                      {car.year} • {car.owner_handle || 'Владелец неизвестен'}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedCars.includes(car.id)
                      ? 'bg-[#6A3FFB] border-[#6A3FFB]'
                      : 'border-white/30'
                  }`}>
                    {selectedCars.includes(car.id) && (
                      <CheckCircle size={12} className="text-white" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleAddCandidates}
            disabled={selectedCars.length === 0 || isAddingCandidates}
            className="px-4 py-2 bg-[#6A3FFB] hover:bg-[#3F297A] text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAddingCandidates ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Добавить выбранных ({selectedCars.length})
          </button>
          
          <button
            onClick={() => setSelectedCars([])}
            disabled={selectedCars.length === 0}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Очистить выбор
          </button>
        </div>
      </div>

      {/* Текущие кандидаты */}
      <div>
        <h3 className="font-semibold mb-3">Текущие кандидаты</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin opacity-50" />
            <span className="ml-2 opacity-70">Загрузка...</span>
          </div>
        ) : candidates && candidates.length > 0 ? (
          <div className="space-y-2">
            {candidates.map((candidate, index) => (
              <div
                key={candidate.car_id}
                className="p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#6A3FFB]/20 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {candidate.car_name || `${candidate.car_brand} ${candidate.car_model}`}
                      </div>
                      <div className="text-xs opacity-70">
                        {candidate.car_year} • {candidate.owner_handle}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-[#6A3FFB]">
                      {candidate.votes} голосов
                    </div>
                    {candidate.my_vote && (
                      <div className="text-xs text-green-500">✓ Ваш голос</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm opacity-70">
            Нет кандидатов
          </div>
        )}
      </div>
    </div>
  );
}
