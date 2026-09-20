const VendasModule = {
    render() {
        const vendas = DB.get('vendas', []);
        const container = document.getElementById('vendas-list');
        const resumo = document.getElementById('vendas-resumo');

        const total = vendas.reduce((s, v) => s + (parseFloat(v.valor_total) || 0), 0);
        const comissao = vendas.reduce((s, v) => s + (parseFloat(v.comissao) || 0), 0);

        resumo.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card"><label>Total em Vendas</label><span>${AppModule.formatCurrency(total)}</span></div>
                <div class="kpi-card"><label>Total em Comissões</label><span>${AppModule.formatCurrency(comissao)}</span></div>
                <div class="kpi-card"><label>Quantidade</label><span>${vendas.length}</span></div>
            </div>
        `;

        if (!vendas.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma venda registrada.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Valor Total</th><th>Comissão</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                        ${vendas.map(v => `
                            <tr>
                                <td>${AppModule.formatDate(v.data)}</td>
                                <td>${AppModule.escapeHtml(v.cliente_nome)}</td>
                                <td>${AppModule.escapeHtml(v.servico)}</td>
                                <td>${AppModule.formatCurrency(v.valor_total)}</td>
                                <td>${AppModule.formatCurrency(v.comissao)}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="VendasModule.editar('${v.id}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="VendasModule.excluir('${v.id}')">Excluir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    novaVenda() {
        this.abrirFormulario();
    },

    editar(id) {
        const venda = DB.get('vendas', []).find(v => v.id === id);
        if (venda) this.abrirFormulario(venda);
    },

    abrirFormulario(venda = null) {
        const isEdit = !!venda;
        const clientes = DB.get('clientes', []);
        const config = DB.get('config', {});
        const servicos = config.servicos || [];

        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Cliente *</label>
                    <select id="venda-cliente" class="form-control">
                        <option value="">Selecione...</option>
                        ${clientes.map(c => `<option value="${c.id}" ${venda?.cliente_id === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Serviço</label>
                    <select id="venda-servico" class="form-control">
                        ${servicos.map(s => `<option value="${AppModule.escapeHtml(s)}" ${venda?.servico === s ? 'selected' : ''}>${AppModule.escapeHtml(s)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Valor Total *</label><input type="number" id="venda-valor" class="form-control" step="0.01" value="${AppModule.escapeHtml(venda?.valor_total || '')}"></div>
                <div class="form-group"><label>Comissão</label><input type="number" id="venda-comissao" class="form-control" step="0.01" value="${AppModule.escapeHtml(venda?.comissao || '')}"></div>
            </div>
            <div class="form-group"><label>Descrição</label><textarea id="venda-descricao" class="form-control" rows="3">${AppModule.escapeHtml(venda?.descricao || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="VendasModule.salvar('${venda?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Venda' : 'Nova Venda', html, footer);
    },

    salvar(id) {
        const clienteId = document.getElementById('venda-cliente').value;
        const valorTotal = parseFloat(document.getElementById('venda-valor').value) || 0;

        if (!clienteId || !valorTotal) {
            AppModule.toast('Preencha cliente e valor total.');
            return;
        }

        const clientes = DB.get('clientes', []);
        const cliente = clientes.find(c => c.id === clienteId);
        const vendas = DB.get('vendas', []);
        const index = vendas.findIndex(v => v.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            cliente_id: clienteId,
            cliente_nome: cliente ? cliente.nome : '',
            servico: document.getElementById('venda-servico').value,
            valor_total: valorTotal,
            comissao: parseFloat(document.getElementById('venda-comissao').value) || 0,
            descricao: document.getElementById('venda-descricao').value.trim(),
            data: new Date().toISOString()
        };

        if (index >= 0) {
            vendas[index] = { ...vendas[index], ...dados };
            AppModule.addAtividade(`Venda de ${cliente?.nome} atualizada.`);
        } else {
            vendas.push(dados);
            AppModule.addAtividade(`Venda de ${cliente?.nome} registrada.`);
        }

        DB.set('vendas', vendas);
        AppModule.closeModal();
        AppModule.toast('Venda salva com sucesso!');
        this.render();
    },

    excluir(id) {
        if (!confirm('Deseja excluir esta venda?')) return;
        const vendas = DB.get('vendas', []).filter(v => v.id !== id);
        DB.set('vendas', vendas);
        AppModule.addAtividade('Venda excluída.');
        AppModule.toast('Venda excluída.');
        this.render();
    }
};
