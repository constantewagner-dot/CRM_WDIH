const PipelineModule = {
    init() { this.render(); },

    getStages() { return DB.getPipelineStages(); },

    render() {
        const board = document.getElementById('pipeline-board');
        if (!board) return;
        const stages = this.getStages();
        const negocios = DB.getNegocios();

        board.innerHTML = stages.map(stage => {
            const itens = negocios.filter(n => n.stage === stage);
            return `
                <div class="pipeline-column" data-stage="${stage}"
                     ondragover="PipelineModule.allowDrop(event)"
                     ondrop="PipelineModule.drop(event, '${stage}')">
                    <div class="pipeline-column-header">
                        <span>${stage}</span><span class="badge">${itens.length}</span>
                    </div>
                    <div class="pipeline-column-body">
                        ${itens.map(n => this.cardHTML(n)).join('')}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="PipelineModule.novoNegocio('${stage}')">+ Adicionar</button>
                </div>`;
        }).join('');
    },

    cardHTML(n) {
        return `
            <div class="pipeline-card" draggable="true" data-id="${n.id}"
                 ondragstart="PipelineModule.dragStart(event, '${n.id}')">
                <span class="pipeline-cliente">${DB.getClienteNome(n.clienteId)}</span>
                <span class="pipeline-titulo">${n.titulo || 'Sem título'}</span>
                <small>${n.servico || ''}</small>
                ${Number(n.valor) ? `<small>${AppModule.formatCurrency(n.valor)}</small>` : ''}
                <div class="card-actions">
                    <button class="btn-icon" onclick="PipelineModule.editarNegocio('${n.id}')">✏️</button>
                    <button class="btn-icon btn-danger" onclick="PipelineModule.excluirNegocio('${n.id}')">🗑️</button>
                </div>
            </div>`;
    },

    dragStart(e, id) {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    },
    allowDrop(e) { e.preventDefault(); },
    drop(e, stage) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const n = DB.getNegocios().find(x => x.id === id);
        if (!n || n.stage === stage) return;
        n.stage = stage;
        n.atualizadoEm = new Date().toISOString();
        DB.saveNegocio(n);
        this.render();
        AppModule.updateDashboard();
    },

    novoNegocio(stage) {
        const stages = this.getStages();
        const body = `
            <div class="form-group"><label>Cliente</label>
                <select id="neg-clienteId" class="form-control">${DB.clienteOptions()}</select>
            </div>
            <div class="form-group"><label>Título</label><input type="text" id="neg-titulo" class="form-control"></div>
            <div class="form-group"><label>Serviço</label>
                <select id="neg-servico" class="form-control">${DB.getServicos().map(s => `<option>${s}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Valor</label><input type="number" id="neg-valor" class="form-control" step="0.01"></div>
            <div class="form-group"><label>Etapa</label>
                <select id="neg-stage" class="form-control">${stages.map(s => `<option ${s === stage ? 'selected' : ''}>${s}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Descrição</label><textarea id="neg-descricao" class="form-control"></textarea></div>`;

        AppModule.openModal('Novo Negócio', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.salvarNegocio()">Salvar</button>`);
    },

    salvarNegocio() {
        const n = {
            id: AppModule.generateId('negocio'),
            titulo: document.getElementById('neg-titulo').value,
            clienteId: document.getElementById('neg-clienteId').value,
            servico: document.getElementById('neg-servico').value,
            valor: parseFloat(document.getElementById('neg-valor').value) || 0,
            probabilidade: 50,
            stage: document.getElementById('neg-stage').value,
            origemLead: '', campanha: '',
            descricao: document.getElementById('neg-descricao').value,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        DB.saveNegocio(n);
        AppModule.closeModal();
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Negócio criado!', 'success');
    },

    editarNegocio(id) {
        const n = DB.getNegocios().find(x => x.id === id);
        if (!n) return;
        const stages = this.getStages();
        const body = `
            <div class="form-group"><label>Cliente</label>
                <select id="neg-clienteId" class="form-control">${DB.clienteOptions(n.clienteId)}</select>
            </div>
            <div class="form-group"><label>Título</label><input type="text" id="neg-titulo" class="form-control" value="${n.titulo || ''}"></div>
            <div class="form-group"><label>Serviço</label>
                <select id="neg-servico" class="form-control">${DB.getServicos().map(s => `<option ${s === n.servico ? 'selected' : ''}>${s}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Valor</label><input type="number" id="neg-valor" class="form-control" step="0.01" value="${n.valor || 0}"></div>
            <div class="form-group"><label>Etapa</label>
                <select id="neg-stage" class="form-control">${stages.map(s => `<option ${s === n.stage ? 'selected' : ''}>${s}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Descrição</label><textarea id="neg-descricao" class="form-control">${n.descricao || ''}</textarea></div>`;

        AppModule.openModal('Editar Negócio', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.atualizarNegocio('${id}')">Atualizar</button>`);
    },

    atualizarNegocio(id) {
        const n = DB.getNegocios().find(x => x.id === id);
        if (!n) return;
        n.titulo = document.getElementById('neg-titulo').value;
        n.clienteId = document.getElementById('neg-clienteId').value;
        n.servico = document.getElementById('neg-servico').value;
        n.valor = parseFloat(document.getElementById('neg-valor').value) || 0;
        n.stage = document.getElementById('neg-stage').value;
        n.descricao = document.getElementById('neg-descricao').value;
        n.atualizadoEm = new Date().toISOString();
        DB.saveNegocio(n);
        AppModule.closeModal();
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Negócio atualizado!', 'success');
    },

    excluirNegocio(id) {
        if (!confirm('Excluir este negócio?')) return;
        DB.deleteNegocio(id);
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Negócio excluído.', 'danger');
    }
};
