(function () {
  'use strict';

  // ---- Header: mobile menu + solid-on-scroll ----
  var shell = document.getElementById('nav-shell');
  var burger = document.getElementById('nav-burger');
  var menu = document.getElementById('nav-mobile-menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    menu.classList.toggle('open', open);
    burger.classList.toggle('active', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); }
    });
  }
  if (shell) {
    var onScroll = function () { shell.classList.toggle('is-solid', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---- Scroll reveal ----
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- Order builder: live summary ----
  var form = document.getElementById('order-form');
  if (!form) return;
  var money = function (n) { return '₦' + Number(n).toLocaleString('en-NG'); };
  var linesEl = document.getElementById('summary-lines');
  var mbar = document.getElementById('mbar');

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function update() {
    var items = Array.prototype.slice.call(form.querySelectorAll('input[name="items"]'));
    var checked = items.filter(function (i) { return i.checked; });
    items.forEach(function (i) { i.closest('.svc').classList.toggle('is-on', i.checked); });

    var speedInput = form.querySelector('input[name="deliverySpeed"]:checked');
    form.querySelectorAll('.seg-opt').forEach(function (l) { l.classList.toggle('is-on', l.contains(speedInput)); });
    var extra = checked.length && speedInput ? Number(speedInput.dataset.extra || 0) : 0;

    var subtotal = 0;
    if (!checked.length) {
      linesEl.innerHTML = '<p class="summary-empty">No services selected yet. Choose a service to see your total.</p>';
    } else {
      linesEl.innerHTML = '<ul class="lines">' + checked.map(function (c) {
        subtotal += Number(c.dataset.price);
        return '<li><span>' + esc(c.dataset.name) + '</span><span>' + money(c.dataset.price) + '</span></li>';
      }).join('') + '</ul>';
    }
    var total = subtotal + extra;
    document.getElementById('sum-services').textContent = money(subtotal);
    document.getElementById('sum-handling').textContent = money(extra);
    document.getElementById('sum-total').textContent = money(total);
    if (mbar) {
      mbar.hidden = !checked.length;
      document.getElementById('mbar-count').textContent = checked.length + (checked.length === 1 ? ' service' : ' services');
      document.getElementById('mbar-total').textContent = money(total);
    }
  }
  form.addEventListener('change', update);
  update();

  // After a server-side error re-render, bring the message into view and focus it.
  var serverErr = document.getElementById('builder-error');
  if (serverErr && !serverErr.hidden) {
    serverErr.scrollIntoView({ block: 'center' });
    serverErr.focus({ preventScroll: true });
  }

  // ---- Prevent duplicate submissions; require at least one service ----
  var submitting = false;
  form.addEventListener('submit', function (e) {
    if (submitting) { e.preventDefault(); return; }
    if (!form.querySelector('input[name="items"]:checked')) {
      e.preventDefault();
      var err = document.getElementById('builder-error');
      if (err) { err.hidden = false; err.focus(); }
      return;
    }
    submitting = true;
    form.querySelectorAll('button[type="submit"]').forEach(function (b) {
      b.setAttribute('aria-disabled', 'true');
      b.textContent = 'Preparing secure checkout…';
    });
  });
  // bfcache / back button: allow a retry after returning from the payment page
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { window.location.reload(); }
  });
})();
