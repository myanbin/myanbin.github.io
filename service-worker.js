console.log('Hello from service-worker.js');

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

workbox.routing.registerRoute(
  /\.html$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'html-cache',
  }),
);

workbox.routing.registerRoute(
  new RegExp('/public/'),
  // Use the cache if it's available.
  new workbox.strategies.CacheFirst({
    // Use a custom cache name.
    cacheName: 'public-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        // Cache for a maximum of a week.
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      })
    ]
  })
);

workbox.precaching.precacheAndRoute([
  {url: '/', revision: '383676' },
  {url: '/index.html', revision: '383676' },
  {url: '/about.html', revision: '383676' },
]);

// Set a default network-first strategy to use when
// there is no explicit matching route:
workbox.routing.setDefaultHandler(new workbox.strategies.NetworkFirst());