

export function showContainerAfterLoad(container = 'main', mainContainer) {
    const mainSection = container || document.querySelector(container);
    const noContentMessage = document.querySelector(`${mainContainer} .no-container-message`);

    if (mainSection) mainSection.classList.add('active');
    if (noContentMessage) noContentMessage.style.display = 'none';
}

export function hideContainerDuringLoad(container = 'main', mainContainer) {
    const mainSection = container || document.querySelector(container);;
    const noContentMessage = document.querySelector(`${mainContainer} .no-container-message`);

    if (mainSection) mainSection.classList.remove('active');
    if (noContentMessage) noContentMessage.style.display = 'flex';
}