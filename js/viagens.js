/* ============================================================
   viagens.js — Viagens (formato do backup)
   ============================================================ */

const ViagensModule = {
    init() {
        // Proteção: se o db.js antigo estiver em cache, não quebra
        if (typeof DB.getViagens !== 'function') {
            console.warn('DB.getViagens ausente — módulo de viagens desativado.');
            return;
        }
        this.render();
    },

    render() {
        const el = document.getElementById('viagens-list');
        if (!el) return;
        const viagens = DB.getViagens();

        el.innerHTML = viagens.length ? `
            <table class="table">
                <thead><tr>
                    <th>Cliente</th><th>Destino</th><th>Ida</th><th>Volta</th>
                    <th>Companhia</th><th>Valor</th><th>Status</th><th>Ações</th>
                </tr></thead>
                <tbody>${viagens.map(v => `
                    <tr>
                        <td>${DB.getClienteNome(v.clienteId)}</td>
                        <td>${v.destino || '—'}</td>
                        <td>${AppModule.formatDate(v.dataIda)}</td>
                        <td>${AppModule.formatDate(v.dataVolta)}</td>
                        <td>${v.companhia || '—'}</td>
                        <td>${AppModule.formatCurrency(v.valor)}</td>
                        <td><span class="badge badge-${(v.status || '').toLowerCase()}">${v.status || '—'}</span></td>
                        <td>
                            <button class="btn-icon" onclick="ViagensModule.editarViagem('${v.id}')">✏️</button>
                            <button class="btn-icon btn-danger" onclick="ViagensModule.excluirViagem('${v.id}')">🗑️</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>` : '<p style="color:var(--gray-500);">Nenhuma viagem cadastrada</p>';
    },

    novaViagem() {
        const clientes = DB.getClientes();
        const body = `
            <div class="form-group"><label>Cliente</label>
                <select id="vg-clienteId" class="form-control">
                    <option value="">— Selecione —</option>
                    ${clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Destino</label><input type="text" id="vg-destino" class="form-control"></div>
            <div class="form-grid">
                <div class="form-group"><label>Data de Ida</label><input type="date" id="vg-dataIda" class="form-control"></div>
                <div class="form-group"><label>Data de Volta</label><input type="date" id="vg-dataVolta" class="form-control"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Companhia</label>
                    <select id="vg-companhia" class="form-control">${DB.getCompanhias().map(c => `<option>${c}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Valor</label><input type="number" id="vg-valor" class="form-control" step="0.01"></div>
            </div>
            <div class="form-group"><label>Status</label>
                <select id="vg-status" class="form-control">
                    <option>Concluída</option><option>Agendada</option><option>Cancelada</option>
                </select>
            </div>
            <div class="form-group"><label>Notas</label><textarea id="vg-notas" class="form-control"></textarea></div>`;

        AppModule.openModal('Nova Viagem', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ViagensModule.salvarViagem()">Salvar</button>`);
    },

    salvarViagem() {
        const v = {
            id: AppModule.generateId(),
            clienteId: document.getElementById('vg-clienteId').value,
            destino: document.getElementById('vg-destino').value,
            dataIda: document.getElementById('vg-dataIda').value,
            dataVolta: document.getElementById('vg-dataVolta').value,
            servico: '',
            companhia: document.getElementById('vg-companhia').value,
            valor: parseFloat(document.getElementById('vg-valor').value) || 0,
            status: document.getElementById('vg-status').value,
            notas: document.getElementById('vg-notas').value,
            criadoEm: new Date().toISOString()
        };
        DB.saveViagem(v);
        AppModule.closeModal();
        this.render();
        AppModule.showToast('Viagem salva!', 'success');
    },

    editarViagem(id) {
        const v = DB.getViagens().find(x => x.id === id);
        if (!v) return;
        const clientes = DB.getClientes();
        const body = `
            <div class="form-group"><label>Cliente</label>
                <select id="vg-clienteId" class="form-control">
                    <option value="">— Selecione —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${c.id === v.clienteId ? 'selected' : ''}>${c.nome}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Destino</label><input type="text" id="vg-destino" class="form-control" value="${v.destino || ''}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Data de Ida</label><input type="date" id="vg-dataIda" class="form-control" value="${v.dataIda || ''}"></div>
                <div class="form-group"><label>Data de Volta</label><input type="date" id="vg-dataVolta" class="form-control" value="${v.dataVolta || ''}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Companhia</label>
                    <select id="vg-companhia" class="form-control">${DB.getCompanhias().map(c => `<option ${c === v.companhia ? 'selected' : ''}>${c}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Valor</label><input type="number" id="vg-valor" class="form-control" step="0.01" value="${v.valor || 0}"></div>
            </div>
            <div class="form-group"><label>Status</label>
                <select id="vg-status" class="form-control">
                    ${['Concluída', 'Agendada', 'Cancelada'].map(s => `<option ${s === v.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Notas</label><textarea id="vg-notas" class="form-control">${v.notas || ''}</textarea></div>`;

        AppModule.openModal('Editar Viagem', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ViagensModule.atualizarViagem('${id}')">Atualizar</button>`);
    },

    atualizarViagem(id) {
        const v = DB.getViagens().find(x => x.id === id);
        if (!v) return;
        v.clienteId = document.getElementById('vg-clienteId').value;
        v.destino = document.getElementById('vg-destino').value;
        v.dataIda = document.getElementById('vg-dataIda').value;
        v.dataVolta = document.getElementById('vg-dataVolta').value;
        v.companhia = document.getElementById('vg-companhia').value;
        v.valor = parseFloat(document.getElementById('vg-valor').value) || 0;
        v.status = document.getElementById('vg-status').value;
        v.notas = document.getElementById('vg-notas').value;
        DB.saveViagem(v);
        AppModule.closeModal();
        this.render();
        AppModule.showToast('Viagem atualizada!', 'success');
    },

    excluirViagem(id) {
        if (!confirm('Excluir esta viagem?')) return;
        DB.deleteViagem(id);
        this.render();
        AppModule.showToast('Viagem excluída.', 'danger');
    }
};
