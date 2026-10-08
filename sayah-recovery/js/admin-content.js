/* ==========================================================================
   SAYAH RECOVERY — Admin: Site Content editor
   Lets a signed-in admin edit contact info, services, coverage areas, logo
   and hero image, all stored in the single Firestore document
   siteContent/main (see README.md for the security rules).

   Requires (loaded before this file, in this order):
     firebase-init.js   -> global `db`, `auth`, `storage`
     site-content.js    -> window.SITE_DATA with safe defaults
     admin.js            -> handles sign-in/out (this file only reads `auth`)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof auth === "undefined" || typeof db === "undefined") return;

  wireSectionTabs();
  wireContentTabs();
  wireSaveButtons();
  wireImageUploads();

  auth.onAuthStateChanged((user) => {
    if (user) loadContentEditor();
  });
});

/* ---------- Tab switching ---------- */

function wireSectionTabs() {
  document.querySelectorAll(".admin-section-tabs .admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-section-tabs .admin-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const section = tab.dataset.section;
      const reviewsSection = document.querySelector("#reviews-section");
      const contentSection = document.querySelector("#content-section");
      if (reviewsSection) reviewsSection.hidden = section !== "reviews";
      if (contentSection) contentSection.hidden = section !== "content";
    });
  });
}

function wireContentTabs() {
  const panels = {
    contact: "#content-contact-panel",
    services: "#content-services-panel",
    coverage: "#content-coverage-panel",
    images: "#content-images-panel",
  };
  document.querySelectorAll("[data-content-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-content-tab]").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.contentTab;
      Object.keys(panels).forEach((key) => {
        const el = document.querySelector(panels[key]);
        if (el) el.hidden = key !== target;
      });
    });
  });
}

/* ---------- Load current content into the editors ---------- */

function loadContentEditor() {
  db.collection("siteContent")
    .doc("main")
    .get()
    .then((doc) => {
      if (doc.exists) {
        const remote = doc.data();
        Object.keys(remote).forEach((key) => {
          if (remote[key] !== undefined) window.SITE_DATA[key] = remote[key];
        });
      }
      renderContactForm();
      renderServicesEditor();
      renderCoverageEditor();
      renderImagesPanel();
    })
    .catch((err) => {
      console.warn("Couldn't load site content for editing:", err.message);
      // Still render with whatever defaults we have, so the panel isn't stuck empty.
      renderContactForm();
      renderServicesEditor();
      renderCoverageEditor();
      renderImagesPanel();
    });
}

/* ---------- Contact info ---------- */

function renderContactForm() {
  const data = window.SITE_DATA;
  setVal("#cf-phone-primary", data.phonePrimary);
  setVal("#cf-phone-secondary", data.phoneSecondary);
  setVal("#cf-whatsapp", data.whatsapp);
  setVal("#cf-email", data.email);
  setVal("#cf-hours", data.hours);
}

function setVal(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.value = value || "";
}

/* ---------- Services editor ---------- */

function renderServicesEditor() {
  const list = document.querySelector("#services-editor-list");
  if (!list) return;
  list.innerHTML = "";
  (window.SITE_DATA.services || []).forEach((svc) => list.appendChild(buildServiceRow(svc)));
}

function buildServiceRow(svc) {
  svc = svc || { title: "", description: "", price: "" };
  const card = document.createElement("div");
  card.className = "content-card";
  card.innerHTML = `
    <div class="content-card-row">
      <strong>Service</strong>
      <button type="button" class="remove-card-btn">Remove</button>
    </div>
    <div class="field"><label>Title</label><input type="text" class="svc-title" value="${escapeAttr(svc.title)}"></div>
    <div class="field"><label>Description</label><textarea class="svc-desc">${escapeHtml(svc.description)}</textarea></div>
    <div class="field"><label>Price (optional — leave blank to hide)</label><input type="text" class="svc-price" value="${escapeAttr(svc.price)}" placeholder="e.g. From £60"></div>
  `;
  card.querySelector(".remove-card-btn").addEventListener("click", () => card.remove());
  return card;
}

/* ---------- Coverage editor ---------- */

function renderCoverageEditor() {
  const list = document.querySelector("#coverage-editor-list");
  if (!list) return;
  list.innerHTML = "";
  (window.SITE_DATA.coverageGroups || []).forEach((grp) => list.appendChild(buildCoverageRow(grp)));
}

function buildCoverageRow(grp) {
  grp = grp || { name: "", towns: "" };
  const card = document.createElement("div");
  card.className = "content-card";
  card.innerHTML = `
    <div class="content-card-row">
      <strong>Coverage Area</strong>
      <button type="button" class="remove-card-btn">Remove</button>
    </div>
    <div class="field"><label>Region name</label><input type="text" class="cov-name" value="${escapeAttr(grp.name)}" placeholder="e.g. Hertfordshire"></div>
    <div class="field"><label>Towns (comma-separated)</label><textarea class="cov-towns">${escapeHtml(grp.towns)}</textarea></div>
  `;
  card.querySelector(".remove-card-btn").addEventListener("click", () => card.remove());
  return card;
}

/* ---------- Images ---------- */

function renderImagesPanel() {
  const logoPreview = document.querySelector("#logo-preview");
  const heroPreview = document.querySelector("#hero-preview");
  if (logoPreview) logoPreview.src = window.SITE_DATA.logoUrl || "assets/logo.png";
  if (heroPreview) heroPreview.src = window.SITE_DATA.heroImageUrl || "assets/truck-hero.jpg";
}

/* ---------- Save buttons ---------- */

function wireSaveButtons() {
  document.querySelector("#add-service-btn")?.addEventListener("click", () => {
    document.querySelector("#services-editor-list")?.appendChild(buildServiceRow());
  });
  document.querySelector("#add-coverage-btn")?.addEventListener("click", () => {
    document.querySelector("#coverage-editor-list")?.appendChild(buildCoverageRow());
  });

  document.querySelector("#save-contact-btn")?.addEventListener("click", () => {
    const payload = {
      phonePrimary: valOf("#cf-phone-primary"),
      phoneSecondary: valOf("#cf-phone-secondary"),
      whatsapp: valOf("#cf-whatsapp").replace(/[^\d]/g, ""),
      email: valOf("#cf-email"),
      hours: valOf("#cf-hours"),
    };
    saveToFirestore(payload, "#save-contact-msg");
  });

  document.querySelector("#save-services-btn")?.addEventListener("click", () => {
    const rows = document.querySelectorAll("#services-editor-list .content-card");
    const services = Array.from(rows)
      .map((row) => ({
        title: row.querySelector(".svc-title").value.trim(),
        description: row.querySelector(".svc-desc").value.trim(),
        price: row.querySelector(".svc-price").value.trim(),
      }))
      .filter((s) => s.title);
    saveToFirestore({ services }, "#save-services-msg");
  });

  document.querySelector("#save-coverage-btn")?.addEventListener("click", () => {
    const rows = document.querySelectorAll("#coverage-editor-list .content-card");
    const coverageGroups = Array.from(rows)
      .map((row) => ({
        name: row.querySelector(".cov-name").value.trim(),
        towns: row.querySelector(".cov-towns").value.trim(),
      }))
      .filter((g) => g.name);
    saveToFirestore({ coverageGroups }, "#save-coverage-msg");
  });

  document.querySelector("#logo-reset-btn")?.addEventListener("click", () => {
    saveToFirestore({ logoUrl: "" }, "#logo-msg", () => {
      window.SITE_DATA.logoUrl = "";
      renderImagesPanel();
    });
  });
  document.querySelector("#hero-reset-btn")?.addEventListener("click", () => {
    saveToFirestore({ heroImageUrl: "" }, "#hero-msg", () => {
      window.SITE_DATA.heroImageUrl = "";
      renderImagesPanel();
    });
  });
}

function valOf(selector) {
  const el = document.querySelector(selector);
  return el ? el.value.trim() : "";
}

function saveToFirestore(payload, msgSelector, onSuccess) {
  const msgEl = document.querySelector(msgSelector);
  if (msgEl) {
    msgEl.textContent = "Saving…";
    msgEl.classList.remove("error");
  }
  db.collection("siteContent")
    .doc("main")
    .set(payload, { merge: true })
    .then(() => {
      Object.keys(payload).forEach((key) => (window.SITE_DATA[key] = payload[key]));
      if (msgEl) {
        msgEl.textContent = "Saved ✓";
        msgEl.classList.remove("error");
      }
      if (onSuccess) onSuccess();
      window.setTimeout(() => {
        if (msgEl) msgEl.textContent = "";
      }, 3000);
    })
    .catch((err) => {
      if (msgEl) {
        msgEl.textContent = "Couldn't save: " + err.message;
        msgEl.classList.add("error");
      }
    });
}

/* ---------- Image uploads ---------- */

function wireImageUploads() {
  wireImageUpload("#logo-file", "logo", "#logo-preview", "#logo-msg");
  wireImageUpload("#hero-file", "hero", "#hero-preview", "#hero-msg");
}

function wireImageUpload(inputSelector, kind, previewSelector, msgSelector) {
  const input = document.querySelector(inputSelector);
  if (!input) return;

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;

    if (typeof storage === "undefined") {
      setMsg(msgSelector, "Image uploads aren't available right now.", true);
      return;
    }

    setMsg(msgSelector, "Uploading…", false);

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `site-content/${kind}-${Date.now()}.${ext}`;
    const ref = storage.ref().child(path);

    ref
      .put(file)
      .then((snapshot) => snapshot.ref.getDownloadURL())
      .then((url) => {
        const field = kind === "logo" ? "logoUrl" : "heroImageUrl";
        return db
          .collection("siteContent")
          .doc("main")
          .set({ [field]: url }, { merge: true })
          .then(() => url);
      })
      .then((url) => {
        const field = kind === "logo" ? "logoUrl" : "heroImageUrl";
        window.SITE_DATA[field] = url;
        const preview = document.querySelector(previewSelector);
        if (preview) preview.src = url;
        setMsg(msgSelector, "Saved ✓", false);
        window.setTimeout(() => setMsg(msgSelector, "", false), 3000);
      })
      .catch((err) => {
        setMsg(msgSelector, "Couldn't upload: " + err.message, true);
      });
  });
}

function setMsg(selector, text, isError) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", !!isError);
}

/* ---------- Small helpers ---------- */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
