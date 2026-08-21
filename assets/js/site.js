/* ==========================================================================
   Minato Studio, site behaviour
   No dependencies, no build step. Everything degrades gracefully without JS:
   the nav is a plain list, the gallery is plain figures, reveals are visible.
   The theme is applied by a tiny inline snippet in <head> (see any page) so
   there is no flash of the wrong palette before this file loads.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------------------------------------------------------------- theme */

  var STORE_KEY = 'minato-theme';

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* The resolved theme: an explicit choice if one exists, otherwise system. */
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set === 'dark' || set === 'light') return set;
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORE_KEY, theme); } catch (e) { /* private mode */ }
    updateToggleLabels(theme);
    // Keep the browser chrome (address bar on mobile) in step with the page.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#08131c' : '#fbfaf8');
  }

  function updateToggleLabels(theme) {
    var next = theme === 'dark' ? 'light' : 'dark';
    var label = 'Switch to ' + next + ' theme';
    Array.prototype.forEach.call(document.querySelectorAll('.theme-toggle'), function (btn) {
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
  }

  updateToggleLabels(currentTheme());

  Array.prototype.forEach.call(document.querySelectorAll('.theme-toggle'), function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  /* If the visitor has never chosen, follow the OS when it changes. */
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onSystemChange = function () {
      var stored = null;
      try { stored = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
      if (!stored) updateToggleLabels(systemPrefersDark() ? 'dark' : 'light');
    };
    if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }

  /* ------------------------------------------------------------ mobile nav */

  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (navToggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };

    navToggle.addEventListener('click', function () {
      setNav(nav.classList.contains('is-open') === false);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        navToggle.focus();
      }
    });

    /* Reset the menu when the layout crosses back to desktop. */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setNav(false);
    });
  }

  /* --------------------------------------------------------- sticky header */

  var header = document.querySelector('.site-header');
  if (header) {
    var syncHeader = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
  }

  /* -------------------------------------------------------- scroll reveal */

  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

      Array.prototype.forEach.call(revealables, function (el, i) {
        // A short stagger within a group reads as one motion rather than a pop.
        el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms';
        io.observe(el);
      });
    } else {
      Array.prototype.forEach.call(revealables, function (el) {
        el.classList.add('is-visible');
      });
    }
  }

  /* -------------------------------------------------------------- lightbox */

  var shots = document.querySelectorAll('.shot');
  if (shots.length) {
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Screenshot viewer');
    lightbox.innerHTML =
      '<button class="icon-btn lightbox-close" type="button" aria-label="Close viewer">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div><div class="lightbox-inner"></div><p class="lightbox-caption"></p></div>';
    document.body.appendChild(lightbox);

    var inner = lightbox.querySelector('.lightbox-inner');
    var caption = lightbox.querySelector('.lightbox-caption');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    var lastFocused = null;

    var openShot = function (shot) {
      var frame = shot.querySelector('.phone');
      var label = shot.querySelector('figcaption');
      if (!frame) return;
      lastFocused = shot;
      inner.innerHTML = '';
      inner.appendChild(frame.cloneNode(true));
      caption.textContent = label ? label.textContent : '';
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    var closeShot = function () {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      inner.innerHTML = '';
      if (lastFocused) lastFocused.focus();
    };

    Array.prototype.forEach.call(shots, function (shot) {
      shot.addEventListener('click', function () { openShot(shot); });
      // The figures carry role="button", so they must answer Enter and Space
      // the way a real button would.
      shot.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          openShot(shot);
        }
      });
    });

    closeBtn.addEventListener('click', closeShot);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.parentNode === lightbox) closeShot();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeShot();
      // Trap focus: only one control is focusable inside, so keep it there.
      if (e.key === 'Tab' && lightbox.classList.contains('is-open')) {
        e.preventDefault();
        closeBtn.focus();
      }
    });
  }

  /* ------------------------------------------------------------ year stamp */

  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
