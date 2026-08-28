# Outstanding before launch

Tracking what still needs doing on the public site (`main`). Grouped by who
unblocks it: the first section needs answers from the parish, the rest is work
we can do ourselves.

## 1. Needs answers from the parish

Nothing here can be guessed. Everything on this list is either invented
placeholder text or unverified, and each item is currently visible on the live
site or removed pending an answer.

- [ ] **Weekday Liturgy times** — removed from the homepage rather than left
      invented. Previously showed "Weekdays 9:00 AM".
- [ ] **Confession times** — removed for the same reason. Previously showed
      "Before Liturgy".
- [x] **Parish phone number** — (215) 389-2000 office, (215) 334-1884 WhatsApp.
- [x] **Parish email** — office@saintmaron.org.
- [x] **Office hours** — Tuesday – Friday, 10:00 AM – 2:00 PM.
- [x] **Pastor's name** — Father Andrawos Fadi El Tabchi. Still to ask: whether
      other clergy or staff should be listed.
- [x] **Founding year** — 1892, confirmed by the 125th anniversary on
      2 December 2017.
- [ ] **Parish history** — the "A Maronite home in the heart of the city"
      section is written from general Maronite history, not this parish's own
      story. The second paragraph is explicitly marked placeholder.
- [x] **Zeffy account link** — points at the parish's donation form.
- [x] **Venmo account link** — @SaintMaronPhilly.
- [ ] **First real news items and bulletin PDF** — both sections are empty and
      show a "check back soon" notice.

Confirmed so far: Saturday Vigil 4:00 PM, Sunday 11:00 AM.

## 2. Blocks the site reading as official

- [x] **Remove the "Demonstration site — placeholder content" footer line.**
      Removed 2026-08-28. The site now presents as official, so the remaining
      items in section 1 are visible to parishioners as-is.

## 3. Development work

- [x] **Google Maps embed** on `contact.html`.
- [ ] **Favicon** — no `favicon.ico` or `<link rel="icon">` on any page. The
      gold cedar crest in `app.js` would work as an SVG favicon.
- [ ] **Open Graph / social preview tags** — none on any page, so links shared
      to Facebook, WhatsApp, or iMessage show no title, description, or image.
      The sanctuary photo would serve as the preview image.
- [ ] **Meta descriptions** — only `index.html` has one. `news.html`,
      `bulletin.html`, `contact.html`, and `donate.html` have none.
- [ ] **Replace the demo Google Form links** — news items can carry a button;
      the demo pointed at a test form. Nothing links to it now that the sample
      news is gone, but it will come up again with the first real sign-up.
- [ ] **Finish "Sign In with GitHub".** The handler (`api/oauth.js`) and
      config are in place. Still needed: create the GitHub OAuth app with
      callback `https://www.saintmaronphilly.org/api/oauth`, set
      `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in Vercel, redeploy.
      See README. The OAuth app should eventually be owned by the parish
      account, not a personal one.
- [ ] **Create the parish GitHub organisation** so the church owns the repo
      independently. Two owners, a parish role address, passkeys for 2FA,
      recovery codes in a shared password manager.
- [ ] **Restrict what the CMS account can write** ([#1](https://github.com/MichelFaloughi/SaintMaronSouthPhilly/issues/1)). A GitHub push ruleset
      limiting the priest's account to `content/` and `bulletins/` means a
      compromised session cannot touch `donate.html` or any code.
- [ ] **Delete the `cedar` demo passcode** from `admin.html` and `README.txt`
      on the `development` branch, so it is never mistaken for a real login.
- [x] **Custom domain** on Vercel, with HTTPS — <https://www.saintmaronphilly.org/>.
- [ ] **Port the confirmed Mass times to `development`** — that branch still
      shows the old 5:00 PM / 10:30 AM placeholders.

## 4. Worth considering

- [ ] Accessibility pass — colour contrast on the burgundy hero, keyboard
      navigation, and heading order.
- [ ] A real 404 page; Vercel serves its default today.
- [ ] Arabic or transliterated Syriac for key headings, if the parish wants it.
