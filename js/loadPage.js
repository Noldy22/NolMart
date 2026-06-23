import { scrollToTop } from "./scrollToTop.js";

const mainSection = document.querySelector('main');
const noContentMessage = document.querySelector('.no-content-message');

export function showPageAfterLoad() {
    scrollToTop();

    if (mainSection) mainSection.style.display = 'block';
    if (noContentMessage) noContentMessage.style.display = 'none';
}

export function hidePageDuringLoad() {
    scrollToTop();

    if (mainSection) mainSection.style.display = 'none';
    if (noContentMessage) noContentMessage.style.display = 'flex';
}