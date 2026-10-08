/* ==========================================================================
   SAYAH RECOVERY — Dynamic site content
   Loads editable content (contact details, services, coverage areas, logo,
   hero image) from Firestore so it can be changed from the admin panel
   without touching any HTML/CSS/JS files.

   Must load AFTER firebase-init.js (needs the global `db`) and BEFORE
   main.js (main.js reads window.SITE_DATA.whatsapp at click time).

   Design: window.SITE_DATA starts out populated with the site's original
   hardcoded content as a safe default. renderSiteData() is called
   immediately (synchronously) with these defaults — so if Firestore is
   slow, offline, or the document doesn't exist yet, the page looks
   exactly like it always did. Once the Firestore read resolves, any
   fields present in the document overwrite the defaults and the page
   re-renders with the live content.
   ========================================================================== */

window.SITE_DATA = {
  phonePrimary: "07729 392939",
  phoneSecondary: "01992 842494",
  whatsapp: "447729392939",
  email: "sayahrecovery@gmail.com",
  hours: "Open 24 hours a day, 7 days a week.",
  logoUrl: "",
  heroImageUrl: "",
  services: [
    {
      title: "Car, Van & Truck Breakdown & Recovery",
      description: "When you're stranded, we're here to help. Our expert team provides 24/7 breakdown and recovery services for cars, vans, and trucks. Whether it's a minor issue or a major breakdown, you can count on us to get you back on the road quickly and safely.",
      price: "",
    },
    {
      title: "Off-Road Recovery Specialist",
      description: "Stuck off-road? No problem. Our specialists are equipped to handle even the toughest recovery challenges. We'll ensure your vehicle is safely extracted and back on track, whatever the terrain.",
      price: "",
    },
    {
      title: "Accident Management Support & Solutions",
      description: "Accidents happen, but you don't have to handle them alone. We offer comprehensive accident management support and solutions, from the initial incident to the final repair — coordinating with insurance companies and repair shops to make the process seamless and stress-free.",
      price: "",
    },
    {
      title: "IVR Qualified Drivers",
      description: "Safety and professionalism are our priorities. All our drivers are IVR (Institute of Vehicle Recovery) qualified, ensuring your vehicle is in the hands of trained and certified experts every time.",
      price: "",
    },
    {
      title: "Commercial Service Vans for Roadside Repairs",
      description: "Protect your business assets with tailored commercial plans. Navigating the aftermath of an incident can be overwhelming — let us handle the logistics, from roadside repairs to fleet support, so you can focus on your operation.",
      price: "",
    },
    {
      title: "Bus, Coach & Low Loader Specialists",
      description: "We understand the unique needs of larger vehicles. Our team specialises in the recovery of buses, coaches and low loaders, providing tailored solutions from towing and repair coordination to insurance liaison.",
      price: "",
    },
  ],
  coverageGroups: [
    { name: "Hertfordshire", towns: "Cheshunt, Bishops Stortford, Buntingford, Cuffley, Hatfield, Hatfield Heath, Hertford, Hoddesdon, Northaw, Potters Bar, Puckeridge, Sawbridgeworth, Standon, Stevenage, Ware, Watton at Stone, Welwyn Garden City." },
    { name: "Essex & M11 Corridor", towns: "Braintree, Brentwood, Chelmsford, Chigwell, Colchester, Epping, Great Dunmow, Great Hallingbury, Loughton, Nazeing, North Weald, Ongar, Roydon, Saffron Walden, Stansted Mountfitchet, Waltham Abbey, Waltham Cross." },
    { name: "North & North-East London", towns: "Barnet, Chingford, Enfield, Ilford, Romford, Woodford." },
    { name: "Also Covering", towns: "Dartford, Tilbury, Thurrock." },
  ],
};

const DEFAULT_LOGO = "assets/logo.png";
const DEFAULT_HERO = "assets/truck-hero.jpg";

function digitsOnly(str) {
  return String(str || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
}

/* A single generic icon used for every dynamically-rendered service card
   (a wrench) so newly added services don't need a hand-picked icon. */
const SERVICE_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M14.7 6.3a4 4 0 0 0-5.5 4.9L3 17.4V21h3.6l6.2-6.2a4 4 0 0 0 4.9-5.5l-2.8 2.8-2.1-2.1z"/>' +
  "</svg>";

/* Same location-pin icon the original coverage cards already all shared. */
const COVERAGE_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' +
  "</svg>";

function renderSiteData() {
  const data = window.SITE_DATA;

  // ---- Phone numbers (text spans + tel: links + aria-labels) ----
  document.querySelectorAll('[data-bind="phone-primary"]').forEach((el) => (el.textContent = data.phonePrimary));
  document.querySelectorAll('[data-bind="phone-secondary"]').forEach((el) => (el.textContent = data.phoneSecondary));
  document.querySelectorAll('[data-tel="primary"]').forEach((el) => {
    el.setAttribute("href", "tel:" + digitsOnly(data.phonePrimary));
    if (el.hasAttribute("data-aria-template")) {
      el.setAttribute("aria-label", el.getAttribute("data-aria-template").replace("{phone}", data.phonePrimary));
    }
  });
  document.querySelectorAll('[data-tel="secondary"]').forEach((el) => {
    el.setAttribute("href", "tel:" + digitsOnly(data.phoneSecondary));
    if (el.hasAttribute("data-aria-template")) {
      el.setAttribute("aria-label", el.getAttribute("data-aria-template").replace("{phone}", data.phoneSecondary));
    }
  });

  // ---- Email ----
  document.querySelectorAll('[data-bind="email"]').forEach((el) => (el.textContent = data.email));
  document.querySelectorAll('[data-email-link]').forEach((el) => el.setAttribute("href", "mailto:" + data.email));

  // ---- Hours ----
  document.querySelectorAll('[data-bind="hours"]').forEach((el) => (el.textContent = data.hours));

  // ---- Logo (every <img data-bind-src="logo">) ----
  document.querySelectorAll('[data-bind-src="logo"]').forEach((el) => {
    el.src = data.logoUrl || DEFAULT_LOGO;
  });

  // ---- Hero background image ----
  const heroEl = document.querySelector("#hero-section");
  if (heroEl) {
    const url = data.heroImageUrl || DEFAULT_HERO;
    // NOTE: this is the full `background` shorthand (it carries position/size/
    // repeat), not `background-image` — assigning it to backgroundImage alone
    // is invalid CSS and gets silently dropped by the browser.
    heroEl.style.background =
      "linear-gradient(180deg, rgba(4,7,15,0.55) 0%, rgba(4,7,15,0.85) 55%, var(--navy-950) 100%), " +
      "linear-gradient(120deg, rgba(10,20,50,0.9), rgba(4,7,15,0.9)), " +
      'url("' + url + '") center 30% / cover no-repeat';
  }

  // ---- Services grid (services.html only) ----
  const servicesGrid = document.querySelector("#services-grid");
  if (servicesGrid && Array.isArray(data.services)) {
    servicesGrid.innerHTML = "";
    data.services.forEach((svc) => {
      const card = document.createElement("div");
      card.className = "card reveal is-visible";
      const priceHtml = svc.price ? '<div class="service-price">' + escapeHtml(svc.price) + "</div>" : "";
      card.innerHTML =
        '<div class="card-icon">' + SERVICE_ICON_SVG + "</div>" +
        "<h3>" + escapeHtml(svc.title || "") + "</h3>" +
        "<p>" + escapeHtml(svc.description || "") + "</p>" +
        priceHtml;
      servicesGrid.appendChild(card);
    });
  }

  // ---- Coverage grid (coverage.html only) ----
  const coverageGrid = document.querySelector("#coverage-grid");
  if (coverageGrid && Array.isArray(data.coverageGroups)) {
    coverageGrid.innerHTML = "";
    data.coverageGroups.forEach((grp) => {
      const card = document.createElement("div");
      card.className = "card reveal is-visible";
      card.innerHTML =
        '<div class="card-icon">' + COVERAGE_ICON_SVG + "</div>" +
        "<h3>" + escapeHtml(grp.name || "") + "</h3>" +
        "<p>" + escapeHtml(grp.towns || "") + "</p>";
      coverageGrid.appendChild(card);
    });
  }

  // ---- schema.org JSON-LD (index.html only) ----
  const ldEl = document.querySelector("#ld-schema");
  if (ldEl) {
    try {
      const schema = JSON.parse(ldEl.textContent);
      schema.telephone = ["+" + digitsOnly(data.phonePrimary.replace(/^0/, "44")), "+" + digitsOnly(data.phoneSecondary.replace(/^0/, "44"))];
      schema.email = data.email;
      if (Array.isArray(data.coverageGroups) && data.coverageGroups.length) {
        const towns = data.coverageGroups
          .flatMap((g) => (g.towns || "").split(",").map((t) => t.replace(/\.$/, "").trim()))
          .filter(Boolean);
        schema.areaServed = Array.from(new Set(towns));
      }
      ldEl.textContent = JSON.stringify(schema, null, 2);
    } catch (e) {
      console.warn("Couldn't update schema.org data:", e);
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function loadSiteContentFromFirestore() {
  if (typeof db === "undefined") return;
  db.collection("siteContent")
    .doc("main")
    .get()
    .then((doc) => {
      if (!doc.exists) return;
      const remote = doc.data();
      // Merge: only overwrite fields that are actually present in Firestore,
      // so a partially-filled document never blanks out the rest of the site.
      Object.keys(remote).forEach((key) => {
        if (remote[key] !== undefined) window.SITE_DATA[key] = remote[key];
      });
      renderSiteData();
    })
    .catch((err) => {
      console.warn("Couldn't load live site content, showing defaults:", err.message);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  renderSiteData(); // instant, uses the defaults above — no flash of empty content
  loadSiteContentFromFirestore(); // then upgrades to live content, if available
});
