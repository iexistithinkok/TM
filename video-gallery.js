/**
 * video-gallery.js
 * Renders a YouTube "playlist-like" gallery:
 * - One main player iframe
 * - Clickable thumbnail grid
 *
 * Config:
 * - ./data/videos.json (array of { id, title, tag })
 */
(() => {
  const player = document.querySelector("[data-video-player]");
  const thumbs = document.querySelector("[data-video-thumbnails]");
  if (!player || !thumbs) return;

  const ytEmbed = (id) =>
    `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`;

  const ytThumb = (id) => `https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

  const setActive = (card) => {
    thumbs.querySelectorAll("[data-video-card]").forEach((el) => el.removeAttribute("data-active"));
    card.setAttribute("data-active", "true");
  };

  const setPlayer = (id) => {
    player.setAttribute("src", ytEmbed(id));
  };

  const render = (items) => {
    thumbs.innerHTML = "";

    items.forEach((item, idx) => {
      const id = String(item.id || "").trim();
      if (!id) return;

      const title = String(item.title || "").trim() || "Untitled video";
      const tag = String(item.tag || "").trim();

      const card = document.createElement("button");
      card.type = "button";
      card.className = "video-thumb-card";
      card.setAttribute("data-video-card", "true");

      const img = document.createElement("img");
      img.className = "video-thumb-img";
      img.src = ytThumb(id);
      img.alt = title;
      img.loading = "lazy";

      const meta = document.createElement("div");
      meta.className = "video-thumb-meta";

      const t = document.createElement("div");
      t.className = "video-thumb-title";
      t.textContent = title;

      meta.appendChild(t);

      if (tag) {
        const badge = document.createElement("div");
        badge.className = "video-thumb-tag";
        badge.textContent = tag;
        meta.appendChild(badge);
      }

      card.appendChild(img);
      card.appendChild(meta);

      card.addEventListener("click", () => {
        setPlayer(id);
        setActive(card);
      });

      thumbs.appendChild(card);

      if (idx === 0) {
        setPlayer(id);
        setActive(card);
      }
    });
  };

  const boot = async () => {
    try {
      const res = await fetch("./data/videos.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`videos.json load failed: ${res.status}`);
      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) throw new Error("videos.json is empty");
      render(items);
    } catch (err) {
      console.error(err);
      thumbs.innerHTML = "<p class='muted'>Video gallery unavailable. Check data/videos.json.</p>";
    }
  };

  boot();
})();
