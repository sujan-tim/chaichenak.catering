# Chai Chenak Catering & Events

A responsive catering site with an interactive menu shortlist, customer budget planner, downloadable event plan, two-step inquiry form, gallery, FAQs, and protected owner inbox.

## Run locally

```sh
npm ci
cp .dev.vars.example .dev.vars
npm run db:local
npm run dev
```

Open the local address printed by Wrangler. The project includes Node 22 as a development dependency so npm scripts use a compatible runtime. Source HTML remains in `index.html`; `npm run build` creates `dist/client` and `dist/server`, converts the supplied photographs to WebP, and packages database migrations. Do not deploy the source `index.html` alone: inquiries require the Worker and D1 database.

## Customer workflow

- Search or filter menu experiences and add them to a shortlist.
- Enter a guest count and optional **customer budget**. The per-person amount is budget division, not a business price or binding quote.
- Download the shortlist or carry it into the inquiry form.
- Submit contact and event details. A reference is shown only after successful database storage. An inquiry does not reserve a date.
- Menu shortlists are saved only in this browser. Contact details are never stored in browser storage.

Menu descriptions live in `catalog.js`; confirm offerings with the business before public launch. Photography and business contact details were retained from the original page. Unsupported generic review claims and placeholder social links were removed.

## Owner inbox and operations

Visit `/admin` and sign in with the account that owns the Site. Production `ADMIN_EMAIL` is configured as a Sites runtime secret. Every inbox API request checks the platform-provided identity and owner allowlist server-side. Other signed-in users and anonymous visitors are denied. Do not expose the raw Worker behind a proxy that trusts visitor-supplied authentication headers.

The inbox lists 25 inquiries per page and supports status filtering and updates: new, contacted, quoted, booked, and closed. Customer contact actions open the owner's email or phone application. Status updates do not send messages, take payment, or reserve a calendar slot.

**Email notifications are not connected.** Review the owner inbox for new inquiries. The site does not claim that an email was delivered. Automated notification delivery requires a configured transactional email provider and a confirmed recipient.

The Site starts owner-private. Public access and any custom domain must be configured explicitly before customers can use it. Current site identity is in `.openai/hosting.json`; reuse it when publishing updates.

## Reliability and data

- D1 stores inquiries durably; no public read endpoint exposes customer details.
- Server validation bounds field sizes, dates, guest counts, budgets, and menu IDs.
- Prepared SQL statements, same-origin write checks, request-size limits, a honeypot, and an atomic hourly rate limit protect the inquiry endpoint.
- UUID request keys make retries safe. Reusing a key with changed content returns a conflict.
- API responses are not cached. The owner inbox is not indexed.
- Inquiry data remains until the owner deletes it. Handle access/deletion requests through the Sites database tools or another authorized database administration workflow. There is no automated retention policy.
- Runtime configuration belongs in Sites, not Git. `.dev.vars` is ignored; `.dev.vars.example` documents local configuration.

Schema is in `db/schema.ts`. After a schema change, run `npm run db:generate`, inspect generated SQL, and publish the new migration. Never rewrite a migration already applied in production. Local test inquiries stay in ignored `.wrangler/` storage and are not deployed.

## Verification

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests expect the local server at `http://127.0.0.1:8787`, `.dev.vars` with the example owner email, and Google Chrome on macOS. They use local-only synthetic customer data and injected local identity headers to verify authorization; production identity is provided by Sites. Test coverage includes menu persistence, budget calculation, mobile overflow, keyboard gallery controls, successful inquiry storage, protected inbox access, status updates, and failed-submission recovery.

Deployment uses the Sites source workflow and the build archive. Keep the original GitHub remote intact; Sites uses its own source repository. Before public launch, confirm the business email, phone, service area, available offerings, and the process for monitoring the inbox.
