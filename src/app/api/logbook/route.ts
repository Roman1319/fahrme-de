import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs'; // не edge, чтобы избежать нюансов

const CreateSchema = z.object({
  car_id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  topic: z.string().optional(),
  allow_comments: z.boolean().optional(),
  mileage: z.number().int().optional(),
  mileage_unit: z.enum(['km','mi'], {
    errorMap: () => ({
      message: 'Mileage unit must be either "km" or "mi". "miles" is not accepted.'
    })
  }).optional(),
  cost: z.number().optional(),
  currency: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // создаём ответ заранее — через него будут устанавливаться куки
  const res = NextResponse.json(null, { status: 200 });

  try {
    const supabase = createSupabaseServerClient(req, res);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    let parsed;
    try {
      parsed = CreateSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => e.message).join(', ');
        return NextResponse.json({ 
          error: 'Validation error', 
          details: errorMessage,
          field: error.errors[0]?.path.join('.')
        }, { status: 400 });
      }
      throw error;
    }

    // проверка владения машиной (политики всё равно проверят, но так дадим понятный текст)
    const { data: car, error: carErr } = await supabase
      .from('cars')
      .select('id')
      .eq('id', parsed.car_id)
      .eq('owner_id', user.id)
      .single();

    if (carErr || !car) {
      return NextResponse.json(
        { error: 'Вы можете создавать посты только для своих автомобилей.' },
        { status: 403 }
      );
    }

    const row = {
      author_id: user.id,
      car_id: parsed.car_id,
      title: parsed.title,
      content: parsed.content,
      topic: parsed.topic ?? null,
      allow_comments: parsed.allow_comments ?? true,
      mileage: parsed.mileage ?? null,
      mileage_unit: parsed.mileage_unit ?? null,
      cost: parsed.cost ?? null,
      currency: parsed.currency ?? null,
    };

    const { data, error } = await supabase
      .from('logbook_entries')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('[api/logbook] Insert error:', error);
      return NextResponse.json({ error: 'Ошибка создания поста' }, { status: 400 });
    }

    // возвращаем через res, чтобы не потерять возможные cookie-мутации
    return NextResponse.json(data, { status: 201, headers: res.headers });
  } catch (e: any) {
    console.error('[api/logbook] Unexpected:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
