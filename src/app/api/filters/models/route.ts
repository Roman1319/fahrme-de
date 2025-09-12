import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request, NextResponse.next());
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const source = searchParams.get('source') || 'cars'; // 'cars' или 'car_models'

    if (!brand) {
      return NextResponse.json({ error: 'Brand parameter is required' }, { status: 400 });
    }

    if (source === 'car_models') {
      // Получить модели из таблицы car_models
      const { data: models, error } = await supabase
        .from('car_models')
        .select('id, name, description')
        .eq('brands.name', brand)
        .innerJoin('brands', 'car_models.brand_id', 'brands.id')
        .order('name');

      if (error) {
        console.error('Error fetching models from car_models table:', error);
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
      }

      return NextResponse.json(models || []);
    } else {
      // Получить уникальные модели из таблицы cars для выбранного бренда
      const { data: cars, error } = await supabase
        .from('cars')
        .select('model')
        .eq('brand', brand)
        .not('model', 'is', null)
        .order('model');

      if (error) {
        console.error('Error fetching models from cars table:', error);
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
      }

      // Получить уникальные модели
      const uniqueModels = [...new Set(cars?.map(car => car.model) || [])]
        .map(model => ({ name: model, id: null, description: null }));

      return NextResponse.json(uniqueModels);
    }
  } catch (error) {
    console.error('Error in models API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
