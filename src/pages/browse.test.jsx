import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { json, mockApi, movie, page, renderApp, signIn } from '../test/utils';

const twenty = Array.from({ length: 20 }, (_, index) =>
  movie({ id: index + 1, title: `Movie ${index + 1}` }),
);

const location = () => screen.getByTestId('location').textContent;

describe('Movies', () => {
  it('shows skeletons, then the movies', async () => {
    let finish;
    mockApi({ 'GET /movies': () => new Promise((resolve) => (finish = resolve)) });

    renderApp('/movies');
    expect(await screen.findByRole('status', { name: 'Loading movies' })).toBeInTheDocument();

    finish(page(twenty));
    expect(await screen.findByText('Movie 20')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading movies' })).not.toBeInTheDocument();
  });

  it('keeps page and sort in the URL', async () => {
    const api = mockApi({
      'GET /movies': ({ query }) =>
        page(twenty, { page: Number(query.page), total: 1000, total_pages: 50 }),
    });
    const { user } = renderApp('/movies?page=2');

    await screen.findByText('Movie 1');
    expect(api.calls[0].query).toEqual({ page: '2', sortBy: 'rating' });

    await user.selectOptions(screen.getByLabelText('Sort by'), 'title');

    await waitFor(() => expect(location()).toBe('/movies?sortBy=title'));
    expect(api.calls.at(-1).query).toEqual({ page: '1', sortBy: 'title' });
  });

  it('shows an error state with retry', async () => {
    let attempts = 0;
    mockApi({
      'GET /movies': () =>
        attempts++ === 0 ? json({ error: 'Internal server error' }, 500) : page(twenty),
    });
    const { user } = renderApp('/movies');

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load movies');
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Movie 1')).toBeInTheDocument();
  });
});

describe('watchlist on movie cards', () => {
  it('fetches the watchlist once for the whole grid', async () => {
    signIn();
    const api = mockApi({
      'GET /movies': () => page(twenty),
      'GET /watchlist': () => [twenty[2]],
    });

    renderApp('/movies');

    // Regression: every card used to request the watchlist itself (20 calls a page).
    expect(
      await screen.findByRole('button', { name: 'Remove Movie 3 from watchlist' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Add Movie 1 to watchlist' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(api.to('GET', '/watchlist')).toHaveLength(1);
  });

  it('keeps the watchlist button outside the card link', async () => {
    signIn();
    mockApi({ 'GET /movies': () => page(twenty.slice(0, 1)), 'GET /watchlist': () => [] });

    renderApp('/movies');

    const button = await screen.findByRole('button', { name: 'Add Movie 1 to watchlist' });
    expect(button.closest('a')).toBeNull();
    const card = button.closest('article');
    expect(within(card).getByRole('link')).toHaveAttribute('href', '/movies/1');
  });

  it('has no watchlist buttons for signed-out visitors, and asks for no watchlist', async () => {
    const api = mockApi({ 'GET /movies': () => page(twenty.slice(0, 2)) });

    renderApp('/movies');

    await screen.findByText('Movie 1');
    expect(screen.queryByRole('button', { name: /watchlist/ })).not.toBeInTheDocument();
    expect(api.to('GET', '/watchlist')).toHaveLength(0);
  });

  it('adds a movie and confirms it', async () => {
    signIn();
    const api = mockApi({
      'GET /movies': () => page(twenty.slice(0, 1)),
      'GET /watchlist': () => [],
      'PUT /watchlist/1': () => ({ movie_id: 1, in_watchlist: true }),
    });
    const { user } = renderApp('/movies');

    await user.click(await screen.findByRole('button', { name: 'Add Movie 1 to watchlist' }));

    expect(
      await screen.findByRole('button', { name: 'Remove Movie 1 from watchlist' }),
    ).toBeInTheDocument();
    expect(api.to('PUT', '/watchlist/1')).toHaveLength(1);
    expect(await screen.findByText(/Added “Movie 1”/)).toBeInTheDocument();
  });

  it('undoes the change and reports it when the server refuses', async () => {
    signIn();
    mockApi({
      'GET /movies': () => page(twenty.slice(0, 1)),
      'GET /watchlist': () => [],
      'PUT /watchlist/1': () => json({ error: 'Movie not found' }, 404),
    });
    const { user } = renderApp('/movies');

    await user.click(await screen.findByRole('button', { name: 'Add Movie 1 to watchlist' }));

    expect(await screen.findByText('Movie not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Movie 1 to watchlist' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

describe('Watchlist page', () => {
  it('lists saved movies and removes one', async () => {
    signIn();
    const api = mockApi({
      'GET /watchlist': () => twenty.slice(0, 2),
      'DELETE /watchlist/1': () => ({ movie_id: 1, in_watchlist: false }),
    });
    const { user } = renderApp('/watchlist');

    await user.click(await screen.findByRole('button', { name: 'Remove Movie 1 from watchlist' }));

    await waitFor(() => expect(screen.queryByText('Movie 1')).not.toBeInTheDocument());
    expect(screen.getByText('Movie 2')).toBeInTheDocument();
    expect(api.to('DELETE', '/watchlist/1')).toHaveLength(1);
  });

  it('explains an empty watchlist', async () => {
    signIn();
    mockApi({ 'GET /watchlist': () => [] });

    renderApp('/watchlist');

    expect(
      await screen.findByRole('heading', { name: 'Your watchlist is empty' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse movies' })).toHaveAttribute('href', '/movies');
  });

  it('shows an error with retry when it cannot be loaded', async () => {
    signIn();
    let attempts = 0;
    mockApi({
      'GET /watchlist': () =>
        attempts++ === 0 ? json({ error: 'Internal server error' }, 500) : twenty.slice(0, 1),
    });
    const { user } = renderApp('/watchlist');

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Movie 1')).toBeInTheDocument();
  });
});

describe('Home', () => {
  it('invites signed-out visitors to join', async () => {
    mockApi({ 'GET /movies': () => page(twenty.slice(0, 6)) });

    renderApp('/');

    expect(await screen.findByRole('link', { name: 'Join now' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('does not show "Join now" to someone already signed in', async () => {
    signIn();
    mockApi({ 'GET /movies': () => page(twenty.slice(0, 6)), 'GET /watchlist': () => [] });

    renderApp('/');

    expect(await screen.findByRole('link', { name: 'Your watchlist' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Join now' })).not.toBeInTheDocument();
  });

  it('still renders when the top-rated request fails', async () => {
    mockApi({ 'GET /movies': () => json({ error: 'Internal server error' }, 500) });

    renderApp('/');

    expect(await screen.findByRole('link', { name: 'Browse movies' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Top rated' })).not.toBeInTheDocument(),
    );
  });
});

describe('Layout', () => {
  it('has a menu button that reports its state and closes after navigating', async () => {
    mockApi({ 'GET /movies': () => page(twenty.slice(0, 6)) });
    const { user } = renderApp('/');

    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('link', { name: 'Movies' }));
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'false'));
  });

  it('offers a skip link to the main content', async () => {
    mockApi({ 'GET /movies': () => page([]) });
    renderApp('/');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });
});

describe('Profile', () => {
  const profile = {
    user_id: 'user-alice',
    username: 'alice',
    email: 'alice@example.com',
    created_at: '2026-01-01T00:00:00+00:00',
  };

  it('saves a new username and shows it in the header', async () => {
    signIn();
    const api = mockApi({
      'GET /watchlist': () => [],
      'GET /users/profile': () => profile,
      'PUT /users/profile': ({ body }) => ({ ...profile, ...body }),
    });
    const { user } = renderApp('/profile');

    const input = await screen.findByLabelText('Username');
    expect(screen.getByRole('button', { name: 'Save username' })).toBeDisabled();
    await user.clear(input);
    await user.type(input, 'alice_2');
    await user.click(screen.getByRole('button', { name: 'Save username' }));

    expect(await screen.findByRole('link', { name: 'alice_2' })).toBeInTheDocument();
    expect(api.to('PUT', '/users/profile')[0].body).toEqual({ username: 'alice_2' });
  });

  it('shows the reason when the username is rejected', async () => {
    signIn();
    mockApi({
      'GET /watchlist': () => [],
      'GET /users/profile': () => profile,
      'PUT /users/profile': () => json({ error: 'That username is already taken' }, 409),
    });
    const { user } = renderApp('/profile');

    const input = await screen.findByLabelText('Username');
    await user.clear(input);
    await user.type(input, 'bob');
    await user.click(screen.getByRole('button', { name: 'Save username' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That username is already taken');
  });
});
