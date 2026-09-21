var AppModule = {
    currentPage: 'dashboard',

    init() {
        DB.init();
        this.openPage('dashboard');
        this.startClock();
        this.updateBadgeTarefas();
    },

    openPage(page) {
        this.currentPage = page;

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pageEl = document.getElementById(`page-${page}`);
        if (pageEl) pageEl.classList.add('active');

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navItem) navItem.classList.add('active');

        const titles = {
            dashboard: 'Dashboard',
            clientes: 'Clientes',
            pipeline: 'Pipeline',
            vendas: 'Vendas',
            viagens: 'Viagens',
            financeiro: 'Financeiro',
            milhas: 'Milhas',
            tarefas: 'Tarefas',
            calendario: 'Calendário',
            relatorios: 'Relatórios',
            config: 'Configurações',
            backup: 'Backup'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = titles[page] || page;

        switch (page) {
            case 'dashboard': DashboardModule.render(); break;
            case 'clientes': ClientesModule.render(); break;
            case 'pipeline': PipelineModule.render(); break;
            case 'vendas': VendasModule.render(); break;
            case 'viagens': ViagensModule.render(); break;
            case 'financeiro': FinanceiroModule.render(); break;
            case 'milhas': MilhasModule.render(); break;
            case 'tarefas': TarefasModule.render(); break;
            case 'calendario': CalendarioModule.render(); break;
            case 'relatorios': RelatoriosModule.render(); break;
            case 'config': ConfigModule.render(); break;
            case 'backup': BackupModule.render(); break;
        }
    },

    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('collapsed');
    },

    toggleGroup(groupId, header) {
        const group = header.parentElement;
        group.classList.toggle('open');
    },

    startClock() {
        setInterval(() => {
            if (this.currentPage === 'dashboard') {
                DashboardModule.updateDateTime();
            }
        }, 60000);
    },

    updateBadgeTarefas() {
        const tarefas = DB.get('tarefas', []);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const atrasadas = tarefas.filter(t => {
            if (t.status === 'concluida') return false;
            if (!t.prazo) return false;
            const prazo = new Date(t.prazo);
            prazo.setHours(0, 0, 0, 0);
            return prazo < hoje;
        });

        const badge = document.getElementById('badge-tarefas');
        if (badge) {
            if (atrasadas.length > 0) {
                badge.textContent = atrasadas.length;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }

        setTimeout(() => this.updateBadgeTarefas(), 300000);
    },

    // ===== MODAL =====
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

    // ===== TOAST =====
    toast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    // ===== UTILITÁRIOS =====
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    },

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('pt-BR');
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleString('pt-BR');
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    addAtividade(descricao, tipo = 'geral') {
        const atividades = DB.get('atividades', []);
        atividades.push({
            id: this.generateId(),
            descricao,
            tipo,
            data: new Date().toISOString()
        });
        DB.set('atividades', atividades);
    },

    // ===== COMISSÕES =====
    calcularComissaoVenda(venda) {
        const config = DB.get('config', {});
        const comissaoPadrao = parseFloat(config.agencia?.comissao) || 10;
        const valor = parseFloat(venda.valorVenda) || 0;
        const percentual = parseFloat(venda.comissaoPercentual) || comissaoPadrao;
        return valor * (percentual / 100);
    },

    calcularComissaoTotal() {
        const vendas = DB.get('vendas', []);
        return vendas.reduce((s, v) => s + this.calcularComissaoVenda(v), 0);
    },

    obterResumoComissoes() {
        const config = DB.get('config', {});
        const comissaoPadrao = parseFloat(config.agencia?.comissao) || 10;
        const vendas = DB.get('vendas', []);

        const porVenda = vendas.map(v => ({
            ...v,
            comissao: this.calcularComissaoVenda(v)
        }));

        const total = porVenda.reduce((s, v) => s + v.comissao, 0);
        const numVendas = vendas.length;

        return { porVenda, total, numVendas, comissaoPadrao };
    }
};

document.addEventListener('DOMContentLoaded', () => AppModule.init());
