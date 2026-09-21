var PipelineModule = {
    negocioDrag: null,

    render() {
        const config = DB.get('config', {});
        const etapas = config.pipeline || [];
        const negocios = DB.get('negocios', []);

        const board = document.getElementById('pipeline-board');
        if (!board) return;

        board.innerHTML = etapas.map(etapa => {
            const cards = negocios.filter(n => n.stage === etapa);
            const total = cards.reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);

            return `
                <div class="pipeline-col" data-stage="${AppModule.escapeHtml(etapa)}">
                    <div class="pipeline-col-header">
                        <div>
                            <div class="pipeline-col-title">${AppModule.escapeHtml(etapa)}</div>
                            <div class="pipeline-col-total">${AppModule.formatCurrency(total)}</div>
                        </div>
                        <div class="pipeline-col-count">${cards.length}</div>
                    </div>
                    <div class="pipeline-col-body" ondrop="PipelineModule.drop(event)" ondragover="PipelineModule.allowDrop(event)">
                        ${cards.map(n => this.cardHtml(n)).join('')}
                    </div>
                    <div class="pipeline-add" onclick="PipelineModule.novoNegocio('${AppModule.escapeHtml(etapa)}')">+ Adicionar negócio</div>
                </div>
            `;
        }).join('');
    },

    cardHtml(n) {
        const cliente = DB.getClienteNome(n.clienteId);
        return `
            <div class="pipeline-card" draggable="true" ondragstart="PipelineModule.drag(event, '${n.id}')" onclick="PipelineModule.editarNegocio('${n.id}')">
                <div class="pipeline-card-titulo">${AppModule.escapeHtml(n.titulo)}</div>
                <div class="pipeline-card-cliente">${AppModule.escapeHtml(cliente)}</div>
                <div class="pipeline-card-valor">${AppModule.formatCurrency(n.valor)}</div>
            </div>
        `;
    },

    drag(ev, id) {
        this.negocioDrag = id;
        ev.dataTransfer.effectAllowed = 'move';
    },

    allowDrop(ev) {
        ev.preventDefault();
    },

    drop(ev) {
        ev.preventDefault();
        if (!this.negocioDrag) return;

        const col = ev.target.closest('.pipeline-col');
        if (!col) return;

        const novaEtapa = col.dataset.stage;
        const negocios = DB.get('negocios', []);
        const index = negocios.findIndex(n => n.id === this.negocioDrag);
        if (index < 0) return;

        const negocio = negocios[index];
        const etapaAnterior = negocio.stage;

        if (etapaAnterior === novaEtapa) {
            this.negocioDrag = null;
            return;
        }

        negocio.stage = novaEtapa;
        negocio.atualizadoEm = new Date().toISOString();
        DB.set('negocios', negocios);

        AppModule.addAtividade(`Negócio "${negocio.titulo}" movido para ${novaEtapa}`, 'pipeline');

        // Cria tarefa automática se mudou de etapa
        this.criarTarefaAutomatica(negocio, etapaAnterior, novaEtapa);

        this.negocioDrag = null;
        AppModule.updateBadgeTarefas();
        this.render();
    },

    novoNegocio(etapaInicial = '') {
        const clientes = DB.get('clientes', []);
        const config = DB.get('config', {});
        const etapas = config.pipeline || [];
        const servicos = config.servicos || [];

        const html = `
            <div class="form-group"><label>Cliente *</label>
                <select id="neg-cliente" class="form-control">
                    <option value="">— Selecionar —</option>
                    ${clientes.map(c => `<option value="${c.id}">${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Título *</label><input type="text" id="neg-titulo" class="form-control"></div>
            <div class="form-grid">
                <div class="form-group"><label>Serviço</label>
                    <select id="neg-servico" class="form-control">
                        <option value="">— Selecionar —</option>
                        ${servicos.map(s => `<option value="${AppModule.escapeHtml(s)}">${AppModule.escapeHtml(s)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Valor (R$)</label><input type="number" id="neg-valor" class="form-control" step="0.01" value="0"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Etapa</label>
                    <select id="neg-stage" class="form-control">
                        ${etapas.map(e => `<option value="${AppModule.escapeHtml(e)}" ${etapaInicial === e ? 'selected' : ''}>${AppModule.escapeHtml(e)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Probabilidade (%)</label><input type="number" id="neg-prob" class="form-control" min="0" max="100" value="10"></div>
            </div>
            <div class="form-group"><label>Origem do Lead</label><input type="text" id="neg-origem" class="form-control" placeholder="Ex: Indicação, Instagram, Site"></div>
            <div class="form-group"><label>Campanha</label><input type="text" id="neg-campanha" class="form-control" placeholder="Ex: Black Friday 2026"></div>
            <div class="form-group"><label>Descrição</label><textarea id="neg-desc" class="form-control" rows="3"></textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.salvar('')">Salvar</button>
        `;

        AppModule.openModal('Nova Cotação', html, footer);
    },

    editarNegocio(id) {
        const negocios = DB.get('negocios', []);
        const n = negocios.find(x => x.id === id);
        if (!n) return;

        const clientes = DB.get('clientes', []);
        const config = DB.get('config', {});
        const etapas = config.pipeline || [];
        const servicos = config.servicos || [];

        const html = `
            <div class="form-group"><label>Cliente *</label>
                <select id="neg-cliente" class="form-control">
                    <option value="">— Selecionar —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${n.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Título *</label><input type="text" id="neg-titulo" class="form-control" value="${AppModule.escapeHtml(n.titulo)}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Serviço</label>
                    <select id="neg-servico" class="form-control">
                        <option value="">— Selecionar —</option>
                        ${servicos.map(s => `<option value="${AppModule.escapeHtml(s)}" ${n.servico === s ? 'selected' : ''}>${AppModule.escapeHtml(s)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Valor (R$)</label><input type="number" id="neg-valor" class="form-control" step="0.01" value="${n.valor || 0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Etapa</label>
                    <select id="neg-stage" class="form-control">
                        ${etapas.map(e => `<option value="${AppModule.escapeHtml(e)}" ${n.stage === e ? 'selected' : ''}>${AppModule.escapeHtml(e)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Probabilidade (%)</label><input type="number" id="neg-prob" class="form-control" min="0" max="100" value="${n.probabilidade || 0}"></div>
            </div>
            <div class="form-group"><label>Origem do Lead</label><input type="text" id="neg-origem" class="form-control" value="${AppModule.escapeHtml(n.origemLead || '')}"></div>
            <div class="form-group"><label>Campanha</label><input type="text" id="neg-campanha" class="form-control" value="${AppModule.escapeHtml(n.campanha || '')}"></div>
            <div class="form-group"><label>Descrição</label><textarea id="neg-desc" class="form-control" rows="3">${AppModule.escapeHtml(n.descricao || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="PipelineModule.excluir('${n.id}')">Excluir</button>
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.salvar('${n.id}')">Salvar</button>
        `;

        AppModule.openModal('Editar Cotação', html, footer);
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
        const novaEtapa = document.getElementById('neg-stage').value;

        const dados = {
            id: id || AppModule.generateId(),
            titulo,
            clienteId,
            servico: document.getElementById('neg-servico').value,
            valor: parseFloat(document.getElementById('neg-valor').value) || 0,
            stage: novaEtapa,
            probabilidade: parseFloat(document.getElementById('neg-prob').value) || 0,
            descricao: document.getElementById('neg-desc').value.trim(),
            origemLead: document.getElementById('neg-origem').value.trim(),
            campanha: document.getElementById('neg-campanha').value.trim(),
            criadoEm: index >= 0 ? negocios[index].criadoEm : new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        // Detecta mudança de etapa
        const etapaAnterior = index >= 0 ? negocios[index].stage : null;
        const mudouEtapa = etapaAnterior && etapaAnterior !== novaEtapa;

        if (index >= 0) {
            negocios[index] = { ...negocios[index], ...dados };
        } else {
            negocios.push(dados);
        }

        DB.set('negocios', negocios);
        AppModule.addAtividade(`Negócio "${titulo}" salvo`, 'pipeline');

        // Cria tarefa automática se mudou de etapa
        if (mudouEtapa) {
            this.criarTarefaAutomatica(dados, etapaAnterior, novaEtapa);
            AppModule.toast('Cotação salva! Tarefa automática criada.');
        } else {
            AppModule.toast('Cotação salva!');
        }

        AppModule.closeModal();
        AppModule.updateBadgeTarefas();
        this.render();
    },

    excluir(id) {
        if (!confirm('Excluir esta cotação?')) return;
        const negocios = DB.get('negocios', []);
        const n = negocios.find(x => x.id === id);
        DB.set('negocios', negocios.filter(n => n.id !== id));
        AppModule.addAtividade(`Negócio "${n?.titulo}" excluído`, 'pipeline');
        AppModule.toast('Cotação excluída.');
        AppModule.closeModal();
        this.render();
    },

    // Criar tarefa automática quando negócio muda de etapa
    criarTarefaAutomatica(negocio, etapaAnterior, novaEtapa) {
        const tarefas = DB.get('tarefas', []);

        let tarefaTitulo = '';
        let tarefaDesc = '';
        let prazoDias = 7;
        let prioridade = 'media';

        if (etapaAnterior === 'Novo Lead' && novaEtapa === 'Qualificado') {
            tarefaTitulo = `Qualificar lead: ${negocio.titulo}`;
            tarefaDesc = 'Entrar em contato e qualificar o lead';
            prazoDias = 3;
            prioridade = 'alta';
        } else if (etapaAnterior === 'Qualificado' && novaEtapa === 'Proposta Enviada') {
            tarefaTitulo = `Follow-up: ${negocio.titulo}`;
            tarefaDesc = 'Verificar se cliente recebeu a proposta';
            prazoDias = 5;
        } else if (etapaAnterior === 'Proposta Enviada' && novaEtapa === 'Negociação') {
            tarefaTitulo = `Negociar: ${negocio.titulo}`;
            tarefaDesc = 'Acompanhar negociação e ajustar proposta';
            prazoDias = 7;
        } else if (novaEtapa === 'Fechado (Ganho)') {
            tarefaTitulo = `Onboarding: ${negocio.titulo}`;
            tarefaDesc = 'Iniciar processo de entrega do serviço';
            prazoDias = 2;
            prioridade = 'alta';
        } else if (novaEtapa === 'Perdido') {
            tarefaTitulo = `Reativação: ${negocio.titulo}`;
            tarefaDesc = 'Entrar em contato para entender motivo da perda';
            prazoDias = 15;
            prioridade = 'baixa';
        }

        if (tarefaTitulo) {
            const prazo = new Date();
            prazo.setDate(prazo.getDate() + prazoDias);

            tarefas.push({
                id: AppModule.generateId(),
                titulo: tarefaTitulo,
                descricao: tarefaDesc,
                status: 'pendente',
                prioridade,
                prazo: prazo.toISOString().slice(0, 10),
                clienteId: negocio.clienteId,
                negocioId: negocio.id,
                automatica: true,
                criadoEm: new Date().toISOString()
            });

            DB.set('tarefas', tarefas);
            AppModule.updateBadgeTarefas();
        }
    }
};
