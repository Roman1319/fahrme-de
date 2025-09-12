import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseApiClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseApiClient(request);
    
    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем статистику уведомлений
    const { count: totalCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    // Получаем последние уведомления
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      stats: {
        total: totalCount || 0,
        unread: unreadCount || 0
      },
      notifications: notifications || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Debug Notifications] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseApiClient(request);
    
    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'system', title, body: notificationBody, href } = body;

    // Создаем тестовое уведомление
    const { data: notification, error: createError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title: title || 'Test Notification',
        body: notificationBody || 'This is a test notification',
        href: href || '/debug/notifications'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating notification:', createError);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('[Debug Notifications] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
