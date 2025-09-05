'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AutoCompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: string[];
  maxSuggestions?: number;
  className?: string;
  disabled?: boolean;
  onSelect?: (value: string) => void;
}

export default function AutoCompleteInput({
  value,
  onChange,
  placeholder = '',
  options = [],
  maxSuggestions = 10,
  className = '',
  disabled = false,
  onSelect
}: AutoCompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Фильтруем опции на основе введенного текста
  useEffect(() => {
    if (!value.trim()) {
      setFilteredOptions(options.slice(0, maxSuggestions));
    } else {
      const filtered = options
        .filter(option => 
          option.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, maxSuggestions);
      setFilteredOptions(filtered);
    }
    setHighlightedIndex(-1);
  }, [value, options, maxSuggestions]);

  // Обработчик изменения ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  // Обработчик выбора опции
  const handleSelect = useCallback((option: string) => {
    onChange(option);
    setIsOpen(false);
    onSelect?.(option);
    inputRef.current?.blur();
  }, [onChange, onSelect]);

  // Обработчик клика по опции
  const handleOptionClick = (option: string) => {
    handleSelect(option);
  };

  // Обработчик клавиатуры
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Обработчик фокуса
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Обработчик клика вне компонента
  const handleClickOutside = (e: MouseEvent) => {
    if (
      inputRef.current && 
      !inputRef.current.contains(e.target as Node) &&
      listRef.current &&
      !listRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Прокрутка к выделенному элементу
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="form-input pr-8"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            >
              <X size={14} className="text-neutral-500" />
            </button>
          )}
          <ChevronDown 
            size={16} 
            className={`text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              onClick={() => handleOptionClick(option)}
              className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                index === highlightedIndex
                  ? 'bg-primary text-white'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
