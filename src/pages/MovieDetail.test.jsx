import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ALICE, json, mockApi, movie, renderApp, review, signIn } from '../test/utils';

const detail = (overrides = {}) => ({
  ...movie(),
  genres: [{ id: 7, name: 'Drama' }],
  reviews: [review()],
  ...overrides,
});

describe('MovieDetail', () => {
  it('shows the release year from the API, not a date parsed from it', async () => {
    mockApi({ 'GET /movies/1': () => detail() });

    renderApp('/movies/1');

    // Regression: the year used to go through new Date(1994), which is 1970.
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('The Shawshank Redemption (1994)');
    expect(heading).not.toHaveTextContent('1970');
  });

  it('loads the movie, its genres and its reviews with a single request', async () => {
    const api = mockApi({ 'GET /movies/1': () => detail() });

    renderApp('/movies/1');

    expect(await screen.findByText('A classic.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Drama' })).toHaveAttribute('href', '/search?genres=7');
    expect(api.calls.map((call) => call.path)).toEqual(['/movies/1']);
  });

  it('shows a skeleton while loading', async () => {
    mockApi({ 'GET /movies/1': () => new Promise(() => {}) });

    renderApp('/movies/1');

    expect(await screen.findByRole('status', { name: 'Loading movie' })).toBeInTheDocument();
  });

  it('shows "not found" for a missing movie', async () => {
    mockApi({ 'GET /movies/999': () => json({ error: 'Movie not found' }, 404) });

    renderApp('/movies/999');

    expect(await screen.findByRole('heading', { name: 'Movie not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse all movies' })).toBeInTheDocument();
  });

  it('shows an error with a retry that works', async () => {
    let attempts = 0;
    mockApi({
      'GET /movies/1': () =>
        attempts++ === 0 ? json({ error: 'Internal server error' }, 500) : detail(),
    });

    const { user } = renderApp('/movies/1');
    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Shawshank');
  });

  it('falls back to the placeholder when a poster fails to load', async () => {
    mockApi({ 'GET /movies/1': () => detail() });
    renderApp('/movies/1');

    const poster = await screen.findByAltText('Poster for The Shawshank Redemption');
    poster.dispatchEvent(new Event('error'));

    await waitFor(() => expect(poster).toHaveAttribute('src', '/poster-placeholder.svg'));
  });

  it('asks signed-out visitors to log in instead of showing the form', async () => {
    mockApi({ 'GET /movies/1': () => detail() });

    renderApp('/movies/1');

    expect(await screen.findByText(/to write a review/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Post review' })).not.toBeInTheDocument();
  });
});

describe('reviews on MovieDetail', () => {
  const signedInApi = (routes) => mockApi({ 'GET /watchlist': () => [], ...routes });

  it('posts a review and shows it without reloading the movie', async () => {
    signIn();
    const api = signedInApi({
      'GET /movies/1': () => detail({ reviews: [] }),
      'POST /reviews/1': ({ body }) =>
        json(review({ id: 11, user_id: ALICE.id, username: 'alice', ...body }), 201),
    });

    const { user } = renderApp('/movies/1');
    await user.selectOptions(await screen.findByLabelText('Rating'), '3');
    await user.type(screen.getByLabelText('Review (optional)'), 'Slow but rewarding');
    await user.click(screen.getByRole('button', { name: 'Post review' }));

    expect(await screen.findByText('Slow but rewarding')).toBeInTheDocument();
    expect(api.to('POST', '/reviews/1')[0].body).toEqual({
      rating: 3,
      comment: 'Slow but rewarding',
    });
    expect(api.to('POST', '/reviews/1')[0].headers.Authorization).toBe('Bearer access-token');
    expect(api.to('GET', '/movies/1')).toHaveLength(1);
    // one review per movie: the form goes away
    expect(screen.queryByRole('button', { name: 'Post review' })).not.toBeInTheDocument();
    expect(screen.getByText('Review posted')).toBeInTheDocument();
  });

  it('shows the server message in the form when posting fails', async () => {
    signIn();
    signedInApi({
      'GET /movies/1': () => detail({ reviews: [] }),
      'POST /reviews/1': () => json({ error: 'You have already reviewed this movie' }, 409),
    });

    const { user } = renderApp('/movies/1');
    await user.click(await screen.findByRole('button', { name: 'Post review' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You have already reviewed this movie',
    );
  });

  it('offers edit and delete only on the reviewer’s own review', async () => {
    signIn();
    signedInApi({
      'GET /movies/1': () =>
        detail({
          reviews: [
            review({ id: 11, user_id: ALICE.id, username: 'alice', comment: 'Mine' }),
            review(),
          ],
        }),
    });

    renderApp('/movies/1');

    const mine = (await screen.findByText('Mine')).closest('li');
    const theirs = screen.getByText('A classic.').closest('li');
    expect(within(mine).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(theirs).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(theirs).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('edits a review in place', async () => {
    signIn();
    const own = review({ id: 11, user_id: ALICE.id, username: 'alice', comment: 'Mine' });
    const api = signedInApi({
      'GET /movies/1': () => detail({ reviews: [own] }),
      'PUT /reviews/11': ({ body }) => ({ ...own, ...body, updated_at: '2026-02-01T00:00:00Z' }),
    });

    const { user } = renderApp('/movies/1');
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const comment = screen.getByLabelText('Review (optional)');
    await user.clear(comment);
    await user.type(comment, 'Better on a second watch');
    await user.selectOptions(screen.getByLabelText('Rating'), '5');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Better on a second watch')).toBeInTheDocument();
    expect(screen.getByText(/edited/)).toBeInTheDocument();
    expect(api.to('PUT', '/reviews/11')[0].body).toEqual({
      rating: 5,
      comment: 'Better on a second watch',
    });
  });

  it('asks for confirmation before deleting, then removes the review', async () => {
    signIn();
    const api = signedInApi({
      'GET /movies/1': () =>
        detail({ reviews: [review({ id: 11, user_id: ALICE.id, comment: 'Mine' })] }),
      'DELETE /reviews/11': () => json(null, 204),
    });

    const { user } = renderApp('/movies/1');
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(api.to('DELETE', '/reviews/11')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    await waitFor(() => expect(screen.queryByText('Mine')).not.toBeInTheDocument());
    expect(api.to('DELETE', '/reviews/11')).toHaveLength(1);
    // the form is back, since the user no longer has a review here
    expect(screen.getByRole('button', { name: 'Post review' })).toBeInTheDocument();
  });

  it('keeps the review and says so when deleting fails', async () => {
    signIn();
    signedInApi({
      'GET /movies/1': () =>
        detail({ reviews: [review({ id: 11, user_id: ALICE.id, comment: 'Mine' })] }),
      'DELETE /reviews/11': () => json({ error: 'Internal server error' }, 500),
    });

    const { user } = renderApp('/movies/1');
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(await screen.findByText('Internal server error')).toBeInTheDocument();
    expect(screen.getByText('Mine')).toBeInTheDocument();
  });

  it('shows the average of user ratings', async () => {
    mockApi({
      'GET /movies/1': () =>
        detail({ reviews: [review({ rating: 5 }), review({ id: 12, rating: 2 })] }),
    });

    renderApp('/movies/1');

    const term = await screen.findByText('User rating');
    expect(term.nextElementSibling).toHaveTextContent('3.5/5');
  });
});
