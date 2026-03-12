// public/sw.js
const CACHE_NAME = 'vayazed-bus-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installed');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received:', event);

  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'VayaZed Bus Booking',
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'general',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'VayaZed Bus Booking',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event:', event);
  
  if (event.tag === 'sync-tickets') {
    event.waitUntil(syncTickets());
  }
});

// Function to sync tickets when back online
async function syncTickets() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch('/api/tickets/sync');
    const tickets = await response.json();
    
    // Cache updated tickets
    await cache.put('/api/tickets/offline', new Response(JSON.stringify(tickets)));
    
    console.log('✅ Tickets synced successfully');
  } catch (error) {
    console.error('Error syncing tickets:', error);
  }
}