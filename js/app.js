/* ============================================================
   app.js — Módulo principal
   ============================================================ */

// Função global de formatação de moeda
function formatCurrency(value) {
    return 'R$ ' + (Number(value) || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

const AppModule = {
    init() {
        this.setupNavigation();
        this.setupSidebar();
        this.setupModal();
        this.updateDashboard();
    },

    formatCurrency(value) {
        return 'R$ ' + (Number(value) || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.page);
            });
        });
    },

    navigateTo(page) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`[data-page="${page}"]`);
        if (navItem) navItem.classList.add('active');

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pageEl = document.getElementById(`page-${page}`);
        if (pageEl) pageEl.classList.add('active');

        const titles = {
            dashboard: 'Dashboard',
            pipeline: 'Pipeline',
            vendas: 'Vendas',
            checkin: 'Check-in',
            milhas: 'Milhas',
            comissoes: 'Comissões',
            clientes: 'Clientes',
            config: 'Configurações'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = titles[page] || page;

        try {
            if (page === 'dashboard') this.updateDashboard();
            if (page === 'pipeline') PipelineModule.render();
            if (page === 'vendas') VendasModule.render();
            if (page === 'checkin') CheckinModule.render();
            if (page === 'milhas') MilhasModule.render();
            if (page === 'comissoes') ComissoesModule.render();
            if (page === 'clientes') ClientesModule.render();
        } catch (e) {
            console.error(`Erro ao renderizar ${page}:`, e);
        }
    },

    setupSidebar() {
        const btn = document.getElementById('btn-toggle-sidebar');
        if (btn) {
            btn.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.toggle('collapsed');
            });
        }
    },

    setupModal() {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });
    },

    updateDashboard() {
        const negocios = DB.getNegocios();
        const vendas = DB.getVendas();
        const checkins = DB.getCheckins();
        const milhas = DB.getMilhas();

        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setText('stat-negocios', negocios.length);

        const totalVendas = vendas.reduce((sum, v) => sum + (v.valor || 0), 0);
        setText('stat-vendas', this.formatCurrency(totalVendas));

        setText('stat-checkins', checkins.length);

        const totalMilhas = milhas.reduce((sum, m) => sum + (m.quantidade || 0), 0);
        setText('stat-milhas', totalMilhas.toLocaleString('pt-BR'));

        const el = document.getElementById('dashboard-negocios');
        if (el) {
            const ultimos = negocios.slice(-5).reverse();
            el.innerHTML = ultimos.length
                ? ultimos.map(n => `
                    <div style="padding:8px 0;border-bottom:1px solid var(--gray-100);">
                        <strong>${n.cliente || 'Sem nome'}</strong> — ${n.stage || 'Sem etapa'}
                        <br><small style="color:var(--gray-500);">${n.servico || ''}</small>
                    </div>
                `).join('')
                : '<p style="color:var(--gray-500);">Nenhum negócio cadastrado</p>';
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    openModal(title, bodyHTML, footerHTML = '') {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;
        const t = document.getElementById('modal-title');
        const b = document.getElementById('modal-body');
        const f = document.getElementById('modal-footer');
        if (t) t.textContent = title;
        if (b) b.innerHTML = bodyHTML;
        if (f) f.innerHTML = footerHTML;
        overlay.classList.add('active');
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};
