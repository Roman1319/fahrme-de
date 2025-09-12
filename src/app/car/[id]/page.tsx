'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, ChevronLeft, ChevronRight, X, Loader2, Plus, Edit } from 'lucide-react';
import { Car, LogbookEntry, Comment, MyCar } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { getCar, getCarPhotos, getCarPhotoUrl, updateCarWithPhotos } from '@/lib/cars';
import { getLogbookEntries, getComments, createComment, togglePostLike, getPostLikes, countPostLikes, hasLikedPost } from '@/lib/logbook';
import { getProfile } from '@/lib/profiles';
import CreatePostModal from '@/components/logbook/CreatePostModal';
import { CarPhotoUploader } from '@/components/CarPhotoUploader';
import EditCarModal from '@/components/EditCarModal';
import FollowButton from '@/components/ui/FollowButton';

export default function CarPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params.id as string;
  const { user } = useAuth();
  
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showLogbook, setShowLogbook] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditCar, setShowEditCar] = useState(false);
  const [isSavingCar, setIsSavingCar] = useState(false);
  const [carStats, setCarStats] = useState({ followers: 0, likes: 0 });
  const [userInteraction, setUserInteraction] = useState<{ isFollowing: boolean; isLiked: boolean } | null>(null);
  const [followStats, setFollowStats] = useState({ followersCount: 0, isLoading: true });
  const [ownerProfile, setOwnerProfile] = useState<{ avatarUrl?: string | null; name?: string } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [entryLikes, setEntryLikes] = useState<Record<string, { count: number; isLiked: boolean }>>({});
  
  // Check if current user is the owner
  const isOwner = car && user && car.owner_id === user.id;

  useEffect(() => {
    loadCar();
    loadComments();
    loadLogbookEntries();
    loadCarStats();
    loadUserInteraction();
    loadOwnerProfile();
    setCurrentImageIndex(0);
  }, [carId, user]);

  useEffect(() => {
    if (car) {
      loadFollowStats();
    }
  }, [car]);

  useEffect(() => {
    if (car) {
      loadPhotos();
    }
  }, [car]);

  function loadCar() {
    console.log('[CarPage] Loading car with ID:', carId);
    setIsLoading(true);
    setError(null);
    getCar(carId)
      .then(carData => {
        console.log('[CarPage] Car data received:', carData);
        if (carData) {
          setCar(carData);
        } else {
          console.log('[CarPage] Car not found');
          setError('Auto nicht gefunden');
        }
      })
      .catch(err => {
        console.error('[CarPage] Error loading car:', err);
        setError('Fehler beim Laden des Autos');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function loadPhotos() {
    if (!car) return;
    
    setPhotosLoading(true);
    getCarPhotos(car.id)
      .then(carPhotos => {
        const photoUrls = carPhotos.map(photo => getCarPhotoUrl(photo.storage_path));
        setPhotos(photoUrls);
      })
      .catch(error => {
        console.error('Error loading car photos:', error);
      })
      .finally(() => {
        setPhotosLoading(false);
      });
  }

  function loadComments() {
    getComments(carId)
      .then(commentsData => {
        setComments(commentsData);
      })
      .catch(error => {
        console.error('Error loading comments:', error);
      });
  }

  function loadLogbookEntries() {
    getLogbookEntries(carId)
      .then(entries => {
        setLogbookEntries(entries);
        
        // Load likes for each entry (temporarily disabled)
        if (user) {
          const likesMap: Record<string, { count: number; isLiked: boolean }> = {};
          entries.forEach(entry => {
            likesMap[entry.id] = { count: 0, isLiked: false };
          });
          setEntryLikes(likesMap);
        }
      })
      .catch(error => {
        console.error('Error loading logbook entries:', error);
      });
  }

  function loadCarStats() {
    // Временно отключено из-за проблем с post_likes таблицей
    setCarStats({ followers: 0, likes: 0 });
  }

  function loadFollowStats() {
    if (!car) return;
    
    setFollowStats(prev => ({ ...prev, isLoading: true }));
    
    fetch(`/api/cars/${car.id}/stats`)
      .then(response => response.json())
      .then(data => {
        setFollowStats({
          followersCount: data.followersCount || 0,
          isLoading: false
        });
      })
      .catch(error => {
        console.error('Error loading follow stats:', error);
        setFollowStats(prev => ({ ...prev, isLoading: false }));
      });
  }

  function loadUserInteraction() {
    if (!user) return;
    
    // Временно отключено из-за проблем с post_likes таблицей
    setUserInteraction({ isFollowing: false, isLiked: false });
  }

  function loadOwnerProfile() {
    if (!car) return;
    
    getProfile(car.owner_id)
      .then(profile => {
        if (profile) {
          setOwnerProfile({
            avatarUrl: profile.avatar_url,
            name: profile.name || undefined
          });
        }
      })
      .catch(error => {
        console.error('Error loading owner profile:', error);
      });
  }

  const handleAddComment = (text: string) => {
    if (!user || !car) return;

    createComment({
      entry_id: carId,
      text: text
    }, user.id)
      .then(() => {
        loadComments();
        setNewComment('');
      })
      .catch(error => {
        console.error('Error adding comment:', error);
        alert('Fehler beim Hinzufügen des Kommentars');
      });
  };

  const handleToggleLike = () => {
    if (!user || !car) return;
    
    // Временно отключено из-за проблем с post_likes таблицей
    console.log('Like functionality temporarily disabled');
  };

  const handlePostCreated = (entryId: string) => {
    // Reload logbook entries
    loadLogbookEntries();
    // Close modals
    setShowCreatePost(false);
    setShowLogbook(false);
    // Navigate to the new post
    router.push(`/post/${entryId}`);
  };

  const handleEditCar = () => {
    setShowEditCar(true);
  };

  const handleSaveCar = (updatedCar: Partial<MyCar>) => {
    if (!car || !user) return;
    
    setIsSavingCar(true);
    
    // Prepare car data for API
    const carUpdateData = {
      id: car.id,
      brand: updatedCar.make,
      model: updatedCar.model,
      year: updatedCar.year,
      name: updatedCar.name,
      color: updatedCar.color,
      power: updatedCar.power,
      engine: updatedCar.engine,
      volume: updatedCar.volume,
      gearbox: updatedCar.gearbox,
      drive: updatedCar.drive,
      description: updatedCar.description,
      story: updatedCar.story
    };

    // Get new images (base64 strings) and deleted images
    const newImages = (updatedCar as MyCar & { images?: string[] }).images || [];
    const deletedImages = (updatedCar as MyCar & { deletedImages?: string[] }).deletedImages || [];
    
    // Update car with photos
    updateCarWithPhotos(carUpdateData, newImages, deletedImages, user.id)
      .then(() => {
      
      // Show success message
      const deletedCount = deletedImages.length;
      const newCount = newImages.filter(img => img.startsWith('data:image/')).length;
      
      let message = 'Автомобиль успешно обновлен!';
      if (deletedCount > 0) message += `\nУдалено фото: ${deletedCount}`;
      if (newCount > 0) message += `\nДобавлено фото: ${newCount}`;
      
      alert(message);
      setShowEditCar(false);
      
      // Update local state immediately for better UX
      if (car) {
        // Update car data locally
        setCar(prev => prev ? {
          ...prev,
          name: carUpdateData.name || prev.name,
          brand: carUpdateData.brand || prev.brand,
          model: carUpdateData.model || prev.model,
          year: carUpdateData.year || prev.year,
          color: carUpdateData.color || prev.color,
          power: carUpdateData.power || prev.power,
          engine: carUpdateData.engine || prev.engine,
          volume: carUpdateData.volume || prev.volume,
          gearbox: carUpdateData.gearbox || prev.gearbox,
          drive: carUpdateData.drive || prev.drive,
          description: carUpdateData.description || prev.description,
          story: carUpdateData.story || prev.story
        } : null);
      }
      
        // Reload photos in background (less critical)
        loadPhotos();
      })
      .catch(error => {
        console.error('Error saving car:', error);
        alert('Ошибка при сохранении автомобиля: ' + (error as Error).message);
      })
      .finally(() => {
        setIsSavingCar(false);
      });
  };

  const nextImage = () => {
    if (photos.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % photos.length);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    }
  };

  const prevImage = () => {
    if (photos.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    }
  };

  const goToImage = (index: number) => {
    if (photos.length > 0 && !isTransitioning && index !== currentImageIndex) {
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

    if (diffInSeconds < 60) return 'gerade eben';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} Min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} Std`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} Tag`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} Mon`;
    return `${Math.floor(diffInSeconds / 31536000)} Jahr`;
  };

  if (isLoading) {
    return (
      <main className="pb-12">
        <section className="space-y-4">
          <div className="section text-center py-16">
            <Loader2 size={32} className="mx-auto mb-4 animate-spin" />
            <div className="text-xl">Lade...</div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="pb-12">
        <section className="space-y-4">
          <div className="section text-center py-16">
            <div className="text-xl">{error || 'Auto nicht gefunden'}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-[#6A3FFB] hover:bg-[#3F297A] text-white px-4 py-2 rounded-full"
            >
              Erneut versuchen
            </button>
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
          <span>Marken / {car.brand} / {car.model}</span>
        </nav>

        {/* Header */}
        <div className="section">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-lg font-extrabold truncate">{car.name || `${car.brand} ${car.model}`}</h1>
              <p className="opacity-70 text-xs mt-1 truncate">
                {car.year} • {car.brand} {car.model}
                {car.color && ` • ${car.color}`}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-1.5 flex-shrink-0 ml-2">
                <button 
                  onClick={() => setShowComments(true)}
                  className="btn-accent px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Plus size={12} />
                  <span className="hidden sm:inline">In Logbuch schreiben</span>
                  <span className="sm:hidden">Logbuch</span>
                </button>
                <button 
                  onClick={handleEditCar}
                  className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Edit size={12} />
                  <span className="hidden sm:inline">Bearbeiten</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          <div className="img-rounded aspect-[4/3] md:aspect-[16/10] relative overflow-hidden mb-2 group max-h-96 md:max-h-[500px]">
            {photosLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 size={32} className="animate-spin opacity-50" />
              </div>
            ) : photos.length > 0 ? (
              <>
                <div className="relative w-full h-full">
                  <Image
                    src={photos[currentImageIndex]}
                    alt={car.name || `${car.brand} ${car.model}`}
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
                {photos.length > 1 && (
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
                {photos.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {currentImageIndex + 1} / {photos.length}
                  </div>
                )}
                
                {/* Dots indicator */}
                {photos.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, index) => (
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
              <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Image
                  src="/hero-car.jpg"
                  alt="Placeholder"
                  width={800}
                  height={600}
                  className="object-cover w-full h-full opacity-80"
                  priority
                />
              </div>
            )}
          </div>


          {/* Action Buttons */}
          {!isOwner && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              <FollowButton 
                carId={car.id}
                size="sm"
                showCount={true}
              />
              <button 
                onClick={handleToggleLike}
                className={`px-2 py-1 text-xs ${userInteraction?.isLiked ? 'btn-accent' : 'btn-secondary'}`}
              >
                {userInteraction?.isLiked ? '✓ Geliked' : 'Auto liken'}
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
              <div className="text-base font-bold text-accent">
                {followStats.isLoading ? '...' : followStats.followersCount}
              </div>
              <div className="text-xs opacity-70">Abonnenten</div>
              <div className="text-xs opacity-50">für das Auto</div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white/5 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  {ownerProfile?.avatarUrl ? (
                    <img 
                      src={ownerProfile.avatarUrl} 
                      alt={ownerProfile.name || 'Owner'} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white/70 font-semibold">
                      {(ownerProfile?.name || car.owner_id || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-bold truncate">
                    {isOwner ? 'Du' : (ownerProfile?.name || car.owner_id || 'Benutzer')}
                  </div>
                </div>
                <div className="text-xs opacity-80 mb-1 truncate">
                  Ich fahre <Link href={`/car/${car.id}`} className="font-semibold hover:opacity-100 transition-opacity">{car.brand} {car.model}</Link>
                  {car.is_former && ' (ehemaliges Auto)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Car Details */}
        <div className="section">
          <h2 className="text-sm font-bold mb-2">Über mein Auto</h2>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-accent">•</span>
              <span className="opacity-80">{car.year} • {car.brand} {car.model}</span>
            </div>
            {car.engine && (
              <div className="flex items-center gap-2">
                <span className="text-accent">•</span>
                <span className="opacity-80">Motor: {car.engine}</span>
              </div>
            )}
            {car.volume && (
              <div className="flex items-center gap-2">
                <span className="text-accent">•</span>
                <span className="opacity-80">Hubraum: {car.volume}</span>
              </div>
            )}
            {car.gearbox && (
              <div className="flex items-center gap-2">
                <span className="text-accent">•</span>
                <span className="opacity-80">Getriebe: {car.gearbox}</span>
              </div>
            )}
            {car.drive && (
              <div className="flex items-center gap-2">
                <span className="text-accent">•</span>
                <span className="opacity-80">Antrieb: {car.drive}</span>
              </div>
            )}
            {car.power && car.power > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-accent">•</span>
                <span className="opacity-80">Leistung: {car.power} PS</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {(car.description || car.story) && (
          <div className="section">
            <h2 className="text-sm font-bold mb-2">Beschreibung</h2>
            <p className="opacity-80 text-xs leading-relaxed break-words whitespace-pre-wrap">{car.description || car.story}</p>
          </div>
        )}

        {/* Logbook */}
        <div className="section">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold">Logbuch</h2>
            <div className="flex gap-1.5">
              {isOwner && (
                <button 
                  onClick={() => {
                    window.location.href = `/cars/${car.brand.toLowerCase()}/${car.model.toLowerCase()}/${car.id}/logbook/new`;
                  }}
                  className="btn-accent px-1.5 py-1 text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">Neuer Post</span>
                  <span className="sm:hidden">Neu</span>
                </button>
              )}
              <button 
                onClick={() => setShowLogbook(true)}
                className="btn-secondary px-1.5 py-1 text-xs"
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
              {isOwner ? (
                <button 
                  onClick={() => setShowLogbook(true)}
                  className="text-xs px-3 py-1 bg-[#6A3FFB] hover:bg-[#3F297A] text-white rounded-full"
                >
                  Ersten Eintrag erstellen
                </button>
              ) : (
                <p className="text-xs opacity-50">Melden Sie sich an, um Einträge zu erstellen</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {logbookEntries.slice(0, 3).map((entry) => (
                <Link 
                  key={entry.id} 
                  href={`/post/${entry.id}`}
                  className="block bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white/90 truncate">
                        {entry.title}
                      </h3>
                      
                      <div className="text-xs text-white/60 mb-2">
                        {formatTimeAgo(entry.publish_date)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            <span>{entryLikes[entry.id]?.count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
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
                      <span className="font-medium text-sm">User</span>
                      <span className="text-xs opacity-70">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                  </div>
                  <p className="opacity-80 mb-2 text-sm">{comment.text}</p>
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
            {isOwner ? (
              <div className="mb-4">
                <button 
                  onClick={() => setShowCreatePost(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#6A3FFB] hover:bg-[#3F297A] text-white rounded-lg"
                >
                  <Plus size={16} />
                  Neuen Eintrag erstellen
                </button>
              </div>
            ) : user ? (
              <div className="mb-4 text-center">
                <p className="text-sm opacity-70 mb-2">Sie können nur Einträge für Ihre eigenen Autos erstellen</p>
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
              {logbookEntries.map((entry) => (
                <Link 
                  key={entry.id} 
                  href={`/post/${entry.id}`}
                  className="block bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white/90">
                        {entry.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-white/70">User</span>
                        <span className="text-xs text-white/50">{formatTimeAgo(entry.publish_date)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{entryLikes[entry.id]?.count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && photos.length > 0 && (
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
            {photos.length > 1 && (
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
                src={photos[currentImageIndex]}
                alt={car.name || `${car.brand} ${car.model}`}
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
            {photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1} / {photos.length}
              </div>
            )}

            {/* Dots indicator */}
            {photos.length > 1 && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, index) => (
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

      {/* Create Post Modal */}
      {showCreatePost && user && car && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          carId={car.id}
          authorId={user.id}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Edit Car Modal */}
      {showEditCar && car && (
        <EditCarModal
          car={{
            id: car.id,
            name: car.name || '',
            make: car.brand || '',
            model: car.model || '',
            year: car.year || 0,
            color: car.color || '',
            power: car.power || 0,
            engine: car.engine || '',
            volume: car.volume || '',
            gearbox: car.gearbox || '',
            drive: car.drive || '',
            description: car.description || car.story || '',
            story: car.story || '',
            images: photos || [],
            isMainVehicle: car.is_main_vehicle || false,
            isFormerCar: car.is_former || false,
            addedDate: car.created_at || new Date().toISOString(),
            ownerId: car.owner_id || ''
          }}
          isOpen={showEditCar}
          onClose={() => setShowEditCar(false)}
          onSave={handleSaveCar}
          isSaving={isSavingCar}
        />
      )}
    </main>
  );
}