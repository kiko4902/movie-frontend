import { useEffect, useEffectEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import MovieGrid, { MovieGridSkeleton } from '../components/MovieGrid';
import Pagination from '../components/Pagination';
import SortSelect from '../components/SortSelect';
import { EmptyState, ErrorState } from '../components/States';
import { useAsync } from '../hooks/useAsync';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePageTitle } from '../hooks/usePageTitle';
import { DEFAULT_SORT } from '../lib/sort';

const DEBOUNCE_MS = 350;
const FIRST_YEAR = 1900;
const THIS_YEAR = new Date().getFullYear();
const RATING_OPTIONS = [9, 8.5, 8, 7.5];

const toYear = (value) => {
  const year = Number.parseInt(value, 10);
  return year >= FIRST_YEAR && year <= THIS_YEAR ? year : undefined;
};

export default function Search() {
  usePageTitle('Search');

  // Every filter lives in the URL: the address bar is the single source of
  // truth, so a search can be reloaded, bookmarked, shared and stepped
  // through with the back button.
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const genres = (params.get('genres') || '').split(',').map(Number).filter(Boolean);
  const minYear = toYear(params.get('minYear'));
  const maxYear = toYear(params.get('maxYear'));
  const minRating = Number(params.get('minRating')) || undefined;
  const sortBy = params.get('sortBy') || DEFAULT_SORT;
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    if (!('page' in changes)) next.delete('page'); // any new filter starts at page 1
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '' || value === null) next.delete(key);
      else next.set(key, value);
    }
    // Typing replaces the current history entry; paging adds one.
    setParams(next, { replace: !('page' in changes) });
  };

  // The text box updates on every keystroke; the URL (and so the request)
  // follows once typing pauses.
  const [text, setText] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    // The URL changed from outside (back button, link): show that query.
    setSyncedQ(q);
    setText(q);
  }
  const debouncedText = useDebouncedValue(text, DEBOUNCE_MS).trim();
  const commitQuery = useEffectEvent((value) => {
    if (value !== q) update({ q: value });
  });
  useEffect(() => commitQuery(debouncedText), [debouncedText]);

  const genreList = useAsync((signal) => api.genres.list(signal), 'genres');

  const results = useAsync(
    (signal) => api.movies.search({ q, genres, minYear, maxYear, minRating, sortBy, page }, signal),
    `search-${params.toString()}`,
  );

  const toggleGenre = (id) => {
    const next = genres.includes(id) ? genres.filter((g) => g !== id) : [...genres, id];
    update({ genres: next.join(',') });
  };

  const hasFilters = Boolean(q || genres.length || minYear || maxYear || minRating);
  const total = results.data?.pagination.total;

  return (
    <>
      <h1>Search movies</h1>

      <form className="search-form" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="field">
          <label htmlFor="search-q">Title</label>
          <input
            id="search-q"
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Try “godfather” or just “god”"
            maxLength={100}
            autoComplete="off"
          />
        </div>

        <fieldset className="field">
          <legend>Genres</legend>
          {genreList.status === 'error' ? (
            <p className="field-hint">
              Genres could not be loaded.{' '}
              <button type="button" className="link-button" onClick={genreList.retry}>
                Try again
              </button>
            </p>
          ) : (
            <div className="chips">
              {(genreList.data || []).map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  className={`chip ${genres.includes(genre.id) ? 'is-active' : ''}`}
                  aria-pressed={genres.includes(genre.id)}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <div className="search-form-row">
          <div className="field">
            <label htmlFor="search-min-year">From year</label>
            <input
              id="search-min-year"
              type="number"
              inputMode="numeric"
              min={FIRST_YEAR}
              max={THIS_YEAR}
              placeholder={String(FIRST_YEAR)}
              defaultValue={minYear ?? ''}
              key={`min-${minYear}`}
              onBlur={(event) => update({ minYear: toYear(event.target.value) })}
              onKeyDown={(event) => event.key === 'Enter' && event.target.blur()}
            />
          </div>
          <div className="field">
            <label htmlFor="search-max-year">To year</label>
            <input
              id="search-max-year"
              type="number"
              inputMode="numeric"
              min={FIRST_YEAR}
              max={THIS_YEAR}
              placeholder={String(THIS_YEAR)}
              defaultValue={maxYear ?? ''}
              key={`max-${maxYear}`}
              onBlur={(event) => update({ maxYear: toYear(event.target.value) })}
              onKeyDown={(event) => event.key === 'Enter' && event.target.blur()}
            />
          </div>
          <div className="field">
            <label htmlFor="search-min-rating">Minimum IMDb rating</label>
            <select
              id="search-min-rating"
              value={minRating ?? ''}
              onChange={(event) => update({ minRating: event.target.value })}
            >
              <option value="">Any</option>
              {RATING_OPTIONS.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}+
                </option>
              ))}
            </select>
          </div>
          <SortSelect
            id="search-sort"
            value={sortBy}
            onChange={(value) => update({ sortBy: value === DEFAULT_SORT ? '' : value })}
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setText('');
              setParams({}, { replace: true });
            }}
          >
            Clear all filters
          </button>
        )}
      </form>

      <p className="results-summary" role="status">
        {results.status === 'ready' &&
          (total === 1 ? '1 movie found' : `${total.toLocaleString()} movies found`)}
      </p>

      {results.status === 'loading' && <MovieGridSkeleton count={10} />}
      {results.status === 'error' && (
        <ErrorState title="Search failed" error={results.error} onRetry={results.retry} />
      )}
      {results.status === 'ready' &&
        (results.data.data.length === 0 ? (
          <EmptyState title="No movies match your search">
            Try a shorter title, or remove a filter.
          </EmptyState>
        ) : (
          <>
            <MovieGrid movies={results.data.data} />
            <Pagination
              page={results.data.pagination.page}
              totalPages={results.data.pagination.total_pages}
              onChange={(nextPage) => {
                update({ page: nextPage > 1 ? String(nextPage) : '' });
                window.scrollTo({ top: 0 });
              }}
            />
          </>
        ))}
    </>
  );
}
