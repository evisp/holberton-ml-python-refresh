/* ==========================================================================
   Holberton Albania · Python & Data Refresh — interaction layer
   --------------------------------------------------------------------------
   1. Expandable task cards: keyboard operable, screen-reader announced,
      and sized to their real content instead of a fixed max-height cap.
   2. In-page links that account for the sticky header.
   3. Deep links that open the task card they point into.

   Upgrades the existing markup at runtime — no HTML changes required.
   ========================================================================== */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function prefersReducedMotion() {
    return reducedMotion.matches;
  }

  /* Distance to keep clear of the sticky header when scrolling to a target. */
  function headerOffset() {
    var header = document.querySelector(".site-header");
    var height = header ? header.getBoundingClientRect().height : 0;
    return height + 20;
  }

  /* ========================================================================
     Task cards
     ====================================================================== */

  function initTaskCards() {
    var cards = document.querySelectorAll(".task-card");

    Array.prototype.forEach.call(cards, function (card, index) {
      var header = card.querySelector(".task-header");
      var body = card.querySelector(".task-body");
      var toggle = card.querySelector(".task-toggle");

      if (!header || !body) return;

      /* --- Give the pair the identity ARIA needs --- */
      if (!body.id) body.id = "task-body-" + (index + 1);
      if (!header.id) header.id = "task-header-" + (index + 1);

      header.setAttribute("role", "button");
      header.setAttribute("tabindex", "0");
      header.setAttribute("aria-controls", body.id);
      header.setAttribute("aria-expanded", "false");

      body.setAttribute("role", "region");
      body.setAttribute("aria-labelledby", header.id);

      /* --- Start collapsed and out of the accessibility tree --- */
      card.classList.remove("is-open");
      body.hidden = true;
      body.style.maxHeight = "0px";

      if (toggle) toggle.textContent = "Show details";

      /* --- Interaction --- */
      header.addEventListener("click", function () {
        toggleCard(card);
      });

      header.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
          event.preventDefault();
          toggleCard(card);
        }
      });

      /* --- Once open, release the cap so the card can never clip --- */
      body.addEventListener("transitionend", function (event) {
        if (event.propertyName !== "max-height") return;

        if (card.classList.contains("is-open")) {
          body.style.maxHeight = "none";
        } else {
          body.hidden = true;
        }
      });
    });
  }

  function isOpen(card) {
    return card.classList.contains("is-open");
  }

  function toggleCard(card) {
    if (isOpen(card)) {
      closeCard(card);
    } else {
      openCard(card);
    }
  }

  function openCard(card) {
    var header = card.querySelector(".task-header");
    var body = card.querySelector(".task-body");
    var toggle = card.querySelector(".task-toggle");

    if (!body || isOpen(card)) return;

    body.hidden = false;
    card.classList.add("is-open");
    header.setAttribute("aria-expanded", "true");
    if (toggle) toggle.textContent = "Hide details";

    if (prefersReducedMotion()) {
      body.style.maxHeight = "none";
      return;
    }

    /* Measure after the open class lands, so padding is included. */
    body.style.maxHeight = "0px";
    void body.offsetHeight;
    body.style.maxHeight = body.scrollHeight + "px";
  }

  function closeCard(card) {
    var header = card.querySelector(".task-header");
    var body = card.querySelector(".task-body");
    var toggle = card.querySelector(".task-toggle");

    if (!body || !isOpen(card)) return;

    header.setAttribute("aria-expanded", "false");
    if (toggle) toggle.textContent = "Show details";

    if (prefersReducedMotion()) {
      card.classList.remove("is-open");
      body.style.maxHeight = "0px";
      body.hidden = true;
      return;
    }

    /* Animate from a real number, not from "none". */
    body.style.maxHeight = body.scrollHeight + "px";
    void body.offsetHeight;

    card.classList.remove("is-open");
    body.style.maxHeight = "0px";
  }

  /* An open card whose content reflows (window resize, font swap) is holding
     a stale pixel value only mid-transition; "none" covers the settled case. */
  function refreshOpenCards() {
    var open = document.querySelectorAll(".task-card.is-open .task-body");

    Array.prototype.forEach.call(open, function (body) {
      body.style.maxHeight = "none";
    });
  }

  /* ========================================================================
     Copy buttons on code blocks

     Wraps each <pre> and injects a button. Uses the async Clipboard API
     where it exists, and falls back to a hidden textarea — which matters
     because the Clipboard API is unavailable on file:// pages, so the
     button would silently do nothing when previewing locally.
     ====================================================================== */

  function initCodeCopy() {
    var blocks = document.querySelectorAll("pre");

    Array.prototype.forEach.call(blocks, function (pre) {
      if (pre.parentNode && pre.parentNode.classList.contains("code-block")) return;

      var wrapper = document.createElement("div");
      wrapper.className = "code-block";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      var button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy this code to the clipboard");
      wrapper.appendChild(button);

      button.addEventListener("click", function () {
        copyText(getCodeText(pre), button);
      });
    });
  }

  function getCodeText(pre) {
    var code = pre.querySelector("code");
    var text = (code || pre).textContent || "";
    return text.replace(/\s+$/, "");
  }

  function copyText(text, button) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { confirmCopy(button, true); },
        function () { legacyCopy(text, button); }
      );
      return;
    }

    legacyCopy(text, button);
  }

  function legacyCopy(text, button) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.opacity = "0";

    document.body.appendChild(field);
    field.select();

    var succeeded = false;
    try {
      succeeded = document.execCommand("copy");
    } catch (error) {
      succeeded = false;
    }

    document.body.removeChild(field);
    confirmCopy(button, succeeded);
  }

  function confirmCopy(button, succeeded) {
    button.textContent = succeeded ? "Copied" : "Press Ctrl+C";
    button.classList.add("is-copied");

    window.clearTimeout(button.resetTimer);
    button.resetTimer = window.setTimeout(function () {
      button.textContent = "Copy";
      button.classList.remove("is-copied");
    }, 1800);
  }

  /* ========================================================================
     In-page navigation
     ====================================================================== */

  function scrollToTarget(target) {
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();

    window.scrollTo({
      top: top,
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });

    /* Move focus too, so keyboard and screen-reader users follow the jump. */
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  }

  function initAnchorLinks() {
    var links = document.querySelectorAll('a[href^="#"]');

    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href");
        if (!href || href === "#") return;

        var target = document.getElementById(href.slice(1));
        if (!target) return;

        event.preventDefault();

        /* If the destination is inside a collapsed card, open it first. */
        var parentCard = target.closest ? target.closest(".task-card") : null;
        if (parentCard && !isOpen(parentCard)) {
          openCard(parentCard);
        }

        scrollToTarget(target);

        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", href);
        }
      });
    });
  }

  /* A link arriving from another page should land correctly and, if it points
     into a task card, find it already open. */
  function handleInitialHash() {
    if (!window.location.hash || window.location.hash === "#") return;

    var target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;

    var parentCard = target.closest ? target.closest(".task-card") : null;
    if (parentCard) openCard(parentCard);

    window.setTimeout(function () {
      scrollToTarget(target);
    }, 60);
  }

  /* ========================================================================
     Boot
     ====================================================================== */

  document.addEventListener("DOMContentLoaded", function () {
    initTaskCards();
    initCodeCopy();
    initAnchorLinks();
    handleInitialHash();
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refreshOpenCards, 150);
  });

  /* Webfonts landing after paint change content height. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refreshOpenCards);
  }
})();
