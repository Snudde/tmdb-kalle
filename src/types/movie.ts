export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
}

export type MovieStatus = "watchlist" | "watched";

// Film från backend (sparad i databas)
export interface DatabaseMovie {
  id: number; // Databas-id
  tmdb_id: number; // TMDB-id
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
  status: MovieStatus;
  personal_rating: number | null;
  review: string | null;
  is_favorite: number;
  date_added: string;
  date_watched: string | null;
}
