import { scrollToTop } from "./scrollToTop.js";

const mainSection = document.querySelector('main');
const noContentMessage = document.querySelector('.no-content-message');

export function showPageAfterLoad() {
    if (mainSection) mainSection.style.display = 'block';
    if (noContentMessage) noContentMessage.style.display = 'none';

    scrollToTop();
}

export function hidePageDuringLoad() {
    if (mainSection) mainSection.style.display = 'none';
    if (noContentMessage) noContentMessage.style.display = 'flex';

    scrollToTop();
}