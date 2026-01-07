import store from "../lib/store";
import {
  addToWatchlist,
  markAsWatched,
  updateMovie,
  deleteMovie,
  closeMovieDetails,
} from "../lib/store";
import { getImageUrl, getBackdropUrl } from "../services/tmdbApi";
import type { TMDBMovie, DatabaseMovie } from "../types/movie";

export default function MovieDetailsModal(): HTMLElement | null {
  // Om ingen film är vald, returnera null
  if (!store.selectedMovieId) return null;

  const modal = document.createElement("div");
  modal.className = "modal-overlay";

  // Loading state
  if (store.isLoadingDetails) {
    modal.innerHTML = `
      <div class="modal">
        <div class="modal__loading">
          <div class="spinner"></div>
          <p>Loading movie details...</p>
        </div>
      </div>
    `;
    attachCloseListener(modal);
    return modal;
  }

  const details = store.selectedMovieDetails;
  if (!details) return null;

  // Kolla om filmen finns i databasen
  const dbMovie = store.findDatabaseMovie(details.id);
  const status = store.getMovieStatus(details.id);

  // Skapa modal-innehåll
  modal.innerHTML = `
    <div class="modal">
      <button class="modal__close" aria-label="Close modal">&times;</button>
      
      <div class="modal__content">
        <!-- Backdrop image -->
        <div class="modal__backdrop">
          <img src="${getBackdropUrl(details.backdrop_path)}" alt="${
    details.title
  }" />
          <div class="modal__backdrop-overlay"></div>
        </div>

        <div class="modal__body">
          <div class="modal__poster">
            <img src="${getImageUrl(details.poster_path)}" alt="${
    details.title
  }" />
          </div>

          <div class="modal__info">
            <h2 class="modal__title">${details.title}</h2>
            ${
              details.tagline
                ? `<p class="modal__tagline">${details.tagline}</p>`
                : ""
            }

            <div class="modal__meta">
              <span class="modal__year">${new Date(
                details.release_date
              ).getFullYear()}</span>
              <span class="modal__runtime">${details.runtime} min</span>
              <span class="modal__rating">⭐ ${details.vote_average.toFixed(
                1
              )}/10</span>
            </div>

            ${
              details.genres && details.genres.length > 0
                ? `
              <div class="modal__genres">
                ${details.genres
                  .map((g: any) => `<span class="genre-tag">${g.name}</span>`)
                  .join("")}
              </div>
            `
                : ""
            }

            <p class="modal__overview">${details.overview}</p>

            <!-- Status badge -->
            ${
              status
                ? `
              <div class="modal__status-badge modal__status-badge--${status}">
                ${status === "watchlist" ? "📝 In Watchlist" : "✅ Watched"}
              </div>
            `
                : ""
            }

            <!-- Actions för film som INTE är sedd -->
            ${
              !dbMovie || dbMovie.status !== "watched"
                ? `
              <div class="modal__actions">
                <button 
                  class="btn btn--primary" 
                  data-action="add-watchlist"
                  ${status === "watchlist" ? "disabled" : ""}
                >
                  ${
                    status === "watchlist"
                      ? "✓ In Watchlist"
                      : "+ Add to Watchlist"
                  }
                </button>
                <button 
                  class="btn btn--secondary" 
                  data-action="mark-watched"
                  ${status === "watched" ? "disabled" : ""}
                >
                  ${status === "watched" ? "✓ Watched" : "Mark as Watched"}
                </button>
              </div>
            `
                : ""
            }

            <!-- Rating & Review för SEDDA filmer -->
            ${
              dbMovie && dbMovie.status === "watched"
                ? `
              <div class="modal__watched-section">
                <h3>Your Review</h3>
                
                <div class="modal__rating-input">
                  <label>Your Rating:</label>
                  <div class="rating-stars-large" data-movie-id="${
                    dbMovie.id
                  }" data-current-rating="${dbMovie.personal_rating || 0}">
                    ${createStarRating(
                      dbMovie.personal_rating || 0,
                      dbMovie.id
                    )}
                  </div>
                </div>

                <div class="modal__review-input">
                  <label for="review-textarea">Your Review:</label>
                  <textarea 
                    id="review-textarea" 
                    class="review-textarea"
                    placeholder="Write your thoughts about this movie..."
                    rows="5"
                  >${dbMovie.review || ""}</textarea>
                  <button class="btn btn--primary btn--small" data-action="save-review">
                    Save Review
                  </button>
                </div>

                <div class="modal__favorite-toggle">
                  <button 
                    class="btn btn--favorite ${
                      dbMovie.is_favorite ? "active" : ""
                    }" 
                    data-action="toggle-favorite"
                    data-is-favorite="${dbMovie.is_favorite}"
                  >
                    ${
                      dbMovie.is_favorite ? "⭐ Favorite" : "☆ Add to Favorites"
                    }
                  </button>
                </div>

                <div class="modal__danger-zone">
                  <button class="btn btn--danger btn--small" data-action="delete-movie">
                    🗑️ Remove from Watched
                  </button>
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  attachEventListeners(modal, details, dbMovie);
  attachCloseListener(modal);

  return modal;
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

// Event listeners för modal
function attachEventListeners(
  modal: HTMLElement,
  details: any,
  dbMovie?: DatabaseMovie
) {
  modal.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

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

    // Disable button och visa loading
    const originalText = target.textContent;
    target.textContent = "Loading...";
    (target as HTMLButtonElement).disabled = true;

    try {
      switch (action) {
        case "add-watchlist":
          const tmdbMovie: TMDBMovie = {
            id: details.id,
            title: details.title,
            overview: details.overview,
            poster_path: details.poster_path,
            release_date: details.release_date,
            vote_average: details.vote_average,
          };
          await addToWatchlist(tmdbMovie);
          break;

        case "mark-watched":
          const tmdbMovie2: TMDBMovie = {
            id: details.id,
            title: details.title,
            overview: details.overview,
            poster_path: details.poster_path,
            release_date: details.release_date,
            vote_average: details.vote_average,
          };
          await markAsWatched(tmdbMovie2);
          break;

        case "save-review":
          if (dbMovie) {
            const textarea = modal.querySelector(
              "#review-textarea"
            ) as HTMLTextAreaElement;
            await updateMovie(dbMovie.id, { review: textarea.value });
            alert("Review saved!");
          }
          (target as HTMLButtonElement).disabled = false;
          target.textContent = originalText;
          break;

        case "toggle-favorite":
          if (dbMovie) {
            const isFavorite = target.dataset.isFavorite === "1";
            await updateMovie(dbMovie.id, { is_favorite: !isFavorite });
          }
          break;

        case "delete-movie":
          if (
            dbMovie &&
            confirm(`Remove "${details.title}" from watched list?`)
          ) {
            await deleteMovie(dbMovie.id);
            closeMovieDetails();
          } else {
            (target as HTMLButtonElement).disabled = false;
            target.textContent = originalText;
          }
          break;
      }
    } catch (error) {
      console.error("Action failed:", error);
      (target as HTMLButtonElement).disabled = false;
      target.textContent = originalText;
    }
  });
}

// Stäng modal vid click utanför eller på close-button
function attachCloseListener(modal: HTMLElement) {
  const closeBtn = modal.querySelector(".modal__close");
  const modalContent = modal.querySelector(".modal");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeMovieDetails);
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeMovieDetails();
    }
  });

  // Escape-tangent stänger modal
  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeMovieDetails();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);
}
