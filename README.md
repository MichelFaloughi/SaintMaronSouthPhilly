# Saint Maron Maronite Catholic Church — South Philadelphia

## Branches

| Branch | Contents | Serves |
| --- | --- | --- |
| `main` | Coming-soon holding page | Production |
| `development` | Full parish site (demo) | Preview deploys |

`main` is deliberately minimal: a single self-contained `index.html` using the
parish palette (burgundy, brass gold, limestone) and typefaces (Marcellus,
Source Serif 4). It has no build step and no dependencies beyond Google Fonts.

The full site — Home, News, Bulletin, Contact, Donate, plus the staff area —
lives on `development`. See `README.txt` there for how to run and demo it.

## Going live

When the parish is ready to launch, merge `development` into `main`. Before
that, replace the demo staff passcode with a real CMS login, swap the
placeholder parish details (Liturgy times, phone, email, pastor), and point the
donation buttons at the parish's own Zeffy and Venmo accounts.
