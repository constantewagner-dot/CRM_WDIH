/* ============================================================
   app.js — Módulo principal
   ============================================================ */

const AppModule = {
    init() {
        this.setupNavigation();
        this.setupSidebar();
        this.setupModal();
        this.updateDashboard();
    },

    formatCurrency(value) {
        return 'R$ ' + (Number(value) || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });
    },

    formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return d.toLocaleDateString('pt-BR');
    },

    generateId(prefix) {
        const base = Date.now().toString(36) + Math.random().toString(36).substr(2, 7);
        return prefix ? prefix + '_' + base : base;
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
        const nav = document.querySelector(`[data-page="${page}"]`);
        if (nav) nav.classList.add('active');

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pg = document.getElementById(`page-${page}`);
        if (pg) pg.classList.add('active');

        const titles = {
            dashboard: 'Dashboard', pipeline: 'Pipeline', vendas: 'Vendas',
            viagens: 'Viagens', checkin: 'Check-in', milhas: 'Milhas',
            comissoes: 'Comissões', clientes: 'Clientes', config: 'Configurações'
        };
        const t = document.getElementById('page-title');
        if (t) t.textContent = titles[page] || page;

        try {
            if (page === 'dashboard') this.updateDashboard();
            if (page === 'pipeline') PipelineModule.render();
            if (page === 'vendas') VendasModule.render();
            if (page === 'viagens') ViagensModule.render();
            if (page === 'checkin') CheckinModule.render();
            if (page === 'milhas') MilhasModule.render();
            if (page === 'comissoes') ComissoesModule.render();
            if (page === 'clientes') ClientesModule.render();
        } catch (e) {
            console.error('Erro ao renderizar ' + page, e);
        }
    },

    setupSidebar() {
        const btn = document.getElementById('btn-toggle-sidebar');
        if (btn) btn.addEventListener('click', () => {
            const sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('collapsed');
        });
    },

    setupModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });
    },

    updateDashboard() {
        const negocios = DB.getNegocios();
        const vendas = DB.getVendas();
        const clientes = DB.getClientes();

        const ativos = negocios.filter(n =>
            n.stage !== 'Fechado (Ganho)' && n.stage !== 'Perdido'
        ).length;

        const totalVendas = vendas.reduce((s, v) => s + (Number(v.valorVenda) || 0), 0);

        const checkinsPendentes = vendas.filter(v =>
            v.necessidadeCheckin === 'sim' && !v.checkinRealizadoEm
        ).length;

        const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        set('stat-negocios', ativos);
        set('stat-vendas', this.formatCurrency(totalVendas));
        set('stat-checkins', checkinsPendentes);
        set('stat-clientes', clientes.length);

        const el = document.getElementById('dashboard-negocios');
        if (el) {
            const ultimos = negocios.slice(-5).reverse();
            el.innerHTML = ultimos.length
                ? ultimos.map(n => `
                    <div style="padding:8px 0;border-bottom:1px solid var(--gray-100);">
                        <strong>${n.titulo || 'Sem título'}</strong> — ${n.stage || '—'}
                        <br><small style="color:var(--gray-500);">${DB.getClienteNome(n.clienteId)} · ${n.servico || ''}</small>
                    </div>`).join('')
                : '<p style="color:var(--gray-500);">Nenhum negócio cadastrado</p>';
        }
    },

    showToast(message, type = 'info') {
        const c = document.getElementById('toast-container');
        if (!c) return;
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = message;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    openModal(title, bodyHTML, footerHTML = '') {
        const o = document.getElementById('modal-overlay');
        if (!o) return;
        const t = document.getElementById('modal-title');
        const b = document.getElementById('modal-body');
        const f = document.getElementById('modal-footer');
        if (t) t.textContent = title;
        if (b) b.innerHTML = bodyHTML;
        if (f) f.innerHTML = footerHTML;
        o.classList.add('active');
    },

    closeModal() {
        const o = document.getElementById('modal-overlay');
        if (o) o.classList.remove('active');
    }
};
