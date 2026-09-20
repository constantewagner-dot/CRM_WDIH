var AppModule = {
    pageModules: {
        dashboard: 'DashboardModule',
        clientes: 'ClientesModule',
        pipeline: 'PipelineModule',
        vendas: 'VendasModule',
        viagens: 'ViagensModule',
        financeiro: 'FinanceiroModule',
        relatorios: 'RelatoriosModule',
        milhas: 'MilhasModule',
        tarefas: 'TarefasModule',
        calendario: 'CalendarioModule',
        config: 'ConfigModule',
        backup: 'BackupModule'
    },

    init() {
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000);

        const hash = window.location.hash.replace('#', '');
        const startPage = hash || 'dashboard';
        this.openPage(startPage);
    },

    openPage(page) {
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`page-${page}`);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-item[data-page]').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navItem) {
            navItem.classList.add('active');
            const group = navItem.closest('.nav-group');
            if (group) group.classList.add('open');
        }

        const pageTitles = {
            dashboard: 'Dashboard',
            clientes: 'Clientes',
            pipeline: 'Cotações / Pipeline',
            vendas: 'Vendas',
            viagens: 'Viagens',
            financeiro: 'Transações Financeiras',
            relatorios: 'Relatórios',
            milhas: 'Milhas',
            tarefas: 'Tarefas',
            calendario: 'Calendário',
            config: 'Configurações',
            backup: 'Backup e Restauração'
        };
        document.title = pageTitles[page] ? `CRM WDIH - ${pageTitles[page]}` : 'CRM WDIH';

        // Acesso robusto ao módulo (funciona com var, window ou global)
        const moduleName = this.pageModules[page];
        if (moduleName) {
            const mod = window[moduleName] || (typeof eval !== 'undefined' ? (() => { try { return eval(moduleName); } catch(e) { return null; } })() : null);
            if (mod && typeof mod.render === 'function') {
                try {
                    mod.render();
                } catch (e) {
                    console.error(`Erro ao renderizar ${moduleName}:`, e);
                }
            }
        }

        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.add('collapsed');
        }
    },

    toggleGroup(groupId, btn) {
        const group = document.getElementById(groupId);
        if (!group) return;
        const isOpen = group.classList.contains('open');
        group.classList.toggle('open', !isOpen);
        const arrow = btn.querySelector('.nav-arrow');
        if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('collapsed');
    },

    openModal(title, bodyHtml, footerHtml = '') {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = bodyHtml;
        if (modalFooter) modalFooter.innerHTML = footerHtml;
        if (modal) modal.classList.add('open');
    },

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.classList.remove('open');
    },

    toast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    showToast(message, type = 'success') {
        this.toast(message, type);
    },

    updateDateTime() {
        const el = document.getElementById('dashboard-data-hora');
        if (!el) return;
        const now = new Date();
        const options = {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
        };
        el.textContent = now.toLocaleDateString('pt-BR', options);
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    formatCurrency(value) {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('pt-BR');
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleString('pt-BR');
    },

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    addAtividade(descricao, tipo = 'sistema') {
        const atividades = DB.get('atividades', []);
        atividades.unshift({
            id: this.generateId(),
            tipo,
            descricao,
            data: new Date().toISOString()
        });
        DB.set('atividades', atividades);
    },

    confirmAction(message, onConfirm) {
        if (confirm(message)) onConfirm();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AppModule.init();
});
