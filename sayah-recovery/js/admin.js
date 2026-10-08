/* ==========================================================================
   SAYAH RECOVERY — Review admin panel
   Requires firebase-init.js to have run first (defines global `db`, `auth`).
   Gated entirely by Firebase Authentication — see README.md for setup.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const loginCard = document.querySelector("#login-card");
  const dashboard = document.querySelector("#dashboard");
  const loginForm = document.querySelector("#login-form");
  const loginError = document.querySelector("#login-error");
  const signOutBtn = document.querySelector("#sign-out-btn");
  const userEmailEl = document.querySelector("#admin-user-email");

  if (typeof auth === "undefined") return;

  auth.onAuthStateChanged((user) => {
    if (user) {
      loginCard.hidden = true;
      dashboard.hidden = false;
      userEmailEl.textContent = user.email;
      loadPending();
      loadApproved();
    } else {
      loginCard.hidden = false;
      dashboard.hidden = true;
    }
  });

  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;

    auth.signInWithEmailAndPassword(email, password).catch((err) => {
      loginError.textContent = "Sign-in failed — check your email and password.";
      loginError.hidden = false;
      console.error(err);
    });
  });

  signOutBtn?.addEventListener("click", () => auth.signOut());

  // Tab switching between Pending / Published
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.querySelector("#pending-panel").hidden = target !== "pending";
      document.querySelector("#approved-panel").hidden = target !== "approved";
    });
  });
});

function loadPending() {
  const list = document.querySelector("#pending-list");
  const countEl = document.querySelector("#pending-count");
  if (!list) return;
  list.innerHTML = "";
  list.appendChild(loadingNote());

  db.collection("reviews")
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .get()
    .then((snap) => {
      list.innerHTML = "";
      if (countEl) countEl.textContent = snap.size ? String(snap.size) : "";
      if (snap.empty) {
        list.appendChild(emptyNote("No pending reviews right now."));
        return;
      }
      snap.forEach((doc) => list.appendChild(buildAdminCard(doc, true)));
    })
    .catch((err) => {
      list.innerHTML = "";
      list.appendChild(emptyNote("Couldn't load reviews (" + err.message + ")"));
    });
}

function loadApproved() {
  const list = document.querySelector("#approved-list");
  if (!list) return;
  list.innerHTML = "";
  list.appendChild(loadingNote());

  db.collection("reviews")
    .where("status", "==", "approved")
    .orderBy("createdAt", "desc")
    .get()
    .then((snap) => {
      list.innerHTML = "";
      if (snap.empty) {
        list.appendChild(emptyNote("No published reviews yet."));
        return;
      }
      snap.forEach((doc) => list.appendChild(buildAdminCard(doc, false)));
    })
    .catch((err) => {
      list.innerHTML = "";
      list.appendChild(emptyNote("Couldn't load reviews (" + err.message + ")"));
    });
}

function loadingNote() {
  const p = document.createElement("p");
  p.className = "admin-empty";
  p.textContent = "Loading…";
  return p;
}

function emptyNote(text) {
  const p = document.createElement("p");
  p.className = "admin-empty";
  p.textContent = text;
  return p;
}

function buildAdminCard(doc, isPending) {
  const data = doc.data();
  const card = document.createElement("div");
  card.className = "admin-review-card";

  const stars = document.createElement("div");
  stars.className = "stars";
  const r = Math.max(1, Math.min(5, Number(data.rating) || 5));
  stars.textContent = "★".repeat(r) + "☆".repeat(5 - r);
  card.appendChild(stars);

  const name = document.createElement("div");
  name.className = "admin-review-name";
  name.textContent = data.name || "Customer";
  card.appendChild(name);

  const comment = document.createElement("p");
  comment.className = "admin-review-comment";
  comment.textContent = data.comment || "";
  card.appendChild(comment);

  const when = document.createElement("div");
  when.className = "admin-review-date";
  when.textContent = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toLocaleString("en-GB") : "";
  card.appendChild(when);

  const actions = document.createElement("div");
  actions.className = "admin-review-actions";

  if (isPending) {
    const approveBtn = document.createElement("button");
    approveBtn.type = "button";
    approveBtn.className = "btn btn-call";
    approveBtn.textContent = "Approve";
    approveBtn.addEventListener("click", () => {
      approveBtn.disabled = true;
      db.collection("reviews")
        .doc(doc.id)
        .update({ status: "approved" })
        .then(() => {
          loadPending();
          loadApproved();
        })
        .catch((err) => {
          alert("Couldn't approve this review: " + err.message);
          approveBtn.disabled = false;
        });
    });
    actions.appendChild(approveBtn);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-sos";
  deleteBtn.textContent = isPending ? "Reject" : "Unpublish";
  deleteBtn.addEventListener("click", () => {
    const confirmMsg = isPending
      ? "Reject and permanently delete this review?"
      : "Remove this review from the public site?";
    if (!window.confirm(confirmMsg)) return;
    deleteBtn.disabled = true;
    db.collection("reviews")
      .doc(doc.id)
      .delete()
      .then(() => {
        loadPending();
        loadApproved();
      })
      .catch((err) => {
        alert("Couldn't remove this review: " + err.message);
        deleteBtn.disabled = false;
      });
  });
  actions.appendChild(deleteBtn);

  card.appendChild(actions);
  return card;
}
