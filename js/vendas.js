/* ============================================================
   vendas.js — Módulo de Vendas
   ============================================================ */

const VendasModule = {
    init() {
        this.render();
    },

    render() {
        const list = document.getElementById('vendas-list');
        if (!list) return;

        const vendas = DB.getVendas();
        list.innerHTML = vendas.length
            ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Serviço</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${vendas.map(v => `
                        <tr>
                            <td>${v.cliente || '—'}</td>
                            <td>${v.servico || '—'}</td>
                            <td>${AppModule.formatCurrency(v.valor)}</td>
                            <td>${v.data || '—'}</td>
                            <td><span class="badge badge-${v.status || 'concluida'}">${v.status || 'Concluída'}</span></td>
                            <td>
                                <button class="btn-icon" onclick="VendasModule.editarVenda('${v.id}')">✏️</button>
                                <button class="btn-icon" onclick="VendasModule.excluirVenda('${v.id}')">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`
            : '<p style="color:var(--gray-500);">Nenhuma venda registrada</p>';
    },

    novaVenda() {
        const body = `
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="vnd-cliente" class="form-control">
            </div>
            <div class="form-group">
                <label>Serviço</label>
                <select id="vnd-servico" class="form-control">
                    ${DB.getServicos().map(s => `<option>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Valor</label>
                <input type="number" id="vnd-valor" class="form-control" step="0.01">
            </div>
            <div class="form-group">
                <label>Data</label>
                <input type="date" id="vnd-data" class="form-control">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="vnd-status" class="form-control">
                    <option value="concluida">Concluída</option>
                    <option value="pendente">Pendente</option>
                    <option value="cancelada">Cancelada</option>
                </select>
            </div>
        `;

        AppModule.openModal('Nova Venda', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="VendasModule.salvarVenda()">Salvar</button>
        `);
    },

    salvarVenda() {
        const venda = {
            id: AppModule.generateId(),
            cliente: document.getElementById('vnd-cliente').value,
            servico: document.getElementById('vnd-servico').value,
            valor: parseFloat(document.getElementById('vnd-valor').value) || 0,
            data: document.getElementById('vnd-data').value,
            status: document.getElementById('vnd-status').value
        };

        DB.saveVenda(venda);
        AppModule.closeModal();
        AppModule.showToast('Venda registrada!', 'success');
        this.render();
        ComissoesModule.render();
        AppModule.updateDashboard();
    },

    editarVenda(id) {
        const vendas = DB.getVendas();
        const v = vendas.find(x => x.id === id);
        if (!v) return;

        const body = `
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="vnd-cliente" class="form-control" value="${v.cliente || ''}">
            </div>
            <div class="form-group">
                <label>Serviço</label>
                <select id="vnd-servico" class="form-control">
                    ${DB.getServicos().map(s => `<option ${s === v.servico ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Valor</label>
                <input type="number" id="vnd-valor" class="form-control" step="0.01" value="${v.valor || 0}">
            </div>
            <div class="form-group">
                <label>Data</label>
                <input type="date" id="vnd-data" class="form-control" value="${v.data || ''}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="vnd-status" class="form-control">
                    ${['concluida', 'pendente', 'cancelada'].map(s => `<option value="${s}" ${s === v.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
        `;

        AppModule.openModal('Editar Venda', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="VendasModule.atualizarVenda('${id}')">Atualizar</button>
        `);
    },

    atualizarVenda(id) {
        const vendas = DB.getVendas();
        const v = vendas.find(x => x.id === id);
        if (!v) return;

        v.cliente = document.getElementById('vnd-cliente').value;
        v.servico = document.getElementById('vnd-servico').value;
        v.valor = parseFloat(document.getElementById('vnd-valor').value) || 0;
        v.data = document.getElementById('vnd-data').value;
        v.status = document.getElementById('vnd-status').value;

        DB.saveVenda(v);
        AppModule.closeModal();
        AppModule.showToast('Venda atualizada!', 'success');
        this.render();
        ComissoesModule.render();
        AppModule.updateDashboard();
    },

    excluirVenda(id) {
        if (!confirm('Excluir esta venda?')) return;
        DB.deleteVenda(id);
        AppModule.showToast('Venda excluída.', 'danger');
        this.render();
        ComissoesModule.render();
        AppModule.updateDashboard();
    }
};
