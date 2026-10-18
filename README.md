# Saint Maron Maronite Catholic Church — South Philadelphia

Static parish website. No build step, no server, no dependencies beyond
Google Fonts. Open `index.html` in a browser, or deploy the folder as-is.

## Where it lives

| | |
| --- | --- |
| Live site | <https://www.saintmaronphilly.org/> |
| Content editor | <https://www.saintmaronphilly.org/admin/> |
| Hosting | Vercel, deploying `main` on every push |
| Repo | <https://github.com/MichelFaloughi/SaintMaronSouthPhilly> |

`saintmaronphilly.org` redirects to `www`.

## Branches

| Branch | Contents | Serves |
| --- | --- | --- |
| `main` | Public site, no staff area | Production |
| `development` | Same site plus the browser-based demo CMS | Preview / demos |

`main` is the version meant to be served to parishioners. The staff sign-in
page and its localStorage publishing flow exist only on `development`, where
they are used to show the parish how posting will feel once a real CMS is
wired up. Nothing on `main` writes to the browser or to a server.

## Updating content

All content is edited through **Sveltia CMS** at `/admin` — news, bulletins,
and every heading, paragraph, Mass time, photo, and link between the site's
header and footer. Publishing from the CMS commits to this repo, which
redeploys the site.

| File | Contents |
| --- | --- |
| `content/news.json` | `{ "items": [...] }` — `title`, `date` (`YYYY-MM-DD`), `body` (HTML from the rich text editor: paragraphs, bold, italic, links, lists, a small heading, alignment); optional `image` / `imageAlt`, `art` (`window`, `cedar`, `candles`, `bells`), and `link` (`{ label, url }`) for a button |
| `content/bulletins.json` | `{ "items": [...] }` — `title`, `date`, `file` (path to the PDF in `bulletins/`) |
| `content/priests.json` | `{ "heading", "items": [...] }`: `name`, `years`, `role`, optional `image`. The scrolling strip of priests on the home page, in list order (oldest first). Portraits live in `images/priests/` |
| `content/pages/*.json` | One file per page (home, contact, donate, news, bulletin) holding that page's editable text |
| `content/theme.json` | `palette` and `fonts`, chosen from the presets in `theme-presets.js` (the "Design" entry in the CMS) |

Prose fields (news bodies, section text, welcome paragraphs, the parish
story, the contact and donate page text, the photo caption) are edited with
the CMS's rich text editor and stored as HTML. Every title (page titles, the
small lines above them, box and card titles, news and bulletin titles, the
priests strip title) uses the same editor limited to bold, italic,
alignment, and Color & size. The pages never trust that HTML:
`richHtml()` in `app.js` rebuilds prose from an allowlist (paragraphs, line
breaks, bold, italic, strikethrough, links, lists, headings (a Heading 1 is kept at
that size but marked up as `h2`, so each page keeps one `h1`), block quotes, and
the editor's text-align style) and `inlineRich()` reduces titles to bold,
italic, and line breaks plus one alignment on the heading itself. Everything
else is dropped, and links go through `safeUrl()`.

Every rich text field also has a **Color & size** button. Sveltia's editor
cannot style a selection, so it inserts an inline chip: a few words with a
color and a size chosen from the preset lists in `text-styles.js`, saved as
`<span data-color data-size>`. The sanitizer turns only those listed names
into `.tone-*` and `.size-*` classes, defined in `styles.css` with lighter
twins for the dark hero and banner. To add a color, add it to both files. In the HTML pages, a
`data-cms` element with class `rich` receives prose; any other receives the
inline form. A value with no tags at all is treated as plain text, so
hand-written JSON still works.

Newest date sorts to the top of news and bulletins. Editing the JSON by hand
and pushing works too — the CMS is a convenience, not a requirement.

Page text reaches the page through `data-cms` attributes: an element tagged
`data-cms="hero.lede"` gets its text from that key in the page's JSON file
(`data-cms-tel`, `-wa`, `-mailto`, `-href`, `-src`, `-map`, `-dir`, and
`-times` are variants for links, images, the map, and the Mass-times list —
see `applyContent` in `app.js`). The HTML each page ships with is the
fallback if the JSON cannot be fetched, so keep it in sync when renaming a
field. Field names in `admin/config.yml`, keys in `content/pages/*.json`,
and `data-cms` attributes in the HTML must all agree.

The CMS preview pane shows the real website page with the unsaved draft
in it. `admin/index.html` maps each entry to its page (a news item to
`news.html`, the Priests entry to the home page, and so on), loads that
page with `?cms-preview` in an iframe, and sends the draft by
`postMessage`. In that mode `app.js` accepts drafts only from the framing
admin page on the same origin, holds its first draw until the draft
arrives, and redraws in place on each edit. Drafts pass through the same
escaping and sanitizing as published content. When adding a page or a
content file, add it to `TARGETS` in `admin/index.html` and load it
through `getJson()` in `app.js` so the preview covers it.

### Signing in to the CMS

**Sign In with GitHub** signs in with your GitHub account, which must have
write access to this repo. It goes through `api/oauth.js`, a Vercel serverless
function on the same domain that holds the OAuth app's client secret (a static
site cannot keep one). It needs two environment variables set in Vercel:

| Variable | From |
| --- | --- |
| `GITHUB_CLIENT_ID` | GitHub → Settings → Developer settings → OAuth Apps |
| `GITHUB_CLIENT_SECRET` | same page, *Generate a new client secret* |

The OAuth app's **Authorization callback URL** must be
`https://www.saintmaronphilly.org/api/oauth`.

**Sign In Using Access Token** is the fallback: paste a fine-grained personal
access token with *Contents: read and write* on this repo. Needs no setup.

## Running locally

The pages fetch `content/*.json`, and `fetch` is blocked on `file://` URLs, so
open the folder over HTTP rather than double-clicking `index.html`:

```
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Without this the site still loads, but the
news and bulletin sections show their "check back soon" notice.

## Before launch

Parish details are still placeholders and are marked as such on the pages.
See [OUTSTANDING.md](OUTSTANDING.md) for the full checklist of what needs
replacing and what the parish still needs to supply.
