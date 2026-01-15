// ===============================
// VIDEO DATA (manual curation)
// ===============================
const videos = [
   {
    title: "Skydiver breaking records...",
    description: "A fun day in the field as a news photographer turned into a front-row seat for history. We covered a skydiver pushing endurance to the limit—breaking the world record for the most jumps out of an airplane in 24 hours. Fast-paced, high-altitude, and packed with real-time moments as the record was set..",
    youtubeId: "ybzYvrkGdDw",
  },
  {
    title: "Day One Learning Journey",
    description: "Sullivan University’s National Center for Hospitality Studies (NCHS) took learning beyond the classroom with an immersive experience aboard Royal Caribbean’s Oasis of the Seas in the Bahamas. We followed the students throughout their journey—capturing hands-on training, behind-the-scenes moments, and the real-world lessons that shape tomorrow’s hospitality professionals.",
    youtubeId: "YherfuEabG4",
  },

  {
    title: "Hickory Point Web Banner",
    description: "To showcase Hickory Point’s Waterfront Park, we designed a web banner that captures the waterfront vibe and turns it into a polished, click-worthy visual—clean branding, clear messaging, and optimized for fast-loading web placements.",
    youtubeId: "VDESxbsOuDY",
  },
  {
    title: "The Sweetest Place on Earth turns 134",
    description: "For Schimpff’s Confectionery’s 134th birthday, we captured the heart of a Jeffersonville icon—old-school craftsmanship, family tradition, and a community landmark still serving up joy more than a century later..",
    youtubeId: "O38CxoRAQmw",
  },
  {
    title: "Digital Signage",
    description: "Digital signage package designed for high-visibility screens—clean layouts, bold typography, and motion-ready messaging built to read fast from a distance. Optimized for multiple aspect ratios and placements, with consistent branding across slides for a polished, professional loop.",
    youtubeId: "rsgKjv4lwaE",
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
document.getElementById("videos")?.scrollIntoView({ behavior: "smooth", block: "start" });

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
