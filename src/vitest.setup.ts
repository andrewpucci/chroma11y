import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/svelte';
import { afterEach, vi } from 'vitest';

const originalFetch = globalThis.fetch;
const faviconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" /></svg>';

vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : input.toString();

  if (new URL(url, 'http://localhost').pathname === '/favicon.svg') {
    return Promise.resolve(
      new Response(faviconSvg, {
        headers: { 'Content-Type': 'image/svg+xml' }
      })
    );
  }

  if (originalFetch) {
    return originalFetch(input, init);
  }

  return Promise.reject(new TypeError(`fetch failed: ${url}`));
});

afterEach(() => {
  cleanup();
});
