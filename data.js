/* ============================================================
   Seed content for the demo. In production this file is replaced
   by the CMS content store. Placeholder text is marked clearly.
   ============================================================ */

window.STM_ART = (function () {
  // Decorative SVG placeholders used until real parish photos are added.
  function frame(inner, label) {
    return (
      '<svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + label + '">' +
      '<defs>' +
      '<linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#7d2b3c"/><stop offset="1" stop-color="#46151f"/>' +
      '</linearGradient>' +
      '</defs>' +
      '<rect width="640" height="480" fill="url(#g1)"/>' +
      inner +
      '<text x="320" y="452" text-anchor="middle" fill="#d3b563" font-family="Georgia, serif" font-style="italic" font-size="17" opacity="0.85">' + label + '</text>' +
      '</svg>'
    );
  }

  var archWindow =
    '<g opacity="0.9">' +
    '<path d="M240 400 L240 210 A80 80 0 0 1 400 210 L400 400 Z" fill="none" stroke="#d3b563" stroke-width="3"/>' +
    '<path d="M262 400 L262 220 A58 58 0 0 1 378 220 L378 400 Z" fill="#6b2233" stroke="#b08a2e" stroke-width="1.5"/>' +
    '<line x1="320" y1="162" x2="320" y2="400" stroke="#b08a2e" stroke-width="1.5"/>' +
    '<line x1="262" y1="290" x2="378" y2="290" stroke="#b08a2e" stroke-width="1.5"/>' +
    '<circle cx="320" cy="120" r="26" fill="none" stroke="#d3b563" stroke-width="2.5"/>' +
    '<path d="M320 100 L320 140 M300 120 L340 120" stroke="#d3b563" stroke-width="2.5"/>' +
    '</g>';

  var cedar =
    '<g stroke="#d3b563" stroke-width="3" fill="none" opacity="0.95" stroke-linecap="round">' +
    '<line x1="320" y1="150" x2="320" y2="400"/>' +
    '<path d="M320 180 L230 210 M320 180 L410 210"/>' +
    '<path d="M320 235 L210 270 M320 235 L430 270"/>' +
    '<path d="M320 295 L195 335 M320 295 L445 335"/>' +
    '<path d="M320 355 L215 390 M320 355 L425 390"/>' +
    '<path d="M320 150 L295 120 M320 150 L345 120 M320 150 L320 105"/>' +
    '</g>';

  var candles =
    '<g opacity="0.95">' +
    '<rect x="200" y="250" width="18" height="130" rx="4" fill="#f4f3ee"/>' +
    '<rect x="311" y="220" width="18" height="160" rx="4" fill="#f4f3ee"/>' +
    '<rect x="422" y="260" width="18" height="120" rx="4" fill="#f4f3ee"/>' +
    '<ellipse cx="209" cy="238" rx="7" ry="14" fill="#d3b563"/>' +
    '<ellipse cx="320" cy="208" rx="7" ry="14" fill="#d3b563"/>' +
    '<ellipse cx="431" cy="248" rx="7" ry="14" fill="#d3b563"/>' +
    '<line x1="150" y1="392" x2="490" y2="392" stroke="#b08a2e" stroke-width="2"/>' +
    '</g>';

  var bells =
    '<g opacity="0.95" stroke="#d3b563" fill="none" stroke-width="3" stroke-linejoin="round">' +
    '<path d="M320 130 C250 130 240 230 235 300 L405 300 C400 230 390 130 320 130 Z"/>' +
    '<line x1="215" y1="300" x2="425" y2="300"/>' +
    '<circle cx="320" cy="330" r="14" fill="#d3b563" stroke="none"/>' +
    '<path d="M320 130 L320 100 M304 100 L336 100"/>' +
    '</g>';

  return {
    window: frame(archWindow, "Photo placeholder — church interior"),
    cedar: frame(cedar, "Photo placeholder — parish community"),
    candles: frame(candles, "Photo placeholder — Divine Liturgy"),
    bells: frame(bells, "Photo placeholder — parish events"),
  };
})();

window.STM_SEED = {
  news: [
    {
      id: "seed-news-1",
      title: "Feast of the Assumption Celebration",
      date: "2026-08-15",
      body:
        "Join us as we celebrate the Feast of the Assumption of the Blessed Virgin Mary with a special Divine Liturgy, followed by a parish luncheon in the church hall. All parishioners, family, and friends are warmly invited. (Placeholder text for the demo.)",
      art: "candles",
      link: { label: "See the schedule", url: "https://docs.google.com/forms/d/e/1FAIpQLSdI5rzP049X-_zhFLWHk6T2N3DOWlkigE1EKIMDNrIxZsWcyA/viewform" },
    },
    {
      id: "seed-news-2",
      title: "Lebanese Heritage Festival Returns This Fall",
      date: "2026-08-02",
      body:
        "Our beloved Lebanese Heritage Festival returns with traditional food, music, dabke dancing, and activities for children. Volunteers are needed for cooking, setup, and hospitality — see the parish office to sign up. (Placeholder text for the demo.)",
      art: "cedar",
      link: { label: "Volunteer to help", url: "https://docs.google.com/forms/d/e/1FAIpQLSdI5rzP049X-_zhFLWHk6T2N3DOWlkigE1EKIMDNrIxZsWcyA/viewform" },
    },
    {
      id: "seed-news-3",
      title: "Religious Education Registration Now Open",
      date: "2026-07-20",
      body:
        "Registration for the fall religious education program is now open for children in grades K through 8. Classes meet Sunday mornings before the Divine Liturgy. Please register by the end of the month. (Placeholder text for the demo.)",
      art: "window",
      link: null,
    },
  ],
  bulletins: [
    {
      id: "seed-bull-1",
      title: "Thirteenth Sunday of Pentecost",
      date: "2026-08-16",
      file: "bulletins/bulletin-2026-08-16.pdf",
    },
    {
      id: "seed-bull-2",
      title: "Twelfth Sunday of Pentecost",
      date: "2026-08-09",
      file: "bulletins/bulletin-2026-08-09.pdf",
    },
  ],
};
