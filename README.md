# Saint Maron Maronite Catholic Church — South Philadelphia

Static parish website. No build step, no server, no dependencies beyond
Google Fonts. Open `index.html` in a browser, or deploy the folder as-is.

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

News items and bulletins live in `data.js`. To publish, edit that file and
push; the change deploys automatically.

- **News** — add an entry to `STM_SEED.news`. Fields: `id`, `title`, `date`
  (`YYYY-MM-DD`), `body`, and optionally `art` (one of `window`, `cedar`,
  `candles`, `bells`), `image` / `imageAlt` for a real photo, and `link`
  (`{ label, url }`) for a button. Newest date sorts to the top.
- **Bulletins** — drop the PDF in `bulletins/`, then add an entry to
  `STM_SEED.bulletins` with `id`, `title`, `date`, and `file`.

## Before launch

The parish details are still placeholders and are marked as such on the
pages: Divine Liturgy times, phone, email, office hours, and the pastor's
name. The footer carries a "demonstration site" line for the same reason.
Replace those, point the Zeffy and Venmo buttons at the parish's own
accounts, and swap the contact page's map placeholder for a real embed.
