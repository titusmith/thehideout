// Click a work image to enlarge it. It grows out of its spot in the grid to the
// centre of the screen over a 10% black overlay. Escape or a click anywhere
// outside the image puts it back.
(function () {
  var grid = document.getElementById('work-grid');
  if (!grid) return;

  var DURATION = 450; // ms, keep in step with the CSS transition
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var open = null; // { source, clone, backdrop }

  function fitRect(img) {
    var w = img.naturalWidth || img.width || 1;
    var h = img.naturalHeight || img.height || 1;
    var maxW = window.innerWidth * 0.9;
    var maxH = window.innerHeight * 0.9;
    var scale = Math.min(maxW / w, maxH / h, 1);
    w *= scale; h *= scale;
    return { left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2, width: w, height: h };
  }

  // Transform that makes an element placed at `to` look like it sits at `from`
  function invert(from, to) {
    return 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) ' +
      'scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')';
  }

  function lockScroll(lock) {
    var root = document.documentElement;
    if (lock) {
      var bar = window.innerWidth - root.clientWidth;
      root.style.overflow = 'hidden';
      if (bar) document.body.style.paddingRight = bar + 'px';
    } else {
      root.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  function openImage(source) {
    if (open) return;
    var start = source.getBoundingClientRect();
    var end = fitRect(source);

    var backdrop = document.createElement('div');
    backdrop.className = 'lightbox-backdrop';
    // The backdrop covers everything but the image, so any click outside it closes
    backdrop.addEventListener('click', closeImage);

    var clone = document.createElement('img');
    clone.className = 'lightbox-image';
    clone.src = source.currentSrc || source.src;
    clone.alt = source.alt;
    clone.style.left = end.left + 'px';
    clone.style.top = end.top + 'px';
    clone.style.width = end.width + 'px';
    clone.style.height = end.height + 'px';
    clone.style.transform = invert(start, end);

    document.body.appendChild(backdrop);
    document.body.appendChild(clone);
    source.style.visibility = 'hidden';
    lockScroll(true);
    open = { source: source, clone: clone, backdrop: backdrop };

    // Next frame: let the browser paint the start position, then animate to the centre
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        backdrop.classList.add('is-open');
        clone.classList.add('is-open');
        clone.style.transform = 'none';
      });
    });
  }

  function closeImage() {
    if (!open) return;
    var o = open;
    open = null;
    var end = {
      left: parseFloat(o.clone.style.left), top: parseFloat(o.clone.style.top),
      width: parseFloat(o.clone.style.width), height: parseFloat(o.clone.style.height),
    };
    o.backdrop.classList.remove('is-open');
    o.clone.style.transform = invert(o.source.getBoundingClientRect(), end);

    var done = function () {
      o.source.style.visibility = '';
      o.clone.remove();
      o.backdrop.remove();
      lockScroll(false);
    };
    if (reduceMotion.matches) done();
    else setTimeout(done, DURATION);
  }

  grid.addEventListener('click', function (e) {
    var img = e.target.closest('.grid-item.is-loaded img');
    if (img) openImage(img);
  });

  grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var img = e.target.closest('.grid-item.is-loaded img');
    if (img) { e.preventDefault(); openImage(img); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeImage();
  });

  window.addEventListener('resize', function () {
    if (!open) return;
    var r = fitRect(open.source);
    open.clone.style.left = r.left + 'px';
    open.clone.style.top = r.top + 'px';
    open.clone.style.width = r.width + 'px';
    open.clone.style.height = r.height + 'px';
  });
})();
