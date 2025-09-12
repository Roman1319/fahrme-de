'use client';

import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import { useFilters, FilterState } from '@/hooks/useFilters';
import { LOGBOOK_TOPICS, getTopicLabel, getTopicIcon } from '@/lib/logbook-topics';

interface ExploreFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  className?: string;
}

export default function ExploreFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}: ExploreFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<'cars' | 'brands'>('cars');
  
  const {
    brands,
    models,
    yearRange,
    isLoading,
    error,
    initializeFilters,
    handleBrandChange,
    createSelectOptions,
    createYearOptions,
    getActiveFilters,
    hasActiveFilters
  } = useFilters();

  useEffect(() => {
    initializeFilters(source);
  }, [initializeFilters, source]);

  useEffect(() => {
    if (filters.car_brand) {
      handleBrandChange(filters.car_brand, source);
    }
  }, [filters.car_brand, handleBrandChange, source]);

  const handleBrandSelect = (brand: string) => {
    onFiltersChange({ 
      car_brand: brand,
      car_model: '' // Сбросить модель при смене бренда
    });
  };

  const handleModelSelect = (model: string) => {
    onFiltersChange({ car_model: model });
  };

  const handleTopicSelect = (topic: string) => {
    onFiltersChange({ topic });
  };

  const handleYearFromSelect = (year: string) => {
    onFiltersChange({ year_from: year });
  };

  const handleYearToSelect = (year: string) => {
    onFiltersChange({ year_to: year });
  };

  const handleClearFilters = () => {
    onClearFilters();
    onFiltersChange({
      car_brand: '',
      car_model: '',
      topic: '',
      year_from: '',
      year_to: ''
    });
  };

  const activeFilters = getActiveFilters(filters);
  const hasActive = hasActiveFilters(filters);

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
        <div className="text-red-500 text-sm">Ошибка загрузки фильтров: {error}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Кнопка открытия фильтров */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn-secondary flex items-center gap-2"
        >
          <Filter size={16} />
          Фильтры
          {hasActive && (
            <span className="bg-[#6A3FFB] text-white text-xs px-2 py-1 rounded-full">
              {activeFilters.length}
            </span>
          )}
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Переключатель источника данных */}
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">Источник:</span>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as 'cars' | 'brands')}
            className="text-sm bg-white/10 border border-white/20 rounded px-2 py-1"
            disabled={isLoading}
          >
            <option value="cars">Из машин</option>
            <option value="brands">Справочник</option>
          </select>
        </div>
      </div>

      {/* Панель фильтров */}
      {isOpen && (
        <div className="bg-white/5 rounded-lg p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin opacity-50" />
              <span className="ml-2 opacity-70">Загрузка фильтров...</span>
            </div>
          ) : (
            <>
              {/* Активные фильтры */}
              {hasActive && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm opacity-70">Активные:</span>
                  {activeFilters.map((filter, index) => (
                    <span
                      key={index}
                      className="bg-[#6A3FFB]/20 text-[#6A3FFB] text-xs px-2 py-1 rounded-full"
                    >
                      {filter}
                    </span>
                  ))}
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                  >
                    <X size={12} />
                    Очистить все
                  </button>
                </div>
              )}

              {/* Фильтры */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Бренд */}
                <div>
                  <label className="form-label">Бренд</label>
                  <select
                    value={filters.car_brand}
                    onChange={(e) => handleBrandSelect(e.target.value)}
                    className="form-input"
                    disabled={isLoading}
                  >
                    {createSelectOptions(brands, 'Все бренды')}
                  </select>
                </div>

                {/* Модель */}
                <div>
                  <label className="form-label">Модель</label>
                  <select
                    value={filters.car_model}
                    onChange={(e) => handleModelSelect(e.target.value)}
                    className="form-input"
                    disabled={!filters.car_brand || isLoading}
                  >
                    {createSelectOptions(models, 'Все модели')}
                  </select>
                </div>

                {/* Тема */}
                <div>
                  <label className="form-label">Тема</label>
                  <select
                    value={filters.topic}
                    onChange={(e) => handleTopicSelect(e.target.value)}
                    className="form-input"
                    disabled={isLoading}
                  >
                    <option value="">Все темы</option>
                    {LOGBOOK_TOPICS.map(topic => (
                      <option key={topic.value} value={topic.value}>
                        {getTopicIcon(topic.value)} {getTopicLabel(topic.value)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Год от */}
                <div>
                  <label className="form-label">Год от</label>
                  <select
                    value={filters.year_from}
                    onChange={(e) => handleYearFromSelect(e.target.value)}
                    className="form-input"
                    disabled={isLoading}
                  >
                    {createYearOptions('Любой год')}
                  </select>
                </div>

                {/* Год до */}
                <div>
                  <label className="form-label">Год до</label>
                  <select
                    value={filters.year_to}
                    onChange={(e) => handleYearToSelect(e.target.value)}
                    className="form-input"
                    disabled={isLoading}
                  >
                    {createYearOptions('Любой год')}
                  </select>
                </div>
              </div>

              {/* Информация о фильтрах */}
              <div className="text-xs opacity-50 pt-2 border-t border-white/10">
                {source === 'cars' 
                  ? 'Фильтры основаны на данных из таблицы cars'
                  : 'Фильтры основаны на справочнике brands/car_models'
                }
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
