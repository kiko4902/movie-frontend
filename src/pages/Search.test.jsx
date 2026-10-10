import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { json, mockApi, movie, page, renderApp } from '../test/utils';

const GENRES = [
  { id: 1, name: 'Action' },
  { id: 7, name: 'Drama' },
];

const searchApi = (search = () => page([movie()])) =>
  mockApi({ 'GET /genres': () => GENRES, 'GET /search': search });

const location = () => screen.getByTestId('location').textContent;

describe('Search', () => {
  it('searches once typing pauses, not on every keystroke', async () => {
    const api = searchApi();
    const { user } = renderApp('/search');
    await screen.findByText('1 movie found');
    const before = api.to('GET', '/search').length;

    await user.type(screen.getByLabelText('Title'), 'shaw');

    await waitFor(() => expect(location()).toBe('/search?q=shaw'));
    await screen.findByText('1 movie found');
    const after = api.to('GET', '/search').slice(before);
    // one request for the finished word, none for "s", "sh" or "sha"
    expect(after.map((call) => call.query.q)).toEqual(['shaw']);
  });

  it('reads every filter from the URL, so a search can be shared or reloaded', async () => {
    const api = searchApi();

    renderApp('/search?q=god&genres=7&minYear=1970&maxYear=1980&minRating=9&sortBy=year&page=2');

    await screen.findByText('1 movie found');
    expect(api.to('GET', '/search')[0].query).toEqual({
      q: 'god',
      genres: '7',
      minYear: '1970',
      maxYear: '1980',
      minRating: '9',
      sortBy: 'year',
      page: '2',
    });
    expect(screen.getByLabelText('Title')).toHaveValue('god');
    expect(screen.getByRole('button', { name: 'Drama' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('From year')).toHaveValue(1970);
    expect(screen.getByLabelText('Minimum IMDb rating')).toHaveValue('9');
    expect(screen.getByLabelText('Sort by')).toHaveValue('year');
  });

  it('toggles a genre and goes back to the first page', async () => {
    const api = searchApi();
    const { user } = renderApp('/search?q=god&page=3');

    await user.click(await screen.findByRole('button', { name: 'Drama' }));

    await waitFor(() => expect(location()).toBe('/search?q=god&genres=7'));
    expect(api.to('GET', '/search').at(-1).query).toMatchObject({ genres: '7', page: '1' });
  });

  it('pages through results and keeps the filters', async () => {
    const api = searchApi(({ query }) =>
      page([movie()], { page: Number(query.page), total: 45, total_pages: 3 }),
    );
    const { user } = renderApp('/search?q=the');

    await user.click(await screen.findByRole('button', { name: 'Next' }));

    await waitFor(() => expect(location()).toBe('/search?q=the&page=2'));
    expect(api.to('GET', '/search').at(-1).query).toMatchObject({ q: 'the', page: '2' });
    expect(await screen.findByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('says so when nothing matches', async () => {
    searchApi(() => page([]));

    renderApp('/search?q=zzzz');

    expect(
      await screen.findByRole('heading', { name: 'No movies match your search' }),
    ).toBeInTheDocument();
    expect(screen.getByText('0 movies found')).toBeInTheDocument();
  });

  it('shows an error with retry when the search fails', async () => {
    let attempts = 0;
    searchApi(() =>
      attempts++ === 0 ? json({ error: 'Internal server error' }, 500) : page([movie()]),
    );

    const { user } = renderApp('/search');
    expect(await screen.findByRole('heading', { name: 'Search failed' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('The Shawshank Redemption')).toBeInTheDocument();
  });

  it('clears all filters at once', async () => {
    searchApi();
    const { user } = renderApp('/search?q=god&genres=7');

    await user.click(await screen.findByRole('button', { name: 'Clear all filters' }));

    await waitFor(() => expect(location()).toBe('/search'));
    expect(screen.getByLabelText('Title')).toHaveValue('');
  });

  it('still searches when the genre list fails to load', async () => {
    mockApi({
      'GET /genres': () => json({ error: 'Internal server error' }, 500),
      'GET /search': () => page([movie()]),
    });

    renderApp('/search');

    expect(await screen.findByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText(/Genres could not be loaded/)).toBeInTheDocument();
  });
});
