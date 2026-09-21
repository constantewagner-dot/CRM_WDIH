var VendasModule = {
    render() {
        this.renderResumo();
        this.renderLista();
    },

    renderResumo() {
        const container = document.getElementById('vendas-resumo');
        if (!container) return;

        const vendas = DB.get('vendas', []);
        const total = vendas.reduce((s, v) => s + (parseFloat(v.valorVenda) || 0), 0);
        const totalComissao = AppModule.calcularComissaoTotal();

        const mesAtual = new Date().getMonth();
        const anoAtual = new Date().getFullYear();
        const vendasMes = vendas.filter(v => {
            const d = new Date(v.criadoEm);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        });
        const totalMes = vendasMes.reduce((s, v) => s + (parseFloat(v.valorVenda) || 0), 0);
        const comissaoMes = vendasMes.reduce((s, v) => s + AppModule.calcularComissaoVenda(v), 0);

        container.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <label>Total em Vendas</label>
                    <span style="color:var(--success);">${AppModule.formatCurrency(total)}</span>
                </div>
                <div class="kpi-card">
                    <label>Vendas no Mês</label>
                    <span style="color:var(--success);">${AppModule.formatCurrency(totalMes)}</span>
                </div>
                <div class="kpi-card">
                    <label>Comissões no Mês</label>
                    <span style="color:var(--primary);">${AppModule.formatCurrency(comissaoMes)}</span>
                </div>
                <div class="kpi-card">
                    <label>Comissões Totais</label>
                    <span style="color:var(--primary);">${AppModule.formatCurrency(totalComissao)}</span>
                </div>
            </div>
        `;
    },

    renderLista() {
        const container = document.getElementById('vendas-list');
        if (!container) return;

        const vendas = DB.get('vendas', []);

        if (!vendas.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma venda registrada.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Data</th><th>Cliente</th><th>Serviço</th><th>Destino</th>
                            <th>Valor</th><th>Comissão</th><th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vendas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).map(v => {
                            const comissao = AppModule.calcularComissaoVenda(v);
                            return `
                                <tr>
                                    <td>${AppModule.formatDate(v.dataVenda || v.criadoEm)}</td>
                                    <td>${AppModule.escapeHtml(DB.getClienteNome(v.clienteId))}</td>
                                    <td>${AppModule.escapeHtml(v.servico || '—')}</td>
                                    <td>${AppModule.escapeHtml(v.destino || '—')}</td>
                                    <td style="font-weight:700;color:var(--success);">${AppModule.formatCurrency(v.valorVenda)}</td>
                                    <td>${AppModule.formatCurrency(comissao)} <small>(${v.comissaoPercentual || DB.get('config', {}).agencia?.comissao || 10}%)</small></td>
                                    <td>
                                        <div class="row-actions">
                                            <button class="btn btn-sm btn-secondary" onclick="VendasModule.editarVenda('${v.id}')">Editar</button>
                                            <button class="btn btn-sm btn-danger" onclick="VendasModule.excluir('${v.id}')">Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    novaVenda() {
        this.abrirFormVenda();
    },

    editarVenda(id) {
        const v = DB.get('vendas', []).find(x => x.id === id);
        if (v) this.abrirFormVenda(v);
    },

    abrirFormVenda(venda = null) {
        const isEdit = !!venda;
        const clientes = DB.get('clientes', []);
        const config = DB.get('config', {});
        const servicos = config.servicos || [];
        const comissaoPadrao = parseFloat(config.agencia?.comissao) || 10;

        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Cliente *</label>
                    <select id="venda-cliente" class="form-control">
                        <option value="">— Selecionar —</option>
                        ${clientes.map(c => `<option value="${c.id}" ${venda?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Data da Venda *</label><input type="date" id="venda-data" class="form-control" value="${venda?.dataVenda || new Date().toISOString().slice(0,10)}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Serviço</label>
                    <select id="venda-servico" class="form-control">
                        <option value="">— Selecionar —</option>
                        ${servicos.map(s => `<option value="${AppModule.escapeHtml(s)}" ${venda?.servico === s ? 'selected' : ''}>${AppModule.escapeHtml(s)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Destino</label><input type="text" id="venda-destino" class="form-control" value="${AppModule.escapeHtml(venda?.destino || '')}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Valor da Venda (R$) *</label><input type="number" id="venda-valor" class="form-control" step="0.01" value="${venda?.valorVenda || 0}"></div>
                <div class="form-group"><label>Comissão (%)</label>
                    <input type="number" id="venda-comissao" class="form-control" step="0.1" value="${venda?.comissaoPercentual || comissaoPadrao}">
                    <small style="color:var(--text-muted);">Padrão da agência: ${comissaoPadrao}%</small>
                </div>
            </div>
            <div class="form-group"><label>Observações</label><textarea id="venda-obs" class="form-control" rows="2">${AppModule.escapeHtml(venda?.observacoes || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="VendasModule.salvar('${venda?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Venda' : 'Nova Venda', html, footer);
    },

    salvar(id) {
        const clienteId = document.getElementById('venda-cliente').value;
        const valor = parseFloat(document.getElementById('venda-valor').value);
        const data = document.getElementById('venda-data').value;

        if (!clienteId || !valor || !data) {
            AppModule.toast('Preencha cliente, valor e data.');
            return;
        }

        const vendas = DB.get('vendas', []);
        const index = vendas.findIndex(v => v.id === id);
        const config = DB.get('config', {});
        const comissaoPadrao = parseFloat(config.agencia?.comissao) || 10;

        const dados = {
            id: id || AppModule.generateId(),
            clienteId,
            dataVenda: data,
            servico: document.getElementById('venda-servico').value,
            destino: document.getElementById('venda-destino').value.trim(),
            valorVenda: valor,
            comissaoPercentual: parseFloat(document.getElementById('venda-comissao').value) || comissaoPadrao,
            observacoes: document.getElementById('venda-obs').value.trim(),
            criadoEm: index >= 0 ? vendas[index].criadoEm : new Date().toISOString()
        };

        if (index >= 0) {
            vendas[index] = { ...vendas[index], ...dados };
        } else {
            vendas.push(dados);
        }

        DB.set('vendas', vendas);
        AppModule.addAtividade(`Venda ${id ? 'atualizada' : 'registrada'} para ${DB.getClienteNome(clienteId)}`, 'vendas');
        AppModule.closeModal();
        AppModule.toast('Venda salva!');
        this.render();
    },

    excluir(id) {
        if (!confirm('Excluir esta venda?')) return;
        const vendas = DB.get('vendas', []);
        const v = vendas.find(x => x.id === id);
        DB.set('vendas', vendas.filter(v => v.id !== id));
        AppModule.addAtividade(`Venda de ${DB.getClienteNome(v?.clienteId)} excluída`, 'vendas');
        AppModule.toast('Venda excluída.');
        this.render();
    }
};
