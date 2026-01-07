import store from "../../lib/store";
import {
  addToWatchlist,
  markAsWatched,
  findTMDBMovie,
  findDatabaseMovie,
} from "../../lib/store";
import { getImageUrl } from "../../services/tmdbApi";
import type { TMDBMovie } from "../../types/movie";
import { openMovieDetails } from "../../lib/store";

export default function browse(): HTMLElement {
  const container = document.createElement("div");
  container.className = "browse";

  // Sökfält
  const searchSection = document.createElement("div");
  searchSection.className = "search-section";
  searchSection.innerHTML = `
    <h2>Browse Movies</h2>
    <input 
      type="text" 
      id="search-input" 
      class="search-input" 
      placeholder="Search for movies..."
      value="${store.searchQuery}"
    />
  `;
  container.appendChild(searchSection);

  // Loading state
  if (store.isLoading) {
    const loader = document.createElement("div");
    loader.className = "loader";
    loader.textContent = "Loading movies...";
    container.appendChild(loader);
    return container;
  }

  // Filmlista
  const movieGrid = document.createElement("div");
  movieGrid.className = "movie-grid";

  if (store.browseMovies.length === 0) {
    movieGrid.innerHTML = `<p class="no-results">No movies found</p>`;
  } else {
    store.browseMovies.forEach((movie) => {
      const movieCard = createMovieCard(movie);
      movieGrid.appendChild(movieCard);
    });
  }

  container.appendChild(movieGrid);

  // Event listeners
  attachEventListeners(container);

  return container;
}

// Skapa ett filmkort
function createMovieCard(movie: TMDBMovie): HTMLElement {
  const card = document.createElement("div");
  card.className = "movie-card";

  const status = store.getMovieStatus(movie.id);
  if (status) {
    card.classList.add(`movie-card--${status}`); // ✅ Lägg bara till om status finns
  }

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  card.innerHTML = `
    <div class="movie-card__poster">
      <img src="${getImageUrl(movie.poster_path)}" alt="${movie.title}" />
      ${status ? `<span class="movie-card__badge">${status}</span>` : ""}
    </div>
    <div class="movie-card__content">
      <h3 class="movie-card__title">${movie.title}</h3>
      <div class="movie-card__meta">
        <span class="movie-card__year">${releaseYear}</span>
        <span class="movie-card__rating">⭐ ${rating}</span>
      </div>
      <p class="movie-card__overview">${movie.overview.substring(0, 120)}...</p>
      <div class="movie-card__actions">
        <button 
          class="btn btn--primary btn--small" 
          data-action="watchlist" 
          data-tmdb-id="${movie.id}"
          ${status === "watchlist" ? "disabled" : ""}
        >
          ${status === "watchlist" ? "✓ In Watchlist" : "+ Watchlist"}
        </button>
        <button 
          class="btn btn--secondary btn--small" 
          data-action="watched" 
          data-tmdb-id="${movie.id}"
          ${status === "watched" ? "disabled" : ""}
        >
          ${status === "watched" ? "✓ Watched" : "Mark Watched"}
        </button>
        <button 
          class="btn btn--tertiary btn--small" 
          data-action="details" 
          data-tmdb-id="${movie.id}"
        >
          Details
        </button>
      </div>
    </div>
  `;

  return card;
}

// Attach event listeners
function attachEventListeners(container: HTMLElement) {
  // Sök-input
  const searchInput = container.querySelector(
    "#search-input"
  ) as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value;
      store.searchMovies(query);
    });
  }

  // Knapp-clicks (event delegation)
  container.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

    if (target.tagName !== "BUTTON") return;

    const action = target.dataset.action;
    const tmdbId = target.dataset.tmdbId;

    if (!action || !tmdbId) return;

    const movieId = parseInt(tmdbId);
    const movie = findTMDBMovie(movieId);

    if (!movie) {
      console.error("Movie not found:", movieId);
      return;
    }

    // Disable button och visa loading
    target.disabled = true;
    const originalText = target.textContent;
    target.textContent = "Loading...";

    try {
      switch (action) {
        case "watchlist":
          await addToWatchlist(movie);
          break;
        case "watched":
          await markAsWatched(movie);
          break;
        case "details":
          openMovieDetails(movieId);
          break;
      }
    } catch (error) {
      console.error("Action failed:", error);
      target.disabled = false;
      target.textContent = originalText;
    }
  });
}
