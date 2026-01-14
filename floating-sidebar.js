/**
 * floating-sidebar.js
 * - Floating sidebar that follows user
 * - Highlights current section
 * - Mobile toggle
 */
(() => {
  const sidebar = document.querySelector("[data-floating-sidebar]");
  const toggle = document.querySelector("[data-floating-toggle]");
  const panel = document.querySelector("[data-floating-panel]");
  const links = Array.from(document.querySelectorAll("[data-section-link]"));

  if (!sidebar || !panel || links.length === 0) return;

  const setOpen = (open) => {
    if (!toggle) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    sidebar.toggleAttribute("data-open", open);
  };

  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
    });
  }

  // Close on click (mobile)
  links.forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  const sections = links
    .map((a) => document.querySelector(`[data-section="${a.getAttribute("data-section-link")}"]`))
    .filter(Boolean);

  if (sections.length === 0) return;

  const byId = new Map();
  sections.forEach((s) => byId.set(s.getAttribute("data-section"), s));

  const setActive = (sectionKey) => {
    links.forEach((a) => {
      const isActive = a.getAttribute("data-section-link") === sectionKey;
      a.classList.toggle("is-active", isActive);
      if (isActive) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      setActive(visible.target.getAttribute("data-section"));
    },
    { root: null, threshold: [0.2, 0.35, 0.5, 0.65] }
  );

  sections.forEach((s) => observer.observe(s));

  // default closed on load
  setOpen(false);
})();
