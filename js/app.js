const AppModule = {
    currentPage: 'dashboard',

    init() {
        this.openPage('dashboard');
        this.startClock();
        this.expandGroupForPage('dashboard');
    },

    openPage(page) {
        this.currentPage = page;

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        const target = document.getElementById('page-' + page);
        if (target) target.classList.add('active');

        const nav = document.querySelector('.nav-item[data-page="' + page + '"]');
        if (nav) nav.classList.add('active');

        this.expandGroupForPage(page);
        this.refreshPage(page);

        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    },

    refreshPage(page) {
        if (page === 'dashboard') DashboardModule.render();
        if (page === 'clientes') ClientesModule.render();
        if (page === 'pipeline') PipelineModule.render();
        if (page === 'vendas') VendasModule.render();
        if (page === 'viagens') ViagensModule.render();
        if (page === 'financeiro') FinanceiroModule.render();
        if (page === 'milhas') MilhasModule.render();
        if (page === 'config') ConfigModule.render();
    },

    toggleGroup(id, btn) {
        const group = document.getElementById(id);
        const isOpen = group.classList.contains('open');
        group.classList.toggle('open', !isOpen);
        btn.classList.toggle('expanded', !isOpen);
    },

    expandGroupForPage(page) {
        const groups = {
            'clientes': 'menu-cadastros',
            'pipeline': 'menu-cadastros',
            'vendas': 'menu-cadastros',
            'viagens': 'menu-cadastros',
            'financeiro': 'menu-financeiro',
            'relatorios': 'menu-financeiro',
            'milhas': 'menu-milhas',
            'tarefas': 'menu-ferramentas',
            'calendario': 'menu-ferramentas',
            'config': 'menu-ferramentas',
            'backup': 'menu-ferramentas'
        };

        const groupId = groups[page];
        if (groupId) {
            const group = document.getElementById(groupId);
            const btn = document.querySelector('button[onclick*="' + groupId + '"]');
            if (group && btn) {
                group.classList.add('open');
                btn.classList.add('expanded');
            }
        }
    },

    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
    },

    openModal(title, bodyHtml, footerHtml = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        document.getElementById('modal-footer').innerHTML = footerHtml;
        document.getElementById('modal').classList.add('open');
    },

    closeModal() {
        document.getElementById('modal').classList.remove('open');
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    },

    formatDate(date) {
        if (!date) return '-';
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('pt-BR');
    },

    formatDateTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleString('pt-BR');
    },

    toast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    addAtividade(descricao) {
        const atividades = DB.get('atividades', []);
        atividades.unshift({
            id: this.generateId(),
            descricao,
            data: new Date().toISOString()
        });
        DB.set('atividades', atividades.slice(0, 50));
    },

    startClock() {
        const update = () => {
            const el = document.getElementById('dashboard-data-hora');
            if (el) {
                el.textContent = new Date().toLocaleString('pt-BR');
            }
        };
        update();
        setInterval(update, 1000);
    },

    escapeHtml(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AppModule.init();
});
