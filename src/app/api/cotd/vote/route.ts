import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const VoteSchema = z.object({
  car_id: z.string().uuid('Invalid car ID format')
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request, NextResponse.next());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    let parsed;
    try {
      parsed = VoteSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => e.message).join(', ');
        return NextResponse.json({ 
          error: 'Validation error', 
          details: errorMessage 
        }, { status: 400 });
      }
      throw error;
    }

    const { car_id } = parsed;

    // Использовать функцию голосования из Supabase
    const { data, error } = await supabase.rpc('vote_for_cotd_car', {
      p_car_id: car_id
    });

    if (error) {
      logger.error('Error voting for COTD car:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: data.message 
    });
  } catch (error) {
    logger.error('Error in COTD vote API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
