// Legacy redirect: /ensaios/post.html?slug=foo -> /ensaios/foo
const slug = new URLSearchParams(window.location.search).get("slug");
const allowedSlug = /^[a-z0-9-]+$/;
if (slug && allowedSlug.test(slug)) {
  window.location.replace(`./${slug}`);
} else {
  window.location.replace("./");
}
