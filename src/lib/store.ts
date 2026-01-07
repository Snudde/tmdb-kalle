import type { TMDBMovie, DatabaseMovie } from "../types/movie";
import { getPopularMoviesTMDB, searchMoviesTMDB } from "../services/tmdbApi";
import {
  getWatchlistMovies,
  getWatchedMovies,
  addToWatchlist as apiAddToWatchlist,
  markAsWatched as apiMarkAsWatched,
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

export default store;
