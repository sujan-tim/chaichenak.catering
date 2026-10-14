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
- Submit event and contact details. A reference appears only after database storage succeeds; an inquiry does not reserve a date. Food tasting requests include a preferred date and time for the team to confirm.
- Review inquiries at `/admin`, filter them, and set new/contacted/quoted/booked/closed statuses.

Menu shortlists are saved only in the customer's browser. Contact details are never stored in browser storage. Owner status updates do not send messages, take payments, or reserve calendar slots. Email and phone links open the owner's usual applications. New inquiry notifications are sent to chaichenakcatering@gmail.com after the inquiry is saved; the customer email is set as Reply-To. D1 remains the record if email delivery fails.

Menu content is in `catalog.js`. Business details and photographs were retained from the original site. Confirm offerings, contact information, and service areas before a public launch.

## Station films and visual design

The local design takes inspiration from [Selene Catering](https://selenecatering.com/) and the supplied screen recording while retaining Chai Chenak branding, copy, and event media.

The collection has 230 selectable choices: 221 transcribed from the 14 menu sheets in `Packages&menu/`, plus nine retained event displays. The full menu at `/menu` starts with 17 filmed choices; the 213 remaining choices follow in expandable sections. Category filters, accent-insensitive search, and the event planner cover both sections. Categories cover live stations, butler-passed appetizers, mocktails, brunch, Pakistani mains, desserts, non-live appetizers, continental entrées, kids’ buffet, and event displays. Five favorites appear on the homepage, including a text-only buffet card. The seven deleted buffet and main-course clips and their preview images are no longer published; their dishes remain selectable. Existing shortlist IDs stay compatible. The `/packages` page displays seven distinct package sheets: five wedding packages (including Mehendi / Sangeet Qawali Night) and two for house parties or private venues. `/banquet` features a redesigned hall-photo opening, silent video tour and two banquet menu cards. The previous 35-person menu is no longer published. The shared navigation links to Packages and Banquet Hall on all public pages.

- `catalog.js` owns menu names, descriptions, section source filenames, item surcharge notes, categories, and media references. Keep live and non-live service styles distinct; their shortlist labels distinguish identical dish names. Listed surcharges are informational and do not calculate a package price.
- `media-manifest.js` maps the original filenames to stable station IDs.
- `scripts/prepare-media.mjs` creates silent H.264 MP4 previews and WebP posters, handles portrait rotation and HDR conversion, and builds the three-panel hero film.
- Originals remain unchanged in `medias/`. Generated files are cached in ignored `.media-cache/` and copied to `dist/client/media/` during builds. The build never publishes the original MOV files or the reference recording.
- Install FFmpeg (including `ffprobe`) on the development machine before the first media build. Run `npm run media:prepare` separately if needed; `npm run build` also prepares missing or changed clips. Repeated builds reuse the cache. Listed films with missing originals reuse their existing prepared video and poster; without a complete cache, the build fails. Remove a film from `media-manifest.js` to stop publishing it.
- The hero plays silently when motion is allowed. On the full menu, muted station films load and loop as their cards enter the viewport, including on mobile. Offscreen clips pause; the motion toggle, reduced-motion setting, data-saving mode, background tabs, and open dialogs suppress automatic playback. Homepage previews play on desktop hover/keyboard focus. A dialog provides explicit video controls and menu selection.
- Reduced-motion preferences, data-saving mode, and the page's motion toggle suppress automatic playback. Explicitly opening a station still allows watching its film. Scroll reveals never hide content when JavaScript is unavailable or motion is disabled.

The event footage is short; the preview player loops it when motion is enabled. No prices, ingredient guarantees, dietary certifications, or booking availability were inferred from the footage.

## Customer chat assistant

The Event Halls navigation offers Banquet Hall and Conference Hall on the shared `/banquet` page. `/banquet#conference-hall` covers conference planning and links to a “Conference / Meeting” inquiry, with that occasion retained in the owner inbox and email notification. Room setup, facilities, capacity and availability are confirmed by the team. The hall photo, silent film and two menu options remain labeled as banquet details. The customer chat also offers a Conference Hall suggestion and a direct link to the conference section.

The two banquet menu slots are configured in `banquet-menus.js`. Menu One uses `Banquet/IMG_5506 2.JPG` ($35 per person plus tax); Menu Two uses `Banquet/7bb18a9e-a516-461b-a3f4-1ade2e392c8b 2.JPG` ($45 per person plus tax). Both supplied sheets list $150 per staff member, a minimum of two staff members and a five-hour event. Each sheet is optimized and linked at full size within its card, with these prices and service details also shown as text. To replace a menu, update its source path and transcribed summary in the configuration; `source: null` displays “Coming soon”. The chat reads the published menu rates from the same configuration and directs full quotes and menu details to the team. Menu inquiry links carry the chosen option into the customer message and preserve their notes. `banquet.css` styles the hall page only.

The conference section displays the supplied short video in `Banquet/conference hall/`. The build converts the complete video to a silent portrait H.264 MP4 with its audio track removed. Playback starts only when the visitor chooses to play; `preload="none"` avoids downloading the film on page load. Station and banquet preview films are also silent. Originals are kept intact; only optimized media is published.

Every public page includes a “Questions? Ask us” chat with menu, package, banquet and tasting suggestions, plus links to the inquiry form and team contact. It opens on request, supports keyboard controls, works on mobile, and keeps its conversation in memory for the current page only. Clear chat removes that history. Messages render as plain text; the assistant cannot submit inquiries or confirm bookings.

Without an API key, it displays a **Menu & FAQ guide** using local catalog and business information. To enable conversational AI locally, add these values to your private `.dev.vars` without replacing its existing owner password:

```dotenv
OPENAI_API_KEY="your-key-here"
OPENAI_MODEL="gpt-4.1-mini"
```

Restart the local Worker after changing configuration. For your production Cloudflare Worker, set the key with `npx wrangler secret put OPENAI_API_KEY`; the model is optional and defaults to `gpt-4.1-mini`. Never put the key in HTML, frontend JavaScript, `wrangler.toml`, or a committed file. AI requests can incur charges on the OpenAI API account.

The Worker calls the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text), supplies business facts and the current menu from `worker/assistant.js`, and sends only the latest two conversation exchanges plus the new question. It sets `store: false`, does not save chats in D1, and discloses OpenAI processing in the chat. API provider retention policies still apply. Package prices and inclusions appear in original images, so the assistant links to those sheets rather than guessing their contents. Menu surcharges are extras, not complete event quotes. The team confirms dietary needs, availability, hall capacity and final arrangements.

AI requests require working D1 rate-limit storage: 30 attempts per IP per fixed hour and 500 attempts site-wide per fixed UTC day. These limits use the existing `rate_limits` table, separately from inquiry limits; no migration is required. Requests have bounded sizes, same-origin checks, a 20-second provider timeout and a 450-token output cap. Provider failures or unavailable limit storage return the clearly labeled local guide. Exhausted limits return a retry message and keep the question available for retry. Configure account spending controls separately if needed.

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
4. Onboard `chaichenakcatering.com` for Cloudflare Email Sending and confirm the sender `inquiries@chaichenakcatering.com` is permitted.
5. Build, then deploy with `npx wrangler deploy`.

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

The homepage features five stations; `/menu` contains the full 230-choice collection with 17 local films. Filmed choices appear first without duplication in the text menu below. The all-menu view opens the first text section; selecting a category or searching opens matching text sections. A jump link leads past the video cards to the remaining menu choices. Selections and planning values carry between pages through local storage, including distinct labels for live and non-live versions of a dish. The build shares the header, contact form, footer, and dialogs from `index.html` with the full menu in `menu-section.html`. The full menu page also displays the 14 original menu JPGs directly, with full-size links. `menu-sheets.js` explicitly lists the menu images copied unchanged into `dist/client/menu-sheets/`; package JPGs appear separately on `/packages`, using `package-sheets.js`. Repeated copies of the same package are omitted from the display, and each selected original is copied unchanged into `dist/client/package-sheets/`. Menu images load lazily and do not appear on the homepage.

`media-manifest.js` maps supplied source clips, including the `medias/Buffet` and `medias/Desert` folders. `gallery.js` organizes 17 existing event photographs by category; the gallery initially shows eight and supports filters, more photographs, and keyboard lightbox navigation. No separate new gallery-photo folder was present when these were organized.

The three supplied Instagram posts use native embed frames, loaded only as the visitor approaches their section. Direct post links remain available if Instagram blocks an embed or requires sign-in. Instagram content is external and is not copied or substituted with unrelated images.

Public catering contact: **chaichenakcatering@gmail.com**, including the downloadable event plan. The Worker stores inquiries in D1 and sends email notifications through the Cloudflare Email Service binding after storage succeeds.
