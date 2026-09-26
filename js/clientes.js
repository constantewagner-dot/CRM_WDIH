var ClientesModule = {
    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */
    init() {
        this.render();
    },

    /* ============================================================
       UTILITÁRIOS
       ============================================================ */
    getClientes() {
        return DB.get('clientes', []);
    },

    getClienteById(id) {
        return this.getClientes().find(c => c.id === id) || null;
    },

    saveClientes(clientes) {
        DB.set('clientes', clientes);
    },

    gerarId() {
        return 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    normalizarTexto(texto) {
        return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    /* ============================================================
       RENDERIZAÇÃO DA LISTA
       ============================================================ */
    render() {
        const tbody = document.getElementById('clientes-list');
        if (!tbody) return;

        const termoBusca = this.normalizarTexto(document.getElementById('clientes-busca')?.value || '');

        let clientes = this.getClientes();

        // Sempre ordena por nome em ordem crescente/alfabética
        clientes = clientes.sort((a, b) => {
            const nomeA = this.normalizarTexto(a.nome);
            const nomeB = this.normalizarTexto(b.nome);
            return nomeA.localeCompare(nomeB);
        });

        // Filtro por nome, e-mail ou telefone
        if (termoBusca) {
            clientes = clientes.filter(c => {
                const nome = this.normalizarTexto(c.nome);
                const email = this.normalizarTexto(c.email);
                const telefone = this.normalizarTexto(c.telefone);
                return nome.includes(termoBusca) ||
                       email.includes(termoBusca) ||
                       telefone.includes(termoBusca);
            });
        }

        if (clientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum cliente encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = clientes.map(c => `
            <tr>
                <td><strong>${AppModule.escapeHtml(c.nome)}</strong></td>
                <td>${AppModule.escapeHtml(c.email || '-')}</td>
                <td>${AppModule.escapeHtml(c.telefone || '-')}</td>
                <td>${AppModule.escapeHtml(c.cpf || '-')}</td>
                <td class="row-actions">
                    <button class="btn btn-sm btn-secondary" onclick="ClientesModule.visualizar('${c.id}')">👁️ Ver</button>
                    <button class="btn btn-sm btn-secondary" onclick="ClientesModule.editar('${c.id}')">✏️ Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="ClientesModule.excluir('${c.id}')">🗑️ Excluir</button>
                </td>
            </tr>
        `).join('');
    },

    /* ============================================================
       MODAL DE CLIENTE
       ============================================================ */
    abrirModal(titulo, htmlBody, htmlFooter) {
        document.getElementById('modal-title').textContent = titulo;
        document.getElementById('modal-body').innerHTML = htmlBody;
        document.getElementById('modal-footer').innerHTML = htmlFooter;
        document.getElementById('modal').classList.add('open');
    },

    novoCliente() {
        this.abrirModal(
            'Novo Cliente',
            this.formCliente(),
            `<button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
             <button class="btn btn-primary" onclick="ClientesModule.salvar()">Salvar Cliente</button>`
        );
    },

    editar(id) {
        const cliente = this.getClienteById(id);
        if (!cliente) return;

        this.abrirModal(
            'Editar Cliente',
            this.formCliente(cliente),
            `<button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
             <button class="btn btn-primary" onclick="ClientesModule.salvar('${id}')">Salvar Alterações</button>`
        );
    },

    visualizar(id) {
        const cliente = this.getClienteById(id);
        if (!cliente) return;

        // Conta negócios e vendas vinculados
        const negocios = (DB.get('negocios', []) || []).filter(n => n.clienteId === id);
        const vendas = (DB.get('vendas', []) || []).filter(v => v.clienteId === id);
        const viagens = (DB.get('viagens', []) || []).filter(v => v.clienteId === id);

        const totalVendas = vendas.reduce((sum, v) => sum + (parseFloat(v.valor) || 0), 0);

        this.abrirModal(
            cliente.nome,
            `
                <div class="form-grid">
                    <div class="form-group"><label>E-mail</label><p>${AppModule.escapeHtml(cliente.email || '-')}</p></div>
                    <div class="form-group"><label>Telefone</label><p>${AppModule.escapeHtml(cliente.telefone || '-')}</p></div>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label>CPF</label><p>${AppModule.escapeHtml(cliente.cpf || '-')}</p></div>
                    <div class="form-group"><label>Aniversário</label><p>${cliente.aniversario ? AppModule.formatDate(cliente.aniversario) : '-'}</p></div>
                </div>
                <div class="form-group"><label>Endereço</label><p>${AppModule.escapeHtml(cliente.endereco || '-')}</p></div>
                <div class="form-group"><label>Observações</label><p>${AppModule.escapeHtml(cliente.observacoes || '-')}</p></div>
                <div class="grid-2 mt-2">
                    <div class="kpi-card">
                        <label>Negócios</label>
                        <span>${negocios.length}</span>
                    </div>
                    <div class="kpi-card">
                        <label>Total em Vendas</label>
                        <span class="text-success">${AppModule.formatCurrency(totalVendas)}</span>
                    </div>
                </div>
                ${viagens.length > 0 ? `
                    <div class="mt-2">
                        <h4>Viagens</h4>
                        <div class="table-wrap">
                            <table class="table">
                                <thead><tr><th>Destino</th><th>Ida</th><th>Volta</th><th>Status</th></tr></thead>
                                <tbody>
                                    ${viagens.map(v => `
                                        <tr>
                                            <td>${AppModule.escapeHtml(v.destino || '-')}</td>
                                            <td>${v.dataIda ? AppModule.formatDate(v.dataIda) : '-'}</td>
                                            <td>${v.dataVolta ? AppModule.formatDate(v.dataVolta) : '-'}</td>
                                            <td><span class="badge badge-info">${AppModule.escapeHtml(v.status || 'Agendada')}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
            `,
            `<button class="btn btn-secondary" onclick="AppModule.closeModal()">Fechar</button>
             <button class="btn btn-primary" onclick="ClientesModule.editar('${id}')">Editar</button>`
        );
    },

    formCliente(cliente) {
        const c = cliente || {};
        return `
            <div class="form-grid">
                <div class="form-group">
                    <label>Nome completo *</label>
                    <input type="text" id="cli-nome" class="form-control" value="${AppModule.escapeHtml(c.nome || '')}" required>
                </div>
                <div class="form-group">
                    <label>E-mail</label>
                    <input type="email" id="cli-email" class="form-control" value="${AppModule.escapeHtml(c.email || '')}">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="text" id="cli-telefone" class="form-control" value="${AppModule.escapeHtml(c.telefone || '')}">
                </div>
                <div class="form-group">
                    <label>CPF</label>
                    <input type="text" id="cli-cpf" class="form-control" value="${AppModule.escapeHtml(c.cpf || '')}">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Aniversário</label>
                    <input type="date" id="cli-aniversario" class="form-control" value="${c.aniversario || ''}">
                </div>
                <div class="form-group">
                    <label>Endereço</label>
                    <input type="text" id="cli-endereco" class="form-control" value="${AppModule.escapeHtml(c.endereco || '')}">
                </div>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="cli-observacoes" class="form-control">${AppModule.escapeHtml(c.observacoes || '')}</textarea>
            </div>
        `;
    },

    /* ============================================================
       CRUD
       ============================================================ */
    salvar(id) {
        const nome = document.getElementById('cli-nome').value.trim();
        if (!nome) {
            AppModule.toast('Informe o nome do cliente.');
            return;
        }

        const clientes = this.getClientes();
        const agora = new Date().toISOString();

        const dados = {
            nome,
            email: document.getElementById('cli-email').value.trim(),
            telefone: document.getElementById('cli-telefone').value.trim(),
            cpf: document.getElementById('cli-cpf').value.trim(),
            aniversario: document.getElementById('cli-aniversario').value,
            endereco: document.getElementById('cli-endereco').value.trim(),
            observacoes: document.getElementById('cli-observacoes').value.trim()
        };

        if (id) {
            const index = clientes.findIndex(c => c.id === id);
            if (index === -1) {
                AppModule.toast('Cliente não encontrado.');
                return;
            }
            clientes[index] = { ...clientes[index], ...dados, atualizadoEm: agora };
            AppModule.toast('Cliente atualizado!');
        } else {
            const novo = {
                id: this.gerarId(),
                ...dados,
                criadoEm: agora,
                atualizadoEm: agora
            };
            clientes.push(novo);
            AppModule.toast('Cliente cadastrado!');
        }

        this.saveClientes(clientes);
        AppModule.closeModal();
        this.render();
    },

    excluir(id) {
        const cliente = this.getClienteById(id);
        if (!cliente) return;

        // Verifica vínculos
        const negocios = DB.get('negocios', []).filter(n => n.clienteId === id);
        const vendas = DB.get('vendas', []).filter(v => v.clienteId === id);
        const viagens = DB.get('viagens', []).filter(v => v.clienteId === id);

        let msg = `Deseja excluir o cliente "${cliente.nome}"?`;
        if (negocios.length || vendas.length || viagens.length) {
            msg += `\n\nAtenção: existem ${negocios.length} negócio(s), ${vendas.length} venda(s) e ${viagens.length} viagem(ns) vinculados.`;
        }

        if (!confirm(msg)) return;

        let clientes = this.getClientes();
        clientes = clientes.filter(c => c.id !== id);
        this.saveClientes(clientes);

        // Opcional: remove vínculos para evitar dados órfãos
        DB.set('negocios', DB.get('negocios', []).filter(n => n.clienteId !== id));
        DB.set('vendas', DB.get('vendas', []).filter(v => v.clienteId !== id));
        DB.set('viagens', DB.get('viagens', []).filter(v => v.clienteId !== id));

        AppModule.toast('Cliente excluído!');
        this.render();
    }
};

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ClientesModule.init());
} else {
    ClientesModule.init();
}
