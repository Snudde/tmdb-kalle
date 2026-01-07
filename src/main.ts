import "./style.css";
import {
  setRenderCallback,
  loadPopularMovies,
  loadWatchlist,
  loadWatched,
} from "./lib/store.ts";

// Statiska sidor
import headerHTML from "./views/static/header/index.html?raw";
import footerHTML from "./views/static/footer/index.html?raw";

// Dynamiska sidor
import browse from "./views/browse/index.ts";
import watchlist from "./views/watchlist/index.ts"; // ← Ny import

import watched from "./views/watched/index.ts"; // ← Ny import

const currentPage = (): string | HTMLElement => {
  const path = window.location.pathname;
  switch (path) {
    case "/":
    case "/browse":
      return browse();
    case "/watchlist":
      return watchlist();
    case "/watched": // ← Ny route
      return watched();
    default:
      return "404";
  }
};

const app = document.querySelector("#app")!;

const renderApp = () => {
  const page = currentPage();

  if (typeof page === "string") {
    app.innerHTML = `
      ${headerHTML} 
      ${page} 
      ${footerHTML}`;
  } else {
    app.innerHTML = `${headerHTML} ${footerHTML}`;
    app.insertBefore(page, app.querySelector("footer")!);
  }
};

// Initialisera appen
renderApp();

// Ladda all data när appen startar
async function initializeApp() {
  await Promise.all([loadPopularMovies(), loadWatchlist(), loadWatched()]);
}

initializeApp();

// Rerender-logic
window.addEventListener("popstate", () => {
  renderApp();
});

// Intercepta länkar
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest("a");

  if (link && link.href.startsWith(window.location.origin)) {
    e.preventDefault();
    const path = new URL(link.href).pathname;
    window.history.pushState({}, "", path);
    renderApp();
  }
});

// Set render callback
setRenderCallback(renderApp);
