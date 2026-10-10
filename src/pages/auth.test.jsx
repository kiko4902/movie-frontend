import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sessionStore } from '../api';
import { ALICE, json, mockApi, movie, page, renderApp, sessionFor, signIn } from '../test/utils';

const location = () => screen.getByTestId('location').textContent;

const browse = { 'GET /movies': () => page([movie()]), 'GET /watchlist': () => [] };

describe('Login', () => {
  it('logs in, stores the session and goes to the movies', async () => {
    const api = mockApi({ ...browse, 'POST /auth/login': () => sessionFor() });
    const { user } = renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(location()).toBe('/movies'));
    expect(api.to('POST', '/auth/login')[0].body).toEqual({
      email: 'alice@example.com',
      password: 'secret1',
    });
    expect(sessionStore.get().user).toEqual(ALICE);
    expect(screen.getByRole('link', { name: 'alice' })).toHaveAttribute('href', '/profile');
  });

  it('shows the server message and stays on the page when login fails', async () => {
    mockApi({ 'POST /auth/login': () => json({ error: 'Invalid email or password' }, 401) });
    const { user } = renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(location()).toBe('/login');
    expect(sessionStore.get()).toBeNull();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
  });

  it('logs in to the demo account without sending any credentials', async () => {
    const demo = { id: 'user-demo', email: 'demo@example.com', username: 'demo' };
    const api = mockApi({ ...browse, 'POST /auth/demo': () => sessionFor(demo) });
    const { user } = renderApp('/login');

    await user.click(screen.getByRole('button', { name: 'Try the demo account' }));

    await waitFor(() => expect(location()).toBe('/movies'));
    expect(api.to('POST', '/auth/demo')[0].body).toBeUndefined();
    expect(screen.getByRole('link', { name: 'demo' })).toBeInTheDocument();
  });

  it('returns to the page that required the login', async () => {
    mockApi({
      'POST /auth/login': () => sessionFor(),
      'GET /watchlist': () => [],
    });
    const { user } = renderApp('/watchlist');

    await waitFor(() => expect(location()).toBe('/login'));
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(location()).toBe('/watchlist'));
    expect(
      await screen.findByRole('heading', { name: 'Your watchlist is empty' }),
    ).toBeInTheDocument();
  });
});

describe('Register', () => {
  const fill = async (user) => {
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password'), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));
  };

  it('creates the account with a username and signs in with one request', async () => {
    const api = mockApi({ ...browse, 'POST /auth/register': () => json(sessionFor(), 201) });
    const { user } = renderApp('/register');

    await fill(user);

    await waitFor(() => expect(location()).toBe('/movies'));
    expect(api.to('POST', '/auth/register')[0].body).toEqual({
      email: 'alice@example.com',
      username: 'alice',
      password: 'secret1',
    });
    expect(api.to('POST', '/auth/login')).toHaveLength(0);
  });

  it('shows why registration failed', async () => {
    mockApi({
      'POST /auth/register': () => json({ error: 'That username is already taken' }, 409),
    });
    const { user } = renderApp('/register');

    await fill(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('That username is already taken');
    expect(location()).toBe('/register');
  });

  it('explains the next step when email confirmation is required', async () => {
    mockApi({
      'POST /auth/register': () =>
        json(
          { user: ALICE, session: null, message: 'Check your email to confirm your account' },
          201,
        ),
    });
    const { user } = renderApp('/register');

    await fill(user);

    expect(await screen.findByText('Check your email to confirm your account')).toBeInTheDocument();
    expect(sessionStore.get()).toBeNull();
  });
});

describe('route guards and session', () => {
  it.each(['/watchlist', '/profile'])(
    'sends signed-out visitors from %s to login',
    async (path) => {
      mockApi({});
      renderApp(path);
      await waitFor(() => expect(location()).toBe('/login'));
    },
  );

  it('keeps signed-in users away from the login page', async () => {
    signIn();
    mockApi({ 'GET /watchlist': () => [], 'GET /movies': () => page([]) });

    renderApp('/login');

    await waitFor(() => expect(location()).toBe('/movies'));
  });

  it('logs out and hides account-only navigation', async () => {
    signIn();
    mockApi({ 'GET /watchlist': () => [], 'GET /movies': () => page([movie()]) });
    const { user } = renderApp('/movies');

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(sessionStore.get()).toBeNull();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Watchlist' })).not.toBeInTheDocument();
  });

  it('signs the user out with a message when the session can no longer be refreshed', async () => {
    signIn(ALICE, { expires_at: 0 });
    mockApi({
      'POST /auth/refresh': () => json({ error: 'Session expired' }, 401),
      'GET /movies': () => page([movie()]),
    });

    renderApp('/movies');

    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows a not-found page for unknown addresses', async () => {
    mockApi({});
    renderApp('/no/such/page');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
