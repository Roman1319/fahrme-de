import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseApiClient } from '@/lib/supabaseServer';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const CarIdSchema = z.object({
  carId: z.string().uuid('Invalid car ID format')
});

export async function POST(
  request: NextRequest,
  { params }: { params: { carId: string } }
) {
  try {
    const supabase = createSupabaseApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Логирование для отладки
    logger.debug('[API] Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message,
      cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value]))
    });

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Валидация carId
    const validation = CarIdSchema.safeParse({ carId: params.carId });
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid car ID format',
        details: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { carId } = validation.data;

    // Проверить, что машина существует
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, owner_id')
      .eq('id', carId)
      .single();

    if (carError || !car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    // Нельзя подписаться на свою машину
    if (car.owner_id === user.id) {
      return NextResponse.json({ error: 'Cannot follow own car' }, { status: 400 });
    }

    // Добавить подписку
    const { error: followError } = await supabase
      .from('follows_cars')
      .insert({
        user_id: user.id,
        car_id: carId
      });

    if (followError) {
      // Если уже подписан, это не ошибка
      if (followError.code === '23505') {
        return NextResponse.json({ message: 'Already following' });
      }
      return NextResponse.json({ error: 'Failed to follow car' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully followed car' });
  } catch (error) {
    logger.error('Error following car:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { carId: string } }
) {
  try {
    const supabase = createSupabaseApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Валидация carId
    const validation = CarIdSchema.safeParse({ carId: params.carId });
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid car ID format',
        details: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { carId } = validation.data;

    // Удалить подписку
    const { error: unfollowError } = await supabase
      .from('follows_cars')
      .delete()
      .eq('user_id', user.id)
      .eq('car_id', carId);

    if (unfollowError) {
      return NextResponse.json({ error: 'Failed to unfollow car' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully unfollowed car' });
  } catch (error) {
    logger.error('Error unfollowing car:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { carId: string } }
) {
  try {
    const supabase = createSupabaseApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Валидация carId
    const validation = CarIdSchema.safeParse({ carId: params.carId });
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid car ID format',
        details: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { carId } = validation.data;

    // Проверить статус подписки
    const { data: follow, error: followError } = await supabase
      .from('follows_cars')
      .select('*')
      .eq('user_id', user.id)
      .eq('car_id', carId)
      .single();

    if (followError && followError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 });
    }

    return NextResponse.json({ 
      isFollowing: !!follow,
      followersCount: 0 // Будет обновлено отдельным запросом
    });
  } catch (error) {
    logger.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
