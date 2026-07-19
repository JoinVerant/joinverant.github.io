/* ============================================================
   VERANT — interaction layer
   Self-contained. No external requests, no cookies, no storage,
   no analytics. Everything degrades gracefully with JS disabled
   or prefers-reduced-motion set.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- frame-guard (anti-clickjacking) ---------- */
  // This page is never meant to run inside a third-party frame. On GitHub Pages
  // the anti-framing HTTP header (X-Frame-Options / frame-ancestors) is dropped,
  // so enforce it here too. No-op for normal top-level visitors.
  try {
    if (window.self !== window.top) {
      // Same-origin (or accessible) parent: break out by taking over the top window.
      window.top.location.href = window.self.location.href;
    }
  } catch (e) {
    // Cross-origin frame blocked access to window.top — can't break out, so
    // neutralize this page instead so it can't be used as a clickjacking overlay.
    document.documentElement.style.display = "none";
    throw new Error("Verant: refusing to run in a frame");
  }

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
})();
