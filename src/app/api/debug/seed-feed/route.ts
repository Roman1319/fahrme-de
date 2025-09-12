import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseApiClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseApiClient(request);
    
    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, есть ли уже данные
    const { count: entriesCount } = await supabase
      .from('logbook_entries')
      .select('*', { count: 'exact', head: true });

    if (entriesCount && entriesCount > 0) {
      return NextResponse.json({ 
        message: 'Data already exists', 
        count: entriesCount 
      });
    }

    // Создаем тестовые данные
    const testData = [
      {
        title: 'Mein erster Logbucheintrag',
        content: 'Heute habe ich eine tolle Fahrt mit meinem Auto gemacht. Das Wetter war perfekt und die Straßen waren leer.',
        author_id: user.id,
        car_id: null, // Будет создана тестовая машина
        publish_date: new Date().toISOString()
      },
      {
        title: 'Wartung abgeschlossen',
        content: 'Die jährliche Wartung ist endlich abgeschlossen. Alle Filter wurden gewechselt und das Öl erneuert.',
        author_id: user.id,
        car_id: null,
        publish_date: new Date(Date.now() - 86400000).toISOString() // Вчера
      },
      {
        title: 'Neue Reifen montiert',
        content: 'Endlich neue Reifen! Die Fahreigenschaften haben sich deutlich verbessert.',
        author_id: user.id,
        car_id: null,
        publish_date: new Date(Date.now() - 172800000).toISOString() // Позавчера
      }
    ];

    // Создаем тестовую машину
    const { data: car, error: carError } = await supabase
      .from('cars')
      .insert({
        owner_id: user.id,
        brand: 'BMW',
        model: 'M3',
        year: 2020,
        name: 'Mein M3',
        color: 'Schwarz',
        mileage: 50000
      })
      .select()
      .single();

    if (carError) {
      console.error('Error creating test car:', carError);
      return NextResponse.json({ error: 'Failed to create test car' }, { status: 500 });
    }

    // Обновляем записи с car_id
    const entriesWithCar = testData.map(entry => ({
      ...entry,
      car_id: car.id
    }));

    // Создаем записи
    const { data: entries, error: entriesError } = await supabase
      .from('logbook_entries')
      .insert(entriesWithCar)
      .select();

    if (entriesError) {
      console.error('Error creating test entries:', entriesError);
      return NextResponse.json({ error: 'Failed to create test entries' }, { status: 500 });
    }

    // Создаем тестовые медиа
    const mediaData = entries.map(entry => ({
      entry_id: entry.id,
      storage_path: 'test/placeholder-logbook.jpg',
      media_type: 'image',
      sort: 1
    }));

    const { error: mediaError } = await supabase
      .from('logbook_media')
      .insert(mediaData);

    if (mediaError) {
      console.error('Error creating test media:', mediaError);
      // Не критично, продолжаем
    }

    return NextResponse.json({ 
      message: 'Test data created successfully',
      entries: entries.length,
      car: car.id
    });

  } catch (error) {
    console.error('[Debug Seed] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
