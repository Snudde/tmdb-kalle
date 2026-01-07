import type { TMDBMovie, DatabaseMovie } from "../types/movie";
import { getPopularMoviesTMDB, searchMoviesTMDB } from "../services/tmdbApi";
import {
  getWatchlistMovies,
  getWatchedMovies,
  addToWatchlist as apiAddToWatchlist,
  markAsWatched as apiMarkAsWatched,
  deleteMovie as apiDeleteMovie,
  updateMovie as apiUpdateMovie, // ← Lägg till denna
} from "../services/movieApi";

class Store {
  renderCallback: () => void;

  // TMDB filmer (browse)
  browseMovies: TMDBMovie[] = [];
  searchQuery: string = "";
  isLoading: boolean = false;

  // Backend filmer (watchlist & watched)
  watchlistMovies: DatabaseMovie[] = [];
  watchedMovies: DatabaseMovie[] = [];

  // Filter state för watched
  watchedFilter: "all" | "favorites" | "5" | "4" | "3" | "2" | "1" = "all";

  constructor() {
    this.renderCallback = () => {};
  }

  // ========== TMDB BROWSE ==========

  async loadPopularMovies() {
    this.isLoading = true;
    this.triggerRender();

    try {
      this.browseMovies = await getPopularMoviesTMDB();
      this.searchQuery = "";
    } catch (error) {
      console.error("Failed to load popular movies:", error);
    } finally {
      this.isLoading = false;
      this.triggerRender();
    }
  }

  async searchMovies(query: string) {
    this.isLoading = true;
    this.searchQuery = query;
    this.triggerRender();

    try {
      this.browseMovies = await searchMoviesTMDB(query);
    } catch (error) {
      console.error("Failed to search movies:", error);
    } finally {
      this.isLoading = false;
      this.triggerRender();
    }
  }

  // Ta bort film
  async deleteMovie(movieId: number) {
    try {
      const success = await apiDeleteMovie(movieId);
      if (success) {
        // Ta bort från watchlist eller watched
        this.watchlistMovies = this.watchlistMovies.filter(
          (m) => m.id !== movieId
        );
        this.watchedMovies = this.watchedMovies.filter((m) => m.id !== movieId);
        this.triggerRender();
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      alert("Failed to delete movie");
    }
  }

  // Uppdatera film (för rating, review, favorite)
  async updateMovie(movieId: number, updates: Partial<DatabaseMovie>) {
    try {
      const result = await apiUpdateMovie(movieId, updates);
      if (result) {
        // Uppdatera i watched-listan
        const index = this.watchedMovies.findIndex((m) => m.id === movieId);
        if (index >= 0) {
          this.watchedMovies[index] = result;
        }
        this.triggerRender();
      }
    } catch (error) {
      console.error("Error updating movie:", error);
      alert("Failed to update movie");
    }
  }

  // Sätt filter för watched
  setWatchedFilter(filter: "all" | "favorites" | "5" | "4" | "3" | "2" | "1") {
    this.watchedFilter = filter;
    this.triggerRender();
  }

  // Hämta filtrerade watched-filmer
  getFilteredWatchedMovies(): DatabaseMovie[] {
    let filtered = [...this.watchedMovies];

    if (this.watchedFilter === "favorites") {
      filtered = filtered.filter((m) => m.is_favorite === 1);
    } else if (this.watchedFilter !== "all") {
      const rating = parseInt(this.watchedFilter);
      filtered = filtered.filter((m) => m.personal_rating === rating);
    }

    return filtered;
  }

  // ========== BACKEND INTEGRATION ==========

  // Ladda watchlist från backend
  async loadWatchlist() {
    try {
      this.watchlistMovies = await getWatchlistMovies();
      this.triggerRender();
    } catch (error) {
      console.error("Failed to load watchlist:", error);
    }
  }

  // Ladda watched från backend
  async loadWatched() {
    try {
      this.watchedMovies = await getWatchedMovies();
      this.triggerRender();
    } catch (error) {
      console.error("Failed to load watched movies:", error);
    }
  }

  findDatabaseMovie(tmdbId: number): DatabaseMovie | undefined {
    return [...this.watchlistMovies, ...this.watchedMovies].find(
      (m) => m.tmdb_id === tmdbId
    );
  }

  // Lägg till i watchlist
  async addToWatchlist(movie: TMDBMovie) {
    try {
      const result = await apiAddToWatchlist(movie);
      if (result) {
        this.watchlistMovies.push(result);
        this.triggerRender();
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      alert("This movie is already in your list!");
    }
  }

  // Markera som sedd
  async markAsWatched(movie: TMDBMovie) {
    try {
      // Kolla om filmen redan finns
      const existingMovie = this.findDatabaseMovie(movie.id);

      const result = await apiMarkAsWatched(movie, existingMovie);

      if (result) {
        // Om filmen fanns i watchlist, ta bort den därifrån
        if (existingMovie && existingMovie.status === "watchlist") {
          this.watchlistMovies = this.watchlistMovies.filter(
            (m) => m.id !== existingMovie.id
          );
        }

        // Lägg till i watched (eller uppdatera om den redan finns där)
        const existingWatchedIndex = this.watchedMovies.findIndex(
          (m) => m.id === result.id
        );

        if (existingWatchedIndex >= 0) {
          this.watchedMovies[existingWatchedIndex] = result;
        } else {
          this.watchedMovies.push(result);
        }

        this.triggerRender();
      }
    } catch (error) {
      console.error("Error marking as watched:", error);
      alert("Failed to mark movie as watched. Please try again.");
    }
  }

  // ========== HELPER METHODS ==========

  // Kolla om en film finns i watchlist eller watched
  getMovieStatus(tmdbId: number): "watchlist" | "watched" | null {
    if (this.watchlistMovies.some((m) => m.tmdb_id === tmdbId)) {
      return "watchlist";
    }
    if (this.watchedMovies.some((m) => m.tmdb_id === tmdbId)) {
      return "watched";
    }
    return null;
  }

  // Hitta en TMDB-film baserat på ID
  findTMDBMovie(tmdbId: number): TMDBMovie | undefined {
    return this.browseMovies.find((m) => m.id === tmdbId);
  }

  // ========== RENDER CALLBACK ==========

  setRenderCallback(renderApp: () => void) {
    this.renderCallback = renderApp;
  }

  triggerRender() {
    if (this.renderCallback) {
      this.renderCallback();
    }
  }
}

const store = new Store();

// Exportera metoder
export const loadPopularMovies = store.loadPopularMovies.bind(store);
export const searchMovies = store.searchMovies.bind(store);
export const loadWatchlist = store.loadWatchlist.bind(store);
export const loadWatched = store.loadWatched.bind(store);
export const addToWatchlist = store.addToWatchlist.bind(store);
export const markAsWatched = store.markAsWatched.bind(store);
export const getMovieStatus = store.getMovieStatus.bind(store);
export const findTMDBMovie = store.findTMDBMovie.bind(store);
export const setRenderCallback = store.setRenderCallback.bind(store);
export const findDatabaseMovie = store.findDatabaseMovie.bind(store);
export const deleteMovie = store.deleteMovie.bind(store);
export const updateMovie = store.updateMovie.bind(store);
export const setWatchedFilter = store.setWatchedFilter.bind(store);
export const getFilteredWatchedMovies =
  store.getFilteredWatchedMovies.bind(store);

export default store;
