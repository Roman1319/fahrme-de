'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
// import type { RegisterCredentials, LoginCredentials } from '@/services/auth/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = 'signin',
  onSuccess 
}: AuthModalProps) {
  const { register, login } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Формы
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode, mounted]);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const credentials = {
      name: signUpForm.name,
      email: signUpForm.email,
      password: signUpForm.password
    };

    register(credentials.name, credentials.email, credentials.password)
      .then((error) => {
        if (!error) {
          onSuccess?.();
          onClose();
        } else {
          setError(error);
        }
      })
      .catch(() => {
        setError('Unerwarteter Fehler');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const credentials = {
      email: signInForm.email,
      password: signInForm.password
    };

    login(credentials.email, credentials.password)
      .then((error) => {
        if (!error) {
          onSuccess?.();
          onClose();
        } else {
          setError(error);
        }
      })
      .catch(() => {
        setError('Unerwarteter Fehler');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };



  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="modal-glass max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {mode === 'signin' && 'Anmelden'}
            {mode === 'signup' && 'Registrieren'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Переключение режимов */}
          <div className="flex mb-6 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Anmelden
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Registrieren
            </button>
          </div>

          {/* Ошибки */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Форма входа */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
                  <input
                    type="email"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="ihre.email@beispiel.de"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Passwort (optional im Demo)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signInForm.password}
                    onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Passwort (optional im Demo)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Anmeldung...' : 'Anmelden'}
              </button>
            </form>
          )}

          {/* Форма регистрации */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
                  <input
                    type="text"
                    value={signUpForm.name}
                    onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ihr Name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  E-Mail-Adresse *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
                  <input
                    type="email"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="ihre.email@beispiel.de"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Passwort (optional im Demo)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Passwort (optional im Demo)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Registrierung...' : 'Registrieren'}
              </button>
            </form>
          )}


          {/* Демо-режим предупреждение */}
          <div className="mt-6 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-md">
            <p className="text-xs text-yellow-300">
              <strong>Demo-Modus:</strong> Alle Daten werden nur in diesem Browser gespeichert. 
              Beim Löschen der Browser-Daten gehen alle Informationen verloren.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
