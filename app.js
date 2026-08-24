/* ============================================================
   Shared site logic.
   - Injects the header and footer on every page
   - Content store: seed content + changes saved in this browser
     (in production, replaced by the real CMS backend)
   - Renders news cards and bulletin lists
   ============================================================ */

(function () {
  "use strict";

  var STORE_KEY = "stmaron_demo_v1";

  // ---------- Content store ----------
  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable: fall back to memory */ }
    return { newsAdded: [], newsRemoved: [], bullAdded: [], bullRemoved: [] };
  }

  var state = loadState();

  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* memory only */ }
  }

  function byDateDesc(a, b) { return (b.date || "").localeCompare(a.date || ""); }

  function getNews() {
    var seed = window.STM_SEED.news.filter(function (n) { return state.newsRemoved.indexOf(n.id) === -1; });
    var added = state.newsAdded.filter(function (n) { return state.newsRemoved.indexOf(n.id) === -1; });
    return added.concat(seed).sort(byDateDesc);
  }

  function getBulletins() {
    var seed = window.STM_SEED.bulletins.filter(function (b) { return state.bullRemoved.indexOf(b.id) === -1; });
    var added = state.bullAdded.filter(function (b) { return state.bullRemoved.indexOf(b.id) === -1; });
    return added.concat(seed).sort(byDateDesc);
  }

  // ---------- Helpers ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function prettyDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function safeUrl(u) {
    var s = String(u || "").trim();
    if (!s) return "";
    if (/^(https?:)?\/\//i.test(s) || /^[\w-]+\.html/.test(s) || /^mailto:/i.test(s) || /^tel:/i.test(s)) return s;
    return "https://" + s;
  }

  var CREST =
    '<svg class="crest" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M8 60 L8 26 A24 24 0 0 1 56 26 L56 60 Z" fill="#6b2233" stroke="#b08a2e" stroke-width="2"/>' +
    '<g stroke="#d3b563" stroke-width="2.4" stroke-linecap="round">' +
    '<line x1="32" y1="18" x2="32" y2="52"/>' +
    '<path d="M32 24 L21 29 M32 24 L43 29" fill="none"/>' +
    '<path d="M32 33 L18 39 M32 33 L46 39" fill="none"/>' +
    '<path d="M32 42 L20 48 M32 42 L44 48" fill="none"/>' +
    '</g></svg>';

  var PDF_ICON =
    '<svg class="b-icon" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="6" y="3" width="24" height="34" rx="3" fill="#6b2233"/>' +
    '<path d="M30 3 L34 9 L30 9 Z" fill="#b08a2e"/>' +
    '<text x="18" y="26" text-anchor="middle" fill="#d3b563" font-family="Georgia, serif" font-size="10">PDF</text>' +
    '</svg>';

  // ---------- Chrome (header / footer) ----------
  var NAV = [
    ["index.html", "Home"],
    ["news.html", "News"],
    ["bulletin.html", "Bulletin"],
    ["contact.html", "Contact"],
    ["donate.html", "Donate"],
  ];

  function renderChrome(active) {
    var header = document.getElementById("site-header");
    if (header) {
      var links = NAV.map(function (n) {
        var cls = n[0] === active ? ' class="active" aria-current="page"' : "";
        return '<a href="' + n[0] + '"' + cls + ">" + n[1] + "</a>";
      }).join("");
      header.innerHTML =
        '<div class="wrap">' +
        '<div class="masthead">' + CREST +
        '<div class="masthead-names">' +
        '<a class="name" href="index.html">Saint Maron Church</a>' +
        '<span class="place">Maronite Catholic &middot; South Philadelphia</span>' +
        "</div></div>" +
        '<nav class="nav" aria-label="Main navigation">' + links + "</nav>" +
        "</div>";
    }

    var footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML =
        '<div class="wrap">' +
        '<div class="footer-grid">' +
        "<div><h3>Saint Maron Church</h3>" +
        "<p>1013 Ellsworth Street<br>Philadelphia, PA 19147</p>" +
        '<p class="blessing">Peace be with you &middot; &#1587;&#1604;&#1575;&#1605; &#1604;&#1603;&#1605;</p></div>' +
        "<div><h3>Visit</h3><p><a href=\"index.html\">Home</a><br><a href=\"news.html\">Parish News</a><br><a href=\"bulletin.html\">Weekly Bulletin</a></p></div>" +
        "<div><h3>Connect</h3><p><a href=\"contact.html\">Contact Us</a><br><a href=\"donate.html\">Support the Parish</a><br><a href=\"admin.html\">Parish Staff Sign-In</a></p></div>" +
        "</div>" +
        '<div class="footer-base">' +
        "<span>&copy; 2026 Saint Maron Maronite Catholic Church. Demonstration site &mdash; placeholder content.</span>" +
        "<span>Eparchy of Saint Maron of Brooklyn</span>" +
        "</div></div>";
    }

    // Scroll reveal
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll(".reveal").forEach(function (el) { obs.observe(el); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    }

    // Failsafe: nothing stays hidden for more than a moment, no matter what.
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { el.classList.add("in"); });
    }, 2000);
  }

  // ---------- Renderers ----------
  function newsCard(n) {
    var img;
    if (n.imageData) {
      img = '<img src="' + n.imageData + '" alt="' + esc(n.title) + '">';
    } else {
      img = window.STM_ART[n.art] || window.STM_ART.window;
    }
    var link = "";
    if (n.link && n.link.url) {
      var url = safeUrl(n.link.url);
      // Off-site links (sign-up forms and the like) open in a new tab so the
      // parish site stays put; internal pages stay in the same tab.
      var ext = /^(https?:)?\/\//i.test(url) ? ' target="_blank" rel="noopener"' : "";
      link = '<div class="card-actions"><a class="btn small" href="' + esc(url) + '"' + ext + ">" + esc(n.link.label || "Learn more") + "</a></div>";
    }
    return (
      '<article class="card fade-in">' +
      '<div class="card-img">' + img + "</div>" +
      '<div class="card-body">' +
      '<span class="date">' + esc(prettyDate(n.date)) + "</span>" +
      "<h3>" + esc(n.title) + "</h3>" +
      "<p>" + esc(n.body) + "</p>" +
      link +
      "</div></article>"
    );
  }

  function renderNews(id, limit) {
    var el = document.getElementById(id);
    if (!el) return;
    var items = getNews();
    if (limit) items = items.slice(0, limit);
    if (!items.length) {
      el.innerHTML = '<div class="empty-state">No news has been posted yet. Check back soon.</div>';
      return;
    }
    el.innerHTML = items.map(newsCard).join("");
  }

  function renderBulletins(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var items = getBulletins();
    if (!items.length) {
      el.innerHTML = '<div class="empty-state">No bulletins are available right now. Check back soon.</div>';
      return;
    }
    el.innerHTML = items.map(function (b) {
      var href = b.fileData ? b.fileData : b.file;
      var dl = b.fileData ? ' download="' + esc(b.title) + '.pdf"' : ' target="_blank" rel="noopener"';
      return (
        '<div class="bulletin-item fade-in">' + PDF_ICON +
        '<div class="b-meta"><span class="date">' + esc(prettyDate(b.date)) + "</span>" +
        "<h3>" + esc(b.title) + "</h3></div>" +
        '<a class="btn small" href="' + esc(href) + '"' + dl + ">Open PDF</a>" +
        "</div>"
      );
    }).join("");
  }

  // ---------- Toast ----------
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  // ---------- Admin API ----------
  var Admin = {
    addNews: function (item) {
      item.id = "user-news-" + Date.now();
      state.newsAdded.unshift(item);
      saveState();
      return item;
    },
    removeNews: function (id) {
      state.newsRemoved.push(id);
      state.newsAdded = state.newsAdded.filter(function (n) { return n.id !== id; });
      saveState();
    },
    addBulletin: function (item) {
      item.id = "user-bull-" + Date.now();
      state.bullAdded.unshift(item);
      saveState();
      return item;
    },
    removeBulletin: function (id) {
      state.bullRemoved.push(id);
      state.bullAdded = state.bullAdded.filter(function (b) { return b.id !== id; });
      saveState();
    },
    reset: function () {
      state = { newsAdded: [], newsRemoved: [], bullAdded: [], bullRemoved: [] };
      saveState();
    },
  };

  // ---------- Public API ----------
  window.STM = {
    renderChrome: renderChrome,
    renderNews: renderNews,
    renderBulletins: renderBulletins,
    getNews: getNews,
    getBulletins: getBulletins,
    prettyDate: prettyDate,
    esc: esc,
    toast: toast,
    Admin: Admin,
  };
})();
