# Sayah Recovery — Website

A modern, dark/"futuristic" static website for Sayah Recovery (24/7 vehicle, van, truck &amp; HGV recovery — North London and the M11 corridor).

Plain HTML/CSS/JS — no build step, no framework, no npm install needed. Open it directly in VS Code or any browser.

## Structure

```
sayah-recovery/
├── index.html          Homepage (also hosts the customer reviews section)
├── services.html        Full services list
├── coverage.html         Coverage area / zones
├── contact.html          Contact form + SOS request + direct contact details
├── admin.html            Admin panel (reviews + site content) — NOT linked anywhere on the public site (see below)
├── css/
│   └── style.css        All styles (single design system file)
├── js/
│   ├── main.js            Mobile menu, scroll animations, active nav link, form handling
│   ├── firebase-init.js   Your Firebase project config + shared `db`/`auth`/`storage` objects
│   ├── site-content.js    Loads editable content (contact info, services, coverage, logo, hero) onto every public page
│   ├── reviews.js         Public review submission form + display of approved reviews
│   ├── admin.js           Admin panel logic — reviews tab (login, approve/reject)
│   └── admin-content.js   Admin panel logic — Site Content tab (edit contact/services/coverage/images)
└── assets/
    ├── logo.png
    ├── truck-hero.jpg    Homepage hero background (web-optimised)
    └── favicon-32.png / favicon-64.png / favicon-256.png
```

## How to preview it

**Option A — just open it:** double-click `index.html`, or in VS Code right-click it and choose "Open with Live Server" (install the free "Live Server" extension for auto-reload while editing).

**Option B — quick local server** (recommended, avoids browser file:// quirks):
```bash
cd sayah-recovery
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Things to finish before going live

1. ~~**Contact form backend.**~~ Done — the form on `contact.html` submits to Formspree (`https://formspree.io/f/mlgqavar`) and shows a real success/error message via `js/main.js`.

1a. **WhatsApp number.** Every "Share Location" / WhatsApp button uses the number set as "WhatsApp number" in the admin panel's Site Content → Contact Info tab (defaults to **07729 392939**, same as Call Now/SOS, hardcoded as a fallback in `js/site-content.js`). Change it any time from the admin panel — every button on every page updates automatically, no code edit needed.

2. **Reviews & site content — Firestore/Storage security rules.** Both systems (see full sections below) are already wired up to your Firebase project, but you still need to paste two sets of rules into the Firebase console once — see "Customer reviews system" and "Site content control panel" below for the exact rules to paste in.

3. **Coverage map.** The coverage panel currently lists zones as text/cards. If you want an actual interactive map (Google Maps embed or a postcode checker), let me know your exact service radius and I can add it.

4. **Domain &amp; hosting.** This is a static site, so it can be hosted almost anywhere cheaply or for free:
   - Netlify or Vercel (drag-and-drop the folder, free tier, instant HTTPS)
   - GitHub Pages
   - Standard cPanel/shared hosting — just upload the folder contents via FTP

5. **Socials.** No social media links were added since none were provided — add a `.socials` block in the footer (already styled in `css/style.css`) once you have your Facebook/Instagram links.

## Editing content

**Via the admin panel (no code, no redeploy needed) —** sign in at `admin.html` → **Site Content** tab:
- Contact info: both phone numbers, WhatsApp number, email address, opening hours text.
- Services: title, description and an optional price for each service card on `services.html` (add/remove/reorder by editing the list and saving).
- Coverage areas: the region name + comma-separated town list for each card on `coverage.html`.
- Images: logo and the homepage hero photo (upload a new file any time, or "Reset to default" to go back to the original).

Changes save straight to Firestore/Storage and appear on the live site within a few seconds (no redeploy, no editing HTML). See "Site content control panel" below for exactly how this works and the one-time Firebase setup it needs.

**Directly in the files (for everything else) —** general page text, headlines, the "Why Choose Us"/"How It Works" sections, and the overall page structure are not covered by the admin panel by design (keeps the panel focused and the page layout stable) — edit these directly in the `.html` files, search for the section you want to change (marked with HTML comments like `<!-- ================= SERVICES PREVIEW ================= -->`).
- Colours, fonts and spacing are controlled by CSS variables at the top of `css/style.css` (`:root { ... }`) — change them once and the whole site updates.

## Design notes

- Fonts: **Orbitron** (display/numerals) + **Rajdhani** (headings) + **Inter** (body) via Google Fonts — matches the chrome-blue look of the logo.
- Sticky "Call Now" in the header and a floating action stack (bottom-right) with a **WhatsApp "Share Location"** button above a pulsing **SOS** button are present on every page for maximum visibility.
- Fully responsive: collapses to a full-screen mobile menu under 760px.
- Scroll-reveal animations use `IntersectionObserver` (no library needed).

## How the WhatsApp "Share Location" button works

Every button with the class `whatsapp-location-btn` (the floating button, the big green button on the Contact page, and the one in the mobile menu) does this on click:

1. Asks the visitor's browser for permission to read their GPS location (the standard browser location-permission prompt).
2. If they allow it, it opens WhatsApp (`wa.me/447729392939`) with a pre-filled message that includes a Google Maps link pinned to their exact coordinates.
3. If they deny permission, don't have geolocation support, or it times out (10 seconds), it still opens WhatsApp with a pre-filled message asking them to type their address instead — so nobody gets stuck.

**Important:** browsers only allow the Geolocation API on secure origins — that means **HTTPS** in production (or `localhost` while testing). It will silently fail to prompt if you view the site over plain `http://` on a real domain, so make sure your hosting has HTTPS enabled (Netlify/Vercel/GitHub Pages all give you this for free automatically).

## Customer reviews system

The homepage (`index.html`) has a review section where visitors can submit a star rating + comment, and approved reviews are displayed publicly. It's backed by your Firebase project (`sayahrecovery-927f7`) using **Firestore** for storage and **Firebase Authentication** for the admin panel — no npm/build step, just the Firebase CDN `<script>` tags already included in `index.html` and `admin.html`.

**How it works:**
1. A visitor fills in the form on the homepage and submits it. This writes a new document straight to Firestore with `status: "pending"` — it is **not** shown on the site yet.
2. You open `admin.html`, sign in, and see it under the **Pending** tab.
3. Click **Approve** and it immediately becomes visible in the public reviews section on the homepage (newest first, up to 9 shown). Click **Reject** instead and it's permanently deleted.
4. Already-published reviews can be pulled down later from the **Published** tab using **Unpublish**.

**`admin.html` is intentionally not linked from any menu or footer** — it only has a `noindex` tag so search engines skip it. Reach it by typing the full address directly, e.g. `https://sayahrecovery.co.uk/admin.html`, and bookmark it once you're logged in. It's still protected properly: nobody can use the dashboard without signing in via Firebase Authentication.

**One-time setup you still need to do in the Firebase console** (console.firebase.google.com → project `sayahrecovery-927f7`):

1. **Authentication → Sign-in method** → enable **Email/Password** if not already, then **Authentication → Users** → add yourself (the email/password you'll use to log into `admin.html`).
2. **Firestore Database** → create a database if you haven't already (production mode is fine, since the rules below lock it down properly).
3. **Firestore Database → Rules** — paste this in and click Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reviews/{reviewId} {
      // Anyone can read an approved review; only a signed-in admin can read pending/rejected ones
      allow read: if resource.data.status == 'approved' || request.auth != null;

      // Anyone can submit a new review, but only as "pending" and only with valid fields
      allow create: if request.resource.data.status == 'pending'
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 100
                    && request.resource.data.comment is string
                    && request.resource.data.comment.size() > 0
                    && request.resource.data.comment.size() <= 1000
                    && request.resource.data.rating is int
                    && request.resource.data.rating >= 1
                    && request.resource.data.rating <= 5;

      // Only a signed-in admin can approve, reject, or unpublish
      allow update, delete: if request.auth != null;
    }
  }
}
```

That's it — no other setup is needed. The site already has your `firebaseConfig` baked into `js/firebase-init.js`.

**Note:** reviews only appear/can be submitted on the **homepage** — the other pages don't include the review widgets. (All four public pages now load the Firebase Firestore SDK regardless, because the site content control panel below needs it everywhere.)

## Site content control panel

A second tab in `admin.html` ("Site Content") lets you edit contact details, services + prices, coverage-area town lists, the logo and the homepage hero photo — without touching any code or redeploying. Page structure (which sections exist, general headline/body text) stays fixed and isn't editable here, by design; see "Editing content" above for what covers what.

**How it works:** all of this content lives in a single Firestore document, `siteContent/main`. Every public page (`index.html`, `services.html`, `coverage.html`, `contact.html`) loads `js/site-content.js`, which fills the page with safe hardcoded defaults immediately, then fetches that document and re-renders with whatever you've saved — so the site never shows empty content, even if Firestore is briefly unreachable. Images are uploaded to Firebase Storage (under `site-content/`) from the admin panel; the resulting URL is what gets saved into the document.

**One-time setup you still need to do in the Firebase console** (console.firebase.google.com → project `sayahrecovery-927f7`), in addition to the Authentication/Firestore setup from the reviews section above:

1. **Firestore Database → Rules** — add this `siteContent` block alongside the existing `reviews` block (same file, same Rules page):

```
    match /siteContent/{docId} {
      // Anyone visiting the site can read the live content
      allow read: if true;
      // Only a signed-in admin can change it
      allow write: if request.auth != null;
    }
```

So the full rules file (reviews + site content together) looks like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reviews/{reviewId} {
      allow read: if resource.data.status == 'approved' || request.auth != null;
      allow create: if request.resource.data.status == 'pending'
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 100
                    && request.resource.data.comment is string
                    && request.resource.data.comment.size() > 0
                    && request.resource.data.comment.size() <= 1000
                    && request.resource.data.rating is int
                    && request.resource.data.rating >= 1
                    && request.resource.data.rating <= 5;
      allow update, delete: if request.auth != null;
    }
    match /siteContent/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

2. **Storage → Rules** (Firebase console → Storage → Rules tab — a different page from Firestore Rules) — paste this in and click Publish:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /site-content/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

This allows anyone to view uploaded logo/hero images (needed for the public site to display them), but only a signed-in admin can upload — capped at 5MB and image files only.

That's it — once both rule sets are published, sign in at `admin.html`, open the **Site Content** tab, and everything is editable immediately.

## Free/organic SEO — what's still open

Not yet started (next on the list once you're happy with the review system): Google Business Profile optimisation tips, `schema.org` LocalBusiness structured data on the site, `sitemap.xml` + `robots.txt`, and a shortlist of free UK business directories worth listing on (Yell, Checkatrade, Thomson Local, Trustpilot). Ask any time to pick this back up.

## Still open / not yet built

- **Privacy Policy page** — worth having now that the site collects review submissions (name + comment), contact form details, and precise GPS location via the WhatsApp button (UK GDPR). Ask any time and this can be written up.
- **Coverage map** — currently text/cards, not an interactive map.
- **Social media links** — none provided yet.
