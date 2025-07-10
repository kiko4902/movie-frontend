import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import './Search.css';
import MovieCard from '../components/MovieCard';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [genres, setGenres] = useState([]);
  const [filters, setFilters] = useState({
    query: '',
    minYear: 1900,
    maxYear: new Date().getFullYear(),
    selectedGenres: [],
    sortBy: '' 
  });

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await api.genres.getAll();
        setGenres(response.data || []);
      } catch (err) {
        console.error('Failed to fetch genres:', err);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    setFilters({
      query: searchParams.get('q') || searchParams.get('query') || '',
      minYear: parseInt(searchParams.get('minYear')) || 1900,
      maxYear: parseInt(searchParams.get('maxYear')) || new Date().getFullYear(),
      selectedGenres: searchParams.get('genres')?.split(',').map(Number).filter(Number.isInteger) || [],
      sortBy: searchParams.get('sortBy') || '' 
    });
  }, [searchParams]);

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, query: e.target.value }));
  };

  const handleSortChange = (value) => {
    setFilters(prev => ({ ...prev, sortBy: value }));
  };

  const toggleGenre = (genreId) => {
    setFilters(prev => {
      const newGenres = prev.selectedGenres.includes(genreId)
        ? prev.selectedGenres.filter(id => id !== genreId)
        : [...prev.selectedGenres, genreId];
      return { ...prev, selectedGenres: newGenres };
    });
  };

  const handleYearRangeChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    
    setFilters(prev => {
      if (name === 'minYear' && numValue > prev.maxYear) {
        return { ...prev, minYear: prev.maxYear };
      }
      if (name === 'maxYear' && numValue < prev.minYear) {
        return { ...prev, maxYear: prev.minYear };
      }
      return { ...prev, [name]: numValue };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        q: filters.query,
        minYear: filters.minYear,
        maxYear: filters.maxYear
      };

      if (filters.selectedGenres.length > 0) {
        params.genres = filters.selectedGenres.join(',');
      }
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
      }

      const response = await api.movies.search(params);
      setMovies(response.data || []);
      
      const urlParams = {};
      if (filters.query) urlParams.query = filters.query;
      if (filters.minYear !== 1900) urlParams.minYear = filters.minYear;
      if (filters.maxYear !== new Date().getFullYear()) urlParams.maxYear = filters.maxYear;
      if (filters.selectedGenres.length > 0) urlParams.genres = filters.selectedGenres.join(',');
      if (filters.sortBy) urlParams.sortBy = filters.sortBy;
      
      setSearchParams(urlParams);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <h1>Search Movies</h1>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={filters.query}
            onChange={handleSearchChange}
            placeholder="Search by title..."
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>Release Year Range: {filters.minYear} - {filters.maxYear}</label>
            <div 
              className="range-slider"
              style={{
                '--min': filters.minYear,
                '--max': filters.maxYear,
                '--max-year': new Date().getFullYear()
              }}
            >
              <input
                type="range"
                name="minYear"
                min="1900"
                max={new Date().getFullYear()}
                value={filters.minYear}
                onChange={handleYearRangeChange}
                className="slider-input min-slider"
              />
              <input
                type="range"
                name="maxYear"
                min="1900"
                max={new Date().getFullYear()}
                value={filters.maxYear}
                onChange={handleYearRangeChange}
                className="slider-input max-slider"
              />
            </div>
            <div className="year-labels">
              <span>1900</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          </div>

          <div className="filter-group">
            <label>Genres</label>
            <div className="genre-buttons">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  type="button"
                  className={`genre-button ${filters.selectedGenres.includes(genre.id) ? 'active' : ''}`}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">Error: {error}</div>}
      
      {movies.length > 0 ? (
        <div className="movies-grid">
          {movies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        !loading && !error && (
          <div className="no-results">
            No movies found matching your criteria
          </div>
        )
      )}
    </div>
  );
}