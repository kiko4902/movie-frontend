import { request } from './client';

export { ApiError, sessionStore } from './client';

// Drops empty values so the URL only carries filters that are actually set.
function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(','));
    } else {
      search.set(key, value);
    }
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: { email, password } }),
    register: ({ email, password, username }) =>
      request('/auth/register', {
        method: 'POST',
        body: { email, password, ...(username && { username }) },
      }),
    demo: () => request('/auth/demo', { method: 'POST' }),
  },

  movies: {
    list: (params, signal) => request(`/movies${queryString(params)}`, { signal }),
    search: (params, signal) => request(`/search${queryString(params)}`, { signal }),
    // Includes genres and reviews, so the detail page needs only this one call.
    get: (id, signal) => request(`/movies/${id}`, { signal }),
  },

  genres: {
    list: (signal) => request('/genres', { signal }),
  },

  reviews: {
    create: (movieId, review) =>
      request(`/reviews/${movieId}`, { method: 'POST', body: review, auth: true }),
    update: (reviewId, review) =>
      request(`/reviews/${reviewId}`, { method: 'PUT', body: review, auth: true }),
    remove: (reviewId) => request(`/reviews/${reviewId}`, { method: 'DELETE', auth: true }),
  },

  watchlist: {
    list: (signal) => request('/watchlist', { auth: true, signal }),
    add: (movieId) => request(`/watchlist/${movieId}`, { method: 'PUT', auth: true }),
    remove: (movieId) => request(`/watchlist/${movieId}`, { method: 'DELETE', auth: true }),
  },

  users: {
    getProfile: (signal) => request('/users/profile', { auth: true, signal }),
    updateProfile: (profile) =>
      request('/users/profile', { method: 'PUT', body: profile, auth: true }),
  },
};

export default api;
