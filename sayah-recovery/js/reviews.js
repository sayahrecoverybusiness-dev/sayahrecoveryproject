/* ==========================================================================
   SAYAH RECOVERY — Public reviews (submit + display)
   Requires firebase-init.js to have run first (defines global `db`).
   Only runs its logic on pages that actually contain the relevant elements,
   so it's safe to include on every page.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initReviewFormToggle();
  initReviewForm();
  loadApprovedReviews();
});

/* ---------- Show/hide the review submission form ---------- */
function initReviewFormToggle() {
  const toggleBtn = document.querySelector("#toggle-review-form");
  const panel = document.querySelector("#review-form-panel");
  if (!toggleBtn || !panel) return;

  toggleBtn.addEventListener("click", () => {
    const isHidden = panel.hasAttribute("hidden");
    if (isHidden) {
      panel.removeAttribute("hidden");
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      panel.setAttribute("hidden", "");
    }
  });
}

/* ---------- Submit a new review (goes in as "pending") ---------- */
function initReviewForm() {
  const form = document.querySelector("#review-form");
  if (!form || typeof db === "undefined") return;

  const successBox = document.querySelector("#review-success");
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.querySelector("#review-name")?.value.trim();
    const comment = form.querySelector("#review-comment")?.value.trim();
    const ratingInput = form.querySelector('input[name="rating"]:checked');
    const rating = ratingInput ? parseInt(ratingInput.value, 10) : null;

    let valid = true;
    const nameField = form.querySelector("#review-name");
    const commentField = form.querySelector("#review-comment");
    const starRating = form.querySelector("#star-rating");

    [
      [nameField, !name],
      [commentField, !comment],
    ].forEach(([field, isInvalid]) => {
      if (!field) return;
      field.style.borderColor = isInvalid ? "#ff3b3b" : "";
      if (isInvalid) valid = false;
    });
    if (starRating) {
      starRating.style.outline = rating ? "" : "2px solid #ff3b3b";
      if (!rating) valid = false;
    }
    if (!valid || !name || !comment || !rating) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
    }

    db.collection("reviews")
      .add({
        name: name.slice(0, 100),
        comment: comment.slice(0, 1000),
        rating: rating,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        form.reset();
        if (successBox) {
          successBox.classList.add("visible");
          successBox.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      })
      .catch((err) => {
        console.error("Review submission failed:", err);
        alert("Sorry, something went wrong submitting your review. Please try again, or contact us directly.");
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Review";
        }
      });
  });
}

/* ---------- Load and render approved reviews ---------- */
function loadApprovedReviews() {
  const list = document.querySelector("#reviews-list");
  if (!list || typeof db === "undefined") return;

  db.collection("reviews")
    .where("status", "==", "approved")
    .orderBy("createdAt", "desc")
    .limit(9)
    .get()
    .then((snapshot) => {
      list.innerHTML = "";

      if (snapshot.empty) {
        const empty = document.createElement("div");
        empty.className = "reviews-empty reveal is-visible";
        empty.textContent = "No reviews yet — be the first to share your experience with us!";
        list.appendChild(empty);
        return;
      }

      snapshot.forEach((doc) => {
        list.appendChild(buildReviewCard(doc.data()));
      });
    })
    .catch((err) => {
      console.error("Failed to load reviews:", err);
      // Fail quietly on the public site — don't show a scary error to visitors.
      list.innerHTML = "";
    });
}

function buildReviewCard(review) {
  const card = document.createElement("div");
  card.className = "testimonial reveal is-visible";

  const stars = document.createElement("div");
  stars.className = "stars";
  const ratingNum = Math.max(1, Math.min(5, Number(review.rating) || 5));
  stars.textContent = "★".repeat(ratingNum) + "☆".repeat(5 - ratingNum);
  card.appendChild(stars);

  const quote = document.createElement("p");
  quote.className = "quote";
  quote.textContent = `"${review.comment || ""}"`;
  card.appendChild(quote);

  const who = document.createElement("div");
  who.className = "who";
  who.textContent = review.name || "Customer";
  card.appendChild(who);

  return card;
}
