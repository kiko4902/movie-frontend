import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes, Providers } from '../App';

export const API = 'http://api.test';

export const ALICE = { id: 'user-alice', email: 'alice@example.com', username: 'alice' };

const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;

export const sessionFor = (user = ALICE, overrides = {}) => ({
  user,
  session: {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_at: inAnHour(),
    ...overrides,
  },
});

export const signIn = (user = ALICE, overrides) => {
  localStorage.setItem('moviedb_session', JSON.stringify(sessionFor(user, overrides)));
};

export const movie = (overrides = {}) => ({
  id: 1,
  title: 'The Shawshank Redemption',
  overview: 'Two imprisoned men bond over a number of years.',
  poster_thumb_url: 'https://m.media-amazon.com/images/M/abc@._V1_QL75_UX300_.jpg',
  poster_large_url: 'https://m.media-amazon.com/images/M/abc@._V1_QL75_UX600_.jpg',
  certificate: 'A',
  runtime: '142 min',
  imdb_rating: 9.3,
  meta_score: 80,
  no_of_votes: 2343110,
  gross: '28,341,469',
  year: 1994,
  avg_rating: null,
  ...overrides,
});

export const review = (overrides = {}) => ({
  id: 10,
  user_id: 'user-bob',
  movie_id: 1,
  rating: 4,
  comment: 'A classic.',
  created_at: '2026-01-05T10:00:00+00:00',
  updated_at: null,
  username: 'bob',
  ...overrides,
});

export const page = (movies, overrides = {}) => ({
  data: movies,
  pagination: { page: 1, limit: 20, total: movies.length, total_pages: 1, ...overrides },
});

export const json = (body, status = 200) => ({ status, body });

// Replaces fetch with a table of handlers keyed by "METHOD /path".
// Each handler gets { query, body, headers } and returns json(...) or a plain
// body. A request with no handler fails the test loudly rather than hanging.
export function mockApi(routes) {
  const calls = [];

  const fetchMock = vi.fn(async (input, init = {}) => {
    const url = new URL(input);
    const method = init.method || 'GET';
    const call = {
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body: init.body ? JSON.parse(init.body) : undefined,
      headers: init.headers || {},
    };
    calls.push(call);

    const handler = routes[`${method} ${url.pathname}`];
    if (!handler) throw new Error(`Unexpected request in test: ${method} ${url.pathname}`);

    const result = await handler(call);
    const { status, body } =
      result && typeof result === 'object' && 'status' in result && 'body' in result
        ? result
        : { status: 200, body: result };

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  });

  vi.stubGlobal('fetch', fetchMock);

  return {
    calls,
    to: (method, path) => calls.filter((call) => call.method === method && call.path === path),
  };
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

// Renders the whole app at `route`, with real providers and router.
export function renderApp(route = '/') {
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={[route]}>
      <Providers>
        <AppRoutes />
        <LocationProbe />
      </Providers>
    </MemoryRouter>,
  );
  return { user, ...view };
}
