import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { carId: string } }
) {
  try {
    const supabase = createSupabaseServerClient(request, NextResponse.next());
    const { carId } = params;

    // Получить количество подписчиков
    const { data: followersData, error: followersError } = await supabase
      .from('follows_cars')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId);

    if (followersError) {
      return NextResponse.json({ error: 'Failed to get followers count' }, { status: 500 });
    }

    // Получить количество лайков (если есть таблица post_likes)
    const { data: likesData, error: likesError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', carId);

    const likesCount = likesError ? 0 : (likesData?.length || 0);

    return NextResponse.json({
      followersCount: followersData?.length || 0,
      likesCount
    });
  } catch (error) {
    console.error('Error getting car stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
