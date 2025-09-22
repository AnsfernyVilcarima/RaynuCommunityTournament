document.addEventListener("DOMContentLoaded", () => {
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return `hace unos segundos`;
  };

  document.querySelectorAll(".announcement-meta .time-ago").forEach((span) => {
    const dateString = span.dataset.createdAt;
    if (dateString) {
      span.textContent = timeAgo(new Date(dateString));
    }
  });

  const imagePreviewContainer = document.getElementById("uwu-image-preview");
  const expandedImage = document.getElementById("kawaii-img");
  const imageCaption = document.getElementById("baka-caption");
  const closeButton = document.getElementsByClassName("onichan-close")[0];

  const clickableImages = document.querySelectorAll(
    "a[data-preview-group] img"
  );

  const showImagePreview = (img) => {
    imagePreviewContainer.style.display = "block";
    expandedImage.src = img.parentElement.href;
    imageCaption.innerHTML = img.parentElement.dataset.previewTitle || img.alt;

    history.pushState({ imagePreviewOpen: true }, null);
  };

  const hideImagePreview = () => {
    imagePreviewContainer.style.display = "none";
  };

  clickableImages.forEach((img) => {
    img.onclick = function (e) {
      e.preventDefault();
      showImagePreview(this);
    };
  });

  closeButton.onclick = function () {
    hideImagePreview();
    history.back();
  };

  imagePreviewContainer.onclick = function (e) {
    if (e.target === imagePreviewContainer) {
      hideImagePreview();
      history.back();
    }
  };

  window.addEventListener("popstate", (event) => {
    if (!event.state || !event.state.imagePreviewOpen) {
      hideImagePreview();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && imagePreviewContainer.style.display === "block") {
      hideImagePreview();
      history.back();
    }
  });
});
