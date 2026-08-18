/* ============================================================
   pipeline.js — Módulo de Pipeline
   ============================================================ */

const PipelineModule = {
    init() {
        this.render();
    },

    getStages() {
        return DB.getPipelineStages();
    },

    render() {
        const board = document.getElementById('pipeline-board');
        if (!board) return;

        const stages = this.getStages();
        const negocios = DB.getNegocios();

        board.innerHTML = stages.map(stage => {
            const itens = negocios.filter(n => n.stage === stage);
            return `
                <div class="pipeline-column" data-stage="${stage}">
                    <div class="pipeline-column-header">
                        <span>${stage}</span>
                        <span class="badge">${itens.length}</span>
                    </div>
                    <div class="pipeline-column-body" data-stage="${stage}">
                        ${itens.map(n => this.cardHTML(n)).join('')}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="PipelineModule.novoNegocio('${stage}')">+ Adicionar</button>
                </div>
            `;
        }).join('');
    },

    cardHTML(n) {
        return `
            <div class="pipeline-card" draggable="true" data-id="${n.id}">
                <strong>${n.cliente || 'Sem nome'}</strong>
                <small>${n.servico || ''}</small>
                <small style="color:var(--gray-500);">${AppModule.formatCurrency(n.valor)}</small>
                <div class="card-actions">
                    <button class="btn-icon" onclick="PipelineModule.editarNegocio('${n.id}')" title="Editar">✏️</button>
                    <button class="btn-icon" onclick="PipelineModule.excluirNegocio('${n.id}')" title="Excluir">🗑️</button>
                </div>
            </div>
        `;
    },

    novoNegocio(stage) {
        const stages = this.getStages();
        const stageAtual = stage || stages[0];

        const body = `
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="neg-cliente" class="form-control">
            </div>
            <div class="form-group">
                <label>Serviço</label>
                <select id="neg-servico" class="form-control">
                    ${DB.getServicos().map(s => `<option>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Valor</label>
                <input type="number" id="neg-valor" class="form-control" step="0.01">
            </div>
            <div class="form-group">
                <label>Etapa</label>
                <select id="neg-stage" class="form-control">
                    ${stages.map(s => `<option ${s === stageAtual ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="neg-obs" class="form-control"></textarea>
            </div>
        `;

        AppModule.openModal('Novo Negócio', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.salvarNegocio()">Salvar</button>
        `);
    },

    salvarNegocio() {
        const negocio = {
            id: AppModule.generateId(),
            cliente: document.getElementById('neg-cliente').value,
            servico: document.getElementById('neg-servico').value,
            valor: parseFloat(document.getElementById('neg-valor').value) || 0,
            stage: document.getElementById('neg-stage').value,
            obs: document.getElementById('neg-obs').value,
            dataCriacao: new Date().toISOString()
        };

        DB.saveNegocio(negocio);
        AppModule.closeModal();
        AppModule.showToast('Negócio criado com sucesso!', 'success');
        this.render();
        AppModule.updateDashboard();
    },

    editarNegocio(id) {
        const negocios = DB.getNegocios();
        const n = negocios.find(x => x.id === id);
        if (!n) return;

        const stages = this.getStages();
        const body = `
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="neg-cliente" class="form-control" value="${n.cliente || ''}">
            </div>
            <div class="form-group">
                <label>Serviço</label>
                <select id="neg-servico" class="form-control">
                    ${DB.getServicos().map(s => `<option ${s === n.servico ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Valor</label>
                <input type="number" id="neg-valor" class="form-control" step="0.01" value="${n.valor || 0}">
            </div>
            <div class="form-group">
                <label>Etapa</label>
                <select id="neg-stage" class="form-control">
                    ${stages.map(s => `<option ${s === n.stage ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="neg-obs" class="form-control">${n.obs || ''}</textarea>
            </div>
        `;

        AppModule.openModal('Editar Negócio', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.atualizarNegocio('${id}')">Atualizar</button>
        `);
    },

    atualizarNegocio(id) {
        const negocios = DB.getNegocios();
        const n = negocios.find(x => x.id === id);
        if (!n) return;

        n.cliente = document.getElementById('neg-cliente').value;
        n.servico = document.getElementById('neg-servico').value;
        n.valor = parseFloat(document.getElementById('neg-valor').value) || 0;
        n.stage = document.getElementById('neg-stage').value;
        n.obs = document.getElementById('neg-obs').value;

        DB.saveNegocio(n);
        AppModule.closeModal();
        AppModule.showToast('Negócio atualizado!', 'success');
        this.render();
        AppModule.updateDashboard();
    },

    excluirNegocio(id) {
        if (!confirm('Excluir este negócio?')) return;
        DB.deleteNegocio(id);
        AppModule.showToast('Negócio excluído.', 'danger');
        this.render();
        AppModule.updateDashboard();
    }
};
