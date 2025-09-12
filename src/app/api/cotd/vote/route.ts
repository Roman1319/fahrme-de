import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { car_id } = await request.json();

    if (!car_id) {
      return NextResponse.json({ error: 'car_id is required' }, { status: 400 });
    }

    // Использовать функцию голосования из Supabase
    const { data, error } = await supabase.rpc('vote_for_cotd_car', {
      p_car_id: car_id
    });

    if (error) {
      console.error('Error voting for COTD car:', error);
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
    console.error('Error in COTD vote API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
