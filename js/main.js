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

// Auto-advance the poster carousel on small screens so it reads as a carousel
const posterStrip = document.querySelector(".poster-strip");
if (posterStrip) {
  const slides = posterStrip.querySelectorAll("li");
  const smallScreen = window.matchMedia("(max-width: 720px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ADVANCE_MS = 4000;
  const RESUME_MS = 8000;
  let timer = null;
  let resumeTimer = null;
  let stripVisible = false;

  const shouldRun = () =>
    stripVisible && smallScreen.matches && !reduceMotion.matches && slides.length > 1;

  const advance = () => {
    const width = posterStrip.clientWidth;
    if (!width) return;
    const next = (Math.round(posterStrip.scrollLeft / width) + 1) % slides.length;
    posterStrip.scrollTo({ left: next * width, behavior: "smooth" });
  };

  const stop = () => {
    clearInterval(timer);
    timer = null;
  };
  const start = () => {
    if (!timer && shouldRun()) timer = setInterval(advance, ADVANCE_MS);
  };
  const pauseThenResume = () => {
    stop();
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(start, RESUME_MS);
  };

  ["pointerdown", "touchstart", "wheel"].forEach((type) => {
    posterStrip.addEventListener(type, pauseThenResume, { passive: true });
  });

  new IntersectionObserver(
    ([entry]) => {
      stripVisible = entry.isIntersecting;
      if (stripVisible) start();
      else stop();
    },
    { threshold: 0.4 }
  ).observe(posterStrip);

  smallScreen.addEventListener("change", () => {
    if (smallScreen.matches) start();
    else stop();
  });
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
