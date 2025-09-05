'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Heart, MessageCircle, Eye, Star, Edit, MoreVertical, Plus, Share2 } from 'lucide-react';
import { MyCar } from '@/lib/types';
import EditCarModal from '@/components/EditCarModal';
import { useAuth } from '@/components/AuthProvider';

export default function CarPage() {
  const params = useParams();
  const carId = params.id as string;
  const { user } = useAuth();
  
  const [car, setCar] = useState<MyCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  
  // Проверяем, является ли текущий пользователь владельцем автомобиля
  const isOwner = car && user && car.ownerId === user.email;

  useEffect(() => {
    loadCar();
    loadComments();
  }, [carId]);

  const loadCar = () => {
    setIsLoading(true);
    const savedCars = localStorage.getItem('fahrme:my-cars');
    if (savedCars) {
      try {
        const cars: MyCar[] = JSON.parse(savedCars);
        const foundCar = cars.find(c => c.id === carId);
        setCar(foundCar || null);
      } catch (error) {
        console.error('Error loading car:', error);
        setCar(null);
      }
    } else {
      setCar(null);
    }
    setIsLoading(false);
  };

  const loadComments = () => {
    const savedComments = localStorage.getItem(`fahrme:comments:${carId}`);
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments));
      } catch (error) {
        console.error('Error loading comments:', error);
        setComments([]);
      }
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      text: newComment,
      author: 'Du',
      timestamp: new Date().toLocaleString('de-DE'),
      likes: 0
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    localStorage.setItem(`fahrme:comments:${carId}`, JSON.stringify(updatedComments));
    setNewComment('');
  };

  const handleLikeComment = (commentId: string) => {
    const updatedComments = comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, likes: comment.likes + 1 }
        : comment
    );
    setComments(updatedComments);
    localStorage.setItem(`fahrme:comments:${carId}`, JSON.stringify(updatedComments));
  };

  const handleDeleteComment = (commentId: string) => {
    const updatedComments = comments.filter(comment => comment.id !== commentId);
    setComments(updatedComments);
    localStorage.setItem(`fahrme:comments:${carId}`, JSON.stringify(updatedComments));
  };

  const handleSaveCar = (updatedCar: MyCar) => {
    const savedCars = localStorage.getItem('fahrme:my-cars');
    if (savedCars) {
      try {
        const cars: MyCar[] = JSON.parse(savedCars);
        const updatedCars = cars.map(c => c.id === carId ? updatedCar : c);
        localStorage.setItem('fahrme:my-cars', JSON.stringify(updatedCars));
        setCar(updatedCar);
        setShowEditModal(false);
        
        // Отправляем событие об изменении
        window.dispatchEvent(new CustomEvent('mainVehicleChanged'));
      } catch (error) {
        console.error('Error saving car:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <main className="pb-12">
        <section className="space-y-4">
          <div className="section text-center py-16">
            <div className="text-xl">Lade...</div>
          </div>
        </section>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="pb-12">
        <section className="space-y-4">
          <div className="section text-center py-16">
            <div className="text-xl">Auto nicht gefunden</div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pb-12">
      <section className="space-y-4">
        {/* Breadcrumbs */}
        <nav className="text-sm opacity-70">
          <span>Marken / {car.make} / {car.model}</span>
        </nav>

        {/* Header */}
        <div className="section">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-lg md:text-xl font-extrabold">{car.name || `${car.make} ${car.model}`}</h1>
              <p className="opacity-70 text-xs mt-1">
                {car.year} • {car.make} {car.model}
                {car.color && ` • ${car.color}`}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="btn-primary flex items-center gap-1 px-2 py-1 text-xs"
                >
                  <Edit size={12} />
                  Bearbeiten
                </button>
                <button 
                  onClick={() => setShowComments(true)}
                  className="btn-accent px-2 py-1 text-xs"
                >
                  In Logbuch schreiben
                </button>
              </div>
            )}
          </div>

          {/* Hero Image */}
          <div className="img-rounded aspect-[16/9] relative overflow-hidden mb-3">
            {car.images && car.images.length > 0 ? (
              <Image
                src={car.images[0]}
                alt={car.name || `${car.make} ${car.model}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-fallback flex items-center justify-center">
                <span className="opacity-50 text-sm">Kein Foto</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5 flex-wrap">
            <button className="btn-secondary px-2 py-1 text-xs">
              Auto abonnieren
            </button>
            <button className="btn-secondary px-2 py-1 text-xs">
              {car.make} abonnieren
            </button>
          </div>
        </div>

        {/* Fahrzeugdetails */}
        <div className="section">
          <h2 className="text-sm font-bold mb-2">Технические данные</h2>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-accent">•</span>
              <span className="opacity-80">{car.year} • {car.make} {car.model}</span>
            </div>
            {car.power && (
              <div className="flex items-center gap-2">
                <span className="text-accent">•</span>
                <span className="opacity-80">Dmotor {car.engine}, {car.power} PS</span>
              </div>
            )}
            {car.gearbox && (
              <div className="flex items-center gap-2">
                <span className="text-accent">•</span>
                <span className="opacity-80">{car.gearbox}</span>
              </div>
            )}
            {car.drive && (
              <div className="flex items-center gap-2">
                <span className="text-accent">•</span>
                <span className="opacity-80">{car.drive}</span>
              </div>
            )}
            {car.color && (
              <div className="flex items-center gap-2">
                <span className="text-accent">•</span>
                <span className="opacity-80">Farbe: {car.color}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {car.description && (
          <div className="section">
            <h2 className="text-sm font-bold mb-2">Beschreibung</h2>
            <p className="opacity-80 text-xs leading-relaxed">{car.description}</p>
          </div>
        )}

        {/* Story */}
        {car.story && (
          <div className="section">
            <h2 className="text-sm font-bold mb-2">Geschichte</h2>
            <p className="opacity-80 text-xs leading-relaxed">{car.story}</p>
          </div>
        )}

        {/* Logbook */}
        <div className="section">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold">Logbuch</h2>
            {isOwner ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowComments(true)}
                  className="btn-accent flex items-center gap-1 px-2 py-1 text-xs"
                >
                  <Plus size={12} />
                  Neuer Eintrag
                </button>
                <button 
                  onClick={() => setShowComments(true)}
                  className="btn-primary px-2 py-1 text-xs"
                >
                  alle Einträge
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowComments(true)}
                className="btn-secondary px-2 py-1 text-xs"
              >
                Kommentare anzeigen
              </button>
            )}
          </div>
          {comments.length === 0 ? (
            <p className="opacity-70 text-center py-4 text-xs">Noch keine Beiträge für dieses Auto</p>
          ) : (
            <div className="space-y-2">
              {comments.slice(0, 3).map((comment) => (
                <div key={comment.id} className="border-b border-white/10 pb-2 last:border-b-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-accent text-black px-1.5 py-0.5 rounded-full text-xs font-medium">
                        @{comment.author}
                      </div>
                      <span className="text-xs opacity-70">{comment.timestamp}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                    >
                      Löschen
                    </button>
                  </div>
                  <p className="opacity-80 mb-1 text-xs">{comment.text}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity text-xs"
                    >
                      <Heart className="w-3 h-3" />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="section w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="h2">Kommentare</h2>
              <button
                onClick={() => setShowComments(false)}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>

            {/* Add Comment */}
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ihr Kommentar..."
                className="form-input mb-3"
                rows={3}
              />
              <button
                onClick={handleAddComment}
                className="btn-primary"
              >
                Senden
              </button>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-white/10 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-sm opacity-70">{comment.timestamp}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                      Löschen
                    </button>
                  </div>
                  <p className="opacity-80 mb-2">{comment.text}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Car Modal */}
      {showEditModal && car && (
        <EditCarModal
          car={car}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveCar}
        />
      )}
    </main>
  );
}
