const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const STORAGE_KEY = 'moviedb_session';

// Refresh a little before the access token actually expires, so a request
// never leaves with a token that dies on the way.
const REFRESH_MARGIN_SECONDS = 60;

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 when the server could not be reached
    this.details = details;
  }
}

// The signed-in session: { user, session: { access_token, refresh_token, expires_at } }.
// Kept in localStorage so a reload stays signed in; React reads it through AuthContext.
const listeners = new Set();
const expiryListeners = new Set();

export const sessionStore = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  },
  set(value) {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
    listeners.forEach((listener) => listener(value));
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  // Called when a session ends because it could not be refreshed, as opposed to a logout.
  onExpired(listener) {
    expiryListeners.add(listener);
    return () => expiryListeners.delete(listener);
  },
};

async function send(path, { method = 'GET', body, token, signal } = {}) {
  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      signal,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error || `Request failed (${response.status})`,
      data?.details,
    );
  }
  return data;
}

// Several requests can notice an expired token at once; they share one refresh.
let refreshing = null;

function refreshSession() {
  if (!refreshing) {
    const refreshToken = sessionStore.get()?.session?.refresh_token;
    refreshing = send('/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken } })
      .then((next) => {
        sessionStore.set(next);
        return next;
      })
      .catch((err) => {
        // Only a rejected refresh token ends the session; a network blip does not.
        if (err instanceof ApiError && (err.status === 400 || err.status === 401)) {
          sessionStore.set(null);
          expiryListeners.forEach((listener) => listener());
        }
        throw err;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// request(path, { auth: true }) sends the access token, refreshing it first if
// it is about to expire, and once more if the server still answers 401.
export async function request(path, { auth = false, ...options } = {}) {
  if (!auth) return send(path, options);

  let stored = sessionStore.get();
  if (!stored?.session) throw new ApiError(401, 'Please sign in to continue');

  if (stored.session.expires_at - Date.now() / 1000 < REFRESH_MARGIN_SECONDS) {
    stored = await refreshSession();
  }

  try {
    return await send(path, { ...options, token: stored.session.access_token });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;
    const next = await refreshSession();
    return send(path, { ...options, token: next.session.access_token });
  }
}
