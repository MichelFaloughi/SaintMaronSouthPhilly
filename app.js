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

  // ---------- Rich text ----------
  // News bodies and home-page section text come from the CMS's rich text
  // editor as HTML. That HTML is untrusted like everything else from the
  // CMS, so it is rebuilt here from an allowlist: only these tags survive,
  // links get the same safeUrl() treatment as every other URL, and the only
  // style kept is the editor's own text-align. Anything else (scripts,
  // event handlers, images, iframes, colors) is dropped, with its text kept.
  var RICH_TAGS = { p: 1, br: 1, strong: 1, b: 1, em: 1, i: 1, s: 1, a: 1, ul: 1, ol: 1, li: 1, h3: 1, h4: 1, blockquote: 1 };

  function richHtml(v) {
    var s = String(v == null ? "" : v);
    // Entries written before the editor existed are plain text with line
    // breaks; they are shown as paragraphs so the layout matches.
    if (!/<[a-z][\s\S]*>/i.test(s)) return paragraphs(s);
    var doc = new DOMParser().parseFromString(s, "text/html");
    return cleanNodes(doc.body);
  }

  // Titles and captions: the same editor with bold, italic, and alignment
  // only. Block tags are flattened to line breaks so the result fits inside
  // an existing heading or span; the alignment of the first block is
  // returned separately so the caller can put it on the host element.
  var INLINE_TAGS = { strong: 1, b: 1, em: 1, i: 1, s: 1, a: 1, br: 1 };

  function inlineRich(v) {
    var s = String(v == null ? "" : v);
    if (!/<[a-z][\s\S]*>/i.test(s)) return { html: textHtml(s), align: "" };
    var doc = new DOMParser().parseFromString(s, "text/html");
    var first = doc.body.querySelector("p, h1, h2, h3, h4, h5, h6, li, blockquote");
    var align = first && first.style ? first.style.textAlign : "";
    if (!/^(left|center|right|justify)$/.test(align)) align = "";
    var html = cleanNodes(doc.body, INLINE_TAGS, "<br>").replace(/^(<br>)+|(<br>)+$/g, "");
    return { html: html, align: align };
  }

  function titleTag(tag, v) {
    var r = inlineRich(v);
    return "<" + tag + (r.align ? ' style="text-align:' + r.align + '"' : "") + ">" + r.html + "</" + tag + ">";
  }

  function plainText(v) {
    var s = String(v == null ? "" : v);
    if (!/<[a-z][\s\S]*>/i.test(s)) return s;
    return new DOMParser().parseFromString(s, "text/html").body.textContent || "";
  }

  function paragraphs(s) {
    s = String(s || "").trim();
    if (!s) return "";
    return s.split(/\n\s*\n/).map(function (p) { return "<p>" + textHtml(p) + "</p>"; }).join("");
  }

  // `allowed` is the tag allowlist; `blockSep` (optional) replaces block
  // tags that are not allowed, so paragraphs become line breaks in a title.
  function cleanNodes(parent, allowed, blockSep) {
    allowed = allowed || RICH_TAGS;
    var out = "";
    parent.childNodes.forEach(function (n) {
      if (n.nodeType === 3) { out += esc(n.nodeValue); return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "template") return;
      if (!allowed[tag]) {
        var inner = cleanNodes(n, allowed, blockSep);
        if (blockSep && /^(p|div|h[1-6]|li|blockquote|ul|ol)$/.test(tag) && inner) inner += blockSep;
        out += inner;
        return;
      }
      if (tag === "b") tag = "strong";
      if (tag === "i") tag = "em";
      if (tag === "br") { out += "<br>"; return; }
      var attrs = "";
      if (tag === "a") {
        var raw = String(n.getAttribute("href") || "").trim();
        // Only web, mail, and phone links; anything with another scheme
        // (javascript:, data:, ...) is shown as plain text.
        if (/^[a-z][\w+.-]*:/i.test(raw) && !/^(https?|mailto|tel):/i.test(raw)) { out += cleanNodes(n, allowed, blockSep); return; }
        var href = safeUrl(raw);
        if (!href) { out += cleanNodes(n, allowed, blockSep); return; }
        attrs += ' href="' + esc(href) + '"';
        if (/^(https?:)?\/\//i.test(href)) attrs += ' target="_blank" rel="noopener"';
      }
      var align = n.style ? n.style.textAlign : "";
      if (/^(left|center|right|justify)$/.test(align)) attrs += ' style="text-align:' + align + '"';
      out += "<" + tag + attrs + ">" + cleanNodes(n, allowed, blockSep) + "</" + tag + ">";
    });
    return out;
  }

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
    eachCms(data, "data-cms", function (el, v) {
      if (el.classList.contains("rich")) { el.innerHTML = richHtml(v); return; }
      var r = inlineRich(v);
      el.innerHTML = r.html;
      el.style.textAlign = r.align;
    });
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

  // ---------- Theme ----------
  // The "Design" entry in the CMS writes content/theme.json: a palette name
  // and a font-pairing name, both chosen from the preset lists in
  // theme-presets.js (shared with the CMS preview). An unknown name simply
  // leaves the site in its default burgundy-and-Marcellus look.
  var PALETTES = window.STM_THEME.PALETTES;
  var FONT_PAIRS = window.STM_THEME.FONT_PAIRS;

  function applyTheme() {
    return fetch("content/theme.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (t) {
        var root = document.documentElement.style;
        var palette = t && PALETTES[t.palette];
        if (palette) {
          Object.keys(palette).forEach(function (k) { root.setProperty(k, palette[k]); });
        }
        var pair = t && FONT_PAIRS[t.fonts];
        if (pair) {
          var link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = window.STM_THEME.fontsUrl(pair);
          document.head.appendChild(link);
          root.setProperty("--display", pair.display);
          root.setProperty("--body", pair.body);
        }
      })
      .catch(function (err) {
        console.warn("Could not load theme: " + err.message);
      });
  }

  // ---------- Custom sections ----------
  // The Home Page entry in the CMS carries a "sections" list the parish
  // office can add to freely. Each item picks one of the layouts below and
  // renders into the #home-sections container between the fixed sections.
  function sectionButtons(buttons, center) {
    if (!Array.isArray(buttons)) return "";
    var links = buttons
      .filter(function (b) { return b && (b.label || b.url); })
      .map(function (b, i) {
        var url = safeUrl(b.url) || "#";
        var ext = /^(https?:)?\/\//i.test(url) ? ' target="_blank" rel="noopener"' : "";
        return '<a class="btn' + (i === 0 ? " primary" : "") + '" href="' + esc(url) + '"' + ext + ">" + esc(b.label || "Learn more") + "</a>";
      }).join("");
    if (!links) return "";
    return '<div class="section-actions' + (center ? " center" : "") + '">' + links + "</div>";
  }

  function sectionHtml(s, i) {
    if (!s) return "";
    var layout = s.layout || "text";
    var alt = i % 2 === 0 ? " alt" : "";
    var eyebrow = s.eyebrow ? '<span class="eyebrow">' + esc(s.eyebrow) + "</span>" : "";
    var heading = s.heading ? titleTag("h2", s.heading) : "";
    var text = s.text ? '<div class="body rich">' + richHtml(s.text) + "</div>" : "";
    var img = s.image
      ? '<figure class="parish-photo"><img src="' + esc(s.image) + '" alt="' + esc(s.imageAlt || "") + '"></figure>'
      : "";

    if (layout === "banner") {
      return (
        '<section class="section"><div class="wrap"><div class="callout">' +
        "<div>" + heading + (s.text ? '<div class="rich">' + richHtml(s.text) + "</div>" : "") + "</div>" +
        sectionButtons(s.buttons, false) +
        "</div></div></section>"
      );
    }

    if ((layout === "photo-left" || layout === "photo-right") && img) {
      var col = "<div>" + eyebrow + heading + (heading ? '<hr class="rule">' : "") + text + sectionButtons(s.buttons, false) + "</div>";
      return (
        '<section class="section' + alt + '"><div class="wrap parish-intro custom">' +
        (layout === "photo-left" ? img + col : col + img) +
        "</div></section>"
      );
    }

    // Text-only layout, also the fallback when a photo layout has no photo.
    return (
      '<section class="section' + alt + '"><div class="wrap custom-section center">' +
      '<div class="section-head center">' + eyebrow + heading + (heading ? '<hr class="rule center">' : "") + "</div>" +
      text + sectionButtons(s.buttons, true) +
      "</div></section>"
    );
  }

  function renderSections(list) {
    var el = document.getElementById("home-sections");
    if (!el || !Array.isArray(list)) return;
    el.innerHTML = list.map(sectionHtml).join("");
  }

  function renderPage(active) {
    var src = PAGES[active];
    if (!src) return Promise.resolve();
    return fetch(src, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        applyContent(data);
        renderSections(data.sections);
      })
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
    '<rect x="6" y="3" width="24" height="34" rx="3" style="fill:var(--burgundy, #6b2233)"/>' +
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
    applyTheme();
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
      ? '<img src="' + esc(n.image) + '" alt="' + esc(n.imageAlt || plainText(n.title)) + '">'
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
      titleTag("h3", n.title) +
      '<div class="rich">' + richHtml(n.body) + "</div>" +
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

  // ---------- Priests band ----------
  // A slow, endless strip of every priest who has served the parish, from
  // content/priests.json (the "Priests" entry in the CMS). The list is
  // rendered twice so the CSS animation can slide one full copy and loop
  // seamlessly; the second copy is hidden from assistive technology. The
  // whole section stays hidden until there is something to show, so a
  // failed fetch leaves no empty strip behind.
  var PRIEST_PLACEHOLDER =
    '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect width="80" height="80" style="fill:var(--burgundy, #6b2233)"/>' +
    '<path d="M40 18 V62 M22 36 H58" stroke="#d3b563" stroke-width="4" stroke-linecap="round"/>' +
    '</svg>';

  function priestHtml(p) {
    var alt = p.name ? "Portrait of " + p.name : "";
    var img = p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(alt) + '" width="80" height="80">'
      : PRIEST_PLACEHOLDER;
    var years = p.years ? '<span class="priest-years">' + esc(p.years) + "</span>" : "";
    var role = p.role ? '<span class="priest-role">' + esc(p.role) + "</span>" : "";
    return (
      '<li class="priest"><span class="priest-photo">' + img + "</span>" +
      '<span class="priest-name">' + esc(p.name) + "</span>" + years + role + "</li>"
    );
  }

  // Seconds each portrait takes to cross, by the CMS "Speed" setting.
  var PRIEST_SPEEDS = { slow: 6, normal: 4, fast: 2.5 };

  // Moving content needs a way to stop it that works without a mouse, so
  // the strip has a Pause / Play button (hover still pauses it too).
  function wirePriestsToggle(el) {
    var btn = el.querySelector(".priests-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var paused = el.classList.toggle("paused");
      btn.textContent = paused ? "Play" : "Pause";
    });
  }

  function renderPriests(id) {
    var el = document.getElementById(id);
    if (!el) return Promise.resolve();
    return fetch("content/priests.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        // The parish office can switch the whole strip off in the CMS; a
        // missing setting counts as on.
        if (!data || data.show === false) return;
        var items = Array.isArray(data.items) ? data.items : [];
        items = items.filter(function (p) { return p && p.name && !p.hidden; });
        if (!items.length) return;
        var heading = el.querySelector(".priests-heading");
        if (heading && data.heading != null) heading.textContent = data.heading;
        var track = el.querySelector(".priests-track");
        track.innerHTML = items.map(priestHtml).join("");
        var copy = track.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        track.parentNode.appendChild(copy);
        // A few seconds per portrait keeps the pace steady however many
        // priests are listed.
        var perPriest = PRIEST_SPEEDS[data.speed] || PRIEST_SPEEDS.normal;
        el.style.setProperty("--priests-duration", items.length * perPriest + "s");
        wirePriestsToggle(el);
        el.hidden = false;
      })
      .catch(function (err) {
        console.warn("Could not load priests: " + err.message);
      });
  }

  // ---------- Lightbox ----------
  // Clicking a content photo (the parish photo, CMS section photos, news
  // card images) opens it enlarged in an overlay. The click handler is
  // delegated from the document so photos added by later renders are
  // covered without re-wiring; the overlay itself is built on first use.
  var lightbox = null;
  var lightboxReturnFocus = null;

  function buildLightbox() {
    var el = document.createElement("div");
    el.className = "lightbox";
    el.hidden = true;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Enlarged photo");
    el.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close enlarged photo">&times;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>';
    el.addEventListener("click", closeLightbox);
    document.body.appendChild(el);
    return el;
  }

  function openLightbox(img) {
    lightbox = lightbox || buildLightbox();
    var big = lightbox.querySelector("img");
    big.src = img.currentSrc || img.src;
    big.alt = img.alt || "";
    // Prefer the photo's visible caption; fall back to its alt text.
    var fig = img.closest("figure");
    var capEl = fig && fig.querySelector("figcaption");
    lightbox.querySelector("figcaption").textContent =
      (capEl && capEl.textContent) || img.alt || "";
    lightboxReturnFocus = document.activeElement;
    lightbox.hidden = false;
    requestAnimationFrame(function () { lightbox.classList.add("open"); });
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onLightboxKey);
    lightbox.querySelector(".lightbox-close").focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.classList.remove("open");
    lightbox.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onLightboxKey);
    if (lightboxReturnFocus && lightboxReturnFocus.focus) lightboxReturnFocus.focus();
  }

  function onLightboxKey(e) {
    if (e.key === "Escape") closeLightbox();
    // The close button is the dialog's only control; keep Tab on it.
    if (e.key === "Tab") { e.preventDefault(); lightbox.querySelector(".lightbox-close").focus(); }
  }

  document.addEventListener("click", function (e) {
    var img = e.target.closest && e.target.closest(".parish-photo img, .card-img img");
    if (img) openLightbox(img);
  });

  // ---------- Public API ----------
  window.STM = {
    renderChrome: renderChrome,
    renderPage: renderPage,
    renderNews: renderNews,
    renderBulletins: renderBulletins,
    renderPriests: renderPriests,
    getNews: getNews,
    getBulletins: getBulletins,
    prettyDate: prettyDate,
    esc: esc,
  };
})();
