/* ============================================================
   checkin.js — Módulo de Check-in
   ============================================================ */

const CheckinModule = {
    init() {
        this.render();
    },

    render() {
        const list = document.getElementById('checkin-list');
        if (!list) return;

        const checkins = DB.getCheckins();
        list.innerHTML = checkins.length
            ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Observações</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${checkins.map(c => `
                        <tr>
                            <td>${c.cliente || '—'}</td>
                            <td>${c.data || '—'}</td>
                            <td><span class="badge badge-${c.status || 'pendente'}">${c.status || 'Pendente'}</span></td>
                            <td>${c.obs || ''}</td>
                            <td>
                                <button class="btn-icon" onclick="CheckinModule.editarCheckin('${c.id}')">✏️</button>
                                <button class="btn-icon" onclick="CheckinModule.excluirCheckin('${c.id}')">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`
            : '<p style="color:var(--gray-500);">Nenhum check-in cadastrado</p>';
    },

    novoCheckin() {
        const body = `
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="chk-cliente" class="form-control">
            </div>
            <div class="form-group">
                <label>Data</label>
                <input type="date" id="chk-data" class="form-control">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="chk-status" class="form-control">
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="realizado">Realizado</option>
                    <option value="cancelado">Cancelado</option>
                </select>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="chk-obs" class="form-control"></textarea>
            </div>
        `;

        AppModule.openModal('Novo Check-in', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="CheckinModule.salvarCheckin()">Salvar</button>
        `);
    },

    salvarCheckin() {
        const checkin = {
            id: AppModule.generateId(),
            cliente: document.getElementById('chk-cliente').value,
            data: document.getElementById('chk-data').value,
            status: document.getElementById('chk-status').value,
            obs: document.getElementById('chk-obs').value
        };

        DB.saveCheckin(checkin);
        AppModule.closeModal();
        AppModule.showToast('Check-in salvo!', 'success');
        this.render();
        AppModule.updateDashboard();
    },

    editarCheckin(id) {
        const checkins = DB.getCheckins();
        const c = checkins.find(x => x.id === id);
        if (!c) return;

        const body = `
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="chk-cliente" class="form-control" value="${c.cliente || ''}">
            </div>
            <div class="form-group">
                <label>Data</label>
                <input type="date" id="chk-data" class="form-control" value="${c.data || ''}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="chk-status" class="form-control">
                    ${['pendente', 'confirmado', 'realizado', 'cancelado'].map(s => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="chk-obs" class="form-control">${c.obs || ''}</textarea>
            </div>
        `;

        AppModule.openModal('Editar Check-in', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="CheckinModule.atualizarCheckin('${id}')">Atualizar</button>
        `);
    },

    atualizarCheckin(id) {
        const checkins = DB.getCheckins();
        const c = checkins.find(x => x.id === id);
        if (!c) return;

        c.cliente = document.getElementById('chk-cliente').value;
        c.data = document.getElementById('chk-data').value;
        c.status = document.getElementById('chk-status').value;
        c.obs = document.getElementById('chk-obs').value;

        DB.saveCheckin(c);
        AppModule.closeModal();
        AppModule.showToast('Check-in atualizado!', 'success');
        this.render();
        AppModule.updateDashboard();
    },

    excluirCheckin(id) {
        if (!confirm('Excluir este check-in?')) return;
        DB.deleteCheckin(id);
        AppModule.showToast('Check-in excluído.', 'danger');
        this.render();
        AppModule.updateDashboard();
    }
};
