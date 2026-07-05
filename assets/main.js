/* ============================================================
   VERANT — interaction layer
   Self-contained. No external requests, no cookies, no storage,
   no analytics. Everything degrades gracefully with JS disabled
   or prefers-reduced-motion set.
   ============================================================ */
(function () {
  "use strict";

  // Signal that JS is live — CSS only hides reveal elements under html.js,
  // so a no-JS visit renders the full page.
  document.documentElement.classList.add("js");

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll progress bar ---------- */
  var progress = document.querySelector(".progress");
  if (progress) {
    var onScroll = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var p = max > 0 ? (window.scrollY || doc.scrollTop) / max : 0;
      progress.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- headline line-splitting (DOM-built, no HTML strings) ---------- */
  function splitLines(el) {
    if (reduce) return;
    if (el.children.length) return; // only split plain-text headlines
    var words = el.textContent.trim().split(/\s+/);
    if (words.length < 2) return;
    var probe = document.createElement("span");
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "nowrap";
    el.appendChild(probe);
    var maxW = el.clientWidth, lines = [], cur = [];
    function width(t) { probe.textContent = t; return probe.offsetWidth; }
    words.forEach(function (word) {
      var test = cur.concat(word).join(" ");
      if (width(test) > maxW && cur.length) { lines.push(cur.join(" ")); cur = [word]; }
      else cur.push(word);
    });
    if (cur.length) lines.push(cur.join(" "));
    el.textContent = "";
    lines.forEach(function (L) {
      var w = document.createElement("span"); w.className = "line-wrap";
      var s = document.createElement("span"); s.className = "line";
      s.textContent = L;
      w.appendChild(s); el.appendChild(w);
    });
  }
  document.querySelectorAll(".h-xl, .h-lg, .closing h2").forEach(splitLines);

  /* ---------- scroll reveals ---------- */
  var revealables = document.querySelectorAll(".rv, .rv-l, .rv-r, .rv-s, .stagger");
  if (reduce) {
    revealables.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add("in");
        else if (e.boundingClientRect.top > 0) e.target.classList.remove("in"); // reset below viewport so it replays on the way back down
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- meter bars: fill from data-w when visible ---------- */
  var bars = document.querySelectorAll(".pbar span[data-w]");
  if (bars.length) {
    if (reduce) {
      bars.forEach(function (b) { b.style.width = b.getAttribute("data-w"); });
    } else {
      var bio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.style.width = e.isIntersecting ? e.target.getAttribute("data-w") : "0%";
        });
      }, { threshold: 0.4 });
      bars.forEach(function (b) { bio.observe(b); });
    }
  }

  /* ---------- count-up stats ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var dur = 1400, t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (k < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(frame);
  }
  if (counters.length) {
    if (reduce) {
      counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- pointer spotlight on cards ---------- */
  var lit = document.querySelectorAll(".panel, .step, .shield, .tier");
  lit.forEach(function (el) {
    el.addEventListener("pointermove", function (ev) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (ev.clientX - r.left) + "px");
      el.style.setProperty("--my", (ev.clientY - r.top) + "px");
    });
  });

  /* ---------- subtle 3D tilt on telemetry panels ---------- */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".panel").forEach(function (el) {
      el.addEventListener("pointermove", function (ev) {
        var r = el.getBoundingClientRect();
        var rx = ((ev.clientY - r.top) / r.height - 0.5) * -5;
        var ry = ((ev.clientX - r.left) / r.width - 0.5) * 5;
        el.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".btn").forEach(function (el) {
      el.addEventListener("pointermove", function (ev) {
        var r = el.getBoundingClientRect();
        var dx = (ev.clientX - (r.left + r.width / 2)) * 0.12;
        var dy = (ev.clientY - (r.top + r.height / 2)) * 0.22;
        el.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- click ripple + haptics ---------- */
  function haptic(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* unsupported */ } }
  }
  document.addEventListener("pointerdown", function (ev) {
    var btn = ev.target.closest(".btn, .nav-cta");
    var tappable = btn || ev.target.closest("summary, .nav-links a, .fcol a");
    if (tappable) haptic(10);
    if (!btn || reduce) return;
    var r = btn.getBoundingClientRect();
    var d = Math.max(r.width, r.height);
    var rip = document.createElement("span");
    rip.className = "ripple";
    rip.style.width = rip.style.height = d + "px";
    rip.style.left = (ev.clientX - r.left - d / 2) + "px";
    rip.style.top = (ev.clientY - r.top - d / 2) + "px";
    btn.appendChild(rip);
    setTimeout(function () { rip.remove(); }, 650);
  }, { passive: true });

  /* ---------- ticker: duplicate children once for the seamless -50% loop ---------- */
  var track = document.querySelector(".ticker-track");
  if (track && !track.hasAttribute("data-dup")) {
    track.setAttribute("data-dup", "1");
    Array.prototype.slice.call(track.children).forEach(function (n) {
      track.appendChild(n.cloneNode(true));
    });
  }

  /* ---------- FAQ smooth open/close ---------- */
  document.querySelectorAll(".faq details").forEach(function (det) {
    var summary = det.querySelector("summary");
    var ans = det.querySelector(".ans");
    if (!summary || !ans || reduce) return;
    summary.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (det.hasAttribute("data-busy")) return;
      det.setAttribute("data-busy", "1");
      if (det.open) {
        var h = ans.offsetHeight;
        ans.style.height = h + "px"; ans.style.overflow = "hidden";
        requestAnimationFrame(function () {
          ans.style.transition = "height .32s cubic-bezier(.22,.08,.18,1), opacity .25s";
          ans.style.height = "0px"; ans.style.opacity = "0";
        });
        setTimeout(function () {
          det.open = false;
          ans.style.cssText = "";
          det.removeAttribute("data-busy");
        }, 330);
      } else {
        det.open = true;
        var target = ans.offsetHeight;
        ans.style.height = "0px"; ans.style.opacity = "0"; ans.style.overflow = "hidden";
        requestAnimationFrame(function () {
          ans.style.transition = "height .36s cubic-bezier(.22,.08,.18,1), opacity .3s .1s";
          ans.style.height = target + "px"; ans.style.opacity = "1";
        });
        setTimeout(function () {
          ans.style.cssText = "";
          det.removeAttribute("data-busy");
        }, 380);
      }
    });
  });

  /* ---------- hero telemetry canvas ---------- */
  var canvas = document.getElementById("telemetry");
  if (canvas && !reduce && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    var running = true, tPrev = 0, phase = 0;

    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // trace definitions: [baseline%, amplitude, wavelength, speed, color, width]
    var traces = [
      [0.34, 26, 340, 0.55, "rgba(111,163,224,0.50)", 1.6],
      [0.52, 40, 520, 0.35, "rgba(47,109,180,0.38)", 1.4],
      [0.70, 18, 240, 0.80, "rgba(224,138,60,0.42)", 1.4]
    ];

    function noiseY(tr, x, t) {
      var b = H * tr[0];
      return b
        + Math.sin((x + t * 60 * tr[3]) / tr[2] * Math.PI * 2) * tr[1]
        + Math.sin((x * 0.37 + t * 90 * tr[3]) / tr[2] * Math.PI * 2) * tr[1] * 0.45
        + Math.sin((x * 1.93 - t * 40 * tr[3]) / tr[2] * Math.PI * 2) * tr[1] * 0.18;
    }

    function draw(t) {
      if (!running) return;
      requestAnimationFrame(draw);
      if (t - tPrev < 1000 / 40) return; // ~40fps cap
      tPrev = t;
      phase = t / 1000;
      ctx.clearRect(0, 0, W, H);

      // survey grid
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 1;
      var gs = 72;
      ctx.beginPath();
      for (var gx = 0.5; gx < W; gx += gs) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
      for (var gy = 0.5; gy < H; gy += gs) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
      ctx.stroke();

      // traces
      traces.forEach(function (tr) {
        ctx.strokeStyle = tr[4];
        ctx.lineWidth = tr[5];
        ctx.beginPath();
        for (var x = 0; x <= W; x += 6) {
          var y = noiseY(tr, x, phase);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // sweep line
      var sx = ((phase * 90) % (W + 240)) - 120;
      var grad = ctx.createLinearGradient(sx - 90, 0, sx, 0);
      grad.addColorStop(0, "rgba(224,138,60,0)");
      grad.addColorStop(1, "rgba(224,138,60,0.14)");
      ctx.fillStyle = grad;
      ctx.fillRect(sx - 90, 0, 90, H);
      ctx.fillStyle = "rgba(224,138,60,0.35)";
      ctx.fillRect(sx, 0, 1.2, H);

      // markers riding trace 0
      ctx.fillStyle = "rgba(240,168,98,0.9)";
      var mx = (sx + W) % W;
      var my = noiseY(traces[0], mx, phase);
      ctx.beginPath(); ctx.arc(mx, my, 3, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(draw);

    // pause offscreen / hidden tab
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var was = running;
        running = e.isIntersecting && !document.hidden;
        if (running && !was) requestAnimationFrame(draw);
      });
    }, { threshold: 0.05 });
    vio.observe(canvas);
    document.addEventListener("visibilitychange", function () {
      var was = running;
      running = !document.hidden;
      if (running && !was) requestAnimationFrame(draw);
    });
  }
})();
