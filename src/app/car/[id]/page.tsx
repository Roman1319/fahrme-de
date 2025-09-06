'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Eye, Star, Edit, MoreVertical, Plus, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MyCar, Comment, LogbookEntry } from '@/lib/types';
import EditCarModal from '@/components/EditCarModal';
import { useAuth } from '@/components/AuthProvider';
import AvatarButton from '@/components/ui/AvatarButton';
import AvatarTooltip from '@/components/ui/AvatarTooltip';
import { readProfile, readProfileByEmail } from '@/lib/profile';
import { fixCarOwnership, isCarOwner } from '@/lib/fix-car-ownership';
import { 
  getCarInteraction, 
  toggleCarFollow, 
  toggleCarLike, 
  getCarStats,
  addComment,
  getComments,
  editComment,
  deleteComment,
  likeComment,
  addLogbookEntry,
  getLogbookEntries,
  toggleLogbookEntryLike,
  getLogbookEntryLikes,
  hasUserLikedLogbookEntry
} from '@/lib/interactions';
import CommentsList from '@/components/ui/CommentsList';

export default function CarPage() {
  const params = useParams();
  const carId = params.id as string;
  const { user } = useAuth();
  
  const [car, setCar] = useState<MyCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
  const [newLogbookEntry, setNewLogbookEntry] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showLogbook, setShowLogbook] = useState(false);
  const [carStats, setCarStats] = useState({ followers: 0, likes: 0 });
  const [userInteraction, setUserInteraction] = useState<{ isFollowing: boolean; isLiked: boolean } | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<{ avatarUrl?: string | null; displayName?: string } | null>(null);
  const [commentProfiles, setCommentProfiles] = useState<Record<string, { avatarUrl?: string | null; displayName?: string }>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Проверяем, является ли текущий пользователь владельцем автомобиля
  const isOwner = car && user && isCarOwner(car, user.email);
  

  useEffect(() => {
    loadCar();
    loadComments();
    loadLogbookEntries();
    loadCarStats();
    loadUserInteraction();
    loadOwnerProfile();
    setCurrentImageIndex(0); // Сбрасываем индекс изображения при загрузке нового автомобиля
    
    // Исправляем владение автомобилями при загрузке (только один раз)
    if (user?.email) {
      fixCarOwnership(user.email);
    }
  }, [carId, user]);

  useEffect(() => {
    loadCommentProfiles();
  }, [comments]);

  async function loadOwnerProfile() {
    if (car?.ownerId) {
      // For now, we'll use the current user's profile as a fallback
      // In a real app, you'd fetch the owner's profile by their ID
      const profile = readProfile();
      if (profile) {
        setOwnerProfile({
          avatarUrl: profile.avatarUrl,
          displayName: profile.displayName
        });
      }
    }
  }

  async function loadCommentProfiles() {
    const profiles: Record<string, { avatarUrl?: string | null; displayName?: string }> = {};
    
    comments.forEach(comment => {
      if (!commentProfiles[comment.authorEmail]) {
        const profile = readProfileByEmail(comment.authorEmail);
        if (profile) {
          profiles[comment.authorEmail] = {
            avatarUrl: profile.avatarUrl,
            displayName: profile.displayName
          };
        }
      }
    });
    
    if (Object.keys(profiles).length > 0) {
      setCommentProfiles(prev => ({ ...prev, ...profiles }));
    }
  }

  const loadCar = () => {
    setIsLoading(true);
    const savedCars = localStorage.getItem('fahrme:my-cars');
    if (savedCars) {
      try {
        const cars: MyCar[] = JSON.parse(savedCars);
        const foundCar = cars.find(c => c.id === carId);
        
        // Если у автомобиля нет ownerId, НЕ устанавливаем его автоматически
        // Пользователь должен быть владельцем только своих автомобилей
        if (foundCar && !foundCar.ownerId) {
          console.warn('Автомобиль без владельца:', foundCar);
          // Можно показать сообщение или перенаправить
        }
        
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
    setComments(getComments(carId));
  };

  const loadLogbookEntries = () => {
    setLogbookEntries(getLogbookEntries(carId));
  };

  const loadCarStats = () => {
    setCarStats(getCarStats(carId));
  };

  const loadUserInteraction = () => {
    if (user?.email) {
      const interaction = getCarInteraction(carId, user.email);
      setUserInteraction({
        isFollowing: interaction?.isFollowing || false,
        isLiked: interaction?.isLiked || false
      });
    }
  };

  const handleAddComment = (text: string, images?: string[]) => {
    if (!user) return;

    addComment(carId, text, user.name, user.email, undefined, images || []);
    loadComments();
  };

  const handleAddReply = (parentId: string, text: string, images?: string[]) => {
    if (!user) return;

    addComment(carId, text, user.name, user.email, parentId, images || []);
    loadComments();
  };

  const handleEditComment = (commentId: string, text: string) => {
    editComment(carId, commentId, text);
    loadComments();
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(carId, commentId);
    loadComments();
  };

  const handleLikeComment = (commentId: string) => {
    if (!user) return;
    
    likeComment(carId, commentId, user.email);
    loadComments();
  };

  const handleLikeReply = (parentId: string, replyId: string) => {
    if (!user) return;
    
    likeComment(carId, replyId, user.email);
    loadComments();
  };

  const handleEditReply = (parentId: string, replyId: string, text: string) => {
    editComment(carId, replyId, text);
    loadComments();
  };

  const handleDeleteReply = (parentId: string, replyId: string) => {
    deleteComment(carId, replyId);
    loadComments();
  };

  const handleAddLogbookEntry = () => {
    if (!newLogbookEntry.trim() || !user) return;

    addLogbookEntry(carId, newLogbookEntry, user.name, user.email, 'general');
    loadLogbookEntries();
    setNewLogbookEntry('');
  };

  const handleToggleFollow = () => {
    if (!user || isOwner) return;
    
    toggleCarFollow(carId, user.email);
    loadUserInteraction();
    loadCarStats();
  };

  const handleToggleLike = () => {
    if (!user || isOwner) return;
    
    toggleCarLike(carId, user.email);
    loadUserInteraction();
    loadCarStats();
  };

  const handleToggleLogbookLike = (entryId: string) => {
    if (!user) return;
    
    toggleLogbookEntryLike(entryId, user.email);
    loadLogbookEntries();
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

  const handleSubscribeToUser = (userEmail: string) => {
    // TODO: Implement subscribe functionality
    console.log('Subscribe to user:', userEmail);
    alert('Abonnement-Funktion wird später implementiert');
  };

  const handleMessageUser = (userEmail: string) => {
    // TODO: Implement message functionality
    console.log('Message user:', userEmail);
    alert('Nachrichten-Funktion wird später implementiert');
  };

  const nextImage = () => {
    if (car?.images && car.images.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % (car.images?.length || 1));
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    }
  };

  const prevImage = () => {
    if (car?.images && car.images.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        const imagesLength = car.images?.length || 1;
        setCurrentImageIndex((prev) => (prev - 1 + imagesLength) % imagesLength);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    }
  };

  const goToImage = (index: number) => {
    if (car?.images && car.images.length > 0 && !isTransitioning && index !== currentImageIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex(index);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    }
  };

  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
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

          {/* Photo Gallery */}
          <div className="img-rounded aspect-[16/10] relative overflow-hidden mb-3 group">
            {car.images && car.images.length > 0 ? (
              <>
                <div className="relative w-full h-full">
                  <Image
                    src={car.images[currentImageIndex]}
                    alt={car.name || `${car.make} ${car.model}`}
                    fill
                    className={`object-cover cursor-pointer transition-all duration-300 ${
                      isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                    }`}
                    priority
                    onClick={openImageModal}
                  />
                </div>
                
                {/* Navigation arrows */}
                {car.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      disabled={isTransitioning}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={isTransitioning}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                
                {/* Image counter */}
                {car.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {currentImageIndex + 1} / {car.images.length}
                  </div>
                )}
                
                {/* Dots indicator */}
                {car.images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {car.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        disabled={isTransitioning}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
                        } disabled:cursor-not-allowed`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-fallback flex items-center justify-center">
                <span className="opacity-50 text-sm">Kein Foto</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isOwner && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              <button 
                onClick={handleToggleFollow}
                className={`px-2 py-1 text-xs ${userInteraction?.isFollowing ? 'btn-accent' : 'btn-secondary'}`}
              >
                {userInteraction?.isFollowing ? '✓ Abonniert' : 'Auto abonnieren'}
              </button>
            </div>
          )}

          {/* Car Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-accent">0</div>
              <div className="text-xs opacity-70">Auto-Bewertung</div>
              <div className="text-xs opacity-50">0-100</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-primary">{logbookEntries.length}</div>
              <div className="text-xs opacity-70">Posts</div>
              <div className="text-xs opacity-50">insgesamt</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-left mb-2">
                <div className="text-xs opacity-70">Reaktionen</div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                {isOwner ? (
                  <div className="flex items-center gap-1 text-white opacity-70">
                    <Heart 
                      size={16} 
                      className="fill-current text-red-500" 
                    />
                    <span className="text-lg font-bold">{carStats.likes}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleToggleLike}
                    className={`flex items-center gap-1 transition-all ${
                      userInteraction?.isLiked 
                        ? 'text-red-500' 
                        : 'text-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Heart 
                      size={16} 
                      className={`${userInteraction?.isLiked ? 'fill-current' : ''}`} 
                    />
                    <span className="text-lg font-bold">{carStats.likes}</span>
                  </button>
                )}
                <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={16} className="text-purple-400" />
                  <span className="text-lg font-bold">{comments.length}</span>
                </div>
              </div>
              <div className="text-xs opacity-50">insgesamt</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-accent">{carStats.followers}</div>
              <div className="text-xs opacity-70">Abonnenten</div>
              <div className="text-xs opacity-50">für das Auto</div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <AvatarTooltip
                  src={ownerProfile?.avatarUrl || null}
                  name={ownerProfile?.displayName || car.ownerId || 'Benutzer'}
                  size={48}
                  userInfo={{
                    displayName: ownerProfile?.displayName || car.ownerId || 'Benutzer',
                    fullName: car.ownerId || 'Benutzer',
                    city: car.ownerCity || 'Мюнхен',
                    about: `Besitzer von ${car.make} ${car.model}`
                  }}
                  onSubscribe={!isOwner ? () => handleSubscribeToUser(car.ownerId || '') : undefined}
                  onMessage={!isOwner ? () => handleMessageUser(car.ownerId || '') : undefined}
                  showActions={!isOwner}
                />
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-base font-bold">
                    {isOwner ? 'Du' : (car.ownerId || 'Benutzer')}
                  </div>
                  {car.ownerAge && (
                    <div className="text-xs opacity-70">
                      {car.ownerAge} Jahre
                    </div>
                  )}
                </div>
                <div className="text-sm opacity-80 mb-1">
                  Ich fahre <Link href={`/car/${car.id}`} className="font-semibold hover:opacity-100 transition-opacity">{car.make} {car.model}</Link>
                  {car.isFormerCar && ' (ehemaliges Auto)'}
                  {car.previousCar && ` (davor — ${car.previousCar})`}
                </div>
                <div className="text-xs opacity-60">
                  {car.ownerCity || 'Мюнхен'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fahrzeugdetails */}
        <div className="section">
          <h2 className="text-sm font-bold mb-2">Über mein Auto</h2>
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
            <div className="flex gap-2">
              {isOwner && (
                <button 
                  onClick={() => setShowLogbook(true)}
                  className="btn-accent flex items-center gap-1 px-2 py-1 text-xs"
                >
                  <Plus size={12} />
                  Neuer Eintrag
                </button>
              )}
              <button 
                onClick={() => setShowLogbook(true)}
                className="btn-primary px-2 py-1 text-xs"
              >
                alle Einträge
              </button>
            </div>
          </div>
          {logbookEntries.length === 0 ? (
            <p className="opacity-70 text-center py-4 text-xs">Noch keine Einträge im Logbuch</p>
          ) : (
            <div className="space-y-2">
              {logbookEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="border-b border-white/10 pb-2 last:border-b-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-accent text-black px-1.5 py-0.5 rounded-full text-xs font-medium">
                        @{entry.author}
                      </div>
                      <span className="text-xs opacity-70">{entry.timestamp}</span>
                      <span className="text-xs opacity-50 bg-white/10 px-1 py-0.5 rounded">
                        {entry.type}
                      </span>
                    </div>
                  </div>
                  <p className="opacity-80 mb-1 text-xs">{entry.text}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLogbookLike(entry.id)}
                      className={`flex items-center gap-1 transition-opacity text-xs ${
                        hasUserLikedLogbookEntry(entry.id, user?.email || '') 
                          ? 'opacity-100 text-accent' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${hasUserLikedLogbookEntry(entry.id, user?.email || '') ? 'fill-current' : ''}`} />
                      <span>{getLogbookEntryLikes(entry.id)}</span>
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

      {/* Logbook Modal */}
      {showLogbook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="section w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="h2">Logbuch</h2>
              <button
                onClick={() => setShowLogbook(false)}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>

            {/* Add Logbook Entry */}
            {isOwner && (
              <div className="mb-6">
                <textarea
                  value={newLogbookEntry}
                  onChange={(e) => setNewLogbookEntry(e.target.value)}
                  placeholder="Neuer Logbuch-Eintrag..."
                  className="form-input mb-3"
                  rows={3}
                />
                <button
                  onClick={handleAddLogbookEntry}
                  className="btn-primary"
                >
                  Eintrag hinzufügen
                </button>
              </div>
            )}

            {/* Logbook Entries List */}
            <div className="space-y-4">
              {logbookEntries.map((entry) => (
                <div key={entry.id} className="border-b border-white/10 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.author}</span>
                      <span className="text-sm opacity-70">{entry.timestamp}</span>
                      <span className="text-xs opacity-50 bg-white/10 px-2 py-1 rounded">
                        {entry.type}
                      </span>
                    </div>
                  </div>
                  <p className="opacity-80 mb-2">{entry.text}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleLogbookLike(entry.id)}
                      className={`flex items-center gap-1 transition-opacity ${
                        hasUserLikedLogbookEntry(entry.id, user?.email || '') 
                          ? 'opacity-100 text-accent' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${hasUserLikedLogbookEntry(entry.id, user?.email || '') ? 'fill-current' : ''}`} />
                      <span>{getLogbookEntryLikes(entry.id)}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="section">
        <CommentsList
          comments={comments}
          onAddComment={handleAddComment}
          onLikeComment={handleLikeComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onAddReply={handleAddReply}
          onLikeReply={handleLikeReply}
          onEditReply={handleEditReply}
          onDeleteReply={handleDeleteReply}
          title="Kommentare"
        />
      </div>

      {/* Edit Car Modal */}
      {showEditModal && car && (
        <EditCarModal
          car={car}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveCar}
        />
      )}

      {/* Image Modal */}
      {showImageModal && car?.images && car.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X size={24} />
            </button>

            {/* Navigation arrows */}
            {car.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  disabled={isTransitioning}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  disabled={isTransitioning}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={car.images[currentImageIndex]}
                alt={car.name || `${car.make} ${car.model}`}
                width={1200}
                height={800}
                className={`max-w-full max-h-full object-contain transition-all duration-300 ${
                  isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
                priority
              />
            </div>

            {/* Image counter */}
            {car.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded">
                {currentImageIndex + 1} / {car.images.length}
              </div>
            )}

            {/* Dots indicator */}
            {car.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                {car.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    disabled={isTransitioning}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
                    } disabled:cursor-not-allowed`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
