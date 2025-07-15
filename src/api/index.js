import axios from 'axios';

const api = axios.create({
  baseURL: 'https://webprojectbackend-production.up.railway.app',
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  if (config.url.includes('/auth')) {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  return config;
});
api.interceptors.request.use(config => {
  const session = JSON.parse(localStorage.getItem('supabase_session'));
  if (session?.session?.access_token) {
    config.headers.Authorization = `Bearer ${session.session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('supabase_session');
      
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

const apiService = {
  auth: {
    login: (email, password) => api.post('/auth/login', { email, password }),
    signup: (email, password) => api.post('/auth/register', { email, password }),
  },
  movies: {
    search: (params) => api.get('/search', { 
    params: {
      q: params.query || params.q,         
      genres: params.genres,    
      minYear: params.minYear, 
      maxYear: params.maxYear, 
      sortBy: params.sortBy     
    }
  }),
    getPaginated: (page = 1) => api.get(`/movies?page=${page}`),
    getById: (id) => api.get(`/movies/${id}`),
  },
  reviews: {
    getForMovie: (movieId) => api.get(`/movies/${movieId}/reviews`),
    create: (movieId, data) => {
      const payload = {
        rating: Number(data.rating),
        comment: data.comment
      };
      console.log('Review create payload:', payload, 'Type of rating:', typeof payload.rating);
      return api.post(`/reviews/${movieId}`, payload);
    },
    delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
    update: (reviewId, data) => {
      const payload = {
        rating: Number(data.rating),
        comment: data.comment
      };
      return api.put(`/reviews/${reviewId}`, payload);
    }
  },
  watchlist: {
    get: () => api.get('/watchlist'),
    toggle: (movieId) => api.post('/watchlist/toggle', { movie_id: movieId }),
  },
    users: {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.post('/users/profile', data),
  },
  genres: {
    getAll: () => api.get('/genres'),
  },
};

export default apiService;
