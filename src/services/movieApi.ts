import type { DatabaseMovie, MovieStatus, TMDBMovie } from "../types/movie";

const API_BASE_URL = "http://localhost:3000/api";

// Interface för att skapa en film i backend
interface CreateMovieBody {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
  status: MovieStatus;
  personal_rating?: number | null;
  review?: string | null;
  is_favorite?: boolean;
  date_watched?: string | null;
}

// Hämta alla filmer från watchlist
export async function getWatchlistMovies(): Promise<DatabaseMovie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies?status=watchlist`);

    if (!response.ok) {
      throw new Error("Failed to fetch watchlist");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return [];
  }
}

// Hämta alla sedda filmer
export async function getWatchedMovies(): Promise<DatabaseMovie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies?status=watched`);

    if (!response.ok) {
      throw new Error("Failed to fetch watched movies");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching watched movies:", error);
    return [];
  }
}

// Lägg till film i watchlist
export async function addToWatchlist(
  movie: TMDBMovie
): Promise<DatabaseMovie | null> {
  try {
    const body: CreateMovieBody = {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      overview: movie.overview,
      status: "watchlist",
    };

    const response = await fetch(`${API_BASE_URL}/movies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add to watchlist");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    alert("Failed to add movie to watchlist. It may already exist.");
    return null;
  }
}

// Markera film som sedd
export async function markAsWatched(
  movie: TMDBMovie,
  existingMovie?: DatabaseMovie
): Promise<DatabaseMovie | null> {
  try {
    // Om filmen redan finns i databasen, uppdatera den
    if (existingMovie) {
      return await updateMovie(existingMovie.id, {
        status: "watched",
        date_watched: new Date().toISOString().split("T")[0],
      });
    }

    // Annars skapa en ny post
    const body: CreateMovieBody = {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      overview: movie.overview,
      status: "watched",
      date_watched: new Date().toISOString().split("T")[0],
    };

    const response = await fetch(`${API_BASE_URL}/movies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to mark as watched");
    }

    return await response.json();
  } catch (error) {
    console.error("Error marking as watched:", error);
    throw error; // Kasta felet vidare så Store kan hantera det
  }
}

// Ta bort film från databas
export async function deleteMovie(movieId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete movie");
    }

    return true;
  } catch (error) {
    console.error("Error deleting movie:", error);
    alert("Failed to delete movie");
    return false;
  }
}

// Uppdatera film (t.ex. flytta från watchlist till watched)
export async function updateMovie(
  movieId: number,
  updates: Partial<CreateMovieBody>
): Promise<DatabaseMovie | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update movie");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating movie:", error);
    alert("Failed to update movie");
    return null;
  }
}
