/* ==========================================================================
   SAYAH RECOVERY — Site interactivity
   Vanilla JS, no build step required. Works across all pages.
   ========================================================================== */

// WhatsApp number Sayah Recovery uses for calls/SOS, in international format
// without the leading 0 or "+". Read live (at click time) from
// window.SITE_DATA so it can be changed from the admin panel — js/site-content.js
// sets a safe default even before that panel is ever used.
function getWhatsAppNumber() {
  return (window.SITE_DATA && window.SITE_DATA.whatsapp) || "447729392939";
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initScrollReveal();
  initActiveNavLink();
  initContactForm();
  initWhatsAppLocation();
  initYear();
});

/* ---------- Mobile menu ---------- */
function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (!toggle || !menu) return;

  const closeBtn = menu.querySelector(".close-menu");

  const open = () => {
    menu.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    menu.classList.remove("open");
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  menu.querySelectorAll("a, button").forEach((el) => el.addEventListener("click", close));
}

/* ---------- Reveal-on-scroll ---------- */
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const revealAll = () => items.forEach((el) => el.classList.add("is-visible"));

  if (!("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  try {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach((el) => observer.observe(el));
  } catch (err) {
    revealAll();
  }

  // Safety net: if for any reason an element never intersects (odd layout,
  // embedded iframe, automated screenshot tools, etc.), make sure nothing
  // stays permanently invisible.
  window.setTimeout(revealAll, 2500);
}

/* ---------- Highlight current page in nav ---------- */
function initActiveNavLink() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });
}

/* ---------- Contact form ---------- */
function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const successBox = document.querySelector("#form-success");
  const errorBox = document.querySelector("#form-error");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitBtnDefaultText = submitBtn ? submitBtn.textContent : null;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;
    form.querySelectorAll("[required]").forEach((field) => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = "#ff3b3b";
      } else {
        field.style.borderColor = "";
      }
    });

    if (!valid) return;

    if (errorBox) errorBox.hidden = true;
    if (successBox) successBox.classList.remove("visible");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    // Submitted via fetch (not a normal page navigation) so we can show our
    // own success/error message instead of redirecting to Formspree's site.
    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (response.ok) {
          if (successBox) {
            successBox.classList.add("visible");
            successBox.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          form.reset();
        } else {
          if (errorBox) errorBox.hidden = false;
        }
      })
      .catch(() => {
        if (errorBox) errorBox.hidden = false;
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtnDefaultText;
        }
      });
  });
}

/* ---------- WhatsApp "share my exact location" buttons ---------- */
function buildWhatsAppUrl(message) {
  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

function initWhatsAppLocation() {
  const buttons = document.querySelectorAll(".whatsapp-location-btn");
  if (!buttons.length) return;

  const baseMessage = "Hello Sayah Recovery, I need vehicle recovery assistance.";

  buttons.forEach((btn) => {
    const label = btn.querySelector(".btn-label");
    const defaultText = label ? label.textContent : null;
    const setLabel = (text) => {
      if (label) label.textContent = text;
    };

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (btn.disabled) return;

      // No Geolocation support at all (very old browser) — go straight to
      // WhatsApp so the customer can type their address instead.
      if (!("geolocation" in navigator)) {
        window.location.href = buildWhatsAppUrl(
          `${baseMessage} (My browser can't share my exact location automatically — my address: )`
        );
        return;
      }

      btn.disabled = true;
      setLabel("Getting your location…");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // A plain Google Maps coordinate link — opens directly to a pin at
          // the caller's exact position for whoever reads it on WhatsApp.
          const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
          const message = `${baseMessage}\nMy exact location: ${mapsLink}`;
          window.location.href = buildWhatsAppUrl(message);
        },
        () => {
          // Permission denied, timed out, or unavailable — still send them
          // to WhatsApp so they can describe their location manually rather
          // than getting stuck.
          window.location.href = buildWhatsAppUrl(
            `${baseMessage} (I wasn't able to share my exact location automatically — my address: )`
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Re-enable the button in case the browser keeps the page open
      // (e.g. the user cancels the permission prompt very slowly).
      window.setTimeout(() => {
        btn.disabled = false;
        setLabel(defaultText);
      }, 12000);
    });
  });
}

/* ---------- Footer year ---------- */
function initYear() {
  const yearEl = document.querySelector("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
