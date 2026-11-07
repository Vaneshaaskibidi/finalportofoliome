(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* Intro sambutan: sapaan berganti bahasa + loading, sekali per sesi */
  var intro = document.getElementById('intro');
  var root = document.documentElement;
  if (intro && root.classList.contains('intro-on')) {
    var words = ['Halo', 'Hello', 'Bonjour', 'Hola', 'Ciao', 'Hallo', '\u3053\u3093\u306b\u3061\u306f', '\uc548\ub155\ud558\uc138\uc694'];
    var step = 320, wi = 0, done = false;
    var wordEl = document.getElementById('introWord');
    var fill = document.getElementById('introFill');
    var pct = document.getElementById('introPct');
    var started = Date.now(), total = words.length * step;
    function showWord() {
      wordEl.textContent = words[wi];
      wordEl.classList.remove('swap'); void wordEl.offsetWidth; wordEl.classList.add('swap');
    }
    function finish() {
      if (done) return; done = true;
      clearInterval(wt); clearInterval(pt);
      fill.style.width = '100%'; pct.textContent = '100%';
      try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
      intro.classList.add('leave');
      setTimeout(function () { root.classList.remove('intro-on'); intro.remove(); }, 850);
    }
    var wt = setInterval(function () { wi++; if (wi >= words.length) finish(); else showWord(); }, step);
    var pt = setInterval(function () {
      var p = Math.min(99, Math.round((Date.now() - started) / total * 100));
      fill.style.width = p + '%'; pct.textContent = p + '%';
    }, 60);
    showWord();
    document.getElementById('introSkip').addEventListener('click', finish);
  } else if (intro) { intro.remove(); }

  /* Ledakan kotak kecil di titik klik */
  function burst(x, y) {
    if (reduce) return;
    var colors = ['#FFD60A', '#FF5C8A', '#5CE1E6', '#8CFF98'];
    for (var i = 0; i < 10; i++) {
      var s = document.createElement('span');
      var a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
      s.className = 'burst';
      s.style.left = x - 5 + 'px'; s.style.top = y - 5 + 'px';
      s.style.background = colors[i % colors.length];
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
      document.body.appendChild(s);
      setTimeout(function (el) { el.remove(); }.bind(null, s), 800);
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.btn, .chip, .acc-head, .flip button, nav a.link, .brand, .lights');
    if (t) burst(e.clientX || 0, e.clientY || 0);
    var b = e.target.closest('.btn');
    if (b) { b.classList.add('pressed'); setTimeout(function () { b.classList.remove('pressed'); }, 140); }
  });

  /* Menu: gulir ke bagian, lalu animasikan judulnya */
  var sections = document.querySelectorAll('main section');
  function flash(id) {
    var sec = document.getElementById(id);
    if (!sec) return;
    sec.classList.remove('go');
    void sec.offsetWidth;
    sec.classList.add('go');
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var id = a.getAttribute('href').slice(1);
      if (id && id !== 'atas') setTimeout(function () { flash(id); }, 350);
    });
  });

  /* Menu aktif mengikuti posisi gulir */
  var links = {};
  document.querySelectorAll('nav a.link').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  function spy() {
    var current = null, y = window.innerHeight * 0.35;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= y) current = s.id; });
    Object.keys(links).forEach(function (k) { links[k].setAttribute('aria-current', k === current ? 'true' : 'false'); });
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  /* Akordeon */
  document.querySelectorAll('.acc').forEach(function (item) {
    var btn = item.querySelector('.acc-head');
    btn.addEventListener('click', function () {
      var open = item.getAttribute('data-open') === 'true';
      item.setAttribute('data-open', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  /* Kartu sertifikat */
  document.querySelectorAll('.flip').forEach(function (card) {
    var btn = card.querySelector('button');
    btn.addEventListener('click', function () {
      var open = card.getAttribute('data-open') === 'true';
      card.setAttribute('data-open', open ? 'false' : 'true');
      btn.setAttribute('aria-pressed', open ? 'false' : 'true');
    });
  });

  /* Filter proyek */
  var chips = document.querySelectorAll('.chip');
  var items = document.querySelectorAll('.project');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      items.forEach(function (p) {
        var show = f === 'semua' || (p.getAttribute('data-stack') || '').split(' ').indexOf(f) !== -1;
        p.hidden = !show;
        if (show) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }
      });
    });
  });

  /* Salin email */
  var toast = document.getElementById('toast');
  function say(msg) {
    toast.textContent = msg; toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show');
  }
  document.getElementById('copy').addEventListener('click', function () {
    var el = document.getElementById('email');
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(el);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      say('Teks terpilih, tekan salin.');
    }
    try { navigator.clipboard.writeText(el.textContent).then(function () { say('Email tersalin ✓'); }, fallback); }
    catch (e) { fallback(); }
  });

  /* Lampu start: menyala satu per satu, padam, lalu "GO" */
  var lightsBtn = document.getElementById('lights');
  var lamps = lightsBtn.querySelectorAll('span');
  var lightsTxt = document.getElementById('lightsTxt');
  var timers = [];
  function race() {
    timers.forEach(clearTimeout); timers = [];
    lightsBtn.classList.remove('go');
    lamps.forEach(function (l) { l.classList.remove('on'); });
    lightsTxt.textContent = 'READY...';
    lamps.forEach(function (l, i) { timers.push(setTimeout(function () { l.classList.add('on'); }, 600 + i * 500)); });
    timers.push(setTimeout(function () {
      lamps.forEach(function (l) { l.classList.remove('on'); });
      lightsBtn.classList.add('go'); lightsTxt.textContent = 'LIGHTS OUT!';
    }, 600 + lamps.length * 500 + 900));
  }
  if (reduce) { lamps.forEach(function (l) { l.classList.add('on'); }); lightsTxt.textContent = 'READY'; }
  else { race(); setInterval(race, 9000); lightsBtn.addEventListener('click', race); }

  /* Bilah kecepatan mengikuti gulir */
  var speed = document.getElementById('speed');
  function prog() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    speed.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
  }
  window.addEventListener('scroll', prog, { passive: true });
  prog();

  /* Elemen muncul bergiliran saat digulir */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.sub, .about-text p, .stack > li, .certs > li, .filters, .facts, .mail').forEach(function (el, i) {
      el.classList.add('rv');
      el.style.animationDelay = (i % 3) * 90 + 'ms';
      io.observe(el);
    });
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
