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

News items and bulletins are edited through **Sveltia CMS** at `/admin`.
Publishing from the CMS commits to this repo, which redeploys the site.

Content is stored as two JSON files, each holding `{ "items": [...] }`:

| File | Fields |
| --- | --- |
| `content/news.json` | `title`, `date` (`YYYY-MM-DD`), `body`; optional `image` / `imageAlt`, `art` (`window`, `cedar`, `candles`, `bells`), and `link` (`{ label, url }`) for a button |
| `content/bulletins.json` | `title`, `date`, `file` (path to the PDF in `bulletins/`) |

Newest date sorts to the top. Editing the JSON by hand and pushing works too —
the CMS is a convenience, not a requirement.

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
