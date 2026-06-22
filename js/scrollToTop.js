export function scrollToTop() {
    const stickyTop = document.querySelector('body');
    stickyTop.scrollIntoView({
        behavior: 'auto',
        block: 'start'
    });
}