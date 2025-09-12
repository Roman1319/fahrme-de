import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface COTDCandidate {
  day_id: string;
  date: string;
  status: string;
  car_id: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  car_name: string;
  car_photo_url: string;
  owner_handle: string;
  owner_avatar_url: string;
  votes: number;
  my_vote: boolean;
}

interface COTDWinner {
  car_id: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  car_name: string;
  car_photo_url: string;
  owner_handle: string;
  owner_avatar_url: string;
  votes: number;
}

interface COTDState {
  candidates: COTDCandidate[];
  myVote: COTDCandidate | null;
  yesterdayWinner: COTDWinner | null;
  hasVoted: boolean;
  isVotingOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useCOTD() {
  const { user } = useAuth();
  const [state, setState] = useState<COTDState>({
    candidates: [],
    myVote: null,
    yesterdayWinner: null,
    hasVoted: false,
    isVotingOpen: false,
    isLoading: true,
    error: null
  });

  const loadCOTDData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/cotd/today');
      
      if (!response.ok) {
        throw new Error('Failed to load COTD data');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        candidates: data.candidates || [],
        myVote: data.myVote,
        yesterdayWinner: data.yesterdayWinner,
        hasVoted: data.hasVoted,
        isVotingOpen: data.isVotingOpen,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error loading COTD data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const voteForCar = async (carId: string) => {
    if (!user || state.hasVoted || !state.isVotingOpen) {
      return { success: false, error: 'Cannot vote' };
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/cotd/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ car_id: carId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote');
      }

      // Обновить локальное состояние
      setState(prev => ({
        ...prev,
        hasVoted: true,
        myVote: prev.candidates.find(c => c.car_id === carId) || null,
        candidates: prev.candidates.map(c => 
          c.car_id === carId 
            ? { ...c, votes: c.votes + 1, my_vote: true }
            : c
        ),
        isLoading: false,
        error: null
      }));

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error voting for car:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const addCandidates = async (carIds: string[]) => {
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const response = await fetch('/api/cotd/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'add_candidates', 
          car_ids: carIds 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add candidates');
      }

      // Перезагрузить данные
      await loadCOTDData();

      return { success: true, added_count: data.added_count };
    } catch (error) {
      console.error('Error adding candidates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const closeDay = async () => {
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const response = await fetch('/api/cotd/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'close_day' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close day');
      }

      // Перезагрузить данные
      await loadCOTDData();

      return { success: true, winner_car_id: data.winner_car_id };
    } catch (error) {
      console.error('Error closing day:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  useEffect(() => {
    loadCOTDData();
  }, [user]);

  return {
    ...state,
    voteForCar,
    addCandidates,
    closeDay,
    refetch: loadCOTDData
  };
}
