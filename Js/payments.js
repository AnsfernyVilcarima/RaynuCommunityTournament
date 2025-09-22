document.addEventListener("DOMContentLoaded", function () {
  const copyButtons = document.querySelectorAll(".copy-button");
  const copyModal = document.getElementById("copyModal");
  const modalCopiedText = document.getElementById("modalCopiedText");
  const closeModalButton = copyModal.querySelector(".close-button");

  function showModal(text) {
    modalCopiedText.textContent = text;
    copyModal.classList.add("active");
  }

  function hideModal() {
    copyModal.classList.remove("active");
  }

  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.dataset.copy;
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const textToCopy = targetElement.innerText;
        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            console.log("Texto copiado: " + textToCopy);
            showModal(textToCopy);
          })
          .catch((err) => {
            console.error("Error al copiar: ", err);
            alert("Error al copiar el texto.");
          });
      }
    });
  });

  closeModalButton.addEventListener("click", hideModal);
  copyModal.addEventListener("click", function (event) {
    if (event.target === copyModal) {
      hideModal();
    }
  });
});
