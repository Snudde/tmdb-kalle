// 1. Använda lokalt state
export default function about() {
    let count = 1;
  
    const about = document.createElement("div");
    about.classList.add("about");
    about.innerHTML = `
      <h2>how many boats?</h2>
      <h2 id="boatHeading">⛵️</h2>
      <div class="buttons">
        <button id="incrementButton">Add boats</button>
        <button id="decrementButton">Remove boats</button>
      </div>
    `;
    const boatHeading = about.querySelector<HTMLHeadingElement>("#boatHeading")!;
    const incrementButton = about.querySelector<HTMLButtonElement>("#incrementButton")!;
    const decrementButton = about.querySelector<HTMLButtonElement>("#decrementButton")!;
  
    if (count === 0) {
      decrementButton.disabled = true;
    }
  
    const updateBoats = () =>
      (boatHeading.innerHTML =
        Array.from({ length: count }, (_) => "⛵️").join("") || "no boats");
  
    incrementButton.addEventListener("click", () => {
      count++;
      updateBoats();
    });
    decrementButton.addEventListener("click", () => {
      if (count !== 0) {
        count--;
        updateBoats();
      }
    });
  
    // i slutändan returneras elementet som skapades med document.createElement("div")
    return about;
  }


// 2. Använda global state
// import { getCount, setCount } from "../../lib/store.ts";

// export default function about() {
//   const about = document.createElement("div");
//   about.classList.add("about");
//   const currentCount = getCount();
  
//   // Sätt HTML-innehåll
//   about.innerHTML = `
//     <h2>how many boats?</h2>
//     <h2 id="boatHeading">${Array.from({ length: currentCount }, (_) => "⛵️").join("")}</h2>
//     <div class="buttons">
//       <button id="incrementButton">Add boats</button>
//       <button id="decrementButton">Remove boats</button>
//     </div>
//   `;

//   // Hämta referenser till element
//   const incrementButton = about.querySelector<HTMLButtonElement>("#incrementButton")!;
//   const decrementButton = about.querySelector<HTMLButtonElement>("#decrementButton")!;



//   // Event listeners - använder global state
//   incrementButton.addEventListener("click", () => {
//     const currentCount = getCount();
//     setCount(currentCount + 1);
//     // renderApp() triggas automatiskt av setCount(), vilket kör about() om helt
//   });

//   decrementButton.addEventListener("click", () => {
//     const currentCount = getCount();
//     if (currentCount > 0) {
//       setCount(currentCount - 1);
//       // renderApp() triggas automatiskt av setCount(), vilket kör about() om helt
//     }
//   });

//   // Initial uppdatering
// //   updateBoats();

//   return about;
// }


