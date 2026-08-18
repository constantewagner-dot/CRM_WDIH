const MilhasModule = {
    init() { this.render(); },

    render() {
        const el = document.getElementById('milhas-list');
        if (!el) return;
        const milhas = DB.getMilhas();

        el.innerHTML = milhas.length ? `
            <div class="table-wrap"><table class="table">
                <thead><tr>
                    <th>Cliente</th><th>Programa</th><th>Quantidade</th><th>Valor</th><th>Data</th><th>Ações</th>
                </tr></thead>
                <tbody>${milhas.map(m => `
                    <tr>
                        <td>${DB.getClienteNome(m.clienteId)}</td>
                        <td>${m.programa || '—'}</td>
                        <td>${(m.quantidade || 0).toLocaleString('pt-BR')}</td>
                        <td>${AppModule.formatCurrency(m.valor)}</td>
                        <td>${AppModule.formatDate(m.data)}</td>
                        <td><button class="btn-icon btn-danger" onclick="MilhasModule.excluirRegistro('${m.id}')">🗑️</button></td>
                    </tr>`).join('')}
                </tbody>
            </table></div>` : '<p style="color:var(--gray-500);">Nenhum registro de milhas</p>';
    },

    novoRegistro() {
        const body = `
            <div class="form-group"><label>Cliente</label>
                <select id="mlh-clienteId" class="form-control">${DB.clienteOptions()}</select>
            </div>
            <div class="form-group"><label>Programa</label>
                <select id="mlh-programa" class="form-control">${DB.getProgramas().map(p => `<option>${p}</option>`).join('')}</select>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Quantidade</label><input type="number" id="mlh-quantidade" class="form-control" step="1"></div>
                <div class="form-group"><label>Valor</label><input type="number" id="mlh-valor" class="form-control" step="0.01"></div>
            </div>
            <div class="form-group"><label>Data</label><input type="date" id="mlh-data" class="form-control"></div>`;

        AppModule.openModal('Novo Registro de Milhas', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarRegistro()">Salvar</button>`);
    },

    salvarRegistro() {
        const m = {
            id: AppModule.generateId(),
            clienteId: document.getElementById('mlh-clienteId').value,
            programa: document.getElementById('mlh-programa').value,
            quantidade: parseInt(document.getElementById('mlh-quantidade').value) || 0,
            valor: parseFloat(document.getElementById('mlh-valor').value) || 0,
            data: document.getElementById('mlh-data').value,
            criadoEm: new Date().toISOString()
        };
        DB.saveMilha(m);
        AppModule.closeModal();
        this.render();
        AppModule.showToast('Registro salvo!', 'success');
    },

    excluirRegistro(id) {
        if (!confirm('Excluir este registro?')) return;
        DB.deleteMilha(id);
        this.render();
        AppModule.showToast('Registro excluído.', 'danger');
    }
};
