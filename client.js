// Central place to configure how the frontend talks to the backend.
// In dev, Vite proxies /api/* to your backend (see vite.config.js).
// In production, set VITE_API_BASE_URL to your deployed backend URL.

import { API_BASE_URL, isApiEnabled } from './config';

function friendlyApiError(status, body) {
  if (status === 404) {
    return 'Backend not available yet.';
  }

  if (status >= 500) {
    return 'Server error — please try again shortly.';
  }

  if (body && !body.trim().startsWith('<')) {
    const trimmed = body.trim().slice(0, 120);
    return trimmed || `Request failed (${status}).`;
  }

  return `Request failed (${status}).`;
}

async function request(path, options = {}) {
  if (!isApiEnabled) {
    return null;
  }

  const headers = new Headers(options.headers);

  if (options.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      ...options,
    });
  } catch {
    throw new Error('Could not reach the backend.');
  }

  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(friendlyApiError(res.status, message));
  }

  if (res.status === 204) {
    return null;
  }

  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  return text || null;
}

export const apiClient = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
};

export { isApiEnabled };
