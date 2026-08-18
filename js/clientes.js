/* ============================================================
   clientes.js — Clientes (formato do backup: cpf, status, notas)
   ============================================================ */

const ClientesModule = {
    init() { this.render(); },

    render() {
        const el = document.getElementById('clientes-list');
        if (!el) return;
        const clientes = DB.getClientes();

        el.innerHTML = clientes.length ? `
            <table class="table">
                <thead><tr>
                    <th>Nome</th><th>Telefone</th><th>CPF</th><th>Status</th><th>Notas</th><th>Ações</th>
                </tr></thead>
                <tbody>${clientes.map(c => `
                    <tr>
                        <td><strong>${c.nome || '—'}</strong><br><small style="color:var(--gray-500);">${c.email || ''}</small></td>
                        <td>${c.telefone || '—'}</td>
                        <td>${c.cpf || '—'}</td>
                        <td><span class="badge badge-${(c.status || 'ativo').toLowerCase()}">${c.status || 'Ativo'}</span></td>
                        <td>${c.notas || '—'}</td>
                        <td>
                            <button class="btn-icon" onclick="ClientesModule.editarCliente('${c.id}')">✏️</button>
                            <button class="btn-icon btn-danger" onclick="ClientesModule.excluirCliente('${c.id}')">🗑️</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>` : '<p style="color:var(--gray-500);">Nenhum cliente cadastrado</p>';
    },

    novoCliente() {
        const body = `
            <div class="form-group"><label>Nome</label><input type="text" id="cli-nome" class="form-control"></div>
            <div class="form-grid">
                <div class="form-group"><label>Email</label><input type="email" id="cli-email" class="form-control"></div>
                <div class="form-group"><label>Telefone</label><input type="text" id="cli-telefone" class="form-control"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>CPF</label><input type="text" id="cli-cpf" class="form-control"></div>
                <div class="form-group"><label>Status</label>
                    <select id="cli-status" class="form-control"><option>Ativo</option><option>Inativo</option></select>
                </div>
            </div>
            <div class="form-group"><label>Notas</label><textarea id="cli-notas" class="form-control"></textarea></div>`;

        AppModule.openModal('Novo Cliente', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ClientesModule.salvarCliente()">Salvar</button>`);
    },

    salvarCliente() {
        const c = {
            id: AppModule.generateId('cli'),
            nome: document.getElementById('cli-nome').value,
            email: document.getElementById('cli-email').value,
            telefone: document.getElementById('cli-telefone').value,
            cpf: document.getElementById('cli-cpf').value,
            status: document.getElementById('cli-status').value,
            notas: document.getElementById('cli-notas').value,
            criadoEm: new Date().toISOString()
        };
        DB.saveCliente(c);
        DB.addAtividade('cliente', `Novo cliente: ${c.nome}`);
        AppModule.closeModal();
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Cliente cadastrado!', 'success');
    },

    editarCliente(id) {
        const c = DB.getClientes().find(x => x.id === id);
        if (!c) return;
        const body = `
            <div class="form-group"><label>Nome</label><input type="text" id="cli-nome" class="form-control" value="${c.nome || ''}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Email</label><input type="email" id="cli-email" class="form-control" value="${c.email || ''}"></div>
                <div class="form-group"><label>Telefone</label><input type="text" id="cli-telefone" class="form-control" value="${c.telefone || ''}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>CPF</label><input type="text" id="cli-cpf" class="form-control" value="${c.cpf || ''}"></div>
                <div class="form-group"><label>Status</label>
                    <select id="cli-status" class="form-control">
                        <option ${c.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                        <option ${c.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Notas</label><textarea id="cli-notas" class="form-control">${c.notas || ''}</textarea></div>`;

        AppModule.openModal('Editar Cliente', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ClientesModule.atualizarCliente('${id}')">Atualizar</button>`);
    },

    atualizarCliente(id) {
        const c = DB.getClientes().find(x => x.id === id);
        if (!c) return;
        c.nome = document.getElementById('cli-nome').value;
        c.email = document.getElementById('cli-email').value;
        c.telefone = document.getElementById('cli-telefone').value;
        c.cpf = document.getElementById('cli-cpf').value;
        c.status = document.getElementById('cli-status').value;
        c.notas = document.getElementById('cli-notas').value;
        c.atualizadoEm = new Date().toISOString();
        DB.saveCliente(c);
        AppModule.closeModal();
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Cliente atualizado!', 'success');
    },

    excluirCliente(id) {
        if (!confirm('Excluir este cliente?')) return;
        DB.deleteCliente(id);
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Cliente excluído.', 'danger');
    }
};
