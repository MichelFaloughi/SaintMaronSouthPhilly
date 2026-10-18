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
| `content/pages/*.json` | One file per page (home, contact, donate, news, bulletin) holding that page's editable text |
| `content/theme.json` | `palette` and `fonts`, chosen from the presets in `theme-presets.js` (the "Design" entry in the CMS) |

News bodies and home-page section text are edited with the CMS's rich text
editor and stored as HTML. The pages never trust that HTML: `richHtml()` in
`app.js` rebuilds it from an allowlist (paragraphs, line breaks, bold,
italic, strikethrough, links, lists, h3/h4, block quotes, and the editor's
text-align style), drops everything else, and runs links through `safeUrl()`.
A body with no tags at all is treated as plain text, so older entries and
hand-written JSON still work.

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

The "Design" entry gets a live preview: `admin/index.html` registers a
preview template that draws a sample of the home page with the site's own
`styles.css` and the chosen colors and fonts. It reads the same
`theme-presets.js` the public pages use, so adding a palette or font pairing
there updates the site, the preview, and (after adding the option to
`admin/config.yml`) the editing form together.

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
