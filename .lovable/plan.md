# Transition to Unified App — Cutover Plan

Goal: retire the legacy coordination and vendor Lovable projects and route all traffic to the unified `plan.enzym3entertainment.vip` app, without breaking historical links (emails, vendor invites, contract sign URLs, bookmarks).

## Strategy

Use DNS-level 301 redirects from the old hostnames to `plan.*`. Keep the old projects published in read-only/redirect mode for ~2–4 weeks while traffic drains, then unpublish.

## Phase 1 — Pre-flight verification (do BEFORE touching anything)

1. Smoke test the unified app at `plan.enzym3entertainment.vip`:
   - Log in as admin → lands on `/staff`
   - Log in as vendor → lands on `/vendor`
   - Log in as client → lands on `/app`
   - Test `/join/:code`, `/sign/:id`, `/v/:handle` deep links
   - Confirm Stripe checkout, Resend emails, Spotify OAuth, JaaS meetings all still work
2. Confirm `src/config/urls.ts` points everything at `plan.enzym3entertainment.vip` (already done ✅)
3. Audit outbound URLs in:
   - Resend email templates / edge functions (welcome, invites, reminders, review requests)
   - n8n / Zapier webhook payloads
   - Stripe `success_url` / `cancel_url`
   - JaaS meeting room links
   - Any hardcoded references in `supabase/functions/`

## Phase 2 — Set up DNS 301 redirects

For `coordination.enzym3entertainment.vip` and `vendor.enzym3entertainment.vip`:

1. At your DNS registrar, replace the current A/CNAME records pointing to the old Lovable projects with a **301 redirect** to `https://plan.enzym3entertainment.vip` that preserves the path.
   - If your registrar supports URL forwarding (Cloudflare Page Rules / Bulk Redirects, Namecheap URL Redirect, Porkbun Forwarding, etc.), use "permanent (301)" + "preserve path".
   - Example: `https://coordination.enzym3entertainment.vip/event/123` → `https://plan.enzym3entertainment.vip/event/123`
2. SSL: ensure the redirect endpoint serves HTTPS (Cloudflare and most registrars handle this automatically).
3. Wait for propagation (usually <1 hour, up to 24h).

Note: since you're redirecting at DNS, the unified app's `portalFromHostname.ts` never sees the old hostnames — no code change needed there.

## Phase 3 — Soft-deprecation window (2–4 weeks)

1. Monitor in this order:
   - Edge function logs in Supabase for any requests still referencing old hostnames
   - Resend dashboard for bounce/click activity on old URLs
   - Stripe webhook logs
2. As you find stragglers (old email templates, third-party integrations, saved bookmarks), update them to `plan.*`.
3. Communicate the change once to clients/vendors via email so they update bookmarks and PWA installs.

## Phase 4 — Unpublish legacy projects

Only after redirect traffic drops to near zero:

1. In the legacy **coordination** Lovable project → Publish dialog → Unpublish.
2. In the legacy **vendor** Lovable project → Publish dialog → Unpublish.
3. **Keep the DNS redirects in place indefinitely** — they cost nothing and protect any link that ever shipped in an email.
4. Archive (don't delete) the old Lovable projects for a few months in case you need to reference old code.

## What NOT to do

- Don't unpublish old portals first — breaks vendor invites, contract sign URLs, past Resend email links, PWA installs.
- Don't point both old hostnames at the unified Lovable app as additional custom domains. If you did, `portalFromHostname.ts` would force users into the wrong shell based on the URL they happened to arrive from.
- Don't delete the old Supabase data — the unified app reads from the same shared database (`vp_`, `e3c_`, `ee_` prefixes per memory).

## Technical details

- DNS TTL: lower TTL on the two old hostnames to 300s a day before the cutover so the redirect propagates fast.
- PWA users on the old domains will keep loading the cached old app until their service worker updates. The communication email in Phase 3 should include "reinstall from plan.enzym3entertainment.vip" instructions.
- HSTS: if either old hostname has HSTS preloaded, redirects still work but the browser will force HTTPS — verify your redirect endpoint serves valid SSL.

## Rollback

If something breaks after Phase 2: revert the DNS records back to the original A/CNAME of the legacy projects. Old projects are still published, so traffic resumes within DNS TTL.
