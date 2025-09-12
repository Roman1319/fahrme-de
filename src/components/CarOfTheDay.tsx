'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trophy, Clock, Users, Loader2, CheckCircle } from 'lucide-react';
import { useCOTD } from '@/hooks/useCOTD';
import { useAuth } from '@/components/AuthProvider';

export default function CarOfTheDay() {
  const { user } = useAuth();
  const { 
    candidates, 
    myVote, 
    yesterdayWinner, 
    hasVoted, 
    isVotingOpen, 
    isLoading, 
    error, 
    voteForCar 
  } = useCOTD();

  const [votingCarId, setVotingCarId] = useState<string | null>(null);

  const handleVote = async (carId: string) => {
    if (!user) {
      // Перенаправить на страницу входа
      window.location.href = '/login';
      return;
    }

    if (hasVoted || !isVotingOpen) {
      return;
    }

    setVotingCarId(carId);
    const result = await voteForCar(carId);
    setVotingCarId(null);

    if (!result.success) {
      alert(`Ошибка голосования: ${result.error}`);
    }
  };

  const getCarPhotoUrl = (photoPath: string | null) => {
    if (!photoPath) return '/placeholder-car.jpg';
    // Здесь должна быть логика получения URL из Supabase Storage
    return photoPath;
  };

  if (isLoading) {
    return (
      <div className="section">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={32} className="animate-spin opacity-50" />
          <span className="ml-2 opacity-70">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Ошибка загрузки</div>
          <div className="text-sm opacity-70">{error}</div>
        </div>
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="section">
        <div className="text-center py-8">
          <Trophy size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-bold mb-2">Машина дня</h2>
          <p className="text-sm opacity-70">Сегодня нет кандидатов для голосования</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          <h2 className="text-lg font-bold">Машина дня</h2>
        </div>
        <div className="flex items-center gap-1 text-sm opacity-70">
          <Clock size={14} />
          <span>
            {isVotingOpen ? 'Голосование открыто' : 'Голосование закрыто'}
          </span>
        </div>
      </div>

      {/* Вчерашний победитель */}
      {yesterdayWinner && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-yellow-500" />
            <span className="text-sm font-semibold text-yellow-500">
              Вчера победил:
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10">
              <Image
                src={getCarPhotoUrl(yesterdayWinner.car_photo_url)}
                alt={yesterdayWinner.car_name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {yesterdayWinner.car_name || `${yesterdayWinner.car_brand} ${yesterdayWinner.car_model}`}
              </div>
              <div className="text-xs opacity-70">
                {yesterdayWinner.car_year} • {yesterdayWinner.owner_handle}
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-500">
                <Heart size={12} className="fill-current" />
                <span>{yesterdayWinner.votes} голосов</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Кандидаты */}
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div
            key={candidate.car_id}
            className={`p-3 rounded-lg border transition-all ${
              candidate.my_vote
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Фото машины */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                <Image
                  src={getCarPhotoUrl(candidate.car_photo_url)}
                  alt={candidate.car_name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Информация о машине */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/car/${candidate.car_id}`}
                    className="font-semibold text-sm hover:opacity-80 transition-opacity truncate"
                  >
                    {candidate.car_name || `${candidate.car_brand} ${candidate.car_model}`}
                  </Link>
                  {candidate.my_vote && (
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs opacity-70 mb-2">
                  {candidate.car_year} • {candidate.owner_handle}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs">
                    <Heart size={12} className="fill-current text-red-500" />
                    <span>{candidate.votes} голосов</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Users size={12} className="opacity-70" />
                    <span>Владелец: {candidate.owner_handle}</span>
                  </div>
                </div>
              </div>

              {/* Кнопка голосования */}
              <div className="flex-shrink-0">
                {candidate.my_vote ? (
                  <div className="px-3 py-1.5 bg-green-500/20 text-green-500 text-xs rounded-full flex items-center gap-1">
                    <CheckCircle size={12} />
                    <span>Голос отдан</span>
                  </div>
                ) : hasVoted ? (
                  <div className="px-3 py-1.5 bg-gray-500/20 text-gray-500 text-xs rounded-full">
                    Уже голосовали
                  </div>
                ) : !isVotingOpen ? (
                  <div className="px-3 py-1.5 bg-gray-500/20 text-gray-500 text-xs rounded-full">
                    Голосование закрыто
                  </div>
                ) : (
                  <button
                    onClick={() => handleVote(candidate.car_id)}
                    disabled={votingCarId === candidate.car_id}
                    className="px-3 py-1.5 bg-[#6A3FFB] hover:bg-[#3F297A] text-white text-xs rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {votingCarId === candidate.car_id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Heart size={12} />
                    )}
                    <span>Голосовать</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Информация о голосовании */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <div className="text-xs opacity-70 text-center">
          {hasVoted ? (
            <span className="text-green-500">✓ Вы уже проголосовали сегодня</span>
          ) : !user ? (
            <span>Войдите в систему, чтобы проголосовать</span>
          ) : isVotingOpen ? (
            <span>Выберите машину и нажмите "Голосовать"</span>
          ) : (
            <span>Голосование закрыто. Результаты будут объявлены завтра</span>
          )}
        </div>
      </div>
    </div>
  );
}