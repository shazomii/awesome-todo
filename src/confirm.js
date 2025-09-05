const confirmModal = document.querySelector('#confirm-modal');
const confirmTitle = document.querySelector('#confirm-modal-title');
const confirmMessage = document.querySelector('#confirm-modal-message');
const confirmButton = document.querySelector('#confirm-modal-confirm');
const cancelButton = document.querySelector('#confirm-modal-cancel');

export function showConfirmDialog(title, message, action = "Delete") {
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmButton.textContent = action;
        confirmModal.style.display = 'block';

        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const handleOutsideClick = (e) => {
            if (e.target === confirmModal) {
                handleCancel();
            }
        };

        const cleanup = () => {
            confirmModal.style.display = 'none';
            confirmButton.removeEventListener('click', handleConfirm);
            cancelButton.removeEventListener('click', handleCancel);
            confirmModal.removeEventListener('click', handleOutsideClick);
        };

        confirmButton.addEventListener('click', handleConfirm);
        cancelButton.addEventListener('click', handleCancel);
        confirmModal.addEventListener('click', handleOutsideClick);
    });
}