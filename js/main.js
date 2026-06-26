// Show the nav logo only after scrolling past the hero
const logo = document.querySelector(".logo");
const hero = document.querySelector(".hero");

if (hero && logo) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      logo.classList.toggle("visible", !entry.isIntersecting);
    },
    { threshold: 0.1 }
  );
  observer.observe(hero);
}

// Lazy-load Vimeo: show thumbnail first, replace with iframe on click
function loadVimeo(el) {
  const id = el.dataset.vimeo;
  if (!id) return;
  const iframe = document.createElement("iframe");
  iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
  iframe.allow = "autoplay; fullscreen; picture-in-picture";
  iframe.title = `Vídeo: ${el.dataset.title || el.querySelector("img")?.alt || "player Vimeo"}`;
  iframe.loading = "lazy";
  iframe.frameBorder = "0";
  el.innerHTML = "";
  el.appendChild(iframe);
  el.classList.remove("work-lazy");
  iframe.focus();
}

document.querySelectorAll(".work-lazy").forEach((el) => {
  el.addEventListener("click", () => loadVimeo(el));
});

// "Assistir projeto" button on project pages
document.querySelectorAll("[data-play-video]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const projectHero = document.querySelector(".project-hero");
    if (!projectHero) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    projectHero.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    if (projectHero.classList.contains("work-lazy")) {
      loadVimeo(projectHero);
    }
  });
});
