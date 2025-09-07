'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Eye, Star, Edit, MoreVertical, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MyCar, Comment, LogbookEntry } from '@/lib/types';
import EditCarModal from '@/components/EditCarModal';
import { useAuth } from '@/components/AuthProvider';
import AvatarButton from '@/components/ui/AvatarButton';
import AvatarTooltip from '@/components/ui/AvatarTooltip';
import { readProfile, readProfileByEmail } from '@/lib/profile';
import { fixCarOwnershipOnce } from '@/lib/migrations';
import { isCarOwnerByCar } from '@/lib/ownership';
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
  hasUserLikedLogbookEntry,
  deleteLogbookEntry
} from '@/lib/interactions';
import CommentsList from '@/components/ui/CommentsList';
import LogbookCreateButton from '@/components/LogbookCreateButton';
import { STORAGE_KEYS } from '@/lib/keys';

export default function CarPage() {
  const params = useParams();
  const carId = params.id as string;
  const { user } = useAuth();
  
  const [car, setCar] = useState<MyCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
  const [newComment, setNewComment] = useState('');
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
  const isOwner = car && user && isCarOwnerByCar(car, user.id, user.email);
  

  useEffect(() => {
    loadCar();
    loadComments();
    loadLogbookEntries();
    loadCarStats();
    loadUserInteraction();
    loadOwnerProfile();
    setCurrentImageIndex(0); // Сбрасываем индекс изображения при загрузке нового автомобиля
    
    // Выполняем миграцию владения автомобилями (только один раз)
    if (user?.id) {
      fixCarOwnershipOnce(user.id, user.email);
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
    const savedCars = localStorage.getItem(STORAGE_KEYS.MY_CARS_KEY);
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
        
        // Добавляем тестовое изображение, если у автомобиля нет изображений
        if (foundCar && (!foundCar.images || foundCar.images.length === 0)) {
          foundCar.images = ['/bmw-g20.jpg'];
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
    const entries = getLogbookEntries(carId);
    // Sort: pinned first, then by publishedAt descending
    const sortedEntries = entries.sort((a, b) => {
      // First sort by pinned status
      if (a.pinOnCar && !b.pinOnCar) return -1;
      if (!a.pinOnCar && b.pinOnCar) return 1;
      
      // Then by publishedAt (newest first)
      const aDate = a.publishedAt || a.createdAt || a.timestamp || '';
      const bDate = b.publishedAt || b.createdAt || b.timestamp || '';
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
    setLogbookEntries(sortedEntries);
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
    
    toggleLogbookEntryLike(entryId, user.id, user.email);
    loadLogbookEntries();
  };

  const handleDeleteLogbookEntry = (entryId: string) => {
    if (!user) return;
    
    if (confirm('Möchten Sie diesen Logbuch-Eintrag wirklich löschen?')) {
      const success = deleteLogbookEntry(carId, entryId);
      if (success) {
        loadLogbookEntries();
      }
    }
  };



  const handleSaveCar = (updatedCar: MyCar) => {
    const savedCars = localStorage.getItem(STORAGE_KEYS.MY_CARS_KEY);
    if (savedCars) {
      try {
        const cars: MyCar[] = JSON.parse(savedCars);
        const updatedCars = cars.map(c => c.id === carId ? updatedCar : c);
        localStorage.setItem(STORAGE_KEYS.MY_CARS_KEY, JSON.stringify(updatedCars));
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

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const entryTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - entryTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} дн`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} мес`;
    return `${Math.floor(diffInSeconds / 31536000)} г`;
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
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-lg font-extrabold truncate">{car.name || `${car.make} ${car.model}`}</h1>
              <p className="opacity-70 text-xs mt-1 truncate">
                {car.year} • {car.make} {car.model}
                {car.color && ` • ${car.color}`}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="btn-primary flex items-center gap-1 px-1.5 py-1 text-xs"
                >
                  <Edit size={10} />
                  <span className="hidden sm:inline">Bearbeiten</span>
                </button>
                <button 
                  onClick={() => setShowComments(true)}
                  className="btn-accent px-1.5 py-1 text-xs"
                >
                  <span className="hidden sm:inline">In Logbuch schreiben</span>
                  <span className="sm:hidden">Logbuch</span>
                </button>
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          <div className="img-rounded aspect-[4/3] md:aspect-[16/10] relative overflow-hidden mb-2 group max-h-96 md:max-h-[500px]">
            {car.images && car.images.length > 0 ? (
              <>
                <div className="relative w-full h-full">
                  <Image
                    src={car.images[currentImageIndex]}
                    alt={car.name || `${car.make} ${car.model}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`object-cover cursor-pointer transition-all duration-300 ${
                      isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                    }`}
                    priority
                    onClick={openImageModal}
                    quality={75}
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
              <div className="w-full h-full bg-fallback flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="opacity-60 text-sm font-medium">Kein Foto verfügbar</span>
                <span className="opacity-40 text-xs mt-1">Fügen Sie ein Bild hinzu</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isOwner && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              <button 
                onClick={handleToggleFollow}
                className={`px-2 py-1 text-xs ${userInteraction?.isFollowing ? 'btn-accent' : 'btn-secondary'}`}
              >
                {userInteraction?.isFollowing ? '✓ Abonniert' : 'Auto abonnieren'}
              </button>
            </div>
          )}

          {/* Car Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-base font-bold text-accent">0</div>
              <div className="text-xs opacity-70">Auto-Bewertung</div>
              <div className="text-xs opacity-50">0-100</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-base font-bold text-primary">{logbookEntries.length}</div>
              <div className="text-xs opacity-70">Posts</div>
              <div className="text-xs opacity-50">insgesamt</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-left mb-1">
                <div className="text-xs opacity-70">Reaktionen</div>
              </div>
              <div className="flex items-center justify-center gap-1 mb-1">
                {isOwner ? (
                  <div className="flex items-center gap-1 text-white opacity-70">
                    <Heart 
                      size={14} 
                      className="fill-current text-red-500" 
                    />
                    <span className="text-sm font-bold">{carStats.likes}</span>
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
                      size={14} 
                      className={`${userInteraction?.isLiked ? 'fill-current' : ''}`} 
                    />
                    <span className="text-sm font-bold">{carStats.likes}</span>
                  </button>
                )}
                <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={14} className="text-purple-400" />
                  <span className="text-sm font-bold">{comments.length}</span>
                </div>
              </div>
              <div className="text-xs opacity-50">insgesamt</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-base font-bold text-accent">{carStats.followers}</div>
              <div className="text-xs opacity-70">Abonnenten</div>
              <div className="text-xs opacity-50">für das Auto</div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white/5 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <AvatarTooltip
                  src={ownerProfile?.avatarUrl || null}
                  name={ownerProfile?.displayName || car.ownerId || 'Benutzer'}
                  size={40}
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
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-bold truncate">
                    {isOwner ? 'Du' : (car.ownerId || 'Benutzer')}
                  </div>
                  {car.ownerAge && (
                    <div className="text-xs opacity-70 flex-shrink-0">
                      {car.ownerAge} Jahre
                    </div>
                  )}
                </div>
                <div className="text-xs opacity-80 mb-1 truncate">
                  Ich fahre <Link href={`/car/${car.id}`} className="font-semibold hover:opacity-100 transition-opacity">{car.make} {car.model}</Link>
                  {car.isFormerCar && ' (ehemaliges Auto)'}
                  {car.previousCar && ` (davor — ${car.previousCar})`}
                </div>
                <div className="text-xs opacity-60 truncate">
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
                <span className="opacity-80">Motor {car.engine}, {car.power} PS</span>
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
            <p className="opacity-80 text-xs leading-relaxed break-words whitespace-pre-wrap">{car.description}</p>
          </div>
        )}

        {/* Story */}
        {car.story && (
          <div className="section">
            <h2 className="text-sm font-bold mb-2">Geschichte</h2>
            <p className="opacity-80 text-xs leading-relaxed break-words whitespace-pre-wrap">{car.story}</p>
          </div>
        )}

        {/* Logbook */}
        <div className="section">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold">Logbuch</h2>
            <div className="flex gap-1.5">
              <LogbookCreateButton car={car} />
              <button 
                onClick={() => setShowLogbook(true)}
                className="btn-primary px-1.5 py-1 text-xs"
              >
                <span className="hidden sm:inline">alle Einträge</span>
                <span className="sm:hidden">alle</span>
              </button>
            </div>
          </div>
          {logbookEntries.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="opacity-70 text-sm mb-2">Noch keine Einträge im Logbuch</p>
              {user ? (
                <LogbookCreateButton car={car} className="text-xs px-3 py-1" showText={true} />
              ) : (
                <p className="text-xs opacity-50">Melden Sie sich an, um Einträge zu erstellen</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {logbookEntries.slice(0, 3).map((entry) => {
                // Use new data model fields
                const title = entry.title || entry.text?.split('\n')[0]?.replace(/^\*\*(.*)\*\*$/, '$1')?.replace(/^#+\s*/, '') || 'Untitled';
                const firstImage = entry.photos?.[0] || entry.images?.[0] || 
                  (entry.text?.match(/!\[([^\]]*)\]\(([^)]+)\)/)?.[2]);
                const topic = entry.topic || entry.type || 'general';
                const timestamp = entry.publishedAt || entry.createdAt || entry.timestamp || '';
                
                return (
                  <div key={entry.id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex gap-3">
                      {/* Превью изображения */}
                      <div className="flex-shrink-0">
                        {firstImage ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img 
                              src={firstImage} 
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Контент */}
                      <div className="flex-1 min-w-0">
                        {/* Заголовок и pinned badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white/90 truncate">
                            {title}
                          </h3>
                          {entry.pinOnCar && (
                            <span className="text-xs bg-accent text-black px-2 py-1 rounded-full font-medium">
                              Angepinnt
                            </span>
                          )}
                        </div>
                        
                        {/* Категория */}
                        <div className="text-xs text-white/60 mb-2">
                          {topic === 'maintenance' ? 'Wartung' :
                           topic === 'repair' ? 'Reparatur' :
                           topic === 'tuning' ? 'Tuning' :
                           topic === 'trip' ? 'Fahrt' :
                           topic === 'event' ? 'Event' :
                           topic === 'general' ? 'Allgemein' :
                           topic}
                        </div>
                        
                        {/* Статистика и действия */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-white/60">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              <span>{getLogbookEntryLikes(entry.id)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>0</span>
                            </div>
                            <span className="text-white/50">
                              {formatTimeAgo(timestamp)}
                            </span>
                          </div>
                          
                          {/* Кнопка удаления (только для автора) */}
                          {user && entry.userId === user.id && (
                            <button
                              onClick={() => handleDeleteLogbookEntry(entry.id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              title="Eintrag löschen"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="section w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Kommentare</h2>
              <button
                onClick={() => setShowComments(false)}
                className="opacity-70 hover:opacity-100 transition-opacity text-xl"
              >
                ✕
              </button>
            </div>

            {/* Add Comment */}
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ihr Kommentar..."
                className="form-input mb-2 text-sm"
                rows={2}
              />
              <button
                onClick={() => {
                  handleAddComment(newComment);
                  setNewComment('');
                }}
                className="btn-primary text-sm px-3 py-1"
              >
                Senden
              </button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-white/10 pb-3 last:border-b-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs opacity-70">{comment.timestamp}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                    >
                      Löschen
                    </button>
                  </div>
                  <p className="opacity-80 mb-2 text-sm">{comment.text}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity text-sm"
                    >
                      <Heart className="w-3 h-3" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="section w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Logbuch</h2>
              <button
                onClick={() => setShowLogbook(false)}
                className="opacity-70 hover:opacity-100 transition-opacity text-xl"
              >
                ✕
              </button>
            </div>

            {/* Add Logbook Entry */}
            {user ? (
              <div className="mb-4">
                <LogbookCreateButton 
                  car={car} 
                  className="w-full flex items-center justify-center gap-2 py-3"
                  showText={true}
                />
              </div>
            ) : (
              <div className="mb-4 text-center">
                <p className="text-sm opacity-70 mb-2">Melden Sie sich an, um Einträge zu erstellen</p>
                <button
                  onClick={() => {
                    setShowLogbook(false);
                    window.location.href = '/login';
                  }}
                  className="btn-secondary px-4 py-2"
                >
                  Anmelden
                </button>
              </div>
            )}

            {/* Logbook Entries List */}
            <div className="space-y-3">
              {logbookEntries.map((entry) => {
                // Use new data model fields
                const title = entry.title || entry.text?.split('\n')[0]?.replace(/^\*\*(.*)\*\*$/, '$1')?.replace(/^#+\s*/, '') || 'Untitled';
                const firstImage = entry.photos?.[0] || entry.images?.[0] || 
                  (entry.text?.match(/!\[([^\]]*)\]\(([^)]+)\)/)?.[2]);
                const topic = entry.topic || entry.type || 'general';
                const timestamp = entry.publishedAt || entry.createdAt || entry.timestamp || '';
                const author = entry.author || 'Unknown';
                
                return (
                  <Link 
                    key={entry.id} 
                    href={`/logbuch/${entry.id}`}
                    className="block bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex gap-3">
                      {/* Превью изображения */}
                      <div className="flex-shrink-0">
                        {firstImage ? (
                          <div className="w-20 h-20 rounded-lg overflow-hidden">
                            <img 
                              src={firstImage} 
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Контент */}
                      <div className="flex-1 min-w-0">
                        {/* Заголовок и pinned badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-white/90">
                            {title}
                          </h3>
                          {entry.pinOnCar && (
                            <span className="text-xs bg-accent text-black px-2 py-1 rounded-full font-medium">
                              Angepinnt
                            </span>
                          )}
                        </div>
                        
                        {/* Автор и время */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-white/70">@{author}</span>
                          <span className="text-xs text-white/50">{formatTimeAgo(timestamp)}</span>
                          <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                            {topic === 'maintenance' ? 'Wartung' :
                             topic === 'repair' ? 'Reparatur' :
                             topic === 'tuning' ? 'Tuning' :
                             topic === 'trip' ? 'Fahrt' :
                             topic === 'event' ? 'Event' :
                             topic === 'general' ? 'Allgemein' :
                             topic}
                          </span>
                        </div>
                        
                        {/* Статистика и действия */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-white/60">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleLogbookLike(entry.id);
                              }}
                              className={`flex items-center gap-1 transition-opacity ${
                                hasUserLikedLogbookEntry(entry.id, user?.id || '') 
                                  ? 'opacity-100 text-accent' 
                                  : 'opacity-70 hover:opacity-100'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${hasUserLikedLogbookEntry(entry.id, user?.id || '') ? 'fill-current' : ''}`} />
                              <span>{getLogbookEntryLikes(entry.id)}</span>
                            </button>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>0</span>
                            </div>
                          </div>
                          
                          {/* Кнопка удаления (только для автора) */}
                          {user && entry.userId === user.id && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteLogbookEntry(entry.id);
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              title="Eintrag löschen"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2"
          onClick={closeImageModal}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>

            {/* Navigation arrows */}
            {car.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  disabled={isTransitioning}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  disabled={isTransitioning}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={car.images[currentImageIndex]}
                alt={car.name || `${car.make} ${car.model}`}
                width={800}
                height={600}
                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 70vw, 60vw"
                className={`max-w-full max-h-full object-contain transition-all duration-300 ${
                  isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
                priority
                quality={85}
              />
            </div>

            {/* Image counter */}
            {car.images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1} / {car.images.length}
              </div>
            )}

            {/* Dots indicator */}
            {car.images.length > 1 && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
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
          </div>
        </div>
      )}
    </main>
  );
}
