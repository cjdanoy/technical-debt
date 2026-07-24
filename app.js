const dialog = document.querySelector("#interest-dialog");
const toast = document.querySelector("#toast");
let selectedProduct = "Technical Debt";

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// Download buttons
// To wire up a real file: set href on the <a> to the actual file path, e.g. "assets/kr-12-mac.zip"
// The data-download attribute holds the product name, data-platform is "mac" or "win"
const downloads = {
  "Say So": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/SaySo/Say.So.zip",
  },
  "Keydence": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/vst/Keydence.vst3",
  },
  "Dank Machine XT": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/drummachinext/Dank.Machine.XT.vst3",
  },
  "HH-44": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/hh-44/HH-44.vst3",
  },
  "KR-12": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/KR-12/KR-12.vst3",
  },
  "SHATTER": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/SHATTER/SHATTER.vst3",
  },
  "PARALLAX": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/PARALLAX/PARALLAX.vst3",
  },
  "CASCADE": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/CASCADE/CASCADE.vst3",
  },
  "ABYSS": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/ABYSS/ABYSS.vst3",
  },
  "QUASAR": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/QUASAR/QUASAR.vst3",
  },
  "Tdbt CleanRoom": {
    win: "https://github.com/cjdanoy/technical-debt/releases/download/Tdbt_CleanRoom/Tdbt.CleanRoom.vst3",
  },
};

document.querySelectorAll("[data-download]").forEach(link => {
  link.addEventListener("click", event => {
    event.stopPropagation();
    event.preventDefault();
    const product = link.dataset.download;
    const platform = link.dataset.platform;
    const files = downloads[product];
    if (files && files[platform]) {
      window.location.href = files[platform];
    } else {
      showToast(`${product} for ${platform === "mac" ? "Mac" : "Windows"} — coming soon.`);
    }
  });
});

// ── Sticky shrinking header ──
const header = document.querySelector("header");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

// ── Scroll fade-in sections ──
const fadeEls = document.querySelectorAll(".fade-in");
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add("visible"), i * 80);
      fadeObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
fadeEls.forEach(el => fadeObserver.observe(el));

// ── Hero typing word cycle ──
const typingEl = document.getElementById("typing-word");
if (typingEl) {
  const words = ["Make the plugin", "Build the tool", "Ship the idea", "Describe the sound"];
  let wordIdx = 0;
  let charIdx = 0;
  let deleting = false;
  const TYPE_SPEED = 60, DELETE_SPEED = 35, PAUSE = 2200;
  function typeStep() {
    const word = words[wordIdx];
    if (!deleting) {
      charIdx++;
      typingEl.textContent = word.slice(0, charIdx);
      if (charIdx === word.length) { deleting = true; setTimeout(typeStep, PAUSE); return; }
    } else {
      charIdx--;
      typingEl.textContent = word.slice(0, charIdx);
      if (charIdx === 0) { deleting = false; wordIdx = (wordIdx + 1) % words.length; }
    }
    setTimeout(typeStep, deleting ? DELETE_SPEED : TYPE_SPEED);
  }
  setTimeout(typeStep, 1200);
}

// ── Card 3D tilt effect ──
document.querySelectorAll(".product").forEach(card => {
  card.addEventListener("mousemove", e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${y * -4}deg) scale(1.01)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

// ── Active nav highlight on scroll ──
const navLinks = document.querySelectorAll("nav a[href^='#']");
const sections = [...navLinks].map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);

function updateActiveNav() {
  const scrollY = window.scrollY + 120;
  let current = sections[0];
  sections.forEach(section => {
    if (section.offsetTop <= scrollY) current = section;
  });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute("href") === "#" + current.id ? "var(--teal)" : "";
  });
}
window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();

document.querySelector(".close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });

document.querySelector("#interest-form").addEventListener("submit", event => {
  event.preventDefault();
  const email = document.querySelector("#interest-email").value.trim();
  localStorage.setItem(`technical-debt-${selectedProduct}`, email);
  dialog.close();
  event.target.reset();
  showToast(`You're following ${selectedProduct}.`);
});

document.querySelector("#signup-form").addEventListener("submit", event => {
  event.preventDefault();
  const email = document.querySelector("#email").value.trim();
  localStorage.setItem("technical-debt-mailing-list", email);
  event.target.reset();
  showToast("You're on the list. Thanks for listening.");
});
