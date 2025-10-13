// toastHelper.js - attaches a simple Bootstrap toast helper to window
(function () {
    function ensureContainer() {
        let container = document.getElementById('globalToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'globalToastContainer';
            container.style.position = 'fixed';
            container.style.top = '1rem';
            container.style.right = '1rem';
            container.style.zIndex = 1080;
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(message, type = 'info', timeout = 4000) {
        const container = ensureContainer();
        const toastId = 'toast-' + Date.now();
        const bgClass = (type === 'success') ? 'bg-success text-white' : (type === 'danger') ? 'bg-danger text-white' : (type === 'warning') ? 'bg-warning text-dark' : 'bg-light';

        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center ${bgClass} border-0`;
        toastEl.id = toastId;
        toastEl.role = 'alert';
        toastEl.ariaLive = 'polite';
        toastEl.ariaAtomic = 'true';
        toastEl.style.minWidth = '220px';

        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        container.appendChild(toastEl);
        const bsToast = new bootstrap.Toast(toastEl, { delay: timeout });
        bsToast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            try { toastEl.remove(); } catch (e) { }
        });
    }

    window.showToast = showToast;
})();
