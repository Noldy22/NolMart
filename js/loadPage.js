import { scrollToTop } from "./scrollToTop.js";

const mainSection = document.querySelector('main');
const noContentMessage = document.querySelector('.no-content-message');

export function showPageAfterLoad() {
    if (mainSection) mainSection.classList.add('active');
    if (noContentMessage) noContentMessage.style.display = 'none';

    scrollToTop();
}

export function hidePageDuringLoad() {
    if (mainSection) mainSection.classList.remove('active');
    if (noContentMessage) noContentMessage.style.display = 'flex';

    scrollToTop();
}