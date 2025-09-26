function toggleAnswer(id) {
    const faqItem = document.getElementById(`answer${id}`).parentElement;
    faqItem.classList.toggle("open");
}

function closeAnswer(event, id) {
    event.stopPropagation(); // Prevents triggering the toggleAnswer
    const faqItem = document.getElementById(`answer${id}`).parentElement;
    faqItem.classList.remove("open");
}
