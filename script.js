// ===============================
// VIDEO DATA (manual curation)
// ===============================
const videos = [
  {
    title: "Transform Multimedia Showcase",
    description: "A curated highlight featuring cinematic brand storytelling.",
    youtubeId: "4djzFPCsy_g",
  },
  {
    title: "Motion Systems Reel",
    description: "High-energy motion graphics built for digital launches.",
    youtubeId: "_kHI49_50I8",
  },
  {
    title: "Brand Narrative Film",
    description: "A polished story-driven video for premium campaigns.",
    youtubeId: "41BjbyHVb6o",
  },
  {
    title: "Experimental Visuals",
    description: "Atmospheric sequences designed for immersive screens.",
    youtubeId: "aDBUmznHsaE",
  },
  {
    title: "Product Launch Teaser",
    description: "Cinematic teaser edit with bold, futuristic pacing.",
    youtubeId: "XH6nKQ3L08E",
  },
  {
    title: "Short-Form Sizzle",
    description: "Fast-cut social assets for multi-platform launches.",
    youtubeId: "921OkRZ76t8",
  },
];

// ===============================
// DOM REFERENCES
// ===============================
const featuredTitle = document.getElementById("featured-title");
const featuredDescription = document.getElementById("featured-description");
const featuredIframe = document.getElementById("featured-iframe");
const videoGrid = document.getElementById("video-grid");
const nextButton = document.getElementById("next-video");
const prevButton = document.getElementById("prev-video");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");

let currentIndex = 0;

// ===============================
// CORE PLAYER LOGIC
// ===============================
function updateFeaturedVideo(index) {
  const video = videos[index];

  featuredTitle.textContent = video.title;
  featuredDescription.textContent = video.description;

  // ✅ Correct single-video embed (NO playlist params)
  featuredIframe.src = `https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&playsinline=1&start=4`;

  currentIndex = index;
}

// ===============================
// VIDEO CARD BUILDER
// ===============================
function buildVideoCard(video, index) {
  const card = document.createElement("button");
  card.className = "video-card";
  card.type = "button";
  card.setAttribute("aria-label", `Play ${video.title}`);

  card.innerHTML = `
    <div class="video-thumb">
      <img 
        src="https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg"
        alt="${video.title}"
        loading="lazy"
      />
    </div>
    <h4>${video.title}</h4>
    <p>${video.description}</p>
  `;

  card.addEventListener("click", () => {
    updateFeaturedVideo(index);
    document
      .getElementById("showcase")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  return card;
}

// ===============================
// GRID RENDER
// ===============================
function renderVideoGrid() {
  videoGrid.innerHTML = "";
  videos.forEach((video, index) => {
    videoGrid.appendChild(buildVideoCard(video, index));
  });
}

// ===============================
// NAV CONTROLS
// ===============================
nextButton.addEventListener("click", () => {
  updateFeaturedVideo((currentIndex + 1) % videos.length);
});

prevButton.addEventListener("click", () => {
  updateFeaturedVideo((currentIndex - 1 + videos.length) % videos.length);
});

// ===============================
// INIT
// ===============================
if (videos.length > 0) {
  updateFeaturedVideo(0);
  renderVideoGrid();
} else {
  // Fallback: channel playlist (safe mode)
  featuredIframe.src =
    "https://www.youtube.com/embed/videoseries?list=UU_TMvideo1701&start=4";
}

const openLightbox = (src, alt) => {
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = src;
  lightboxImage.alt = alt;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
};

if (lightbox) {
  document.querySelectorAll("[data-lightbox]").forEach((card) => {
    card.addEventListener("click", () => {
      const src = card.getAttribute("data-lightbox");
      const img = card.querySelector("img");
      if (src && img) {
        openLightbox(src, img.alt);
      }
    });
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target.matches("[data-lightbox-close]")) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

const projectorAudio = document.getElementById("projector-audio");
if (projectorAudio) {
  const playOnce = () => {
    projectorAudio.play().catch(() => {});
    window.removeEventListener("pointerdown", playOnce);
  };
  window.addEventListener("pointerdown", playOnce, { once: true });
}
/**
 * Services "document lightbox"
 * Opens a full-screen overlay using the HTML `hidden` attribute.
 */
(() => {
  const box = document.querySelector("[data-docbox]");
  const closeBtn = document.querySelector("[data-docbox-close]");
  const titleEl = document.querySelector("[data-docbox-title]");
  const contentEl = document.querySelector("[data-docbox-content]");

  if (!box || !closeBtn || !titleEl || !contentEl) return;

  let lastActive = null;

  const open = (btn) => {
    lastActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    titleEl.textContent = btn.getAttribute("data-doc-title") || "Document";
    contentEl.innerHTML = btn.getAttribute("data-doc-body") || "";

    box.hidden = false;
    document.documentElement.style.overflow = "hidden";
    closeBtn.focus();
  };

  const close = () => {
    box.hidden = true;
    document.documentElement.style.overflow = "";
    contentEl.innerHTML = "";
    if (lastActive) lastActive.focus();
  };

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    const opener = t.closest("[data-doc-open]");
    if (opener instanceof HTMLElement) open(opener);

    if (t === box) close();
  });

  closeBtn.addEventListener("click", close);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && box.hidden === false) close();
  });
})();
