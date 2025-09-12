import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseApiClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseApiClient(request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Максимум 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0); // Минимум 0

    // Логирование для отладки серверной сессии
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[Cars API] Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message,
      cookies: Object.fromEntries(request.cookies.entries())
    });

    const { data: cars, error } = await supabase
      .from('cars')
      .select(`
        id,
        brand,
        model,
        year,
        name,
        owner_id,
        profiles!cars_owner_id_fkey(handle, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching cars:', error);
      return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
    }

    // Преобразовать данные для удобства использования
    const transformedCars = cars?.map(car => ({
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      name: car.name,
      owner_handle: car.profiles?.handle || 'Unknown',
      owner_name: car.profiles?.name || 'Unknown'
    })) || [];

    return NextResponse.json(transformedCars);
  } catch (error) {
    console.error('Error in cars API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
