/**
 * Web Push: request permission, subscribe with VAPID public key, save subscription to Supabase.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getPermissionState(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  return Notification.permission
}

/** Request notification permission. Returns current permission. */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

/**
 * Register the service worker (from /sw.js), then subscribe to push and return the subscription JSON.
 * Caller should save the result to Supabase push_subscriptions.
 */
export async function subscribeToPush(): Promise<PushSubscriptionJSON | null> {
  if (!VAPID_PUBLIC_KEY?.trim()) {
    console.error('VITE_VAPID_PUBLIC_KEY is missing')
    return null
  }
  const reg = await navigator.serviceWorker.ready
  const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  })
  return sub.toJSON()
}

/** Check if there is already an active push subscription for this service worker. */
export async function getExistingSubscription(): Promise<PushSubscriptionJSON | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  const reg = await navigator.serviceWorker.ready
  const current = await reg.pushManager.getSubscription()
  return current ? current.toJSON() : null
}

/** Register service worker. Call once at app init. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch {
    return null
  }
}

export type PushSubscriptionRow = {
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Save subscription to Supabase push_subscriptions (upsert by user_id + endpoint).
 * Requires authenticated Supabase client.
 */
export async function saveSubscriptionToSupabase(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  subscription: PushSubscriptionJSON
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) return false
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      { onConflict: 'user_id,endpoint' }
    )
  return !error
}
