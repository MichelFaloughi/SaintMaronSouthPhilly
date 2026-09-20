# Agent notes

Context for AI agents (and new contributors) working on this repo. Read
[README.md](README.md) first for the architecture and content model, and
[OUTSTANDING.md](OUTSTANDING.md) for what is still placeholder or pending.
This file covers what those two don't: conventions, guardrails, and the
situation around the parish's domains.

## What this is

The public website of Saint Maron Maronite Catholic Church in South
Philadelphia, built and maintained by a volunteer. The people who use what
you build are non-technical: the priest and parish office edit everything
through Sveltia CMS at `/admin`, and parishioners (often older, often on
phones) read the site. Every decision should keep both groups in mind:
simple editing surfaces, legible pages, nothing to maintain.

## Hard rules

- **Pushing to `main` deploys to production immediately** (Vercel). Commit
  and push only when asked, and treat every push as a release.
- **No build step, no frameworks, no npm.** The site is plain HTML, CSS, and
  ES5-style JavaScript served as-is. Keep it that way: no bundlers, no
  dependencies, no `package.json`. A library is the wrong answer until
  proven otherwise; the largest features here (CMS binding, lightbox) are
  each under a hundred lines of vanilla JS.
- **Never link to or fetch from `saintmaron.org`** (see Domains below).
- **All user-visible strings that pass through JS go through `esc()`** in
  `app.js`. CMS content is untrusted input: the editing accounts could be
  compromised, and news bodies, captions, and URLs are typed by humans.
  URLs additionally go through `safeUrl()`.
- **No em dashes** in anything public-facing: page copy, commit messages,
  comments, docs. Use commas, colons, parentheses, or separate sentences.
- **No AI attribution** ("Generated with...", "Co-Authored-By: Claude") in
  commits, PRs, or content.

## Conventions

- **JS style**: match `app.js` as it is. `var`, `function` declarations,
  string concatenation for HTML, IIFE module pattern, no arrow functions or
  template literals. Comments explain constraints and rationale, not
  mechanics.
- **CSS**: design tokens live in `:root` in `styles.css` (limestone,
  burgundy, brass gold, ink; Marcellus display, Source Serif 4 body). Derive
  every new color and font from the tokens. New interactive elements need a
  `:focus-visible` state (gold outline) and a `prefers-reduced-motion`
  story; both have existing patterns at the bottom of the file.
- **The data-cms triple**: field names in `admin/config.yml`, keys in
  `content/pages/*.json`, and `data-cms` attributes in the HTML must agree.
  Change one, change all three, and keep the baked-in HTML fallback text in
  sync, because the page must render sensibly even when the JSON fetch
  fails.
- **Schema changes change the priest's editing UI.** Anything added to
  `admin/config.yml` shows up as a form he fills in. Prefer fewer, plainer
  fields with `hint:` text over clever ones. Optional should stay optional.
- **Rendering is centralized**: sections through `sectionHtml()`, news
  through `newsCard()`, page text through `applyContent()`. Add behavior
  there (or via delegated listeners, like the lightbox) so CMS-added content
  is covered automatically.

## Testing

Serve over HTTP (`python3 -m http.server 8000`); `fetch` of `content/*.json`
is blocked on `file://`. Check changes on the news and bulletin pages too,
since header, footer, and lightbox are shared. Phone width matters more than
desktop for this audience.

## Domains: the situation behind the migration

The parish has two domains, and the history explains several rules above:

- **`saintmaron.org` (old, do not use)**: registered to an IT company the
  parish lost contact with. Its WordPress site was compromised from December
  2019 to 2026 (hidden SEO spam: casino, CBD, essay-mill links) and now
  returns a 500 error. The parish cannot access its GoDaddy account or DNS.
  Treat every credential associated with that era as leaked.
- **`saintmaronphilly.org` (current)**: parish-controlled GoDaddy account.
  This site serves at <https://www.saintmaronphilly.org/> via Vercel.
- **Email** runs on the parish's Microsoft 365 tenant. As of September 2026
  it is mid-migration: `@saintmaronphilly.org` is the primary address domain
  and `@saintmaron.org` addresses survive as receiving aliases. When adding
  or editing contact emails on the site, use `@saintmaronphilly.org`.
  (OUTSTANDING.md predates the migration where it mentions the old domain.)

## Security posture

Given the six-year compromise of the old site, this project leans cautious:
the donate page must only ever link out to Zeffy and Venmo (never collect
anything itself), CMS write access should stay limited to `content/` and
`bulletins/` (see OUTSTANDING.md item on push rulesets), and changes to
`donate.html`, `api/oauth.js`, or `admin/config.yml` deserve extra scrutiny
in review.
