import { describe, expect, it, vi } from 'vitest';
import { ApiError, request, sessionStore } from './client';
import { ALICE, json, mockApi, sessionFor, signIn } from '../test/utils';

const refreshed = sessionFor(ALICE, { access_token: 'new-access', refresh_token: 'new-refresh' });

describe('request', () => {
  it('sends public requests without a token', async () => {
    const api = mockApi({ 'GET /movies': () => ({ data: [] }) });

    await request('/movies');

    expect(api.calls[0].headers).not.toHaveProperty('Authorization');
  });

  it('sends the access token on authenticated requests', async () => {
    signIn();
    const api = mockApi({ 'GET /watchlist': () => [] });

    await request('/watchlist', { auth: true });

    expect(api.calls[0].headers.Authorization).toBe('Bearer access-token');
  });

  it('refuses an authenticated request when signed out, without calling the server', async () => {
    const api = mockApi({});

    await expect(request('/watchlist', { auth: true })).rejects.toMatchObject({ status: 401 });
    expect(api.calls).toHaveLength(0);
  });

  it('turns an error response into an ApiError with the server message', async () => {
    mockApi({ 'GET /movies/9': () => json({ error: 'Movie not found' }, 404) });

    const error = await request('/movies/9').catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: 'Movie not found' });
  });

  it('reports an unreachable server as status 0 with a readable message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    const error = await request('/movies').catch((err) => err);

    expect(error).toMatchObject({ status: 0 });
    expect(error.message).toMatch(/could not reach the server/i);
  });

  it('returns null for 204 responses', async () => {
    signIn();
    mockApi({ 'DELETE /reviews/1': () => json(null, 204) });

    await expect(request('/reviews/1', { method: 'DELETE', auth: true })).resolves.toBeNull();
  });
});

describe('session refresh', () => {
  it('refreshes before the request when the token is about to expire', async () => {
    signIn(ALICE, { expires_at: Math.floor(Date.now() / 1000) + 10 });
    const api = mockApi({
      'POST /auth/refresh': () => refreshed,
      'GET /watchlist': () => [],
    });

    await request('/watchlist', { auth: true });

    expect(api.calls.map((call) => call.path)).toEqual(['/auth/refresh', '/watchlist']);
    expect(api.calls[0].body).toEqual({ refresh_token: 'refresh-token' });
    expect(api.calls[1].headers.Authorization).toBe('Bearer new-access');
    expect(sessionStore.get().session.refresh_token).toBe('new-refresh');
  });

  it('refreshes and retries once when the server answers 401', async () => {
    signIn();
    let attempts = 0;
    const api = mockApi({
      'GET /watchlist': () => (attempts++ === 0 ? json({ error: 'expired' }, 401) : ['ok']),
      'POST /auth/refresh': () => refreshed,
    });

    await expect(request('/watchlist', { auth: true })).resolves.toEqual(['ok']);
    expect(api.to('GET', '/watchlist')).toHaveLength(2);
    expect(api.to('POST', '/auth/refresh')).toHaveLength(1);
  });

  it('shares one refresh between requests that expire together', async () => {
    signIn(ALICE, { expires_at: 0 });
    const api = mockApi({
      'POST /auth/refresh': () => refreshed,
      'GET /watchlist': () => [],
      'GET /users/profile': () => ({}),
    });

    await Promise.all([
      request('/watchlist', { auth: true }),
      request('/users/profile', { auth: true }),
    ]);

    expect(api.to('POST', '/auth/refresh')).toHaveLength(1);
  });

  it('ends the session and notifies when the refresh token is rejected', async () => {
    signIn(ALICE, { expires_at: 0 });
    const onExpired = vi.fn();
    const unsubscribe = sessionStore.onExpired(onExpired);
    mockApi({ 'POST /auth/refresh': () => json({ error: 'Session expired' }, 401) });

    await expect(request('/watchlist', { auth: true })).rejects.toMatchObject({ status: 401 });

    expect(sessionStore.get()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('keeps the session when the refresh fails for a network reason', async () => {
    signIn(ALICE, { expires_at: 0 });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    await expect(request('/watchlist', { auth: true })).rejects.toMatchObject({ status: 0 });

    expect(sessionStore.get()).not.toBeNull();
  });
});
