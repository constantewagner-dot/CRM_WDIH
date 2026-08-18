/* ============================================================
   app.js — Módulo principal
   ============================================================ */

const AppModule = {
    init() {
        this.setupNavigation();
        this.setupSidebar();
        this.updateDashboard();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    navigateTo(page) {
        // Atualiza nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

        // Atualiza páginas
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`)?.classList.add('active');

        // Atualiza título
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
        document.getElementById('page-title').textContent = titles[page] || page;

        // Atualiza conteúdo
        if (page === 'dashboard') this.updateDashboard();
        if (page === 'pipeline') PipelineModule.render();
        if (page === 'vendas') VendasModule.render();
        if (page === 'checkin') CheckinModule.render();
        if (page === 'milhas') MilhasModule.render();
        if (page === 'comissoes') ComissoesModule.render();
        if (page === 'clientes') ClientesModule.render();
    },

    setupSidebar() {
        document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
    },

    updateDashboard() {
        const negocios = DB.getNegocios();
        const vendas = DB.getVendas();
        const checkins = DB.getCheckins();
        const milhas = DB.getMilhas();

        document.getElementById('stat-negocios').textContent = negocios.length;
        
        const totalVendas = vendas.reduce((sum, v) => sum + (v.valor || 0), 0);
        document.getElementById('stat-vendas').textContent = `R$ ${totalVendas.toLocaleString('pt-BR')}`;
        
        document.getElementById('stat-checkins').textContent = checkins.length;
        
        const totalMilhas = milhas.reduce((sum, m) => sum + (m.quantidade || 0), 0);
        document.getElementById('stat-milhas').textContent = totalMilhas.toLocaleString('pt-BR');

        // Últimos negócios
        const ultimos = negocios.slice(-5).reverse();
        const el = document.getElementById('dashboard-negocios');
        if (el) {
            el.innerHTML = ultimos.length ? ultimos.map(n => `
                <div style="padding:8px 0;border-bottom:1px solid var(--gray-100);">
                    <strong>${n.cliente || 'Sem nome'}</strong> - ${n.stage || 'Sem etapa'}
                    <br><small style="color:var(--gray-500);">${n.servico || ''}</small>
                </div>
            `).join('') : '<p style="color:var(--gray-500);">Nenhum negócio cadastrado</p>';
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    openModal(title, bodyHTML, footerHTML = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-footer').innerHTML = footerHTML;
        document.getElementById('modal-overlay').classList.add('active');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};
