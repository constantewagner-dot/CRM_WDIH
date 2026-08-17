/* ============================================================
   clientes.js — Gestão de Clientes
   ============================================================ */

const ClientesModule = {
    init() {
        this.render();
        document.getElementById('btn-novo-cliente').addEventListener('click', () => this.openForm());
        document.getElementById('cliente-search').addEventListener('input', (e) => this.render(e.target.value));
    },

    render(filter) {
        const clientes = DB.getClientes();
        const tbody = document.querySelector('#tabela-clientes tbody');
        if (!tbody) return;

        const filtered = filter
            ? clientes.filter(c => c.nome.toLowerCase().includes(filter.toLowerCase()) || (c.email || '').toLowerCase().includes(filter.toLowerCase()) || (c.telefone || '').includes(filter))
            : clientes;

        if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500);">Nenhum cliente encontrado.</td></tr>`;
            return;
        }

        const negocios = DB.getNegocios();
        tbody.innerHTML = filtered.map(c => {
            const count = negocios.filter(n => n.clienteId === c.id).length;
            const statusClass = c.status === 'Ativo' ? 'success' : c.status === 'Inativo' ? 'danger' : 'info';
            return `
                <tr>
                    <td><strong>${c.nome}</strong></td>
                    <td>${c.email || '-'}</td>
                    <td>${c.telefone || '-'}</td>
                    <td><span class="badge badge-${statusClass}">${c.status || 'Ativo'}</span></td>
                    <td>${count}</td>
                    <td>
                        <button class="btn btn-xs btn-outline" onclick="ClientesModule.openForm('${c.id}')">✏️</button>
                        <button class="btn btn-xs btn-danger" onclick="ClientesModule.remove('${c.id}')">🗑️</button>
                        ${c.telefone ? ('<a href="https://wa.me/55' + c.telefone.replace(/\D/g, '') + '" target="_blank" class="whatsapp-btn" title="WhatsApp">💬</a>') : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    openForm(id) {
        const cliente = id ? DB.getClientes().find(c => c.id === id) : { nome: '', email: '', telefone: '', cpf: '', status: 'Ativo', notas: '' };
        const html = `
            <div class="form-group"><label>Nome Completo *</label><input type="text" id="cli-nome" value="${cliente.nome}" required></div>
            <div class="form-group"><label>E-mail</label><input type="email" id="cli-email" value="${cliente.email || ''}"></div>
            <div class="form-group"><label>Telefone / WhatsApp</label><input type="text" id="cli-telefone" value="${cliente.telefone || ''}" placeholder="(11) 99999-9999"></div>
            <div class="form-group"><label>CPF</label><input type="text" id="cli-cpf" value="${cliente.cpf || ''}"></div>
            <div class="form-group"><label>Status</label><select id="cli-status"><option ${cliente.status === 'Ativo' ? 'selected' : ''}>Ativo</option><option ${cliente.status === 'Inativo' ? 'selected' : ''}>Inativo</option><option ${cliente.status === 'Prospect' ? 'selected' : ''}>Prospect</option></select></div>
            <div class="form-group"><label>Notas / Observações</label><textarea id="cli-notas">${cliente.notas || ''}</textarea></div>
        `;
        AppModule.abrirModal(id ? 'Editar Cliente' : 'Novo Cliente', html, [
            { label: 'Cancelar', class: 'btn-outline', action: () => AppModule.fecharModal() },
            { label: id ? 'Salvar' : 'Criar Cliente', class: 'btn-primary', action: () => this.save(id) }
        ]);
    },

    save(id) {
        const nome = document.getElementById('cli-nome').value.trim();
        if (!nome) { AppModule.showToast('Nome é obrigatório!', 'error'); return; }
        const dados = {
            nome, email: document.getElementById('cli-email').value.trim(),
            telefone: document.getElementById('cli-telefone').value.trim(),
            cpf: document.getElementById('cli-cpf').value.trim(),
            status: document.getElementById('cli-status').value,
            notas: document.getElementById('cli-notas').value.trim()
        };
        const clientes = DB.getClientes();
        if (id) {
            const idx = clientes.findIndex(c => c.id === id);
            if (idx >= 0) { clientes[idx] = { ...clientes[idx], ...dados, atualizadoEm: new Date().toISOString() }; }
            DB.logAtividade('cliente', `Cliente atualizado: ${nome}`);
        } else {
            dados.id = DB.gerarId('cli');
            dados.criadoEm = new Date().toISOString();
            clientes.push(dados);
            DB.logAtividade('cliente', `Novo cliente: ${nome}`);
        }
        DB.setClientes(clientes);
        AppModule.fecharModal();
        this.render();
        AppModule.showToast('Cliente salvo!', 'success');
    },

    remove(id) {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
        DB.setClientes(DB.getClientes().filter(c => c.id !== id));
        this.render();
        AppModule.showToast('Cliente excluído', 'info');
        DB.logAtividade('cliente', 'Cliente excluído');
    }
};
