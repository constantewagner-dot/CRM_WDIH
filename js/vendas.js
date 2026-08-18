/* ============================================================
   vendas.js — Vendas (formato do backup: valorVenda, tipoVenda)
   ============================================================ */

const VendasModule = {
    init() { this.render(); },

    render() {
        const el = document.getElementById('vendas-list');
        if (!el) return;
        const vendas = DB.getVendas();

        el.innerHTML = vendas.length ? `
            <table class="table">
                <thead><tr>
                    <th>Cliente</th><th>Título</th><th>Serviço</th><th>Valor</th>
                    <th>Tipo</th><th>Terceiro</th><th>Ações</th>
                </tr></thead>
                <tbody>${vendas.map(v => `
                    <tr>
                        <td>${DB.getClienteNome(v.clienteId)}</td>
                        <td>${v.titulo || '—'}</td>
                        <td>${v.servico || '—'}</td>
                        <td><strong>${AppModule.formatCurrency(v.valorVenda)}</strong></td>
                        <td>${v.tipoVenda === 'milhas_terceiros' ? 'Milhas (3ºs)' : (v.tipoVenda || '—')}</td>
                        <td>${v.nomeTerceiro || '—'}</td>
                        <td>
                            <button class="btn-icon" onclick="VendasModule.editarVenda('${v.id}')">✏️</button>
                            <button class="btn-icon btn-danger" onclick="VendasModule.excluirVenda('${v.id}')">🗑️</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>` : '<p style="color:var(--gray-500);">Nenhuma venda registrada</p>';
    },

    novaVenda() {
        const clientes = DB.getClientes();
        const body = `
            <div class="form-group"><label>Cliente</label>
                <select id="vnd-clienteId" class="form-control">
                    <option value="">— Selecione —</option>
                    ${clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Título</label><input type="text" id="vnd-titulo" class="form-control"></div>
            <div class="form-group"><label>Serviço</label>
                <select id="vnd-servico" class="form-control">${DB.getServicos().map(s => `<option>${s}</option>`).join('')}</select>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Valor Original</label><input type="number" id="vnd-valorOriginal" class="form-control" step="0.01"></div>
                <div class="form-group"><label>Valor da Venda</label><input type="number" id="vnd-valorVenda" class="form-control" step="0.01"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Tipo</label>
                    <select id="vnd-tipoVenda" class="form-control">
                        <option value="dinheiro">Dinheiro</option>
                        <option value="milhas_terceiros">Milhas de terceiros</option>
                        <option value="milhas_proprias">Milhas próprias</option>
                    </select>
                </div>
                <div class="form-group"><label>Nome do Terceiro</label><input type="text" id="vnd-nomeTerceiro" class="form-control"></div>
            </div>
            <div class="form-group"><label>Precisa de Check-in?</label>
                <select id="vnd-necessidadeCheckin" class="form-control">
                    <option value="nao">Não</option><option value="sim">Sim</option>
                </select>
            </div>`;

        AppModule.openModal('Nova Venda', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="VendasModule.salvarVenda()">Salvar</button>`);
    },

    salvarVenda() {
        const v = {
            id: AppModule.generateId('venda'),
            negocioId: null,
            clienteId: document.getElementById('vnd-clienteId').value,
            titulo: document.getElementById('vnd-titulo').value,
            servico: document.getElementById('vnd-servico').value,
            valorOriginal: parseFloat(document.getElementById('vnd-valorOriginal').value) || 0,
            valorVenda: parseFloat(document.getElementById('vnd-valorVenda').value) || 0,
            tipoVenda: document.getElementById('vnd-tipoVenda').value,
            nomeTerceiro: document.getElementById('vnd-nomeTerceiro').value,
            necessidadeCheckin: document.getElementById('vnd-necessidadeCheckin').value,
            novo: false,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        DB.saveVenda(v);
        DB.addAtividade('venda', `Venda "${v.titulo}" criada`);
        AppModule.closeModal();
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Venda registrada!', 'success');
    },

    editarVenda(id) {
        const v = DB.getVendas().find(x => x.id === id);
        if (!v) return;
        const clientes = DB.getClientes();
        const body = `
            <div class="form-group"><label>Cliente</label>
                <select id="vnd-clienteId" class="form-control">
                    <option value="">— Selecione —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${c.id === v.clienteId ? 'selected' : ''}>${c.nome}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Título</label><input type="text" id="vnd-titulo" class="form-control" value="${v.titulo || ''}"></div>
            <div class="form-group"><label>Serviço</label>
                <select id="vnd-servico" class="form-control">${DB.getServicos().map(s => `<option ${s === v.servico ? 'selected' : ''}>${s}</option>`).join('')}</select>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Valor Original</label><input type="number" id="vnd-valorOriginal" class="form-control" step="0.01" value="${v.valorOriginal || 0}"></div>
                <div class="form-group"><label>Valor da Venda</label><input type="number" id="vnd-valorVenda" class="form-control" step="0.01" value="${v.valorVenda || 0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Tipo</label>
                    <select id="vnd-tipoVenda" class="form-control">
                        ${['dinheiro', 'milhas_terceiros', 'milhas_proprias'].map(t => `<option value="${t}" ${t === v.tipoVenda ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Nome do Terceiro</label><input type="text" id="vnd-nomeTerceiro" class="form-control" value="${v.nomeTerceiro || ''}"></div>
            </div>
            <div class="form-group"><label>Precisa de Check-in?</label>
                <select id="vnd-necessidadeCheckin" class="form-control">
                    <option value="nao" ${v.necessidadeCheckin !== 'sim' ? 'selected' : ''}>Não</option>
                    <option value="sim" ${v.necessidadeCheckin === 'sim' ? 'selected' : ''}>Sim</option>
                </select>
            </div>`;

        AppModule.openModal('Editar Venda', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="VendasModule.atualizarVenda('${id}')">Atualizar</button>`);
    },

    atualizarVenda(id) {
        const v = DB.getVendas().find(x => x.id === id);
        if (!v) return;
        v.clienteId = document.getElementById('vnd-clienteId').value;
        v.titulo = document.getElementById('vnd-titulo').value;
        v.servico = document.getElementById('vnd-servico').value;
        v.valorOriginal = parseFloat(document.getElementById('vnd-valorOriginal').value) || 0;
        v.valorVenda = parseFloat(document.getElementById('vnd-valorVenda').value) || 0;
        v.tipoVenda = document.getElementById('vnd-tipoVenda').value;
        v.nomeTerceiro = document.getElementById('vnd-nomeTerceiro').value;
        v.necessidadeCheckin = document.getElementById('vnd-necessidadeCheckin').value;
        v.atualizadoEm = new Date().toISOString();
        DB.saveVenda(v);
        DB.addAtividade('venda', `Venda "${v.titulo}" atualizada`);
        AppModule.closeModal();
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Venda atualizada!', 'success');
    },

    excluirVenda(id) {
        if (!confirm('Excluir esta venda?')) return;
        DB.deleteVenda(id);
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Venda excluída.', 'danger');
    }
};
