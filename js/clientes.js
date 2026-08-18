/* ============================================================
   clientes.js — Módulo de Clientes
   ============================================================ */

const ClientesModule = {
    init() {
        this.render();
    },

    render() {
        const list = document.getElementById('clientes-list');
        if (!list) return;

        const clientes = DB.getClientes();
        list.innerHTML = clientes.length
            ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Documento</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientes.map(c => `
                        <tr>
                            <td>${c.nome || '—'}</td>
                            <td>${c.email || '—'}</td>
                            <td>${c.telefone || '—'}</td>
                            <td>${c.documento || '—'}</td>
                            <td>
                                <button class="btn-icon" onclick="ClientesModule.editarCliente('${c.id}')">✏️</button>
                                <button class="btn-icon" onclick="ClientesModule.excluirCliente('${c.id}')">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`
            : '<p style="color:var(--gray-500);">Nenhum cliente cadastrado</p>';
    },

    novoCliente() {
        const body = `
            <div class="form-group">
                <label>Nome</label>
                <input type="text" id="cli-nome" class="form-control">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="cli-email" class="form-control">
            </div>
            <div class="form-group">
                <label>Telefone</label>
                <input type="text" id="cli-telefone" class="form-control">
            </div>
            <div class="form-group">
                <label>Documento</label>
                <input type="text" id="cli-documento" class="form-control">
            </div>
        `;

        AppModule.openModal('Novo Cliente', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ClientesModule.salvarCliente()">Salvar</button>
        `);
    },

    salvarCliente() {
        const cliente = {
            id: AppModule.generateId(),
            nome: document.getElementById('cli-nome').value,
            email: document.getElementById('cli-email').value,
            telefone: document.getElementById('cli-telefone').value,
            documento: document.getElementById('cli-documento').value
        };

        DB.saveCliente(cliente);
        AppModule.closeModal();
        AppModule.showToast('Cliente cadastrado!', 'success');
        this.render();
    },

    editarCliente(id) {
        const clientes = DB.getClientes();
        const c = clientes.find(x => x.id === id);
        if (!c) return;

        const body = `
            <div class="form-group">
                <label>Nome</label>
                <input type="text" id="cli-nome" class="form-control" value="${c.nome || ''}">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="cli-email" class="form-control" value="${c.email || ''}">
            </div>
            <div class="form-group">
                <label>Telefone</label>
                <input type="text" id="cli-telefone" class="form-control" value="${c.telefone || ''}">
            </div>
            <div class="form-group">
                <label>Documento</label>
                <input type="text" id="cli-documento" class="form-control" value="${c.documento || ''}">
            </div>
        `;

        AppModule.openModal('Editar Cliente', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ClientesModule.atualizarCliente('${id}')">Atualizar</button>
        `);
    },

    atualizarCliente(id) {
        const clientes = DB.getClientes();
        const c = clientes.find(x => x.id === id);
        if (!c) return;

        c.nome = document.getElementById('cli-nome').value;
        c.email = document.getElementById('cli-email').value;
        c.telefone = document.getElementById('cli-telefone').value;
        c.documento = document.getElementById('cli-documento').value;

        DB.saveCliente(c);
        AppModule.closeModal();
        AppModule.showToast('Cliente atualizado!', 'success');
        this.render();
    },

    excluirCliente(id) {
        if (!confirm('Excluir este cliente?')) return;
        DB.deleteCliente(id);
        AppModule.showToast('Cliente excluído.', 'danger');
        this.render();
    }
};
