const ClientesModule = {
    render() {
        const clientes = DB.get('clientes', []);
        const container = document.getElementById('clientes-list');

        if (!clientes.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhum cliente cadastrado.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Nascimento</th>
                            <th>CPF</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientes.map(c => `
                            <tr>
                                <td>${AppModule.escapeHtml(c.nome)}</td>
                                <td>${AppModule.escapeHtml(c.email)}</td>
                                <td>${AppModule.escapeHtml(c.telefone)}</td>
                                <td>${AppModule.formatDate(c.nascimento)}</td>
                                <td>${AppModule.escapeHtml(c.cpf)}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="ClientesModule.editar('${c.id}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="ClientesModule.excluir('${c.id}')">Excluir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    novoCliente() {
        this.abrirFormulario();
    },

    editar(id) {
        const cliente = DB.get('clientes', []).find(c => c.id === id);
        if (cliente) this.abrirFormulario(cliente);
    },

    abrirFormulario(cliente = null) {
        const isEdit = !!cliente;
        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Nome *</label><input type="text" id="cli-nome" class="form-control" value="${AppModule.escapeHtml(cliente?.nome || '')}"></div>
                <div class="form-group"><label>Email</label><input type="email" id="cli-email" class="form-control" value="${AppModule.escapeHtml(cliente?.email || '')}"></div>
                <div class="form-group"><label>Telefone</label><input type="text" id="cli-telefone" class="form-control" value="${AppModule.escapeHtml(cliente?.telefone || '')}"></div>
                <div class="form-group"><label>Data de Nascimento</label><input type="date" id="cli-nascimento" class="form-control" value="${AppModule.escapeHtml(cliente?.nascimento || '')}"></div>
                <div class="form-group"><label>CPF</label><input type="text" id="cli-cpf" class="form-control" value="${AppModule.escapeHtml(cliente?.cpf || '')}"></div>
                <div class="form-group"><label>Endereço</label><input type="text" id="cli-endereco" class="form-control" value="${AppModule.escapeHtml(cliente?.endereco || '')}"></div>
            </div>
            <div class="form-group"><label>Observações</label><textarea id="cli-observacoes" class="form-control" rows="3">${AppModule.escapeHtml(cliente?.observacoes || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ClientesModule.salvar('${cliente?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Cliente' : 'Novo Cliente', html, footer);
    },

    salvar(id) {
        const nome = document.getElementById('cli-nome').value.trim();
        if (!nome) {
            AppModule.toast('Preencha o nome do cliente.');
            return;
        }

        const clientes = DB.get('clientes', []);
        const index = clientes.findIndex(c => c.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            nome,
            email: document.getElementById('cli-email').value.trim(),
            telefone: document.getElementById('cli-telefone').value.trim(),
            nascimento: document.getElementById('cli-nascimento').value,
            cpf: document.getElementById('cli-cpf').value.trim(),
            endereco: document.getElementById('cli-endereco').value.trim(),
            observacoes: document.getElementById('cli-observacoes').value.trim(),
            data_cadastro: new Date().toISOString()
        };

        if (index >= 0) {
            clientes[index] = { ...clientes[index], ...dados };
            AppModule.addAtividade(`Cliente ${nome} atualizado.`);
        } else {
            clientes.push(dados);
            AppModule.addAtividade(`Cliente ${nome} cadastrado.`);
        }

        DB.set('clientes', clientes);
        AppModule.closeModal();
        AppModule.toast('Cliente salvo com sucesso!');
        this.render();
    },

    excluir(id) {
        if (!confirm('Deseja realmente excluir este cliente?')) return;
        const clientes = DB.get('clientes', []).filter(c => c.id !== id);
        DB.set('clientes', clientes);
        AppModule.addAtividade('Cliente excluído.');
        AppModule.toast('Cliente excluído.');
        this.render();
    }
};
