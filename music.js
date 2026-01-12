const musicVideos = [
  {
    title: "Tarpon Springs Featured music by AJH:2025",
    description: "Featuring the Tarpon Springs Area",
    youtube: "pdizDfkGhoi9IFkp",
    thumb: "https://img.youtube.com/vi/pdizDfkGhoi9IFkp/hqdefault.jpg"
  },
  {
    title: "Mamas Table",
    description: "High-energy Greek celebration track.",
    youtube: "N4E0EgTPu00",
    thumb: "https://img.youtube.com/vi/N4E0EgTPu00/hqdefault.jpg"
  },
  {
    title: "Tarpon Springs Anthem",
    description: "A cinematic anthem for the heart of Tarpon Springs.",
    youtube: "3tmd-ClpJxA",
    thumb: "https://img.youtube.com/vi/3tmd-ClpJxA/hqdefault.jpg"
  },
  {
    title: "The Sea Remembers Us",
    description: "Moody coastal storytelling and ambient emotion.",
    youtube: "JGwWNGJdvx8",
    thumb: "https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg"
  },
  {
    title: "Paradise in Tarpon Springs",
    description: "Bright, sunlit celebration of Florida coastal life.",
    youtube: "LgWX2pZQsE",
    thumb: "https://img.youtube.com/vi/LgWX2pZQsE/hqdefault.jpg"
  }
];

let currentMusicIndex = 0;

const iframe = document.getElementById("music-featured-iframe");
const titleEl = document.getElementById("music-featured-title");
const descEl = document.getElementById("music-featured-description");
const grid = document.getElementById("music-video-grid");
const prevBtn = document.getElementById("music-prev");
const nextBtn = document.getElementById("music-next");

function loadMusic(index) {
  const video = musicVideos[index];
  iframe.src = `https://www.youtube.com/embed/${video.youtube}?rel=0&autoplay=1`;
  titleEl.textContent = video.title;
  descEl.textContent = video.description;

  document.querySelectorAll(".video-card").forEach((card, i) => {
    card.classList.toggle("active", i === index);
  });
}

function buildMusicGrid() {
  grid.innerHTML = "";

  musicVideos.forEach((video, index) => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <div class="video-thumb">
        <img src="${video.thumb}" alt="${video.title}">
      </div>
      <h4>${video.title}</h4>
      <p>${video.description}</p>
    `;

    card.addEventListener("click", () => {
      currentMusicIndex = index;
      loadMusic(index);
    });

    grid.appendChild(card);
  });
}

prevBtn.addEventListener("click", () => {
  currentMusicIndex = (currentMusicIndex - 1 + musicVideos.length) % musicVideos.length;
  loadMusic(currentMusicIndex);
});

nextBtn.addEventListener("click", () => {
  currentMusicIndex = (currentMusicIndex + 1) % musicVideos.length;
  loadMusic(currentMusicIndex);
});

// Init
buildMusicGrid();
loadMusic(0);
