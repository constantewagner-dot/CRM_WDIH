const PipelineModule = {
    init() { this.render(); },

    getStages() { return DB.getPipelineStages(); },

    normalizar(str) {
        return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

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
        const fechado = n.stage === 'Fechado (Ganho)' && n.fechadoEm;
        return `
            <div class="pipeline-card" draggable="true" data-id="${n.id}"
                 ondragstart="PipelineModule.dragStart(event, '${n.id}')">
                <span class="pipeline-cliente">${DB.getClienteNome(n.clienteId)}</span>
                <span class="pipeline-titulo">${n.titulo || 'Sem título'}</span>
                <small>${n.servico || ''}</small>
                ${Number(n.valor) ? `<small>${AppModule.formatCurrency(n.valor)}</small>` : ''}
                ${fechado ? `<small style="color:var(--success);font-weight:600;">✅ ${AppModule.formatDate(n.fechadoEm)}</small>` : ''}
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

        const stageAnterior = n.stage;
        n.stage = stage;
        n.atualizadoEm = new Date().toISOString();
        DB.saveNegocio(n);

        // 🔥 Automação ao fechar o negócio (usa data atual como padrão)
        if (stage === 'Fechado (Ganho)' && stageAnterior !== 'Fechado (Ganho)') {
            this.processarFechamento(n, new Date().toISOString().split('T')[0]);
        }

        this.render();
        AppModule.updateDashboard();
    },

    // ============================================================
    // 🎯 MODAL (com campo "Data de Fechamento" dinâmico)
    // ============================================================
    campoDataFechamentoHTML(dataExistente) {
        const data = dataExistente
            ? new Date(dataExistente).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        return `
            <div class="form-group" id="grp-data-fechamento" style="display:none;">
                <label>📅 Data de Fechamento</label>
                <input type="date" id="neg-fechadoEm" class="form-control" value="${data}">
                <small style="color:var(--gray-500);font-size:11px;">Edite a data se o fechamento ocorreu em outro dia.</small>
            </div>`;
    },

    toggleCampoDataFechamento() {
        const select = document.getElementById('neg-stage');
        const grupo = document.getElementById('grp-data-fechamento');
        if (!select || !grupo) return;
        grupo.style.display = select.value === 'Fechado (Ganho)' ? 'block' : 'none';
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
                <select id="neg-stage" class="form-control" onchange="PipelineModule.toggleCampoDataFechamento()">
                    ${stages.map(s => `<option ${s === stage ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            ${this.campoDataFechamentoHTML(null)}
            <div class="form-group"><label>Descrição</label><textarea id="neg-descricao" class="form-control"></textarea></div>`;

        AppModule.openModal('Novo Negócio', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.salvarNegocio()">Salvar</button>`);

        // Mostra o campo data se já começar em "Fechado (Ganho)"
        this.toggleCampoDataFechamento();
    },

    salvarNegocio() {
        const stage = document.getElementById('neg-stage').value;
        const dataFechamentoInput = document.getElementById('neg-fechadoEm');
        const dataFechamento = dataFechamentoInput ? dataFechamentoInput.value : null;

        const n = {
            id: AppModule.generateId('negocio'),
            titulo: document.getElementById('neg-titulo').value,
            clienteId: document.getElementById('neg-clienteId').value,
            servico: document.getElementById('neg-servico').value,
            valor: parseFloat(document.getElementById('neg-valor').value) || 0,
            probabilidade: 50,
            stage: stage,
            origemLead: '', campanha: '',
            descricao: document.getElementById('neg-descricao').value,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        DB.saveNegocio(n);

        if (n.stage === 'Fechado (Ganho)') {
            this.processarFechamento(n, dataFechamento || new Date().toISOString().split('T')[0]);
        }

        AppModule.closeModal();
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Negócio criado!', 'success');
    },

    editarNegocio(id) {
        const n = DB.getNegocios().find(x => x.id === id);
        if (!n) return;
        const stages = this.getStages();
        const dataFechamento = n.fechadoEm || new Date().toISOString();

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
                <select id="neg-stage" class="form-control" onchange="PipelineModule.toggleCampoDataFechamento()">
                    ${stages.map(s => `<option ${s === n.stage ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            ${this.campoDataFechamentoHTML(dataFechamento)}
            <div class="form-group"><label>Descrição</label><textarea id="neg-descricao" class="form-control">${n.descricao || ''}</textarea></div>`;

        AppModule.openModal('Editar Negócio', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.atualizarNegocio('${id}')">Atualizar</button>`);

        this.toggleCampoDataFechamento();
    },

    atualizarNegocio(id) {
        const n = DB.getNegocios().find(x => x.id === id);
        if (!n) return;

        const stageAnterior = n.stage;
        const novoStage = document.getElementById('neg-stage').value;
        const dataFechamentoInput = document.getElementById('neg-fechadoEm');
        const dataFechamento = dataFechamentoInput ? dataFechamentoInput.value : null;

        n.titulo = document.getElementById('neg-titulo').value;
        n.clienteId = document.getElementById('neg-clienteId').value;
        n.servico = document.getElementById('neg-servico').value;
        n.valor = parseFloat(document.getElementById('neg-valor').value) || 0;
        n.stage = novoStage;
        n.descricao = document.getElementById('neg-descricao').value;
        n.atualizadoEm = new Date().toISOString();
        DB.saveNegocio(n);

        // 🔥 Automação ao mover para fechado via edição (usa data editada pelo usuário)
        if (novoStage === 'Fechado (Ganho)' && stageAnterior !== 'Fechado (Ganho)') {
            this.processarFechamento(n, dataFechamento || new Date().toISOString().split('T')[0]);
        }

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
    },

    // ============================================================
    // 🔥 AUTOMAÇÃO DE FECHAMENTO
    // ============================================================
    processarFechamento(n, dataFechamento) {
        // Evita duplicidade
        if (n.fechadoEm) return;

        const dataISO = new Date(dataFechamento + 'T12:00:00').toISOString();
        n.fechadoEm = dataISO;
        n.probabilidade = 100;
        DB.saveNegocio(n);

        const criado = [];

        // 1) Sempre cria venda
        this.criarVenda(n, dataFechamento);
        criado.push('💵 Venda');

        // 2) Condições por serviço
        const servico = this.normalizar(n.servico);

        if (servico === 'grupo wpp' || servico === 'consultoria de milhas') {
            this.criarMilha(n, dataFechamento);
            criado.push('💠 Milhas');
        } else if (servico === 'emissao de passagens') {
            this.criarViagem(n, dataFechamento);
            criado.push('✈️ Viagem');
        }

        DB.addAtividade('negocio', `Negócio "${n.titulo || '—'}" fechado em ${AppModule.formatDate(dataISO)}`);
        AppModule.showToast('Negócio fechado! Criado: ' + criado.join(', '), 'success');
    },

    criarVenda(n, dataFechamento) {
        const v = {
            id: AppModule.generateId('venda'),
            negocioId: n.id,
            clienteId: n.clienteId,
            titulo: n.titulo || '',
            servico: n.servico || '',
            valorOriginal: 0,
            valorVenda: Number(n.valor) || 0,
            tipoVenda: 'dinheiro',
            nomeTerceiro: '',
            novo: false,
            criadoEm: new Date(dataFechamento + 'T12:00:00').toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        DB.saveVenda(v);
        DB.addAtividade('venda', `Venda "${v.titulo}" criada automaticamente pelo pipeline`);
    },

    criarMilha(n, dataFechamento) {
        const m = {
            id: AppModule.generateId('milha'),
            clienteId: n.clienteId,
            programa: '',
            quantidade: 0,
            valor: 0,
            data: dataFechamento,
            origemNegocioId: n.id,
            criadoEm: new Date(dataFechamento + 'T12:00:00').toISOString()
        };
        DB.saveMilha(m);
        DB.addAtividade('milha', `Registro de milhas criado para "${DB.getClienteNome(n.clienteId)}"`);
    },

    criarViagem(n, dataFechamento) {
        const v = {
            id: AppModule.generateId(),
            clienteId: n.clienteId,
            destino: n.titulo || '',
            dataIda: dataFechamento,
            dataVolta: '',
            servico: n.servico || '',
            companhia: '',
            numeroVoo: '',
            categoriaAssento: '',
            valor: Number(n.valor) || 0,
            checkinFeito: false,
            checkinData: '',
            notas: '',
            concluida: false,
            status: 'Em andamento',
            criadoEm: new Date(dataFechamento + 'T12:00:00').toISOString()
        };
        DB.saveViagem(v);
        DB.addAtividade('viagem', `Viagem "${v.destino}" criada automaticamente pelo pipeline`);
    }
};
