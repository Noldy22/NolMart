// js/confirm-modal.js

/**
 * Displays a custom confirmation modal and returns a Promise that resolves to true (confirmed) or false (cancelled).
 * @param {string} message - The message to display in the confirmation modal.
 * @returns {Promise<boolean>} A Promise that resolves to true if 'Yes' is clicked, false if 'No' is clicked or modal is dismissed.
 */
export function showConfirmModal(message) {
    return new Promise((resolve) => {
        const modalOverlay = document.getElementById('customConfirmModal');
        const modalMessage = document.getElementById('confirmModalMessage');
        const yesBtn = document.getElementById('confirmModalYesBtn');
        const noBtn = document.getElementById('confirmModalNoBtn');

        if (!modalOverlay || !modalMessage || !yesBtn || !noBtn) {
            console.error("Confirmation modal elements not found. Falling back to native confirm().");
            resolve(confirm(message)); // Fallback to native confirm
            return;
        }

        modalMessage.textContent = message;
        modalOverlay.classList.add('active'); // Show the modal

        const handleYes = () => {
            modalOverlay.classList.remove('active');
            cleanupListeners();
            resolve(true); // User confirmed
        };

        const handleNo = () => {
            modalOverlay.classList.remove('active');
            cleanupListeners();
            resolve(false); // User cancelled
        };

        const handleOverlayClick = (event) => {
            // If clicked directly on the overlay (not the content), treat as cancel
            if (event.target === modalOverlay) {
                handleNo();
            }
        };

        yesBtn.addEventListener('click', handleYes);
        noBtn.addEventListener('click', handleNo);
        modalOverlay.addEventListener('click', handleOverlayClick);

        // Function to remove event listeners to prevent memory leaks and multiple resolutions
        function cleanupListeners() {
            yesBtn.removeEventListener('click', handleYes);
            noBtn.removeEventListener('click', handleNo);
            modalOverlay.removeEventListener('click', handleOverlayClick);
        }
    });
}