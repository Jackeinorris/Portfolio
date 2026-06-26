// Legacy redirect: /ensaios/post.html?slug=foo -> /ensaios/foo.html
const slug = new URLSearchParams(window.location.search).get("slug");
const allowedSlug = /^[a-z0-9-]+$/;
if (slug && allowedSlug.test(slug)) {
  window.location.replace(`${slug}.html`);
} else {
  window.location.replace("./");
}
