// ============================================================
// ⚙️ APP MODULE — CRM WDIH
// Responsável por: navegação entre páginas, modais e toasts
// ============================================================
const AppModule = {

    // ---------- Navegação entre páginas ----------
    abrirPagina(pagina) {
        // Atualiza menu lateral
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.toggle('active', n.dataset.pagina === pagina);
        });

        // Alterna a página visível
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const secao = document.getElementById('page-' + pagina);
        if (secao) secao.classList.add('active');

        // Dispara renderização dos módulos conforme a página
        if (pagina === 'milhas' && typeof MilhasModule !== 'undefined') {
            MilhasModule.render();
        }
    },

    // ---------- Modal ----------
    openModal(titulo, conteudoHtml, rodapeHtml) {
        const root = document.getElementById('modal-root');
        if (!root) return;
        root.innerHTML = `
            <div class="modal-backdrop" onclick="if(event.target===this) AppModule.closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${titulo}</h3>
                        <button class="modal-close" onclick="AppModule.closeModal()">×</button>
                    </div>
                    <div class="modal-body">${conteudoHtml}</div>
                    <div class="modal-footer">${rodapeHtml || ''}</div>
                </div>
            </div>`;
    },

    closeModal() {
        const root = document.getElementById('modal-root');
        if (root) root.innerHTML = '';
    },

    // ---------- Toast ----------
    showToast(mensagem, tipo = 'info') {
        const root = document.getElementById('toast-root');
        if (!root) return;
        const el = document.createElement('div');
        el.className = 'toast ' + tipo;
        el.textContent = mensagem;
        root.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
};
