import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request, NextResponse.next());
    const { data: { user } } = await supabase.auth.getUser();

    // Проверить, существует ли сегодняшний день голосования
    const { error: todayDayError } = await supabase
      .from('cotd_days')
      .select('id, status')
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    // Если дня нет, создать его
    if (todayDayError && todayDayError.code === 'PGRST116') {
      console.log('Creating today COTD day...');
      const { error: createError } = await supabase
        .from('cotd_days')
        .insert({
          date: new Date().toISOString().split('T')[0],
          status: 'voting'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating today COTD day:', createError);
        return NextResponse.json({ 
          error: 'Failed to create today COTD day', 
          details: createError.message 
        }, { status: 500 });
      }
    } else if (todayDayError) {
      console.error('Error checking today COTD day:', todayDayError);
      return NextResponse.json({ 
        error: 'Failed to check today COTD day', 
        details: todayDayError.message 
      }, { status: 500 });
    }

    // Получить сегодняшних кандидатов
    const { data: candidates, error: candidatesError } = await supabase
      .rpc('get_today_cotd_candidates');

    if (candidatesError) {
      console.error('Error fetching COTD candidates:', candidatesError);
      return NextResponse.json({ 
        error: 'Failed to fetch candidates', 
        details: candidatesError.message,
        code: candidatesError.code 
      }, { status: 500 });
    }

    // Получить вчерашнего победителя
    const { data: yesterdayWinner, error: winnerError } = await supabase
      .rpc('get_yesterday_cotd_winner');

    if (winnerError) {
      console.error('Error fetching yesterday winner:', winnerError);
      // Не критично, продолжаем без вчерашнего победителя
    }

    // Определить мой голос (если пользователь аутентифицирован)
    let myVote = null;
    if (user && candidates && candidates.length > 0) {
      const votedCandidate = candidates.find((c: Record<string, unknown>) => c.my_vote);
      if (votedCandidate) {
        myVote = {
          car_id: votedCandidate.car_id,
          car_brand: votedCandidate.car_brand,
          car_model: votedCandidate.car_model,
          car_year: votedCandidate.car_year,
          car_name: votedCandidate.car_name
        };
      }
    }

    return NextResponse.json({
      candidates: candidates || [],
      myVote,
      yesterdayWinner: yesterdayWinner?.[0] || null,
      hasVoted: !!myVote,
      isVotingOpen: candidates?.[0]?.status === 'voting'
    });
  } catch (error) {
    console.error('Error in COTD today API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
