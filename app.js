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
  // "KR-12": { mac: "assets/kr-12-mac.zip", win: "assets/kr-12-win.zip" },
};

document.querySelectorAll("[data-download]").forEach(link => {
  link.addEventListener("click", event => {
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
