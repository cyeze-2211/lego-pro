import Swal from "sweetalert2";

(function addGlobalStyles() {
    if (!document.getElementById('swal-global-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'swal-global-styles';
        styleElement.textContent = `
            .swal2-container {
                z-index: 99999 !important;
            }
            
            .swal2-popup {
                z-index: 99999 !important;
            }
            
            .swal2-backdrop-show {
                z-index: 99998 !important;
            }
        `;
        document.head.appendChild(styleElement);
    }
})();
export const Alert = (message, iconType) => {
    Swal.fire({
        title: message,
        icon: iconType,
        position: "top-end",
        timer: 3000,
        timerProgressBar: true,
        showCloseButton: true,
        toast: true,
        showConfirmButton: false,
    });
};

export const commonAlert = (message, iconType) => {
    Swal.fire({
        title: message,
        icon: iconType,
        draggable: true,
    });
};