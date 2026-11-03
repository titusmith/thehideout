// Scroll-to-top button — show when scrolled down, hide near top
(function() {
  var btn = document.getElementById('scroll-up');
  if (!btn) return;

  function onScroll() {
    if (window.scrollY > 400) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', scrollToTop);
  onScroll(); // initial check
})();
