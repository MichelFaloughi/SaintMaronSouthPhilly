/* ============================================================
   GitHub OAuth handler for the Sveltia CMS "Sign In with GitHub"
   button. Runs as a Vercel serverless function at /api/oauth.

   A static site cannot keep a secret, and GitHub requires the OAuth
   client secret to turn a login code into a token. This endpoint is
   the one server-side piece that holds it. Configure two environment
   variables in Vercel:

     GITHUB_CLIENT_ID      from the GitHub OAuth App
     GITHUB_CLIENT_SECRET  from the GitHub OAuth App

   The OAuth App's callback URL must be this endpoint's own URL.

   Flow (a port of sveltia/sveltia-cms-auth):
     1. CMS opens a popup to /api/oauth?provider=github&site_id=<host>
     2. We set a CSRF cookie and redirect to GitHub's authorize page
     3. GitHub redirects back here with ?code=…&state=…
     4. We check the state, exchange the code for a token, and return a
        page that hands the token to the CMS window via postMessage
   ============================================================ */

"use strict";

const crypto = require("crypto");

const COOKIE = "csrf-token";
const SCOPES = ["repo", "public_repo", "user", "read:user", "user:email"];

module.exports = async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const q = url.searchParams;

  // Only the site this function is deployed with may use it. The CMS sends
  // its own hostname as site_id; anything else is someone borrowing the
  // endpoint for their own login page.
  const allowedHost = req.headers.host;

  if (q.has("code") || q.has("error")) {
    return callback(req, res, q, allowedHost);
  }
  return start(req, res, q, allowedHost);
};

function start(req, res, q, allowedHost) {
  const provider = q.get("provider") || "github";
  const siteId = q.get("site_id") || "";

  if (provider !== "github") {
    return popup(res, provider, "error", { error: "Unsupported provider", errorCode: "UNSUPPORTED_BACKEND" }, "*");
  }
  if (siteId !== allowedHost) {
    return popup(res, provider, "error", { error: "Unsupported domain", errorCode: "UNSUPPORTED_DOMAIN" }, "*");
  }
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return popup(res, provider, "error", { error: "OAuth app not configured", errorCode: "MISCONFIGURED_CLIENT" }, "*");
  }

  const requested = (q.get("scope") || "").split(/[,\s]+/).filter(Boolean);
  const scope = requested.length && requested.every((s) => SCOPES.includes(s)) ? requested.join(" ") : "repo user";
  const csrf = crypto.randomUUID().replace(/-/g, "");

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: scope,
    state: `${provider}_${csrf}`,
  });

  res.setHeader("Set-Cookie", `${COOKIE}=${provider}_${csrf}; HttpOnly; Path=/api/oauth; Max-Age=600; SameSite=Lax; Secure`);
  res.statusCode = 302;
  res.setHeader("Location", `https://github.com/login/oauth/authorize?${params}`);
  res.end();
}

async function callback(req, res, q, allowedHost) {
  const origin = `https://${allowedHost}`;
  const state = q.get("state") || "";
  const provider = state.split("_")[0] || "github";

  if (q.has("error")) {
    return popup(res, provider, "error", { error: q.get("error_description") || q.get("error"), errorCode: "AUTH_CODE_REQUEST_FAILED" }, origin);
  }

  const cookie = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  const expected = cookie ? cookie[1] : "";
  // Expire the cookie either way; it is single-use.
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Path=/api/oauth; Max-Age=0; SameSite=Lax; Secure`);

  if (!expected || state !== expected) {
    return popup(res, provider, "error", { error: "Potential CSRF attack detected", errorCode: "CSRF_DETECTED" }, origin);
  }

  let token = "";
  let error = "";
  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        code: q.get("code"),
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
      }),
    });
    const data = await r.json();
    token = data.access_token || "";
    error = data.error_description || data.error || "";
  } catch (e) {
    error = "Could not reach GitHub";
  }

  if (!token) {
    return popup(res, provider, "error", { error: error || "No token returned", errorCode: "TOKEN_REQUEST_FAILED" }, origin);
  }
  return popup(res, provider, "success", { provider: provider, token: token }, origin);
}

// The page the popup lands on. It announces itself to the CMS window that
// opened it, waits for the CMS to answer, then posts the result and closes.
// Success messages go only to the site's own origin; the token never leaves
// for anywhere else.
function popup(res, provider, state, content, origin) {
  const payload = `authorization:${provider}:${state}:${JSON.stringify(content)}`;
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Signing in…</title></head>
<body>
<p style="font-family:sans-serif">${state === "success" ? "Signed in. This window will close." : "Sign-in failed: " + escapeHtml(content.error || "unknown error")}</p>
<script>
(function () {
  var provider = ${JSON.stringify(provider)};
  var payload = ${JSON.stringify(payload)};
  var origin = ${JSON.stringify(origin)};
  if (!window.opener) return;
  window.addEventListener("message", function (e) {
    if (e.data !== "authorizing:" + provider) return;
    // A success payload carries the token: deliver it only to the site's
    // own origin. Errors carry nothing sensitive and may go anywhere.
    if (origin !== "*" && e.origin !== origin) return;
    window.opener.postMessage(payload, origin);
    window.close();
  });
  window.opener.postMessage("authorizing:" + provider, "*");
})();
</script>
</body></html>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(html);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
