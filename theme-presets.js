/* ============================================================
   Color schemes and font pairings the parish office can choose
   from in the CMS ("Design" entry). Both the public pages (app.js)
   and the CMS preview (admin/index.html) read this file, so the
   editing form, the preview, and the live site always agree.

   The values in admin/config.yml must match the keys here. An
   unknown name leaves the site in its default burgundy-and-
   Marcellus look, which is baked into styles.css.
   ============================================================ */

window.STM_THEME = (function () {
  var PALETTES = {
    burgundy: null, // the default, baked into styles.css
    cedar: { "--burgundy": "#2f4a34", "--burgundy-deep": "#1c2f21" },
    marian: { "--burgundy": "#2c3e6b", "--burgundy-deep": "#1a2747" },
    plum: { "--burgundy": "#532b58", "--burgundy-deep": "#371a3b" },
  };

  // Each pairing is a Google Fonts query string plus the font stacks it
  // sets. The default pairing is loaded by each page's own <link>.
  var FONT_PAIRS = {
    marcellus: null,
    cinzel: {
      css: "family=Cinzel:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400",
      display: '"Cinzel", "Times New Roman", serif',
      body: '"Lora", Georgia, serif',
    },
    playfair: {
      css: "family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Crimson+Pro:ital,wght@0,400;0,600;1,400",
      display: '"Playfair Display", "Times New Roman", serif',
      body: '"Crimson Pro", Georgia, serif',
    },
    garamond: {
      css: "family=EB+Garamond:ital,wght@0,400;0,600;1,400",
      display: '"EB Garamond", "Times New Roman", serif',
      body: '"EB Garamond", Georgia, serif',
    },
  };

  function fontsUrl(pair) {
    return "https://fonts.googleapis.com/css2?" + pair.css + "&display=swap";
  }

  return { PALETTES: PALETTES, FONT_PAIRS: FONT_PAIRS, fontsUrl: fontsUrl };
})();
