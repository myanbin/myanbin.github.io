console.log('hello from service-worker.js');

importScripts('/public/js/workbox-sw.js');

workbox.routing.registerRoute(
  /\.html$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'html-cache',
  }),
);

workbox.routing.registerRoute(
  /\.(css|js)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'asset-cache',
  }),
);

workbox.routing.registerRoute(
  /\.(jpg|jpeg|svg|png|gif|ttf|mp3)$/,
  // Use the cache if it's available.
  new workbox.strategies.CacheFirst({
    // Use a custom cache name.
    cacheName: 'static-cache',
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
  { url: '/index.html', revision: '2111' },
  { url: '/about.html', revision: '2111' },
  { url: '/links.html', revision: '2111' },
  { url: '/public/css/styles.css', revision: '2111' },
]);

workbox.routing.setDefaultHandler(new workbox.strategies.NetworkFirst());
