// js/notifications.js

/**
 * Displays a custom notification message.
 * @param {string} message - The message to display.
 * @param {'success' | 'error'} type - The type of notification (e.g., 'success', 'error').
 * @param {number} [duration=3000] - How long the notification should be visible in milliseconds.
 */
export function showNotification(message, type, duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('Notification container not found. Please add <div id="notification-container"> to your HTML.');
        // Fallback to native alert if container is missing
        alert(message);
        return;
    }

    const notification = document.createElement('div');
    notification.classList.add('notification', type);

    // Add icon based on type using Font Awesome
    let iconClass = '';
    if (type === 'success') {
        iconClass = 'fas fa-check-circle';
    } else if (type === 'error') {
        iconClass = 'fas fa-times-circle';
    }

    notification.innerHTML = `
        <span class="icon"><i class="${iconClass}"></i></span>
        <span class="message">${message}</span>
        <button class="close-btn">&times;</button>
    `;

    // Add close button functionality
    const closeBtn = notification.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });

    container.appendChild(notification);

    // Automatically hide after duration
    setTimeout(() => {
        hideNotification(notification);
    }, duration);
}

/**
 * Hides a specific notification element with an animation.
 * @param {HTMLElement} notificationElement - The notification DOM element to hide.
 */
function hideNotification(notificationElement) {
    notificationElement.style.animation = 'fadeOutSlideUp 0.4s ease-in forwards'; // Apply fade-out animation
    notificationElement.addEventListener('animationend', () => {
        notificationElement.remove(); // Remove from DOM after animation
    }, { once: true });
}