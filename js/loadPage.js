export function showPageAfterLoad() {
    const mainSection = document.querySelector('main');
    if (mainSection) mainSection.style.display = 'block';

    const noContentMessage = document.querySelector('.no-content-message');
    if (noContentMessage) noContentMessage.style.display = 'none';
}