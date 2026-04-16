const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");
const closeBtn = document.getElementById("closeBtn");

if (hamburger) {
    hamburger.addEventListener("click", () => {
        navMenu.classList.add("active");
    });
}

closeBtn.addEventListener("click", () => {
    navMenu.classList.remove("active");
});

const texts = [
    "Leader of local dropshipping",
    "Trendsetter of local dropshipping"
];

let index = 0;
let charIndex = 0;
let currentText = "";
let isDeleting = false;
let speed = 100;

function typeEffect() {
    currentText = texts[index];

    if (isDeleting) {
        charIndex--;
    } else {
        charIndex++;
    }

    document.getElementById("typewriter").textContent =
        currentText.substring(0, charIndex);

    if (!isDeleting && charIndex === currentText.length) {
        setTimeout(() => { isDeleting = true; }, 1200);
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        index = (index + 1) % texts.length;
    }

    setTimeout(typeEffect, isDeleting ? speed / 2 : speed);
}

typeEffect();

function openTab(evt, tabName) {
    let i, tabPanel, tabBtn;

    tabPanel = document.getElementsByClassName("tab-panel");
    for (i = 0; i < tabPanel.length; i++) {
        tabPanel[i].classList.remove("active");
    }

    tabBtn = document.getElementsByClassName("tab-btn");
    for (i = 0; i < tabBtn.length; i++) {
        tabBtn[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
    item.querySelector(".faq-question").addEventListener("click", () => {
        item.classList.toggle("active");
    });
});
