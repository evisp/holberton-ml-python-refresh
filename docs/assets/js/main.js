// Minimal enhancements: smooth scrolling + expandable task cards

document.addEventListener("DOMContentLoaded", () => {
  // Smooth scroll for internal anchor links
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href").substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Expandable task cards (multiple open allowed)
  const taskCards = document.querySelectorAll(".task-card");
  taskCards.forEach(card => {
    const header = card.querySelector(".task-header");
    const toggle = card.querySelector(".task-toggle");

    if (!header) return;

    header.addEventListener("click", () => {
      card.classList.toggle("is-open");
      if (toggle) {
        toggle.textContent = card.classList.contains("is-open") ? "Hide details" : "Show details";
      }
    });

    // Ensure initial state is collapsed with "Show details" text
    if (toggle) {
      toggle.textContent = "Show details";
    }
    card.classList.remove("is-open");
  });
});