var VendasModule = {
    render() {
        const vendas = DB.get('vendas', []);
        const resumo = document.getElementById('vendas-resumo');
        const list = document.getElementById('vendas-list');

        const total = vendas.reduce((s, v) => s + (parseFloat(v.valorVenda) || 0), 0);
        const ticket = vendas.length ? total / vendas.length : 0;

        if (resumo) {
            resumo.innerHTML = `
                <div class="kpi-grid">
                    <div class="kpi-card"><label>Vendas</label><span>${vendas.length}</span></div>
                    <div class="kpi-card"><label>Valor Total Vendido</label><span>${AppModule.formatCurrency(total)}</span></div>
                    <div class="kpi-card"><label>Ticket Médio</label><span>${AppModule.formatCurrency(ticket)}</span></div>
                </div>
            `;
        }

        if (list) {
            if (!vendas.length) {
                list.innerHTML = '<p class="dashboard-empty">Nenhuma venda registrada.</p>';
                return;
            }

            list.innerHTML = `
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr><th>Data</th><th>Título</th><th>Cliente</th><th>Serviço</th><th>Tipo</th><th>Valor</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${vendas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).map(v => `
                                <tr>
                                    <td>${AppModule.formatDate(v.criadoEm)}</td>
                                    <td>${AppModule.escapeHtml(v.titulo || '—')}</td>
                                    <td>${AppModule.escapeHtml(DB.getClienteNome(v.clienteId))}</td>
                                    <td>${AppModule.escapeHtml(v.servico || '—')}</td>
                                    <td>${AppModule.escapeHtml(this.tipoLabel(v.tipoVenda))}</td>
                                    <td style="font-weight:700;color:var(--success);">${AppModule.formatCurrency(v.valorVenda)}</td>
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
        }
    },

    tipoLabel(tipo) {
        const map = {
            'dinheiro': 'Dinheiro',
            'milhas_terceiros': 'Milhas de Terceiros',
            'milhas_proprias': 'Milhas Próprias'
        };
        return map[tipo] || tipo || '—';
    },

    novaVenda() {
        this.abrirFormulario();
    },

    editar(id) {
        const v = DB.get('vendas', []).find(x => x.id === id);
        if (v) this.abrirFormulario(v);
    },

    abrirFormulario(venda = null) {
        const clientes = DB.get('clientes', []);
        const config = DB.get('config', {});
        const servicos = config.servicos || [];
        const isEdit = !!venda;

        const html = `
            <div class="form-group"><label>Título *</label><input type="text" id="ven-titulo" class="form-control" value="${AppModule.escapeHtml(venda?.titulo || '')}"></div>
            <div class="form-group"><label>Cliente</label>
                <select id="ven-cliente" class="form-control">
                    <option value="">— Sem cliente —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${venda?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Serviço</label>
                <select id="ven-servico" class="form-control">
                    <option value="">— Selecionar —</option>
                    ${servicos.map(s => `<option value="${AppModule.escapeHtml(s)}" ${venda?.servico === s ? 'selected' : ''}>${AppModule.escapeHtml(s)}</option>`).join('')}
                </select>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Valor Original (R$)</label><input type="number" id="ven-original" class="form-control" step="0.01" value="${venda?.valorOriginal || 0}"></div>
                <div class="form-group"><label>Valor Venda (R$)</label><input type="number" id="ven-venda" class="form-control" step="0.01" value="${venda?.valorVenda || 0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Tipo de Venda</label>
                    <select id="ven-tipo" class="form-control">
                        <option value="dinheiro" ${!venda?.tipoVenda || venda?.tipoVenda === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
                        <option value="milhas_terceiros" ${venda?.tipoVenda === 'milhas_terceiros' ? 'selected' : ''}>Milhas de Terceiros</option>
                        <option value="milhas_proprias" ${venda?.tipoVenda === 'milhas_proprias' ? 'selected' : ''}>Milhas Próprias</option>
                    </select>
                </div>
                <div class="form-group"><label>Necessita Check-in</label>
                    <select id="ven-checkin" class="form-control">
                        <option value="nao" ${!venda?.necessidadeCheckin || venda?.necessidadeCheckin === 'nao' ? 'selected' : ''}>Não</option>
                        <option value="sim" ${venda?.necessidadeCheckin === 'sim' ? 'selected' : ''}>Sim</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Nome do Terceiro (se milhas)</label><input type="text" id="ven-terceiro" class="form-control" value="${AppModule.escapeHtml(venda?.nomeTerceiro || '')}"></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="VendasModule.salvar('${venda?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Venda' : 'Nova Venda', html, footer);
    },

    salvar(id) {
        const titulo = document.getElementById('ven-titulo').value.trim();
        if (!titulo) {
            AppModule.toast('Informe o título da venda.');
            return;
        }

        const vendas = DB.get('vendas', []);
        const index = vendas.findIndex(v => v.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            titulo,
            clienteId: document.getElementById('ven-cliente').value,
            servico: document.getElementById('ven-servico').value,
            valorOriginal: parseFloat(document.getElementById('ven-original').value) || 0,
            valorVenda: parseFloat(document.getElementById('ven-venda').value) || 0,
            tipoVenda: document.getElementById('ven-tipo').value,
            necessidadeCheckin: document.getElementById('ven-checkin').value,
            nomeTerceiro: document.getElementById('ven-terceiro').value.trim(),
            criadoEm: index >= 0 ? vendas[index].criadoEm : new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        if (index >= 0) {
            vendas[index] = { ...vendas[index], ...dados };
        } else {
            vendas.push(dados);
        }

        DB.set('vendas', vendas);
        AppModule.addAtividade(`Venda "${titulo}" salva`, 'venda');
        AppModule.closeModal();
        AppModule.toast('Venda salva!');
        this.render();
    },

    excluir(id) {
        if (!confirm('Excluir esta venda?')) return;
        const vendas = DB.get('vendas', []).filter(v => v.id !== id);
        DB.set('vendas', vendas);
        AppModule.toast('Venda excluída.');
        this.render();
    }
};
