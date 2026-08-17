/* ============================================================
   app.js — Núcleo do Sistema (rotas, modal, toast, init)
   ============================================================ */

const AppModule = {
    init() {
        this.setupRouting();
        this.setupModal();
        this.setupBackup();

        if (typeof ConfigModule !== 'undefined') ConfigModule.init();
        if (typeof ClientesModule !== 'undefined') ClientesModule.init();
        if (typeof CRMModule !== 'undefined') CRMModule.init();
        if (typeof ViagensModule !== 'undefined') ViagensModule.init();
        if (typeof VendasModule !== 'undefined') VendasModule.init();
        if (typeof MilhasModule !== 'undefined') MilhasModule.init();
        if (typeof FinanceiroModule !== 'undefined') FinanceiroModule.init();
        if (typeof DashboardModule !== 'undefined') DashboardModule.init();
        if (typeof BackupModule !== 'undefined') BackupModule.init();

        const hash = window.location.hash.substring(1) || 'dashboard';
        this.navigate(hash);
    },

    setupRouting() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                window.location.hash = '#' + section;
                this.navigate(section);
            });
        });
        window.addEventListener('hashchange', () => {
            this.navigate(window.location.hash.substring(1) || 'dashboard');
        });
    },

    navigate(section) {
        const secoes = ['section-dashboard', 'section-pipeline', 'section-clientes', 'section-viagens', 'section-vendas', 'section-milhas', 'section-financeiro', 'section-config'];
        secoes.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        const target = document.getElementById('section-' + section);
        const navLink = document.querySelector(`.nav-link[data-section="${section}"]`);

        if (target) target.classList.add('active');
        if (navLink) navLink.classList.add('active');

        const moduleMap = {
            'dashboard': () => { if (typeof DashboardModule !== 'undefined') DashboardModule.refresh(); },
            'pipeline': () => { if (typeof CRMModule !== 'undefined') CRMModule.refresh(); },
            'clientes': () => { if (typeof ClientesModule !== 'undefined') ClientesModule.render(); },
            'viagens': () => { if (typeof ViagensModule !== 'undefined') ViagensModule.render(); },
            'vendas': () => { if (typeof VendasModule !== 'undefined') VendasModule.refresh(); },
            'milhas': () => { if (typeof MilhasModule !== 'undefined') MilhasModule.refresh(); },
            'financeiro': () => { if (typeof FinanceiroModule !== 'undefined') FinanceiroModule.render(); },
            'config': () => { if (typeof ConfigModule !== 'undefined') ConfigModule.init(); }
        };
        if (moduleMap[section]) moduleMap[section]();
    },

    setupModal() {
        document.getElementById('modal-close').addEventListener('click', () => this.fecharModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.fecharModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.fecharModal();
        });
    },

    abrirModal(titulo, bodyHTML, botoes) {
        document.getElementById('modal-title').textContent = titulo;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        const footer = document.getElementById('modal-footer');
        footer.innerHTML = '';
        if (botoes) {
            botoes.forEach(b => {
                const btn = document.createElement('button');
                btn.className = 'btn ' + (b.class || 'btn-outline');
                btn.textContent = b.label;
                btn.addEventListener('click', b.action);
                footer.appendChild(btn);
            });
        }
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    fecharModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    },

    setupBackup() {
        const btnSidebar = document.getElementById('btn-backup-sidebar');
        if (btnSidebar) btnSidebar.addEventListener('click', () => {
            if (typeof BackupModule !== 'undefined') BackupModule.exportJSON();
        });
    },

    showToast(msg, tipo) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + (tipo || 'info');
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity .3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => AppModule.init());
