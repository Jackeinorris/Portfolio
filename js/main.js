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

// Lazy-load video players: show thumbnail first, replace with iframe on click
function loadVideo(el) {
  const vimeoId = el.dataset.vimeo;
  const youtubeId = el.dataset.youtube;
  if (!vimeoId && !youtubeId) return;
  const iframe = document.createElement("iframe");
  iframe.src = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
  iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.title = `Vídeo: ${el.dataset.title || el.querySelector("img")?.alt || "player de vídeo"}`;
  iframe.loading = "lazy";
  iframe.frameBorder = "0";
  el.replaceChildren(iframe);
  el.classList.remove("work-lazy");
  iframe.focus();
}

document.querySelectorAll(".work-lazy").forEach((el) => {
  el.addEventListener("click", () => loadVideo(el));
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
      loadVideo(projectHero);
    }
  });
});
