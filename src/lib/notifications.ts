import { supabase } from './supabaseClient'

// Типы для уведомлений
export interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'follow' | 'system'
  title: string
  body?: string
  href?: string
  createdAt: string
  read: boolean
}

// Проверка доступности Supabase и таблицы notifications
let supabaseAvailable = false
let tableExists = false

// Инициализация проверки Supabase
const initSupabaseCheck = async () => {
  try {
    // Проверяем, что Supabase клиент настроен
    if (!supabase) {
      console.warn('[notifications] Supabase client not available')
      return
    }

    // Проверяем существование таблицы notifications
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)

    if (error) {
      console.warn('[notifications] Table notifications not available:', error.message)
      supabaseAvailable = false
      tableExists = false
    } else {
      supabaseAvailable = true
      tableExists = true
      console.log('[notifications] Using Supabase notifications')
    }
  } catch (error) {
    console.warn('[notifications] Supabase check failed:', error)
    supabaseAvailable = false
    tableExists = false
  }
}

// Инициализируем проверку при загрузке модуля
if (typeof window !== 'undefined') {
  initSupabaseCheck()
}

// LocalStorage fallback для SSR-safe работы
const getStorageKey = (userId: string) => `notifications_${userId}`

const localStorageFallback = {
  async list(userId: string): Promise<Notification[]> {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(getStorageKey(userId))
      if (!stored) return []
      
      const notifications = JSON.parse(stored)
      return notifications.sort((a: Notification, b: Notification) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } catch (error) {
      console.warn('[notifications] Failed to load from localStorage:', error)
      return []
    }
  },

  async unreadCount(userId: string): Promise<number> {
    const notifications = await this.list(userId)
    return notifications.filter(n => !n.read).length
  },

  async markRead(userId: string, id: string): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const notifications = await this.list(userId)
      const updated = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updated))
    } catch (error) {
      console.warn('[notifications] Failed to mark as read in localStorage:', error)
    }
  },

  async markAllRead(userId: string): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const notifications = await this.list(userId)
      const updated = notifications.map(n => ({ ...n, read: true }))
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updated))
    } catch (error) {
      console.warn('[notifications] Failed to mark all as read in localStorage:', error)
    }
  },

  async push(userId: string, data: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>): Promise<string> {
    if (typeof window === 'undefined') return ''
    
    try {
      const notifications = await this.list(userId)
      const newNotification: Notification = {
        ...data,
        id: crypto.randomUUID(),
        userId,
        createdAt: new Date().toISOString(),
        read: false
      }
      
      notifications.unshift(newNotification)
      localStorage.setItem(getStorageKey(userId), JSON.stringify(notifications))
      return newNotification.id
    } catch (error) {
      console.warn('[notifications] Failed to push to localStorage:', error)
      return ''
    }
  },

  subscribe(userId: string, callback: () => void): () => void {
    // LocalStorage не поддерживает realtime, возвращаем пустую функцию отписки
    return () => {}
  }
}

// Supabase реализация
const supabaseImplementation = {
  async list(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[notifications] Failed to fetch notifications:', error)
      return []
    }

    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      type: item.type,
      title: item.title,
      body: item.body,
      href: item.href,
      createdAt: item.created_at,
      read: item.read
    }))
  },

  async unreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.warn('[notifications] Failed to count unread notifications:', error)
      return 0
    }

    return count || 0
  },

  async markRead(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.warn('[notifications] Failed to mark notification as read:', error)
    }
  },

  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.warn('[notifications] Failed to mark all notifications as read:', error)
    }
  },

  async push(userId: string, data: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>): Promise<string> {
    const { data: result, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: data.type,
        title: data.title,
        body: data.body,
        href: data.href
      })
      .select('id')
      .single()

    if (error) {
      console.warn('[notifications] Failed to create notification:', error)
      return ''
    }

    return result.id
  },

  subscribe(userId: string, callback: () => void): () => void {
    if (!supabaseAvailable || !tableExists) {
      return () => {}
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        () => {
          callback()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}

// Автовыбор реализации
const getImplementation = () => {
  if (supabaseAvailable && tableExists) {
    return supabaseImplementation
  }
  return localStorageFallback
}

// Публичный API
export const list = async (userId: string): Promise<Notification[]> => {
  const impl = getImplementation()
  return impl.list(userId)
}

export const unreadCount = async (userId: string): Promise<number> => {
  const impl = getImplementation()
  return impl.unreadCount(userId)
}

export const markRead = async (userId: string, id: string): Promise<void> => {
  const impl = getImplementation()
  return impl.markRead(userId, id)
}

export const markAllRead = async (userId: string): Promise<void> => {
  const impl = getImplementation()
  return impl.markAllRead(userId)
}

export const push = async (userId: string, data: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>): Promise<string> => {
  const impl = getImplementation()
  return impl.push(userId, data)
}

export const subscribe = (userId: string, callback: () => void): (() => void) => {
  const impl = getImplementation()
  return impl.subscribe(userId, callback)
}

// Экспорт типов
export type { Notification }