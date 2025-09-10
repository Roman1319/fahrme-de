'use client';
import { useEffect } from 'react';

export default function ComponentAnalyzer() {
  useEffect(() => {
    // Анализируем все компоненты на предмет потенциальных проблем
    const analyzeComponents = () => {
      console.group('🔍 COMPONENT ANALYZER');
      
      // Получаем все элементы с data-атрибутами React
      const reactElements = document.querySelectorAll('[data-reactroot]');
      console.log('Found React elements:', reactElements.length);
      
      // Ищем элементы с подозрительными классами или атрибутами
      const suspiciousElements = document.querySelectorAll('[class*="async"], [class*="promise"]');
      if (suspiciousElements.length > 0) {
        console.warn('Found elements with suspicious class names:', suspiciousElements);
      }
      
      // Проверяем наличие промисов в DOM
      const allElements = document.querySelectorAll('*');
      let promiseCount = 0;
      allElements.forEach(el => {
        if (el.textContent?.includes('Promise') || el.textContent?.includes('[object Promise]')) {
          promiseCount++;
          console.warn('Found potential Promise in DOM:', el);
        }
      });
      
      if (promiseCount > 0) {
        console.warn(`Found ${promiseCount} elements with Promise content`);
      }
      
      console.groupEnd();
    };

    // Запускаем анализ через небольшую задержку
    const timeoutId = setTimeout(analyzeComponents, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
