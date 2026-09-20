var PipelineModule = {
    render() {
        const negocios = DB.get('negocios', []);
        const config = DB.get('config', {});
        let etapas = config.pipeline || config.pipelineStages || [];

        // Fallback: extrai etapas dos próprios negócios se config estiver vazia
        if (!etapas.length) {
            const set = new Set(negocios.map(n => n.stage).filter(Boolean));
            etapas = Array.from(set);
        }

        const board = document.getElementById('pipeline-board');
        if (!board) return;

        if (!etapas.length) {
            board.innerHTML = '<p class="dashboard-empty">Nenhuma etapa configurada. Configure em Configurações.</p>';
            return;
        }

        board.innerHTML = etapas.map(etapa => {
            const cards = negocios.filter(n => n.stage === etapa);
            const valorTotal = cards.reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
            return `
                <div class="pipeline-col">
                    <div class="pipeline-col-header">
                        <span class="pipeline-col-title">${AppModule.escapeHtml(etapa)}</span>
                        <span class="pipeline-col-count">${cards.length}</span>
                    </div>
                    <div class="pipeline-col-total">${AppModule.formatCurrency(valorTotal)}</div>
                    <div class="pipeline-col-body">
                        ${cards.map(n => this.renderCard(n)).join('')}
                    </div>
                    <button class="pipeline-add" data-stage="${AppModule.escapeHtml(etapa)}" onclick="PipelineModule.novoNegocioEtapa(this.getAttribute('data-stage'))">+ Adicionar</button>
                </div>
            `;
        }).join('');
    },

    renderCard(n) {
        const cliente = DB.getClienteNome(n.clienteId);
        return `
            <div class="pipeline-card" onclick="PipelineModule.editar('${n.id}')">
                <div class="pipeline-card-titulo">${AppModule.escapeHtml(n.titulo || '—')}</div>
                <div class="pipeline-card-cliente">👤 ${AppModule.escapeHtml(cliente)}</div>
                ${n.servico ? `<div class="pipeline-card-cliente">${AppModule.escapeHtml(n.servico)}</div>` : ''}
                <div class="pipeline-card-valor">${parseFloat(n.valor) ? AppModule.formatCurrency(n.valor) : '—'}</div>
            </div>
        `;
    },

    novoNegocio() {
        this.abrirFormulario();
    },

    novoNegocioEtapa(etapa) {
        this.abrirFormulario(null, etapa);
    },

    editar(id) {
        const n = DB.get('negocios', []).find(x => x.id === id);
        if (n) this.abrirFormulario(n);
    },

    abrirFormulario(negocio = null, etapaInicial = '') {
        const clientes = DB.get('clientes', []);
        const config = DB.get('config', {});
        const servicos = config.servicos || [];
        const etapas = config.pipeline || config.pipelineStages || [];

        const isEdit = !!negocio;
        const etapaAtual = negocio ? negocio.stage : etapaInicial;

        const html = `
            <div class="form-group"><label>Título *</label><input type="text" id="neg-titulo" class="form-control" value="${AppModule.escapeHtml(negocio?.titulo || '')}"></div>
            <div class="form-group"><label>Cliente</label>
                <select id="neg-cliente" class="form-control">
                    <option value="">— Sem cliente —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${negocio?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Serviço</label>
                    <select id="neg-servico" class="form-control">
                        <option value="">— Selecionar —</option>
                        ${servicos.map(s => `<option value="${AppModule.escapeHtml(s)}" ${negocio?.servico === s ? 'selected' : ''}>${AppModule.escapeHtml(s)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Valor (R$)</label><input type="number" id="neg-valor" class="form-control" step="0.01" value="${negocio?.valor || 0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Etapa</label>
                    <select id="neg-stage" class="form-control">
                        ${etapas.map(e => `<option value="${AppModule.escapeHtml(e)}" ${etapaAtual === e ? 'selected' : ''}>${AppModule.escapeHtml(e)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Probabilidade (%)</label><input type="number" id="neg-prob" class="form-control" min="0" max="100" value="${negocio?.probabilidade || 0}"></div>
            </div>
            <div class="form-group"><label>Descrição</label><textarea id="neg-desc" class="form-control" rows="3">${AppModule.escapeHtml(negocio?.descricao || '')}</textarea></div>
            <div class="form-grid">
                <div class="form-group"><label>Origem do Lead</label><input type="text" id="neg-origem" class="form-control" value="${AppModule.escapeHtml(negocio?.origemLead || '')}"></div>
                <div class="form-group"><label>Campanha</label><input type="text" id="neg-campanha" class="form-control" value="${AppModule.escapeHtml(negocio?.campanha || '')}"></div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.salvar('${negocio?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Cotação' : 'Nova Cotação', html, footer);
    },

    salvar(id) {
        const titulo = document.getElementById('neg-titulo').value.trim();
        if (!titulo) {
            AppModule.toast('Informe o título da cotação.');
            return;
        }

        const negocios = DB.get('negocios', []);
        const index = negocios.findIndex(n => n.id === id);
        const clienteId = document.getElementById('neg-cliente').value;

        const dados = {
            id: id || AppModule.generateId(),
            titulo,
            clienteId,
            servico: document.getElementById('neg-servico').value,
            valor: parseFloat(document.getElementById('neg-valor').value) || 0,
            stage: document.getElementById('neg-stage').value,
            probabilidade: parseFloat(document.getElementById('neg-prob').value) || 0,
            descricao: document.getElementById('neg-desc').value.trim(),
            origemLead: document.getElementById('neg-origem').value.trim(),
            campanha: document.getElementById('neg-campanha').value.trim(),
            criadoEm: negocio_existente(negocios, index)?.criadoEm || new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        if (index >= 0) {
            negocios[index] = { ...negocios[index], ...dados };
        } else {
            negocios.push(dados);
        }

        DB.set('negocios', negocios);
        AppModule.addAtividade(`Negócio "${titulo}" salvo`, 'pipeline');
        AppModule.closeModal();
        AppModule.toast('Cotação salva!');
        this.render();
    },

    excluir(id) {
        if (!confirm('Excluir esta cotação?')) return;
        const negocios = DB.get('negocios', []).filter(n => n.id !== id);
        DB.set('negocios', negocios);
        AppModule.toast('Cotação excluída.');
        this.render();
    }
};

// Helper para preservar criadoEm ao editar
function negocio_existente(lista, index) {
    return index >= 0 ? lista[index] : null;
}
