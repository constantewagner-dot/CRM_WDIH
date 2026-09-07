/* ============================================================
   app.js — Módulo Principal (AppModule)
   ============================================================ */

const AppModule = {
    /* ---- Navegação ---- */
    openPage(pagina) {
        document.querySelectorAll('.nav-item').forEach(n =>
            n.classList.toggle('active', n.dataset.pagina === pagina));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const el = document.getElementById('page-' + pagina);
        if (el) el.classList.add('active');

        // Refresh ao abrir
        if (pagina === 'dashboard') DashboardModule.refresh();
        if (pagina === 'milhas') MilhasModule.render();
    },

    updateDashboard() {
        if (typeof DashboardModule !== 'undefined') DashboardModule.refresh();
    },

    /* ---- IDs ---- */
    generateId(prefix) {
        prefix = prefix || '';
        return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    },

    /* ---- Formatação ---- */
    formatCurrency(value) {
        const n = Number(value) || 0;
        return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('pt-BR');
        } catch (e) { return dateStr; }
    },

    /* ---- Modal ---- */
    openModal(title, bodyHTML, footerHTML) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-footer').innerHTML = footerHTML || '';
        document.getElementById('modal-overlay').classList.add('active');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    /* ---- Toast ---- */
    showToast(message, type) {
        type = type || 'info';
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};
