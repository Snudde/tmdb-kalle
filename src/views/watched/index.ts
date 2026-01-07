import store from "../../lib/store";
import {
  deleteMovie,
  updateMovie,
  setWatchedFilter,
  getFilteredWatchedMovies,
} from "../../lib/store";
import { getImageUrl } from "../../services/tmdbApi";
import type { DatabaseMovie } from "../../types/movie";

export default function watched(): HTMLElement {
  const container = document.createElement("div");
  container.className = "watched";

  const filteredMovies = getFilteredWatchedMovies();

  // Header med filter
  const header = document.createElement("div");
  header.className = "watched__header";
  header.innerHTML = `
    <div class="watched__title">
      <h2>Watched Movies</h2>
      <p class="watched__count">${filteredMovies.length} of ${
    store.watchedMovies.length
  } movies</p>
    </div>
    <div class="watched__filters">
      <button class="filter-btn ${
        store.watchedFilter === "all" ? "active" : ""
      }" data-filter="all">
        All
      </button>
      <button class="filter-btn ${
        store.watchedFilter === "favorites" ? "active" : ""
      }" data-filter="favorites">
        ⭐ Favorites
      </button>
      <button class="filter-btn ${
        store.watchedFilter === "5" ? "active" : ""
      }" data-filter="5">
        5 ⭐
      </button>
      <button class="filter-btn ${
        store.watchedFilter === "4" ? "active" : ""
      }" data-filter="4">
        4 ⭐
      </button>
      <button class="filter-btn ${
        store.watchedFilter === "3" ? "active" : ""
      }" data-filter="3">
        3 ⭐
      </button>
      <button class="filter-btn ${
        store.watchedFilter === "2" ? "active" : ""
      }" data-filter="2">
        2 ⭐
      </button>
      <button class="filter-btn ${
        store.watchedFilter === "1" ? "active" : ""
      }" data-filter="1">
        1 ⭐
      </button>
    </div>
  `;
  container.appendChild(header);

  // Tom-state
  if (filteredMovies.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "watched__empty";

    if (store.watchedMovies.length === 0) {
      emptyState.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state__icon" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <h3>No watched movies yet</h3>
          <p>Start watching movies and track your favorites!</p>
          <a href="/browse" class="btn btn--primary">Browse Movies</a>
        </div>
      `;
    } else {
      emptyState.innerHTML = `
        <div class="empty-state">
          <h3>No movies match this filter</h3>
          <p>Try selecting a different filter</p>
          <button class="btn btn--primary" data-filter="all">Show All</button>
        </div>
      `;
    }
    container.appendChild(emptyState);
    attachEventListeners(container);
    return container;
  }

  // Filmlista
  const movieGrid = document.createElement("div");
  movieGrid.className = "movie-grid";

  filteredMovies.forEach((movie) => {
    const movieCard = createWatchedCard(movie);
    movieGrid.appendChild(movieCard);
  });

  container.appendChild(movieGrid);

  // Event listeners
  attachEventListeners(container);

  return container;
}

// Skapa ett watched-filmkort
function createWatchedCard(movie: DatabaseMovie): HTMLElement {
  const card = document.createElement("div");
  card.className = "movie-card movie-card--watched";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  const isFavorite = movie.is_favorite === 1;
  const rating = movie.personal_rating || 0;

  card.innerHTML = `
    <div class="movie-card__poster">
      <img src="${getImageUrl(movie.poster_path)}" alt="${movie.title}" />
      ${
        isFavorite
          ? '<span class="movie-card__favorite-badge">⭐ Favorite</span>'
          : ""
      }
    </div>
    <div class="movie-card__content">
      <h3 class="movie-card__title">${movie.title}</h3>
      <div class="movie-card__meta">
        <span class="movie-card__year">${releaseYear}</span>
      </div>
      
      <!-- Rating -->
      <div class="movie-card__rating-section">
        <label>Your rating:</label>
        <div class="rating-stars" data-movie-id="${
          movie.id
        }" data-current-rating="${rating}">
          ${createStarRating(rating, movie.id)}
        </div>
      </div>

      <!-- Review preview -->
      ${
        movie.review
          ? `
        <div class="movie-card__review-preview">
          <p>${movie.review.substring(0, 80)}${
              movie.review.length > 80 ? "..." : ""
            }</p>
        </div>
      `
          : ""
      }

      <div class="movie-card__actions">
        <button 
          class="btn btn--favorite ${isFavorite ? "active" : ""}" 
          data-action="toggle-favorite" 
          data-movie-id="${movie.id}"
          data-is-favorite="${isFavorite ? "1" : "0"}"
          title="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
        >
          ${isFavorite ? "⭐ Favorite" : "☆ Add to Favorites"}
        </button>
        <button 
          class="btn btn--tertiary btn--small" 
          data-action="edit" 
          data-movie-id="${movie.id}"
        >
          ✏️ Edit
        </button>
        <button 
          class="btn btn--danger btn--small" 
          data-action="delete" 
          data-movie-id="${movie.id}"
          data-movie-title="${movie.title}"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  `;

  return card;
}

// Skapa stjärnbetyg
function createStarRating(currentRating: number, movieId: number): string {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    const filled = i <= currentRating;
    stars += `
      <span 
        class="star ${filled ? "filled" : ""}" 
        data-rating="${i}"
        data-movie-id="${movieId}"
      >★</span>
    `;
  }
  return stars;
}

// Attach event listeners
function attachEventListeners(container: HTMLElement) {
  container.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

    // Filter buttons
    if (target.classList.contains("filter-btn")) {
      const filter = target.dataset.filter as any;
      setWatchedFilter(filter);
      return;
    }

    // Star rating
    if (target.classList.contains("star")) {
      const movieId = parseInt(target.dataset.movieId || "0");
      const rating = parseInt(target.dataset.rating || "0");

      if (movieId && rating) {
        await updateMovie(movieId, { personal_rating: rating });
      }
      return;
    }

    // Button actions
    if (target.tagName !== "BUTTON" || !target.dataset.action) return;

    const action = target.dataset.action;
    const movieId = parseInt(target.dataset.movieId || "0");

    if (!movieId) return;

    switch (action) {
      case "toggle-favorite":
        const isFavorite = target.dataset.isFavorite === "1";
        await updateMovie(movieId, { is_favorite: !isFavorite });
        break;

      case "edit":
        openEditModal(movieId);
        break;

      case "delete":
        const movieTitle = target.dataset.movieTitle || "this movie";
        if (
          confirm(
            `Are you sure you want to delete "${movieTitle}" from your watched list?`
          )
        ) {
          await deleteMovie(movieId);
        }
        break;
    }
  });
}

// Öppna edit-modal (placeholder)
function openEditModal(movieId: number) {
  const movie = store.watchedMovies.find((m) => m.id === movieId);
  if (!movie) return;

  const review = prompt("Edit your review:", movie.review || "");
  if (review !== null) {
    updateMovie(movieId, { review: review });
  }
}
