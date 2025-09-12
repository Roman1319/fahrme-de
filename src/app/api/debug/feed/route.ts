import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseApiClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseApiClient(request);
    
    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[Debug Feed] Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });

    // Проверяем таблицы
    const tables = ['logbook_entries', 'profiles', 'cars', 'logbook_media', 'post_likes', 'comments'];
    const tableStats = {};
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      tableStats[table] = { count: count || 0, error: error?.message };
    }

    // Тестируем RPC функции
    const rpcTests = {};
    
    // Тест feed_explore
    try {
      const { data: exploreData, error: exploreError } = await supabase.rpc('feed_explore', {
        p_limit: 5,
        p_offset: 0
      });
      rpcTests.feed_explore = {
        success: !exploreError,
        dataCount: exploreData?.length || 0,
        error: exploreError?.message,
        code: exploreError?.code
      };
    } catch (error) {
      rpcTests.feed_explore = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Тест feed_personal (только если есть пользователь)
    if (user) {
      try {
        const { data: personalData, error: personalError } = await supabase.rpc('feed_personal', {
          p_limit: 5,
          p_offset: 0
        });
        rpcTests.feed_personal = {
          success: !personalError,
          dataCount: personalData?.length || 0,
          error: personalError?.message,
          code: personalError?.code
        };
      } catch (error) {
        rpcTests.feed_personal = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return NextResponse.json({
      auth: {
        hasUser: !!user,
        userId: user?.id,
        authError: authError?.message
      },
      tableStats,
      rpcTests,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Debug Feed] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
