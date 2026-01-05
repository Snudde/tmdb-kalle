import type { TMDBMovie } from "../types/movie";
import { getMovies as getPopularMoviesFromAPI } from "../services/tmdbApi";

class Store {
  renderCallback: () => void;

  
  // TMDB API state
  popularMovies: TMDBMovie[] = [];
  constructor() {
    this.renderCallback = () => {};
  }

  async loadPopularMoviesTMDB(shouldTriggerRender: boolean = true) {
    try {
      this.popularMovies = await getPopularMoviesFromAPI();
      if (shouldTriggerRender) {
        this.triggerRender();
      }
    }
  }


  // LOADER (async) - för bakåtkompatibilitet

  async loadPopularMovies(shouldTriggerRender: boolean = true) {
    try {
      this.popularMovies = await getPopularMoviesFromAPI();
      if (shouldTriggerRender) {
        this.triggerRender();
      }
      
      return this.popularMovies;
    } catch (error) {
      console.error("Failed to load popular movies:", error);
      return [];
    }
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


export const loadPopularMovies = store.loadPopularMovies.bind(store);  // Async
export const setRenderCallback = store.setRenderCallback.bind(store);