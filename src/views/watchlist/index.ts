import store from "../../lib/store";
import { markAsWatched, findTMDBMovie } from "../../lib/store";
import { getImageUrl } from "../../services/tmdbApi";
import type { DatabaseMovie, TMDBMovie } from "../../types/movie";
import { openMovieDetails } from "../../lib/store";

export default function watchlist(): HTMLElement {
  const container = document.createElement("div");
  container.className = "watchlist";

  // Header med antal filmer
  const header = document.createElement("div");
  header.className = "watchlist__header";
  header.innerHTML = `
    <h2>My Watchlist</h2>
    <p class="watchlist__count">${store.watchlistMovies.length} movies</p>
  `;
  container.appendChild(header);

  // Tom-state
  if (store.watchlistMovies.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "watchlist__empty";
    emptyState.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state__icon" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <h3>Your watchlist is empty</h3>
        <p>Start adding movies you want to watch!</p>
        <a href="/browse" class="btn btn--primary">Browse Movies</a>
      </div>
    `;
    container.appendChild(emptyState);
    return container;
  }

  // Filmlista
  const movieGrid = document.createElement("div");
  movieGrid.className = "movie-grid";

  store.watchlistMovies.forEach((movie) => {
    const movieCard = createWatchlistCard(movie);
    movieGrid.appendChild(movieCard);
  });

  container.appendChild(movieGrid);

  // Event listeners
  attachEventListeners(container);

  return container;
}

// Skapa ett watchlist-filmkort
function createWatchlistCard(movie: DatabaseMovie): HTMLElement {
  const card = document.createElement("div");
  card.className = "movie-card";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  // Formatera datum när filmen lades till
  const dateAdded = new Date(movie.date_added).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  card.innerHTML = `
    <div class="movie-card__poster">
      <img src="${getImageUrl(movie.poster_path)}" alt="${movie.title}" />
      <span class="movie-card__badge">watchlist</span>
    </div>
    <div class="movie-card__content">
      <h3 class="movie-card__title">${movie.title}</h3>
      <div class="movie-card__meta">
        <span class="movie-card__year">${releaseYear}</span>
        <span class="movie-card__rating">⭐ ${rating}</span>
      </div>
      <div class="movie-card__info">
        <p class="movie-card__added">Added: ${dateAdded}</p>
      </div>
      <div class="movie-card__actions">
        <button 
          class="btn btn--secondary btn--small" 
          data-action="mark-watched" 
          data-tmdb-id="${movie.tmdb_id}"
          data-db-id="${movie.id}"
        >
          ✓ Mark as Watched
        </button>
        <button 
          class="btn btn--tertiary btn--small" 
          data-action="details" 
          data-tmdb-id="${movie.tmdb_id}"
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
  container.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

    if (target.tagName !== "BUTTON") return;

    const action = target.dataset.action;
    const tmdbId = target.dataset.tmdbId;

    if (!action || !tmdbId) return;

    const movieId = parseInt(tmdbId);

    // Disable button och visa loading
    target.disabled = true;
    const originalText = target.textContent;
    target.textContent = "Loading...";

    try {
      switch (action) {
        case "mark-watched":
          // Skapa en TMDB-film-objekt från DatabaseMovie
          const dbMovie = store.watchlistMovies.find(
            (m) => m.tmdb_id === movieId
          );
          if (dbMovie) {
            const tmdbMovie: TMDBMovie = {
              id: dbMovie.tmdb_id,
              title: dbMovie.title,
              overview: dbMovie.overview || "",
              poster_path: dbMovie.poster_path,
              release_date: dbMovie.release_date || "",
              vote_average: dbMovie.vote_average || 0,
            };
            await markAsWatched(tmdbMovie);
          }
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
