const ViagensModule = {
    init() { this.render(); },

    isConcluida(v) { return v.concluida === true || v.status === 'Concluída'; },
    isCheckinFeito(v) { return v.checkinFeito === true; },

    render() {
        const el = document.getElementById('viagens-list');
        if (!el) return;
        const viagens = DB.getViagens();
        el.innerHTML = viagens.length
            ? viagens.map(v => this.cardHTML(v)).join('')
            : '<p style="color:var(--gray-500);">Nenhuma viagem cadastrada</p>';
    },

    cardHTML(v) {
        const concluida = this.isConcluida(v);
        const checkin = this.isCheckinFeito(v);
        return `
            <div class="viagem-card">
                <div class="viagem-card-header">
                    <div>
                        <span class="viagem-cliente">${DB.getClienteNome(v.clienteId)}</span>
                        <span class="viagem-destino">✈️ ${v.destino || '—'}${v.dataIda ? ' · ' + AppModule.formatDate(v.dataIda) : ''}</span>
                    </div>
                    <div class="card-actions">
                        ${!checkin ? `<button class="btn btn-sm btn-primary" onclick="ViagensModule.marcarCheckin('${v.id}')">Check-in</button>` : ''}
                        ${!concluida ? `<button class="btn btn-sm btn-secondary" onclick="ViagensModule.concluirViagem('${v.id}')">✅ Concluir</button>` : ''}
                        <button class="btn-icon" onclick="ViagensModule.editarViagem('${v.id}')">✏️</button>
                        <button class="btn-icon btn-danger" onclick="ViagensModule.excluirViagem('${v.id}')">🗑️</button>
                    </div>
                </div>
                <div class="viagem-info-grid">
                    <div class="viagem-info"><label>CIA</label><span>${v.companhia || '—'}</span></div>
                    <div class="viagem-info"><label>Voo</label><span>${v.numeroVoo || '—'}</span></div>
                    <div class="viagem-info"><label>Assento</label><span>${v.categoriaAssento || '—'}</span></div>
                    <div class="viagem-info"><label>Check-in</label><span>${checkin ? '✅ ' + AppModule.formatDate(v.checkinData) : 'Pendente'}</span></div>
                    <div class="viagem-info"><label>Status</label><span>${concluida ? 'Concluída 🎉' : 'Em andamento'}</span></div>
                    <div class="viagem-info"><label>Valor</label><span>${AppModule.formatCurrency(v.valor)}</span></div>
                </div>
                ${v.notas ? `<div style="font-size:12px;color:var(--gray-500);">📝 ${v.notas}</div>` : ''}
            </div>`;
    },

    formHTML(v) {
        const d = v || {};
        return `
            <div class="form-group"><label>Cliente</label>
                <select id="vg-clienteId" class="form-control">${DB.clienteOptions(d.clienteId)}</select>
            </div>
            <div class="form-group"><label>Destino</label><input type="text" id="vg-destino" class="form-control" value="${d.destino || ''}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Data de Ida</label><input type="date" id="vg-dataIda" class="form-control" value="${d.dataIda || ''}"></div>
                <div class="form-group"><label>Data de Volta</label><input type="date" id="vg-dataVolta" class="form-control" value="${d.dataVolta || ''}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Companhia (CIA)</label>
                    <select id="vg-companhia" class="form-control">${DB.getCompanhias().map(c => `<option ${c === d.companhia ? 'selected' : ''}>${c}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Número do Voo</label><input type="text" id="vg-numeroVoo" class="form-control" value="${d.numeroVoo || ''}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Categoria do Assento</label>
                    <select id="vg-categoriaAssento" class="form-control">
                        ${['Econômica', 'Econômica Premium', 'Executiva', 'Primeira Classe'].map(a => `<option ${a === d.categoriaAssento ? 'selected' : ''}>${a}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Valor</label><input type="number" id="vg-valor" class="form-control" step="0.01" value="${d.valor || 0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Check-in</label>
                    <label class="check-label"><input type="checkbox" id="vg-checkinFeito" ${this.isCheckinFeito(d) ? 'checked' : ''}> Realizado</label>
                </div>
                <div class="form-group"><label>Data do Check-in</label><input type="date" id="vg-checkinData" class="form-control" value="${d.checkinData || ''}"></div>
            </div>
            <div class="form-group"><label>Notas</label><textarea id="vg-notas" class="form-control">${d.notas || ''}</textarea></div>
            <div class="form-group" style="border-top:1px solid var(--gray-200);padding-top:12px;">
                <label class="check-label check-success"><input type="checkbox" id="vg-concluida" ${this.isConcluida(d) ? 'checked' : ''}> Viagem concluída com sucesso</label>
            </div>`;
    },

    readForm() {
        return {
            clienteId: document.getElementById('vg-clienteId').value,
            destino: document.getElementById('vg-destino').value,
            dataIda: document.getElementById('vg-dataIda').value,
            dataVolta: document.getElementById('vg-dataVolta').value,
            companhia: document.getElementById('vg-companhia').value,
            numeroVoo: document.getElementById('vg-numeroVoo').value,
            categoriaAssento: document.getElementById('vg-categoriaAssento').value,
            valor: parseFloat(document.getElementById('vg-valor').value) || 0,
            checkinFeito: document.getElementById('vg-checkinFeito').checked,
            checkinData: document.getElementById('vg-checkinData').value,
            notas: document.getElementById('vg-notas').value,
            concluida: document.getElementById('vg-concluida').checked
        };
    },

    novaViagem() {
        AppModule.openModal('Nova Viagem', this.formHTML(), `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ViagensModule.salvarViagem()">Salvar</button>`);
    },

    salvarViagem() {
        const f = this.readForm();
        const v = {
            id: AppModule.generateId(),
            ...f,
            servico: '',
            status: f.concluida ? 'Concluída' : 'Em andamento',
            criadoEm: new Date().toISOString()
        };
        DB.saveViagem(v);
        AppModule.closeModal();
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Viagem salva!', 'success');
    },

    editarViagem(id) {
        const v = DB.getViagens().find(x => x.id === id);
        if (!v) return;
        AppModule.openModal('Editar Viagem', this.formHTML(v), `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ViagensModule.atualizarViagem('${id}')">Atualizar</button>`);
    },

    atualizarViagem(id) {
        const v = DB.getViagens().find(x => x.id === id);
        if (!v) return;
        const f = this.readForm();
        Object.assign(v, f);
        v.status = f.concluida ? 'Concluída' : 'Em andamento';
        v.atualizadoEm = new Date().toISOString();
        DB.saveViagem(v);
        AppModule.closeModal();
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Viagem atualizada!', 'success');
    },

    marcarCheckin(id) {
        const v = DB.getViagens().find(x => x.id === id);
        if (!v) return;
        v.checkinFeito = true;
        v.checkinData = new Date().toISOString().split('T')[0];
        DB.saveViagem(v);
        this.render();
        AppModule.showToast('Check-in realizado!', 'success');
    },

    concluirViagem(id) {
        const v = DB.getViagens().find(x => x.id === id);
        if (!v) return;
        if (!confirm('Marcar esta viagem como concluída com sucesso?')) return;
        v.concluida = true;
        v.status = 'Concluída';
        v.atualizadoEm = new Date().toISOString();
        DB.saveViagem(v);
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Viagem concluída com sucesso! 🎉', 'success');
    },

    excluirViagem(id) {
        if (!confirm('Excluir esta viagem?')) return;
        DB.deleteViagem(id);
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Viagem excluída.', 'danger');
    }
};
