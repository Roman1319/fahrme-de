'use client';
import { useEffect } from 'react';

export default function AsyncComponentDetector() {
  useEffect(() => {
    // Перехватываем console.error для анализа async client component ошибок
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      // Проверяем, является ли это async client component ошибкой
      const errorMessage = args.find(arg => 
        typeof arg === 'string' && 
        arg.includes('async Client Component')
      );
      
      if (errorMessage) {
        console.group('🔍 ASYNC CLIENT COMPONENT DETECTOR');
        console.error('🚨 Found async client component error!');
        console.error('Message:', errorMessage);
        
        // Анализируем стек вызовов
        const stack = new Error().stack;
        if (stack) {
          console.error('Current stack trace:');
          console.log(stack);
          
          // Ищем компоненты в стеке
          const componentMatches = stack.match(/at\s+(\w+)\s+\([^)]*\.tsx?:\d+:\d+\)/g);
          if (componentMatches) {
            console.error('Components in stack:');
            componentMatches.forEach(match => console.log('  ', match));
          }
        }
        
        console.groupEnd();
      }
      
      // Вызываем оригинальный console.error
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
