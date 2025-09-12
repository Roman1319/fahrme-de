import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request, NextResponse.next());
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'cars'; // 'cars' или 'brands'

    if (source === 'brands') {
      // Получить бренды из таблицы brands
      const { data: brands, error } = await supabase
        .from('brands')
        .select('id, name, logo')
        .order('name');

      if (error) {
        console.error('Error fetching brands from brands table:', error);
        return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
      }

      return NextResponse.json(brands || []);
    } else {
      // Получить уникальные бренды из таблицы cars
      const { data: cars, error } = await supabase
        .from('cars')
        .select('brand')
        .not('brand', 'is', null)
        .order('brand');

      if (error) {
        console.error('Error fetching brands from cars table:', error);
        return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
      }

      // Получить уникальные бренды
      const uniqueBrands = [...new Set(cars?.map(car => car.brand) || [])]
        .map(brand => ({ name: brand, id: null, logo: null }));

      return NextResponse.json(uniqueBrands);
    }
  } catch (error) {
    console.error('Error in brands API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
