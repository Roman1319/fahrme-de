'use client';
import { useEffect } from 'react';

export default function AsyncComponentDebugger() {
  useEffect(() => {
    // Перехватываем все ошибки React
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      const errorMessage = args.find(arg => 
        typeof arg === 'string' && 
        (arg.includes('async Client Component') || 
         arg.includes('Only Server Components can be async'))
      );
      
      if (errorMessage) {
        console.group('🚨 ASYNC CLIENT COMPONENT DEBUGGER');
        console.error('Error detected:', errorMessage);
        
        // Получаем полный стек
        const error = new Error();
        const stack = error.stack;
        
        if (stack) {
          console.error('Full stack trace:');
          console.log(stack);
          
          // Ищем файлы .tsx в стеке
          const tsxMatches = stack.match(/at\s+[^(]+\([^)]*\.tsx:\d+:\d+\)/g);
          if (tsxMatches) {
            console.error('TSX files in stack:');
            tsxMatches.forEach(match => {
              console.log('  ', match);
              
              // Извлекаем имя файла
              const fileMatch = match.match(/\(([^)]*\.tsx):\d+:\d+\)/);
              if (fileMatch) {
                console.log('    File:', fileMatch[1]);
              }
            });
          }
          
          // Ищем компоненты
          const componentMatches = stack.match(/at\s+(\w+)\s+\(/g);
          if (componentMatches) {
            console.error('Components/functions in stack:');
            componentMatches.forEach(match => {
              const nameMatch = match.match(/at\s+(\w+)\s+\(/);
              if (nameMatch) {
                console.log('  ', nameMatch[1]);
              }
            });
          }
        }
        
        console.groupEnd();
      }
      
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
