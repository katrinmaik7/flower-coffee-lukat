// LuKat — progressive enhancement only. Content and links work without this file.
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  // Signup backend: CONNECTION REQUIRED BEFORE LAUNCH.
  // Set this to the real form endpoint (e.g. a Tally or Formspree URL that stores submissions).
  // While empty, no data is sent and the success message is never shown.
  var FORM_ENDPOINT = "";

  // Header: surface change after 80px of scroll (VD 05 default)
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 80); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-menu");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { toggle.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { toggle.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open"); toggle.focus(); }
    });
  }

  // Accordion (VD 05 pattern): collapse on load, toggle data-open + aria-expanded
  document.querySelectorAll(".t-acc").forEach(function (item) {
    var head = item.querySelector(".t-acc-head");
    item.setAttribute("data-open", "false");
    head.setAttribute("aria-expanded", "false");
    head.addEventListener("click", function () {
      var open = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", String(!open));
      head.setAttribute("aria-expanded", String(!open));
    });
  });

  // Capture campaign parameters into hidden fields
  var params = new URLSearchParams(window.location.search);
  ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) {
    var el = document.querySelector('input[name="' + k + '"]');
    if (el && params.get(k)) el.value = params.get(k).slice(0, 100);
  });

  // Review-only grid overlay: ?grid=1
  if (params.get("grid") === "1") {
    var o = document.createElement("div");
    o.className = "grid-overlay";
    o.innerHTML = '<div class="container grid">' + new Array(13).join("<span></span>") + "</div>";
    document.body.appendChild(o);
  }

  // Signup form
  var form = document.getElementById("signup");
  if (!form) return;
  var status = document.getElementById("form-status");
  var submit = form.querySelector('button[type="submit"]');
  var msgs = form.dataset;

  function setInvalid(field, msg) {
    var wrap = field.closest(".field");
    var err = wrap.querySelector(".field-error");
    if (msg) { wrap.setAttribute("data-invalid", "true"); err.textContent = msg; field.setAttribute("aria-invalid", "true"); }
    else { wrap.removeAttribute("data-invalid"); err.textContent = ""; field.removeAttribute("aria-invalid"); }
  }

  function validate() {
    var first = null;
    var email = form.elements.email, hood = form.elements.neighbourhood, consent = form.elements.consent;
    var ev = email.value.trim();
    if (!ev) { setInvalid(email, msgs.errEmailEmpty); first = first || email; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ev)) { setInvalid(email, msgs.errEmailInvalid); first = first || email; }
    else setInvalid(email, "");
    if (!hood.value.trim()) { setInvalid(hood, msgs.errHood); first = first || hood; } else setInvalid(hood, "");
    if (!consent.checked) { setInvalid(consent, msgs.errConsent); first = first || consent; } else setInvalid(consent, "");
    return first;
  }

  form.setAttribute("novalidate", "");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.hidden = true;
    var first = validate();
    if (first) { first.focus(); return; }

    var label = submit.textContent;
    submit.disabled = true;
    submit.textContent = msgs.loading;

    function fail() {
      status.textContent = msgs.failure;
      status.hidden = false;
      submit.disabled = false;
      submit.textContent = label;
      status.focus();
    }

    if (!FORM_ENDPOINT) {
      // Not connected: nothing was stored, so show the truthful failure state.
      console.warn("LuKat signup: FORM_ENDPOINT is not set. Connection required before launch.");
      setTimeout(fail, 400);
      return;
    }

    fetch(FORM_ENDPOINT, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        // Success only after the backend confirms storage.
        form.hidden = true;
        status.textContent = msgs.success;
        status.hidden = false;
        status.focus();
      })
      .catch(fail);
  });
})();
