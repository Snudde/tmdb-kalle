// TMDB API Configuration
const TMDB_API_KEY = "346ed5019388cb359ec595d99dc7de90"; // Byt ut mot din nyckel
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Typer för TMDB API-svar
interface TMDBMovieResponse {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
}

interface TMDBSearchResponse {
  results: TMDBMovieResponse[];
  total_pages: number;
  page: number;
}

interface TMDBMovieDetails extends TMDBMovieResponse {
  runtime: number;
  genres: { id: number; name: string }[];
  tagline: string;
  backdrop_path: string | null;
}

// Hämta detaljerad filminfo
export async function getMovieDetails(
  movieId: number
): Promise<TMDBMovieDetails | null> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch movie details");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
}

// Hjälpfunktion för backdrop-bilder (stor bild)
export function getBackdropUrl(backdropPath: string | null): string {
  if (!backdropPath) {
    return "https://via.placeholder.com/1280x720?text=No+Image";
  }
  return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
}

// Hämta populära filmer
export async function getPopularMoviesTMDB(): Promise<TMDBMovieResponse[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch popular movies");
    }

    const data: TMDBSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return [];
  }
}

// Sök efter filmer
export async function searchMoviesTMDB(
  query: string
): Promise<TMDBMovieResponse[]> {
  try {
    if (!query.trim()) {
      return getPopularMoviesTMDB(); // Returnera populära om ingen sökterm
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
        query
      )}&page=1`
    );

    if (!response.ok) {
      throw new Error("Failed to search movies");
    }

    const data: TMDBSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
}

// Hjälpfunktion för att få fullständig bild-URL
export function getImageUrl(posterPath: string | null): string {
  if (!posterPath) {
    return "https://via.placeholder.com/500x750?text=No+Image";
  }
  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
}
