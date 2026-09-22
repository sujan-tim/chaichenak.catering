# Chai Chenak Catering & Events

A standalone catering project with an interactive menu shortlist, customer budget planner, downloadable event plan, two-step inquiry form, gallery, FAQs, and password-protected owner inbox. No ChatGPT or Sites account is needed to run it.

## Run locally

```sh
npm ci
cp .dev.vars.example .dev.vars
node -e "console.log(require('node:crypto').randomBytes(36).toString('base64url'))"
```

Copy the generated password into `ADMIN_PASSWORD` in `.dev.vars`. Keep this file private. Then:

```sh
npm run db:local
npm run dev
```

Open the address printed by Wrangler. Visit `/admin` with username `admin` and the password from `.dev.vars`. The browser shows a standard HTTP authentication prompt. A random local password has already been generated in the existing development checkout; do not overwrite `.dev.vars` if you want to retain it.

The project includes Node 22 as a development dependency so npm scripts use a compatible runtime. The frontend is plain HTML, CSS, and JavaScript. The current backend uses a Cloudflare Worker and D1, which Wrangler emulates locally. No cloud account or deployment is required for development.

## Customer and owner workflows

- Search/filter catering experiences and add favorites to a shortlist.
- Enter guests and an optional customer budget. The per-person amount divides that budget; it is not a business price or quote.
- Download the plan or carry it into an inquiry.
- Submit event and contact details. A reference appears only after database storage succeeds; an inquiry does not reserve a date.
- Review inquiries at `/admin`, filter them, and set new/contacted/quoted/booked/closed statuses.

Menu shortlists are saved only in the customer's browser. Contact details are never stored in browser storage. Owner status updates do not send messages, take payments, or reserve calendar slots. Email and phone links open the owner's usual applications. Automated email notifications are not connected; monitor the inbox for new inquiries.

Menu content is in `catalog.js`. Business details and photographs were retained from the original site. Confirm offerings, contact information, and service areas before a public launch.

## Station films and visual design

The local design takes inspiration from [Selene Catering](https://selenecatering.com/) and the supplied screen recording while retaining Chai Chenak branding, copy, and event media.

The collection has 24 selectable experiences with 24 films from `medias/`. Categories cover savory stations, buffet dishes and accompaniments, desserts/paan, brunch, and drinks. Five favorites appear on the homepage; the full collection and planner live at `/menu`. Existing shortlist IDs stay compatible. Customers can select more than six stations and submit the complete shortlist.

- `catalog.js` owns station names, descriptions, categories, and media references.
- `media-manifest.js` maps the original filenames to stable station IDs.
- `scripts/prepare-media.mjs` creates silent H.264 MP4 previews and WebP posters, handles portrait rotation and HDR conversion, and builds the three-panel hero film.
- Originals remain unchanged in `medias/`. Generated files are cached in ignored `.media-cache/` and copied to `dist/client/media/` during builds. The build never publishes the original MOV files or the reference recording.
- Install FFmpeg (including `ffprobe`) on the development machine before the first media build. Run `npm run media:prepare` separately if needed; `npm run build` also prepares missing or changed clips. Repeated builds reuse the cache.
- The hero plays silently when motion is allowed. Station films load only on desktop hover/keyboard focus or explicit playback. A dialog provides video controls and menu selection.
- Reduced-motion preferences, data-saving mode, and the page's motion toggle suppress automatic playback. Explicitly opening a station still allows watching its film. Scroll reveals never hide content when JavaScript is unavailable or motion is disabled.

The event footage is short; the preview player loops it when motion is enabled. No prices, ingredient guarantees, dietary certifications, or booking availability were inferred from the footage.

## Authentication and configuration

`ADMIN_PASSWORD` must be a random secret with at least 32 characters. Missing or shorter passwords disable owner access. Every owner API request verifies the credentials server-side; visitor-supplied identity headers cannot grant access. Use HTTPS in production; authenticated API access over plain HTTP is rejected except on loopback addresses for development.

HTTP Basic authentication is intended for a single owner. Browsers may retain credentials for their session; use a private browser window on shared devices. Rotate the runtime password to revoke the previous credentials. Team accounts or role-based access would require a separate authentication integration.

## Build and hosting

```sh
npm run build
```

Output is `dist/client` (optimized assets) and `dist/server` (Worker). No Sites manifest, source synchronization, publishing script, or platform sign-in is used. Nothing deploys automatically. The existing GitHub remote is unchanged.

The current backend can be hosted directly on your own Cloudflare account. Before deploying there:

1. Create a production D1 database and replace the local placeholder database ID/name in `wrangler.toml`.
2. Apply the checked-in migrations with `npx wrangler d1 migrations apply DB --remote`.
3. Set a production password with `npx wrangler secret put ADMIN_PASSWORD`.
4. Build, then deploy with `npx wrangler deploy`.

These are optional manual deployment steps, not commands run by the build. Another hosting provider needs an adapter for the Worker/database layer. Uploading only `index.html` or `dist/client` will not provide working inquiries or the owner inbox.

## Reliability and data

Inquiries use durable D1 storage, prepared SQL statements, bounded server validation, same-origin write checks, request-size limits, a honeypot, and an atomic hourly rate limit. UUID request keys make retries safe. API responses and the owner inbox are not cached. Owner pages are excluded from indexing.

Data remains until the owner deletes it through their database administration tools. There is no automatic retention policy. Local data is in ignored `.wrangler/` storage and is not deployed.

Schema is in `db/schema.ts`. Run `npm run db:generate` after schema changes, inspect the generated SQL, and apply migrations to the intended database. Never rewrite migrations already applied to production.

## Verification

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests launch an isolated local server at `http://127.0.0.1:8788` with a fresh temporary database, so test submissions do not populate or exhaust rate limits in the development inbox. They require a configured `.dev.vars` password, a current build, and Google Chrome on macOS. They use synthetic local inquiries and test owner credentials read from the ignored local configuration. They cover menu persistence, budgeting, responsive layouts, keyboard gallery controls, inquiry storage, owner access, status updates, and failed-submission recovery.

### Menu, gallery, and social previews

The homepage features five stations; `/menu` contains the full 24-item collection with 24 local films. Categories include savory stations, buffet dishes and accompaniments, desserts, brunch, and drinks. Selections and planning values carry between pages through local storage. The build shares the header, contact form, footer, and dialogs from `index.html` with the full menu in `menu-section.html`.

`media-manifest.js` maps supplied source clips, including the `medias/Buffet` and `medias/Desert` folders. `gallery.js` organizes 17 existing event photographs by category; the gallery initially shows eight and supports filters, more photographs, and keyboard lightbox navigation. No separate new gallery-photo folder was present when these were organized.

The three supplied Instagram posts use native embed frames, loaded only as the visitor approaches their section. Direct post links remain available if Instagram blocks an embed or requires sign-in. Instagram content is external and is not copied or substituted with unrelated images.

Public catering contact: **chaichenakcatering@gmail.com**, including the downloadable event plan. Inquiry submissions continue to be stored in the local owner inbox; email delivery is not configured.
