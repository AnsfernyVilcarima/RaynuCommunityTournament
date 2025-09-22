document.addEventListener("DOMContentLoaded", () => {
  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach((question) => {
    question.addEventListener("click", () => {
      const answer = question.nextElementSibling;

      const currentCategory = question.closest(".faq-category");
      if (currentCategory) {
        currentCategory
          .querySelectorAll(".faq-question.active")
          .forEach((activeQuestion) => {
            if (activeQuestion !== question) {
              activeQuestion.classList.remove("active");
              activeQuestion.nextElementSibling.style.maxHeight = null;
            }
          });
      }

      question.classList.toggle("active");

      if (answer.style.maxHeight) {
        answer.style.maxHeight = null;
      } else {
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
});
