const CACHE_NAME = 'virgil-coach-v1.0';
const OFFLINE_URL = '/';

// Files to cache for offline use
const urlsToCache = [
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-144.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/Virgil-Logo-2.png'
];

// Essential coaching advice for offline use
const OFFLINE_ADVICE = {
  coding: [
    "Think out loud about your approach first",
    "Start with a brute force solution, then optimize",
    "Ask about edge cases and constraints",
    "Mention time and space complexity",
    "Draw diagrams if it helps explain"
  ],
  political: [
    "Acknowledge the complexity of the situation",
    "Show respect for all perspectives involved",
    "Focus on diplomatic solutions",
    "Emphasize peaceful resolution"
  ],
  hr: [
    "Use the STAR method for behavioral questions",
    "Show enthusiasm for the company mission",
    "Ask thoughtful questions about growth",
    "Highlight specific achievements with numbers"
  ],
  teacher: [
    "Focus on student-centered learning approaches",
    "Show passion for student growth",
    "Discuss classroom management techniques",
    "Emphasize continuous professional development"
  ],
  cyrano: [
    "Compliment something specific and genuine",
    "Use poetic language but stay authentic",
    "Ask thoughtful questions about their interests",
    "Let your sincerity shine through"
  ]
};

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Virgil Coach Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache files individually to handle errors gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        // Store offline advice in cache
        return caches.open(CACHE_NAME)
          .then(cache => {
            return cache.put('/offline-advice', 
              new Response(JSON.stringify(OFFLINE_ADVICE), {
                headers: { 'Content-Type': 'application/json' }
              })
            );
          });
      })
      .catch(err => {
        console.error('Service worker install failed:', err);
      })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Virgil Coach Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Handle API requests for advice
  if (event.request.url.includes('/api/advice')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Fallback to offline advice
          return handleOfflineAdviceRequest(event.request);
        })
    );
    return;
  }
  
  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, return offline page
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
      })
  );
});

// Handle offline advice requests
async function handleOfflineAdviceRequest(request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'hr';
    const question = url.searchParams.get('question') || '';
    
    const cache = await caches.open(CACHE_NAME);
    const adviceResponse = await cache.match('/offline-advice');
    const advice = await adviceResponse.json();
    
    const modeAdvice = advice[mode] || advice.hr;
    const randomAdvice = modeAdvice[Math.floor(Math.random() * modeAdvice.length)];
    
    return new Response(JSON.stringify({
      advice: randomAdvice,
      mode: mode,
      offline: true,
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      advice: 'Take a deep breath and trust your instincts.',
      mode: 'general',
      offline: true,
      error: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync any queued advice requests when connection is restored
  console.log('Background sync triggered');
}

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-144.png',
      vibrate: [100, 50, 100],
      tag: 'virgil-coach',
      requireInteraction: false,
      silent: true // Keep notifications discrete
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message handling from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_ADVICE') {
    // Cache additional advice from the main app
    cacheAdvice(event.data.advice);
  }
});

async function cacheAdvice(newAdvice) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/offline-advice');
    const currentAdvice = await response.json();
    
    // Merge new advice with existing
    const updatedAdvice = { ...currentAdvice, ...newAdvice };
    
    await cache.put('/offline-advice', 
      new Response(JSON.stringify(updatedAdvice), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    console.log('Advice cache updated');
  } catch (error) {
    console.error('Error caching advice:', error);
  }
}

// Cleanup old data periodically
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cleanup-old-data') {
    event.waitUntil(cleanupOldData());
  }
});

async function cleanupOldData() {
  // Clean up old conversation data, etc.
  console.log('Cleaning up old data');
} 