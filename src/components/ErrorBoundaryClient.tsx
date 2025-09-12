'use client';
import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundaryClient extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) { 
    super(props); 
    this.state = { error: null }; 
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { 
    return { error }; 
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // ВАЖНО: печатаем компонентный стек, там будет имя проблемного компонента
    // eslint-disable-next-line no-console
    console.error('[Async Client Component DETECTED]', { 
      error: error.message,
      errorStack: error.stack,
      componentStack: info?.componentStack,
      errorType: error.constructor.name
    });
    
    // Дополнительная информация для отладки
    if (error.message.includes('async Client Component')) {
      console.error('[DETAILED DEBUG] Async Client Component Error Details:', {
        errorMessage: error.message,
        componentStack: info?.componentStack,
        errorStack: error.stack,
        allProps: this.props,
        currentState: this.state
      });
    }
  }
  
  render() {
    if (this.state.error) {
      // Показываем ошибку в UI для отладки
      return (
        <div style={{ 
          padding: '20px', 
          border: '2px solid red', 
          backgroundColor: '#ffe6e6',
          color: 'red',
          fontFamily: 'monospace'
        }}>
          <h3>🚨 Async Client Component Error Detected</h3>
          <p><strong>Error:</strong> {this.state.error.message}</p>
          <details>
            <summary>Component Stack (click to expand)</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {this.state.error.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
