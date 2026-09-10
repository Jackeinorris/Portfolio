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

// O gatilho semântico/de teclado é o <button class="play-btn"> interno (dispara
// este listener por bubbling); o clique no contêiner é conveniência de mouse.
// Não adicionar tabindex/role aqui — criaria parada de tab duplicada. (A10)
document.querySelectorAll(".work-lazy").forEach((el) => {
  el.addEventListener("click", () => loadVideo(el));
});

// Manual poster navigation; swipe remains available without JavaScript controls.
const posterStrip = document.querySelector(".poster-strip");
if (posterStrip) {
  const slides = posterStrip.querySelectorAll("li");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const controls = document.createElement("div");
  controls.className = "poster-controls";
  const previous = document.createElement("button");
  const next = document.createElement("button");
  const status = document.createElement("span");
  previous.type = next.type = "button";
  previous.textContent = "← Anterior";
  next.textContent = "Próximo →";
  previous.setAttribute("aria-label", "Cartaz anterior");
  next.setAttribute("aria-label", "Próximo cartaz");
  previous.setAttribute("aria-controls", posterStrip.id);
  next.setAttribute("aria-controls", posterStrip.id);
  status.setAttribute("role", "status");
  status.setAttribute("aria-atomic", "true");
  controls.append(previous, status, next);
  if (slides.length > 1) posterStrip.after(controls);

  const currentIndex = () => Math.round(posterStrip.scrollLeft / (posterStrip.clientWidth || 1));
  const updateStatus = () => {
    const text = `Cartaz ${currentIndex() + 1} de ${slides.length}`;
    if (status.textContent !== text) status.textContent = text;
  };
  const move = (direction) => {
    const index = (currentIndex() + direction + slides.length) % slides.length;
    posterStrip.scrollTo({
      left: index * posterStrip.clientWidth,
      behavior: reduceMotion.matches ? "instant" : "smooth",
    });
  };
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  posterStrip.addEventListener("scroll", updateStatus, { passive: true });
  window.addEventListener("resize", updateStatus);
  updateStatus();
}

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
