import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const CreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  car_id: z.string().uuid().nullable().optional(),
  topic: z.string().optional(),
  allow_comments: z.boolean().optional(),
  mileage: z.number().int().nonnegative().nullable().optional(),
  mileage_unit: z.enum(['km','mi']).nullable().optional(),
  cost: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    console.log('Received token:', token ? 'Present' : 'Missing');
    
    const supabase = createClient();
    
    // Try to verify the token directly
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('Auth result:', { user: user?.id, error: authError?.message });
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Проверяем, что пользователь аутентифицирован
    console.log('User authenticated:', user.id);

    const body = await req.json();
    console.log('Request body:', body);
    
    const input = CreateSchema.parse(body);
    console.log('Parsed input:', input);

    const row = {
      author_id: user.id,
      car_id: input.car_id ?? null,
      title: input.title,
      content: input.content,
      topic: input.topic ?? null,
      allow_comments: input.allow_comments ?? true,
      mileage: input.mileage ?? null,
      mileage_unit: input.mileage_unit ?? null,
      cost: input.cost ?? null,
      currency: input.currency ?? null,
    };
    
    console.log('Row to insert:', row);

    const { data, error } = await supabase
      .from('logbook_entries')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    console.error('API error:', e);
    return NextResponse.json({ error: (e as Error)?.message ?? 'Internal error' }, { status: 500 });
  }
}
