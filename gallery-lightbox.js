/**
 * gallery-lightbox.js
 * Simple click-to-expand lightbox for images inside [data-gallery-grid].
 */
(() => {
  const grid = document.querySelector("[data-gallery-grid]");
  const box = document.querySelector("[data-lightbox]");
  const img = document.querySelector("[data-lightbox-image]");
  const closeBtn = document.querySelector("[data-lightbox-close]");

  if (!grid || !box || !img || !closeBtn) return;

  const open = (src, alt) => {
    img.src = src;
    img.alt = alt || "Expanded image";
    box.hidden = false;
  };

  const close = () => {
    box.hidden = true;
    img.src = "";
  };

  grid.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLImageElement)) return;
    open(target.src, target.alt);
  });

  closeBtn.addEventListener("click", close);
  box.addEventListener("click", (e) => {
    if (e.target === box) close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();
