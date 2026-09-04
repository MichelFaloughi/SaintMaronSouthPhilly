/* ============================================================
   Shared site logic.
   - Injects the header and footer on every page
   - Renders news cards and bulletin lists from content/*.json
   ============================================================ */

(function () {
  "use strict";

  // ---------- Content ----------
  // News and bulletins live in content/*.json, written by the CMS at /admin.
  // Each file holds { "items": [...] }. One file per collection rather than one
  // file per entry, because with no build step a browser cannot list a folder.
  var SOURCES = {
    news: "content/news.json",
    bulletins: "content/bulletins.json",
  };
  var pending = {};

  function byDateDesc(a, b) { return (b.date || "").localeCompare(a.date || ""); }

  function load(kind) {
    if (!pending[kind]) {
      pending[kind] = fetch(SOURCES[kind], { cache: "no-cache" })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (data) {
          var items = data && Array.isArray(data.items) ? data.items : [];
          return items.slice().sort(byDateDesc);
        })
        .catch(function (err) {
          // Unreachable content is not fatal: the page shows its "check back
          // soon" notice instead of breaking. Also the case on file:// URLs,
          // where fetch is blocked -- serve the folder over http to see content.
          console.warn("Could not load " + kind + ": " + err.message);
          return [];
        });
    }
    return pending[kind];
  }

  // Both return a promise for the sorted list, newest first.
  function getNews() { return load("news"); }
  function getBulletins() { return load("bulletins"); }

  // ---------- Page content ----------
  // Each page's editable text lives in content/pages/*.json, written by the
  // "Site Pages" section of the CMS. Elements opt in with data-cms attributes
  // naming a key path; the HTML they ship with is the fallback if the JSON is
  // missing, so a fetch failure leaves the page exactly as authored.
  var PAGES = {
    "index.html": "content/pages/home.json",
    "contact.html": "content/pages/contact.json",
    "donate.html": "content/pages/donate.json",
    "news.html": "content/pages/news.json",
    "bulletin.html": "content/pages/bulletin.json",
  };

  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  function textHtml(v) { return esc(v).replace(/\n/g, "<br>"); }

  function phoneDigits(v) {
    var d = String(v || "").replace(/\D/g, "");
    return d.length === 10 ? "1" + d : d;
  }

  // A missing key leaves the baked-in HTML alone; an empty string is a
  // deliberate clearing by the editor and blanks the element.
  function eachCms(data, attr, fn) {
    document.querySelectorAll("[" + attr + "]").forEach(function (el) {
      var v = getPath(data, el.getAttribute(attr));
      if (v == null) return;
      fn(el, v);
    });
  }

  function applyContent(data) {
    eachCms(data, "data-cms", function (el, v) { el.innerHTML = textHtml(v); });
    eachCms(data, "data-cms-href", function (el, v) { if (String(v).trim()) el.href = safeUrl(v); });
    eachCms(data, "data-cms-src", function (el, v) { if (String(v).trim()) el.src = v; });
    eachCms(data, "data-cms-alt", function (el, v) { el.alt = v; });
    eachCms(data, "data-cms-tel", function (el, v) {
      el.textContent = v;
      var d = phoneDigits(v);
      if (d) el.href = "tel:+" + d; else el.removeAttribute("href");
    });
    eachCms(data, "data-cms-wa", function (el, v) {
      el.textContent = v;
      var d = phoneDigits(v);
      if (d) el.href = "https://wa.me/" + d; else el.removeAttribute("href");
    });
    eachCms(data, "data-cms-mailto", function (el, v) {
      el.textContent = v;
      if (String(v).trim()) el.href = "mailto:" + v; else el.removeAttribute("href");
    });
    eachCms(data, "data-cms-map", function (el, v) {
      if (String(v).trim()) el.src = "https://maps.google.com/maps?q=" + encodeURIComponent(v) + "&z=16&output=embed";
    });
    eachCms(data, "data-cms-dir", function (el, v) {
      if (String(v).trim()) el.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(v);
    });
    eachCms(data, "data-cms-times", function (el, v) {
      if (!Array.isArray(v)) return;
      el.innerHTML = v.map(function (t) {
        return "<dt>" + esc(t.service) + "</dt><dd>" + esc(t.time) + "</dd>";
      }).join("");
    });
  }

  function renderPage(active) {
    var src = PAGES[active];
    if (!src) return Promise.resolve();
    return fetch(src, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(applyContent)
      .catch(function (err) {
        console.warn("Could not load page content: " + err.message);
      });
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

  var PDF_ICON =
    '<svg class="b-icon" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="6" y="3" width="24" height="34" rx="3" fill="#6b2233"/>' +
    '<path d="M30 3 L34 9 L30 9 Z" fill="#b08a2e"/>' +
    '<text x="18" y="26" text-anchor="middle" fill="#d3b563" font-family="Georgia, serif" font-size="10">PDF</text>' +
    '</svg>';

  // ---------- Chrome (header / footer) ----------
  var NAV = [
    ["index.html", "Home"],
    ["contact.html", "Contact"],
    ["news.html", "News"],
    ["bulletin.html", "Bulletin"],
    ["donate.html", "Donate"],
  ];

  function renderChrome(active) {
    renderPage(active);

    var header = document.getElementById("site-header");
    if (header) {
      var links = NAV.map(function (n) {
        var cls = n[0] === active ? ' class="active" aria-current="page"' : "";
        return '<a href="' + n[0] + '"' + cls + ">" + n[1] + "</a>";
      }).join("");
      header.innerHTML =
        '<div class="wrap">' +
        '<div class="masthead"><img class="crest" src="images/logo.png" alt="">' +
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
        "<p>1013 Ellsworth Street<br>Philadelphia, PA 19147</p></div>" +
        "<div><h3>Visit</h3><p><a href=\"index.html\">Home</a><br><a href=\"news.html\">Parish News</a><br><a href=\"bulletin.html\">Weekly Bulletin</a></p></div>" +
        "<div><h3>Connect</h3><p><a href=\"contact.html\">Contact Us</a><br><a href=\"donate.html\">Support the Parish</a><br><a href=\"admin/\">Admin Portal</a></p></div>" +
        "</div>" +
        '<div class="footer-base">' +
        "<span>&copy; 2026 Saint Maron Maronite Catholic Church</span>" +
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
    var img = n.image
      ? '<img src="' + esc(n.image) + '" alt="' + esc(n.imageAlt || n.title) + '">'
      : window.STM_ART[n.art] || window.STM_ART.window;
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
      "<p>" + textHtml(n.body) + "</p>" +
      link +
      "</div></article>"
    );
  }

  function renderNews(id, limit) {
    var el = document.getElementById(id);
    if (!el) return Promise.resolve();
    return getNews().then(function (items) {
      if (limit) items = items.slice(0, limit);
      if (!items.length) {
        el.innerHTML = '<div class="empty-state">No news has been posted yet. Check back soon.</div>';
        return;
      }
      el.innerHTML = items.map(newsCard).join("");
    });
  }

  function renderBulletins(id) {
    var el = document.getElementById(id);
    if (!el) return Promise.resolve();
    return getBulletins().then(function (items) {
      if (!items.length) {
        el.innerHTML = '<div class="empty-state">No bulletins are available right now. Check back soon.</div>';
        return;
      }
      el.innerHTML = items.map(function (b) {
        return (
          '<div class="bulletin-item fade-in">' + PDF_ICON +
          '<div class="b-meta"><span class="date">' + esc(prettyDate(b.date)) + "</span>" +
          "<h3>" + esc(b.title) + "</h3></div>" +
          '<a class="btn small" href="' + esc(b.file) + '" target="_blank" rel="noopener">Open PDF</a>' +
          "</div>"
        );
      }).join("");
    });
  }

  // ---------- Public API ----------
  window.STM = {
    renderChrome: renderChrome,
    renderPage: renderPage,
    renderNews: renderNews,
    renderBulletins: renderBulletins,
    getNews: getNews,
    getBulletins: getBulletins,
    prettyDate: prettyDate,
    esc: esc,
  };
})();
