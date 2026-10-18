/* ============================================================
   The colors and sizes the parish office can give to a few words
   in any rich text field ("Color & size" in the CMS toolbar).
   Shared by the CMS (admin/index.html), which offers them, and the
   public pages (app.js), which only accept these names. The actual
   colors live in styles.css as .tone-* and .size-* classes, so each
   one can be tuned for dark banners as well as light pages.
   ============================================================ */

window.STM_TEXT_STYLES = {
  colors: [
    { value: "", label: "Normal color" },
    { value: "theme", label: "Site color (follows the color scheme)", swatch: "#6b2233" },
    { value: "gold", label: "Gold", swatch: "#765a14" },
    { value: "blue", label: "Blue", swatch: "#1f4e8c" },
    { value: "green", label: "Green", swatch: "#2e6b3a" },
    { value: "red", label: "Red", swatch: "#a3261c" },
    { value: "gray", label: "Gray", swatch: "#565a4f" },
  ],
  sizes: [
    { value: "", label: "Normal size" },
    { value: "small", label: "Small", em: 0.85 },
    { value: "large", label: "Large", em: 1.25 },
    { value: "xlarge", label: "Extra large", em: 1.6 },
  ],
};
