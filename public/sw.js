/* Service worker for Web Push – handles push events and notification click */
self.addEventListener('push', function (event) {
  if (!event.data) return
  let payload = { title: 'רשימת קניות', body: '' }
  try {
    payload = event.data.json()
  } catch {
    payload.body = event.data.text()
  }
  const title = payload.title || 'רשימת קניות'
  const options = {
    body: payload.body || '',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'supermarket-mode',
    renotify: true,
    requireInteraction: false,
    data: { url: payload.url || '/' }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length) clientList[0].focus()
      if (self.clients.openWindow) self.clients.openWindow(url)
    })
  )
})
