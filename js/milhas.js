/* ============================================================
   milhas.js — Módulo de Milhas
   ============================================================ */

if (typeof window.formatCurrency !== 'function') {
    window.formatCurrency = function (value) {
        return 'R$ ' + (Number(value) || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
}

const MilhasModule = {
    init() {
        this.render();
    },

    render() {
        const list = document.getElementById('milhas-list');
        if (!list) return;

        const milhas = DB.getMilhas();
        list.innerHTML = milhas.length
            ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Programa</th>
                        <th>Quantidade</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${milhas.map(m => `
                        <tr>
                            <td>${m.cliente || '—'}</td>
                            <td>${m.programa || '—'}</td>
                            <td>${(m.quantidade || 0).toLocaleString('pt-BR')}</td>
                            <td>${formatCurrency(m.valor)}</td>
                            <td>${m.data || '—'}</td>
                            <td>
                                <button class="btn-icon" onclick="MilhasModule.editarRegistro('${m.id}')">✏️</button>
                                <button class="btn-icon" onclick="MilhasModule.excluirRegistro('${m.id}')">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`
            : '<p style="color:var(--gray-500);">Nenhum registro de milhas</p>';
    },

    novoRegistro() {
        const body = `
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="mlh-cliente" class="form-control">
            </div>
            <div class="form-group">
                <label>Programa</label>
                <select id="mlh-programa" class="form-control">
                    ${DB.getProgramas().map(p => `<option>${p}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade</label>
                <input type="number" id="mlh-quantidade" class="form-control" step="1">
            </div>
            <div class="form-group">
                <label>Valor</label>
                <input type="number" id="mlh-valor" class="form-control" step="0.01">
            </div>
            <div class="form-group">
                <label>Data</label>
                <input type="date" id="mlh-data" class="form-control">
            </div>
        `;

        AppModule.openModal('Novo Registro de Milhas', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarRegistro()">Salvar</button>
        `);
    },

    salvarRegistro() {
        const registro = {
            id: AppModule.generateId(),
            cliente: document.getElementById('mlh-cliente').value,
            programa: document.getElementById('mlh-programa').value,
            quantidade: parseInt(document.getElementById('mlh-quantidade').value) || 0,
            valor: parseFloat(document.getElementById('mlh-valor').value) || 0,
            data: document.getElementById('mlh-data').value
        };

        DB.saveMilha(registro);
        AppModule.closeModal();
        AppModule.showToast('Registro salvo!', 'success');
        this.render();
        AppModule.updateDashboard();
    },

    editarRegistro(id) {
        const milhas = DB.getMilhas();
        const m = milhas.find(x => x.id === id);
        if (!m) return;

        const body = `
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="mlh-cliente" class="form-control" value="${m.cliente || ''}">
            </div>
            <div class="form-group">
                <label>Programa</label>
                <select id="mlh-programa" class="form-control">
                    ${DB.getProgramas().map(p => `<option ${p === m.programa ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade</label>
                <input type="number" id="mlh-quantidade" class="form-control" step="1" value="${m.quantidade || 0}">
            </div>
            <div class="form-group">
                <label>Valor</label>
                <input type="number" id="mlh-valor" class="form-control" step="0.01" value="${m.valor || 0}">
            </div>
            <div class="form-group">
                <label>Data</label>
                <input type="date" id="mlh-data" class="form-control" value="${m.data || ''}">
            </div>
        `;

        AppModule.openModal('Editar Registro', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.atualizarRegistro('${id}')">Atualizar</button>
        `);
    },

    atualizarRegistro(id) {
        const milhas = DB.getMilhas();
        const m = milhas.find(x => x.id === id);
        if (!m) return;

        m.cliente = document.getElementById('mlh-cliente').value;
        m.programa = document.getElementById('mlh-programa').value;
        m.quantidade = parseInt(document.getElementById('mlh-quantidade').value) || 0;
        m.valor = parseFloat(document.getElementById('mlh-valor').value) || 0;
        m.data = document.getElementById('mlh-data').value;

        DB.saveMilha(m);
        AppModule.closeModal();
        AppModule.showToast('Registro atualizado!', 'success');
        this.render();
        AppModule.updateDashboard();
    },

    excluirRegistro(id) {
        if (!confirm('Excluir este registro?')) return;
        DB.deleteMilha(id);
        AppModule.showToast('Registro excluído.', 'danger');
        this.render();
        AppModule.updateDashboard();
    }
};
