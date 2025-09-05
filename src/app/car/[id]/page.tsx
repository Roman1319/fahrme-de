'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Eye, Star, Edit, MoreVertical, Plus, Share2 } from 'lucide-react';
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
  addLogbookEntry,
  getLogbookEntries,
  toggleLogbookEntryLike,
  getLogbookEntryLikes,
  hasUserLikedLogbookEntry
} from '@/lib/interactions';

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
  const [newLogbookEntry, setNewLogbookEntry] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showLogbook, setShowLogbook] = useState(false);
  const [carStats, setCarStats] = useState({ followers: 0, likes: 0 });
  const [userInteraction, setUserInteraction] = useState<{ isFollowing: boolean; isLiked: boolean } | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<{ avatarUrl?: string | null; displayName?: string } | null>(null);
  const [commentProfiles, setCommentProfiles] = useState<Record<string, { avatarUrl?: string | null; displayName?: string }>>({});
  
  // Проверяем, является ли текущий пользователь владельцем автомобиля
  const isOwner = car && user && isCarOwner(car, user.email);
  

  useEffect(() => {
    loadCar();
    loadComments();
    loadLogbookEntries();
    loadCarStats();
    loadUserInteraction();
    loadOwnerProfile();
    
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

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;

    addComment(carId, newComment, user.name, user.email);
    loadComments();
    setNewComment('');
  };

  const handleAddLogbookEntry = () => {
    if (!newLogbookEntry.trim() || !user) return;

    addLogbookEntry(carId, newLogbookEntry, user.name, user.email, 'general');
    loadLogbookEntries();
    setNewLogbookEntry('');
  };

  const handleToggleFollow = () => {
    if (!user) return;
    
    toggleCarFollow(carId, user.email);
    loadUserInteraction();
    loadCarStats();
  };

  const handleToggleLike = () => {
    if (!user) return;
    
    toggleCarLike(carId, user.email);
    loadUserInteraction();
    loadCarStats();
  };

  const handleToggleLogbookLike = (entryId: string) => {
    if (!user) return;
    
    toggleLogbookEntryLike(entryId, user.email);
    loadLogbookEntries();
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

  const handleSubscribeToUser = (userEmail: string) => {
    // TODO: Implement subscribe functionality
    console.log('Subscribe to user:', userEmail);
    alert('Функция подписки будет реализована позже');
  };

  const handleMessageUser = (userEmail: string) => {
    // TODO: Implement message functionality
    console.log('Message user:', userEmail);
    alert('Функция отправки сообщений будет реализована позже');
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
          <div className="img-rounded aspect-[16/10] relative overflow-hidden mb-3">
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
          <div className="flex gap-1.5 flex-wrap mb-3">
            <button 
              onClick={handleToggleFollow}
              className={`px-2 py-1 text-xs ${userInteraction?.isFollowing ? 'btn-accent' : 'btn-secondary'}`}
            >
              {userInteraction?.isFollowing ? '✓ Abonniert' : 'Auto abonnieren'}
            </button>
            <button 
              onClick={handleToggleLike}
              className={`px-2 py-1 text-xs flex items-center gap-1 ${userInteraction?.isLiked ? 'btn-accent' : 'btn-secondary'}`}
            >
              <Heart size={12} className={userInteraction?.isLiked ? 'fill-current' : ''} />
              {carStats.likes} Likes
            </button>
            <button className="btn-secondary px-2 py-1 text-xs">
              {car.make} abonnieren
            </button>
          </div>

          {/* Car Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-accent">0</div>
              <div className="text-xs opacity-70">Рейтинг авто</div>
              <div className="text-xs opacity-50">0-100</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-primary">{logbookEntries.length}</div>
              <div className="text-xs opacity-70">Посты</div>
              <div className="text-xs opacity-50">всего</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-accent flex items-center justify-center gap-1">
                <Heart size={14} className="fill-current" />
                <span>{carStats.likes}</span>
                <span className="text-pink-400">•</span>
                <span className="text-purple-400">•</span>
                <span>{comments.length}</span>
              </div>
              <div className="text-xs opacity-70">Реакции</div>
              <div className="text-xs opacity-50">суммарно</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-accent">{carStats.followers}</div>
              <div className="text-xs opacity-70">Подписчики</div>
              <div className="text-xs opacity-50">на машину</div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <AvatarTooltip
                  src={ownerProfile?.avatarUrl || null}
                  name={ownerProfile?.displayName || car.ownerId || 'Пользователь'}
                  size={48}
                  userInfo={{
                    displayName: ownerProfile?.displayName || car.ownerId || 'Пользователь',
                    fullName: car.ownerId || 'Пользователь',
                    city: car.ownerCity || 'Мюнхен',
                    about: `Владелец ${car.make} ${car.model}`
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
                    {isOwner ? 'Du' : (car.ownerId || 'Пользователь')}
                  </div>
                  {car.ownerAge && (
                    <div className="text-xs opacity-70">
                      {car.ownerAge} года
                    </div>
                  )}
                </div>
                <div className="text-sm opacity-80 mb-1">
                  Я езжу на <Link href={`/car/${car.id}`} className="font-semibold hover:opacity-100 transition-opacity">{car.make} {car.model}</Link>
                  {car.isFormerCar && ' (бывшая машина)'}
                  {car.previousCar && ` (до этого — ${car.previousCar})`}
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
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold">Комментарии</h2>
          <span className="text-xs opacity-70">{comments.length} комментариев</span>
        </div>
        
        {/* Add Comment Form */}
        {user && (
          <div className="mb-4">
            <div className="flex gap-2">
              <AvatarTooltip
                src={ownerProfile?.avatarUrl || null}
                name={user.email || 'User'}
                size={32}
                userInfo={{
                  displayName: ownerProfile?.displayName || user.name || user.email || 'User',
                  fullName: user.name || user.email || 'User',
                  city: ownerProfile?.city || 'Мюнхен',
                  about: 'Вы'
                }}
                showActions={false}
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Напишите комментарий об этом автомобиле..."
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm resize-none focus:outline-none focus:border-accent transition-colors"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="btn-accent px-4 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-6 text-sm opacity-70">
              Пока нет комментариев. Будьте первым!
            </div>
          ) : (
            comments.map((comment) => {
              const authorProfile = commentProfiles[comment.authorEmail];
              return (
                <div key={comment.id} className="flex gap-3">
                  <AvatarTooltip
                    src={authorProfile?.avatarUrl || null}
                    name={authorProfile?.displayName || comment.author}
                    size={32}
                    userInfo={{
                      displayName: authorProfile?.displayName || comment.author,
                      fullName: comment.author,
                      city: 'Мюнхен', // TODO: Get from profile
                      about: `Автор комментария`
                    }}
                    onSubscribe={() => handleSubscribeToUser(comment.authorEmail)}
                    onMessage={() => handleMessageUser(comment.authorEmail)}
                    showActions={comment.authorEmail !== user?.email}
                  />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{authorProfile?.displayName || comment.author}</span>
                    <span className="text-xs opacity-60">
                      {new Date(comment.timestamp).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm opacity-80 leading-relaxed">{comment.text}</p>
                </div>
              </div>
              );
            })
          )}
        </div>
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
    </main>
  );
}
