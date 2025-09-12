import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request, NextResponse.next());

    // Получить минимальный и максимальный год из таблицы cars
    const { data: yearData, error } = await supabase
      .from('cars')
      .select('year')
      .not('year', 'is', null)
      .order('year');

    if (error) {
      console.error('Error fetching years from cars table:', error);
      return NextResponse.json({ error: 'Failed to fetch years' }, { status: 500 });
    }

    if (!yearData || yearData.length === 0) {
      return NextResponse.json({ min: 1900, max: new Date().getFullYear() });
    }

    const years = yearData.map(car => car.year).filter(year => year > 0);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    return NextResponse.json({ 
      min: Math.max(minYear, 1900), // Не меньше 1900
      max: Math.min(maxYear, new Date().getFullYear()) // Не больше текущего года
    });
  } catch (error) {
    console.error('Error in years API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
