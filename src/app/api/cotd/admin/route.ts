import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, car_ids } = await request.json();

    if (action === 'add_candidates') {
      if (!car_ids || !Array.isArray(car_ids)) {
        return NextResponse.json({ error: 'car_ids array is required' }, { status: 400 });
      }

      const { data, error } = await supabase.rpc('add_cotd_candidates', {
        p_car_ids: car_ids
      });

      if (error) {
        console.error('Error adding COTD candidates:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        added_count: data.added_count 
      });
    }

    if (action === 'close_day') {
      const { data, error } = await supabase.rpc('close_cotd_day');

      if (error) {
        console.error('Error closing COTD day:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data.success) {
        return NextResponse.json({ error: data.error }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        winner_car_id: data.winner_car_id,
        message: data.message 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in COTD admin API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
