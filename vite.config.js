import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PUBLIC_FILES = [
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
];

// Removes any service worker left on this address, so dev always shows the latest code.
const DEV_SERVICE_WORKER = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  await self.clients.claim();
  for (const key of await caches.keys()) await caches.delete(key);
  await self.registration.unregister();
  for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
})()));
`;

function serviceWorker() {
  return {
    name: 'playbox-service-worker',
    configureServer(server) {
      server.middlewares.use('/sw.js', (req, res) => {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(DEV_SERVICE_WORKER);
      });
    },
    // Writes dist/sw.js with the exact list of built files, so each build gets its own offline cache.
    generateBundle: {
      order: 'post',
      handler(options, bundle) {
        const files = ['./', ...Object.keys(bundle), ...PUBLIC_FILES];
        const version = createHash('sha256').update(files.join()).digest('hex').slice(0, 10);
        const source = readFileSync('src/sw.template.js', 'utf8')
          .replace('__VERSION__', version)
          .replace('__FILES__', JSON.stringify(files));
        this.emitFile({ type: 'asset', fileName: 'sw.js', source });
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
});
