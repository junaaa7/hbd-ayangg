/* ==========================================================================
   A JOURNEY OF US — js/script.js

   Daftar isi
   1) KONFIGURASI  ← edit bagian ini dulu
   2) Utilitas
   3) Personalisasi (nama, tanggal)
   4) Foto: fallback & placeholder
   5) Floating hearts & sparkle
   6) Confetti (canvas ringan)
   7) Opening & musik
   8) Scroll reveal & progress
   9) Memory gallery + lightbox
  10) Reasons carousel
  11) Love letter
  12) Birthday cake
  13) Final surprise & closing
   ========================================================================== */


/* ==========================================================================
   1) KONFIGURASI — EDIT DI SINI
   ========================================================================== */
const birthdayConfig = {
  name: "Revianti Sudjana Dwi Wulandari", // muncul di hero, pesan, dan surat
  birthday: "2026-10-22",                 // format: "TAHUN-BULAN-TANGGAL"
  sender: "Arjuna Ranma Putra",           // namamu, muncul di tanda tangan

  // ---- Opsional ----
  locale: "id-ID",                 // bahasa format tanggal, mis. "en-US" untuk "October 15, 2026"
  musicVolume: 0.7,                // 0 (hening) sampai 1 (penuh)
  letterWordDelay: 40              // jeda antar kata saat surat muncul (milidetik)
};


(function () {
  "use strict";

  const cfg = birthdayConfig;
  const root = document.documentElement;
  root.classList.add("js");

  /* ========================================================================
     2) UTILITAS
     ======================================================================== */
  const $  = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => motionQuery.matches;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand  = (min, max) => Math.random() * (max - min) + min;
  const pad   = (n) => String(n).padStart(2, "0");
  const smoothBehavior = () => (reduced() ? "auto" : "smooth");

  const LOCALE = (function () {
    try { new Intl.DateTimeFormat(cfg.locale); return cfg.locale; }
    catch (e) { return "id-ID"; }
  })();

  /** "2024-10-15" atau "2024-10-15T19:30" → Date (waktu lokal, bukan UTC) */
  function parseLocalDate(value) {
    const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/);
    if (!m) return null;
    const date = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), 0);
    return isNaN(date.getTime()) ? null : date;
  }

  function formatLong(date) {
    if (!date) return "";
    return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" }).format(date);
  }

  const birthdayDate = parseLocalDate(cfg.birthday);

  const body = document.body;
  const main = $("#main");


  /* ========================================================================
     3) PERSONALISASI
     Elemen dengan data-bind="name | sender | birthdayLong"
     otomatis diisi dari birthdayConfig.
     ======================================================================== */
  function bindConfig() {
    const values = {
      name: cfg.name,
      sender: cfg.sender,
      birthdayLong: formatLong(birthdayDate)
    };

    $$("[data-bind]").forEach((el) => {
      const value = values[el.dataset.bind];
      if (!value) return;
      el.textContent = value;
      if (el.tagName === "TIME") {
        el.setAttribute("datetime", String(cfg.birthday).slice(0, 10));
      }
    });

    document.title = "Happy Birthday, " + cfg.name + " ❤️";
  }


  /* ========================================================================
     4) FOTO: FALLBACK & PLACEHOLDER
     - Jika foto .jpg tidak ada, otomatis dicoba .webp, .png, .jpeg.
     - Jika tetap tidak ada, tampil placeholder lembut berisi nama file yang
       harus kamu isi. Website tetap rapi tanpa foto sama sekali.
     ======================================================================== */
  const IMAGE_EXTENSIONS = ["jpg", "webp", "png", "jpeg"];

  function markMissing(img) {
    img.dataset.missing = "true";
    const frame = img.closest(".photo");
    if (frame) {
      frame.classList.add("is-missing");
      // Tampilkan nama file saja agar muat di bingkai kecil
      frame.dataset.ph = (img.dataset.original || img.getAttribute("src") || "").split("/").pop();
    }
  }

  function handleImageError(img) {
    if (img.dataset.missing === "true") return;

    const src = img.getAttribute("src") || "";
    if (!img.dataset.original) img.dataset.original = src;

    const match = src.match(/^(.*)\.([a-z0-9]+)(\?.*)?$/i);
    if (match) {
      const tried = (img.dataset.tried || "").split(",").filter(Boolean);
      tried.push(match[2].toLowerCase());
      img.dataset.tried = tried.join(",");

      const next = IMAGE_EXTENSIONS.find((ext) => !tried.includes(ext));
      if (next) {
        img.src = match[1] + "." + next;
        return;
      }
    }
    markMissing(img);
  }

  function initImages() {
    // Event "error" tidak bubble, jadi didengarkan di fase capture.
    document.addEventListener("error", (event) => {
      const el = event.target;
      if (el && el.tagName === "IMG" && !el.closest(".lightbox")) handleImageError(el);
    }, true);

    // Gambar non-lazy yang sudah terlanjur gagal sebelum script ini berjalan
    $$("img").forEach((img) => {
      if (img.loading !== "lazy" && img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
        handleImageError(img);
      }
    });
  }


  /* ========================================================================
     5) FLOATING HEARTS & SPARKLE
     Hanya memakai transform + opacity, jumlahnya sengaja sedikit.
     ======================================================================== */
  function spawnFloaters(layer, options) {
    if (!layer || reduced()) return;
    const opts = Object.assign({ hearts: 12, sparkles: 10, loop: true }, options);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < opts.hearts; i++) {
      const el = document.createElement("span");
      el.className = "floater";
      el.textContent = "♥";
      el.style.setProperty("--x", rand(2, 96).toFixed(1) + "%");
      el.style.setProperty("--size", rand(0.8, 1.8).toFixed(2) + "rem");
      el.style.setProperty("--dur", rand(9, 17).toFixed(1) + "s");
      el.style.setProperty("--delay", (opts.loop ? -rand(0, 14) : rand(0, 1.8)).toFixed(1) + "s");
      el.style.setProperty("--drift", rand(-60, 60).toFixed(0) + "px");
      if (!opts.loop) {
        el.style.setProperty("--iter", "1");
        el.style.setProperty("--dur", rand(4.5, 8).toFixed(1) + "s");
        el.addEventListener("animationend", () => el.remove(), { once: true });
      }
      fragment.appendChild(el);
    }

    for (let i = 0; i < opts.sparkles; i++) {
      const el = document.createElement("span");
      el.className = "sparkle";
      el.textContent = "✦";
      el.style.setProperty("--x", rand(4, 94).toFixed(1) + "%");
      el.style.setProperty("--y", rand(6, 90).toFixed(1) + "%");
      el.style.setProperty("--size", rand(0.6, 1.3).toFixed(2) + "rem");
      el.style.setProperty("--dur", rand(2.8, 5.5).toFixed(1) + "s");
      el.style.setProperty("--delay", (-rand(0, 5)).toFixed(1) + "s");
      fragment.appendChild(el);
    }

    layer.appendChild(fragment);
  }

  /** Percikan sparkle sekali pakai di titik layar tertentu */
  function sparkleBurst(x, y, count) {
    if (reduced()) return;
    const total = count || 16;
    for (let i = 0; i < total; i++) {
      const el = document.createElement("span");
      const angle = rand(0, Math.PI * 2);
      const distance = rand(50, 150);
      el.className = "spark";
      el.textContent = "✦";
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.fontSize = rand(0.7, 1.6).toFixed(2) + "rem";
      el.style.setProperty("--dx", (Math.cos(angle) * distance).toFixed(0) + "px");
      el.style.setProperty("--dy", (Math.sin(angle) * distance).toFixed(0) + "px");
      el.style.animationDelay = rand(0, 0.25).toFixed(2) + "s";
      el.addEventListener("animationend", () => el.remove(), { once: true });
      document.body.appendChild(el);
    }
  }


  /* ========================================================================
     6) CONFETTI — canvas ringan, berhenti otomatis saat semua partikel selesai
     ======================================================================== */
  const Confetti = (function () {
    const canvas = $("#confetti");
    const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    const COLORS = ["#d4607b", "#f5bfcb", "#f6c877", "#b23a5a", "#ffffff", "#ffb3c6", "#ffe2a8"];
    const SHAPES = ["rect", "rect", "circle", "heart"];

    let pieces = [];
    let running = false;
    let lastTime = 0;
    let width = 0;
    let height = 0;

    function resize() {
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makePiece(x, y, angle, speed) {
      return {
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(6, 11),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.22, 0.22),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        shape: SHAPES[(Math.random() * SHAPES.length) | 0],
        wobble: rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.05, 0.14),
        life: 0,
        ttl: rand(110, 190)   // dalam "frame" 60fps
      };
    }

    function drawHeart(size) {
      ctx.beginPath();
      ctx.moveTo(0, size * 0.9);
      ctx.bezierCurveTo(-size * 1.6, -size * 0.1, -size * 0.7, -size * 1.3, 0, -size * 0.45);
      ctx.bezierCurveTo(size * 0.7, -size * 1.3, size * 1.6, -size * 0.1, 0, size * 0.9);
      ctx.fill();
    }

    function frame(now) {
      const dt = Math.min(2.5, (now - lastTime) / 16.667 || 1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);
      pieces = pieces.filter((p) => p.life < p.ttl && p.y < height + 40);

      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        p.life += dt;
        p.vx *= Math.pow(0.985, dt);
        p.vy = p.vy * Math.pow(0.985, dt) + 0.2 * dt;
        p.x += (p.vx + Math.sin(p.wobble) * 0.6) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.wobble += p.wobbleSpeed * dt;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, (p.ttl - p.life) / 35));
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawHeart(p.size / 2.2);
        }
        ctx.restore();
      }

      if (pieces.length) {
        requestAnimationFrame(frame);
      } else {
        running = false;
        ctx.clearRect(0, 0, width, height);
      }
    }

    function start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(frame);
    }

    /** Semburan dari satu titik. angle dalam derajat (-90 = ke atas). */
    function burst(opts) {
      if (!ctx || reduced()) return;
      resize();
      const o = Object.assign({ x: width / 2, y: height * 0.5, angle: -90, spread: 70, count: 90, power: [8, 17] }, opts);
      const small = width < 480 ? 0.7 : 1;
      const total = Math.round(o.count * small);
      for (let i = 0; i < total; i++) {
        const angle = ((o.angle + rand(-o.spread / 2, o.spread / 2)) * Math.PI) / 180;
        pieces.push(makePiece(o.x, o.y, angle, rand(o.power[0], o.power[1])));
      }
      start();
    }

    /** Hujan confetti dari atas layar */
    function rain(count) {
      if (!ctx || reduced()) return;
      resize();
      const total = Math.round((count || 70) * (width < 480 ? 0.7 : 1));
      for (let i = 0; i < total; i++) {
        const piece = makePiece(rand(0, width), rand(-height * 0.3, -10), Math.PI / 2, rand(1, 4));
        piece.ttl = rand(150, 260);
        pieces.push(piece);
      }
      start();
    }

    /** Dua meriam dari kiri & kanan bawah */
    function cannons() {
      if (!ctx || reduced()) return;
      resize();
      burst({ x: 0, y: height * 0.85, angle: -58, spread: 40, count: 70, power: [11, 20] });
      burst({ x: width, y: height * 0.85, angle: -122, spread: 40, count: 70, power: [11, 20] });
    }

    window.addEventListener("resize", () => { if (running) resize(); });

    return { burst: burst, rain: rain, cannons: cannons };
  })();


  /* ========================================================================
     7) OPENING & MUSIK
     ======================================================================== */
  const audio = $("#bgMusic");
  const musicBtn = $("#musicToggle");
  let resumeAfterVideo = false;

  function setMusicState(isPlaying) {
    musicBtn.dataset.state = isPlaying ? "on" : "off";
    musicBtn.setAttribute("aria-pressed", String(isPlaying));
    musicBtn.setAttribute("aria-label", isPlaying ? "Pause music" : "Play music");
  }

  function playMusic() {
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, Number(cfg.musicVolume) || 0.7));
    const attempt = audio.play();
    if (attempt && typeof attempt.then === "function") {
      attempt.then(() => setMusicState(true)).catch(() => setMusicState(false));
    } else {
      setMusicState(!audio.paused);
    }
  }

  function initMusic() {
    musicBtn.addEventListener("click", () => {
      if (audio.paused) {
        playMusic();
      } else {
        audio.pause();
        setMusicState(false);
      }
    });
  }

  function initOpening() {
    const opening = $("#opening");
    const openBtn = $("#openSurprise");
    let opened = false;

    // Selama opening tampil, konten utama tidak bisa difokus
    main.setAttribute("inert", "");

    spawnFloaters($('[data-floaters="opening"]'), { hearts: 14, sparkles: 14 });
    spawnFloaters($('[data-floaters="hero"]'), { hearts: 7, sparkles: 8 });

    openBtn.addEventListener("click", async () => {
      if (opened) return;
      opened = true;
      openBtn.disabled = true;

      playMusic();                         // musik dimulai dari interaksi pengguna
      main.removeAttribute("inert");
      window.scrollTo(0, 0);

      body.classList.add("is-opened");     // memulai animasi hero
      opening.classList.add("is-leaving"); // opening memudar

      await sleep(reduced() ? 0 : 1300);
      opening.hidden = true;
    });
  }


  /* ========================================================================
     8) SCROLL REVEAL & PROGRESS
     ======================================================================== */
  function initReveal() {
    const items = $$("[data-reveal]");

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

    items.forEach((el) => observer.observe(el));
  }

  function initProgress() {
    const bar = $(".progress__bar");
    let ticking = false;

    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }


  /* ========================================================================
     9) MEMORY GALLERY + LIGHTBOX
     ======================================================================== */
  function initGallery() {
    const items = $$(".gallery__item");
    const dialog = $("#lightbox");
    if (!items.length || !dialog) return;

    const inner = $("#lightboxInner");
    const imgEl = $("#lightboxImg");
    const placeholder = $("#lightboxPlaceholder");
    const placeholderName = $("#lightboxPhName");
    const captionEl = $("#lightboxCaption");
    const countEl = $("#lightboxCount");

    let index = 0;
    let lastFocus = null;
    let touchStartX = null;

    function show(i) {
      index = (i + items.length) % items.length;
      const item = items[index];
      const thumb = $("img", item);
      const caption = item.dataset.caption || (thumb && thumb.alt) || "";

      captionEl.textContent = caption;
      countEl.textContent = (index + 1) + " / " + items.length;

      if (thumb && thumb.dataset.missing === "true") {
        imgEl.hidden = true;
        imgEl.removeAttribute("src");
        placeholderName.textContent = thumb.dataset.original || "";
        placeholder.hidden = false;
      } else if (thumb) {
        placeholder.hidden = true;
        imgEl.hidden = false;
        imgEl.alt = thumb.alt;
        imgEl.src = thumb.currentSrc || thumb.src;
      }
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      body.classList.add("has-modal");
    }

    async function close() {
      if (!dialog.open) return;
      dialog.classList.add("is-closing");
      await sleep(reduced() ? 0 : 230);
      dialog.classList.remove("is-closing");
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      body.classList.remove("has-modal");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    items.forEach((item, i) => item.addEventListener("click", () => open(i)));

    $("#lightboxClose").addEventListener("click", close);
    $("#lightboxPrev").addEventListener("click", () => show(index - 1));
    $("#lightboxNext").addEventListener("click", () => show(index + 1));

    // Klik area gelap di luar foto menutup modal
    inner.addEventListener("click", (event) => { if (event.target === inner) close(); });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });

    // Tombol Esc: pakai animasi tutup yang sama
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") show(index + 1);
      if (event.key === "ArrowLeft") show(index - 1);
    });

    // Geser jari kiri/kanan di ponsel
    dialog.addEventListener("touchstart", (event) => { touchStartX = event.touches[0].clientX; }, { passive: true });
    dialog.addEventListener("touchend", (event) => {
      if (touchStartX === null) return;
      const dx = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) > 55) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }


  /* ========================================================================
     10) REASONS CAROUSEL
     Data dibaca dari <ol id="reasonsList"> di index.html
     ======================================================================== */
  function initReasons() {
    const reasons = $$("#reasonsList li").map((li) => li.textContent.trim()).filter(Boolean);
    if (!reasons.length) return;

    const content = $("#reasonContent");
    const numberEl = $("#reasonNumber");
    const textEl = $("#reasonText");
    const progressEl = $("#reasonProgress");
    const nextBtn = $("#reasonNext");
    const prevBtn = $("#reasonPrev");
    const section = $("#reasons");

    let current = 0;
    let busy = false;

    function render() {
      numberEl.textContent = pad(current + 1);
      textEl.textContent = reasons[current];
      progressEl.textContent = (current + 1) + " / " + reasons.length;
      nextBtn.textContent = current === reasons.length - 1 ? "Read Again ↺" : "Next Reason →";
    }

    async function go(step) {
      if (busy) return;
      busy = true;
      content.style.setProperty("--dir", step > 0 ? "1" : "-1");

      if (!reduced()) {
        content.classList.add("is-out");
        await sleep(300);
      }

      current = (current + step + reasons.length) % reasons.length;
      render();

      if (!reduced()) {
        // Masuk dari sisi berlawanan, lalu meluncur ke posisi normal
        content.classList.remove("is-out");
        content.classList.add("is-in");
        void content.offsetWidth;
        content.classList.remove("is-in");
        await sleep(320);
      }
      busy = false;
    }

    nextBtn.addEventListener("click", () => go(1));
    prevBtn.addEventListener("click", () => go(-1));

    // Geser jari / tombol panah
    let startX = null;
    const card = $("#reason");
    card.addEventListener("touchstart", (event) => { startX = event.touches[0].clientX; }, { passive: true });
    card.addEventListener("touchend", (event) => {
      if (startX === null) return;
      const dx = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    section.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    });

    render();
  }


  /* ========================================================================
     11) LOVE LETTER
     Isi surat tetap di HTML. JavaScript hanya memecah tiap paragraf menjadi
     kata-kata agar bisa muncul satu per satu dengan halus.
     ======================================================================== */
  function initLetter() {
    const letter = $("#letter");
    const openBtn = $("#openLetter");
    const envelope = $("#envelope");
    const letterBody = $("#letterBody");
    if (!letter || !openBtn) return;

    let opened = false;

    letter.style.setProperty("--word-delay", (Number(cfg.letterWordDelay) || 40) + "ms");

    function splitIntoWords() {
      let counter = 0;
      $$("p", letterBody).forEach((paragraph) => {
        const words = paragraph.textContent.replace(/\s+/g, " ").trim().split(" ");
        paragraph.textContent = "";
        words.forEach((word, i) => {
          const span = document.createElement("span");
          span.className = "w";
          span.style.setProperty("--i", String(counter++));
          span.textContent = word;
          paragraph.appendChild(span);
          if (i < words.length - 1) paragraph.appendChild(document.createTextNode(" "));
        });
        counter += 5; // jeda kecil antar paragraf
      });
    }

    openBtn.addEventListener("click", async () => {
      if (opened) return;
      opened = true;
      openBtn.disabled = true;

      const instant = reduced();
      splitIntoWords();

      letter.classList.add("is-opening");
      envelope.classList.add("is-open");
      await sleep(instant ? 0 : 1650);

      letter.classList.add("is-reading");
      if (instant) letter.classList.add("is-instant");
      letter.scrollIntoView({ behavior: smoothBehavior(), block: "start" });

      await sleep(instant ? 0 : 750);
      letter.classList.add("is-typing");

      // Ketuk surat untuk langsung menampilkan semuanya
      $("#paper").addEventListener("click", () => letter.classList.add("is-instant"), { once: true });
    });
  }


  /* ========================================================================
     12) BIRTHDAY CAKE
     ======================================================================== */
  function initCake() {
    const btn = $("#blowCandles");
    const cake = $("#cake");
    const candles = $$(".candle");
    const message = $("#wishMessage");
    const section = $("#cake-section");
    const finalSection = $("#final");

    let blown = false;
    let busy = false;
    let finalRevealed = false;

    function revealFinal() {
      finalRevealed = true;
      finalSection.hidden = false;
      void finalSection.offsetWidth;
      finalSection.classList.add("is-shown");

      // Gulir ke kejutan hanya jika pengguna masih berada di area kue
      const rect = section.getBoundingClientRect();
      const stillHere = rect.bottom > 0 && rect.top < window.innerHeight;
      if (stillHere) {
        setTimeout(() => {
          finalSection.scrollIntoView({ behavior: smoothBehavior(), block: "center" });
        }, reduced() ? 0 : 700);
      }
    }

    async function blow() {
      busy = true;
      btn.disabled = true;

      for (const candle of candles) {
        candle.classList.add("is-out");
        await sleep(reduced() ? 0 : 140);
      }
      await sleep(reduced() ? 0 : 400);

      cake.classList.add("is-blown");
      message.classList.add("is-visible");
      message.setAttribute("aria-hidden", "false");

      const rect = cake.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      Confetti.burst({ x: cx, y: rect.top + 60, angle: -90, spread: 80, count: 110, power: [9, 19] });
      Confetti.rain(60);
      sparkleBurst(cx, rect.top + 30, 20);

      blown = true;
      btn.textContent = "Light them again";
      btn.disabled = false;
      busy = false;

      if (!finalRevealed) {
        await sleep(reduced() ? 400 : 3200);
        revealFinal();
      }
    }

    function relight() {
      candles.forEach((candle) => candle.classList.remove("is-out"));
      cake.classList.remove("is-blown");
      message.classList.remove("is-visible");
      message.setAttribute("aria-hidden", "true");
      btn.textContent = "Blow the Candles";
      blown = false;
    }

    btn.addEventListener("click", () => {
      if (busy) return;
      if (blown) relight(); else blow();
    });
  }


  /* ========================================================================
     13) FINAL SURPRISE & CLOSING
     ======================================================================== */
  function initFinal() {
    const openBtn = $("#openFinal");
    const surprise = $("#surprise");
    const frame = $("#surpriseMedia");
    const video = $("#surpriseVideo");
    let opened = false;

    // Jika file video ada, tampilkan video. Jika tidak, tampilkan foto.
    if (video.readyState >= 1) frame.classList.add("has-video");
    video.addEventListener("loadedmetadata", () => frame.classList.add("has-video"));

    // Musik latar dijeda saat video diputar, lalu dilanjutkan
    video.addEventListener("play", () => {
      if (audio && !audio.paused) {
        resumeAfterVideo = true;
        audio.pause();
        setMusicState(false);
      }
    });
    const resume = () => {
      if (resumeAfterVideo) {
        resumeAfterVideo = false;
        playMusic();
      }
    };
    video.addEventListener("pause", resume);
    video.addEventListener("ended", resume);

    openBtn.addEventListener("click", async () => {
      if (opened) return;
      opened = true;
      openBtn.hidden = true;

      Confetti.cannons();
      spawnFloaters($("#finalFloaters"), { hearts: 26, sparkles: 0, loop: false });
      sparkleBurst(window.innerWidth / 2, window.innerHeight / 2, 22);

      await sleep(reduced() ? 0 : 500);
      surprise.hidden = false;
      void surprise.offsetWidth;
      surprise.classList.add("is-open");

      // Tampilkan dan langsung putar video secara otomatis
      frame.classList.add("has-video");
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
          if (video.error) frame.classList.remove("has-video");
        });
      }

      await sleep(reduced() ? 0 : 500);
      surprise.scrollIntoView({ behavior: smoothBehavior(), block: "center" });
    });

    $("#replay").addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: smoothBehavior() });
    });
  }


  /* ========================================================================
     MULAI
     ======================================================================== */
  bindConfig();
  initImages();
  initMusic();
  initOpening();
  initReveal();
  initProgress();
  initGallery();
  initReasons();
  initLetter();
  initCake();
  initFinal();
})();