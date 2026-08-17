/* ============================================================
   crm.js — Pipeline Kanban + Data de Fechamento + Automações
   ============================================================ */

const CRMModule = {
    init() { this.render(); },
    refresh() { this.render(); },

    render() {
        const stages = DB.getPipelineStages();
        const negocios = DB.getNegocios();
        const clientes = DB.getClientes();
        const container = document.getElementById('pipeline-container');
        if (!container) return;

        if (!stages.length) {
            container.innerHTML = '<p style="padding:24px;text-align:center;color:var(--gray-500);">Configure as etapas do pipeline nas ⚙️ Configurações</p>';
            return;
        }

        container.innerHTML = stages.map(stage => {
            const cards = negocios.filter(n => n.stage === stage);
            return `
                <div class="kanban-coluna" data-stage="${stage}"
                     ondragover="CRMModule.allowDrop(event)"
                     ondrop="CRMModule.drop(event, '${stage.replace(/'/g, "\\'")}')">
                    <div class="kanban-header">
                        <span class="kanban-titulo">${stage}</span>
                        <span class="kanban-count">${cards.length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${cards.map(n => this.renderCard(n, clientes)).join('')}
                    </div>
                    <button class="btn-kanban-add" onclick="CRMModule.abrirModalNegocio('${stage.replace(/'/g, "\\'")}')">+ Adicionar</button>
                </div>
            `;
        }).join('');
    },

    renderCard(negocio, clientes) {
        const cliente = clientes.find(c => c.id === negocio.clienteId);
        const valor = negocio.valor ? 'R$ ' + Number(negocio.valor).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) : '';
        const origemBadge = negocio.origemLead ? `<span class="badge badge-origem">📌 ${negocio.origemLead}</span>` : '';
        const campanhaTag = negocio.campanha ? `<span class="badge badge-campanha">📢 ${negocio.campanha}</span>` : '';
        const probabilidade = negocio.probabilidade ? `<span class="kanban-probabilidade">${negocio.probabilidade}%</span>` : '';

        return `
            <div class="kanban-card" draggable="true" data-id="${negocio.id}"
                 ondragstart="CRMModule.drag(event)"
                 ondblclick="CRMModule.abrirModalNegocio(null, '${negocio.id}')">
                <div class="kanban-card-cliente-destaque">👤 ${cliente ? cliente.nome : 'Sem cliente'}${probabilidade}</div>
                <div class="kanban-card-titulo">${negocio.titulo}</div>
                ${valor ? `<div class="kanban-card-valor">${valor}</div>` : ''}
                <div class="kanban-card-badges">${origemBadge}${campanhaTag}</div>
                <div class="kanban-card-actions">
                    <button class="btn-sm" onclick="event.stopPropagation();CRMModule.abrirModalNegocio(null,'${negocio.id}')">✏️</button>
                    <button class="btn-sm btn-sm-danger" onclick="event.stopPropagation();CRMModule.excluirNegocio('${negocio.id}')">🗑️</button>
                </div>
            </div>
        `;
    },

    /* ========== DRAG & DROP ========== */
    drag(ev) { ev.dataTransfer.setData('text/plain', ev.target.closest('.kanban-card').dataset.id); },
    allowDrop(ev) { ev.preventDefault(); },

    drop(ev, newStage) {
        ev.preventDefault();
        const negocioId = ev.dataTransfer.getData('text/plain');
        if (!negocioId) return;
        const negocio = DB.getNegocios().find(n => n.id === negocioId);
        if (!negocio) return;

        const oldStage = negocio.stage;

        // Transferência para Fechado (Ganho): pede data de fechamento
        if (this.isFechadoGanho(newStage) && oldStage !== newStage && !negocio.vendaId) {
            this.solicitarDataFechamento(negocio, newStage);
        } else {
            negocio.stage = newStage;
            negocio.atualizadoEm = new Date().toISOString();
            DB.saveNegocio(negocio);
            this.render();
        }
    },

    isFechadoGanho(stage) {
        const s = (stage || '').toLowerCase();
        return s.includes('fechado') && s.includes('ganho');
    },

    /* ========== POPUP DE DATA DE FECHAMENTO ========== */
    solicitarDataFechamento(negocio, newStage) {
        const hoje = new Date().toISOString().split('T')[0];
        const html = `
            <div class="form-group">
                <label>📅 Data do Fechamento *</label>
                <input type="date" id="fechamento-data" value="${hoje}" required>
            </div>
            <p style="font-size:12px;color:var(--gray-500);">
                Esta data será usada nos cálculos mensais do dashboard financeiro.
            </p>
        `;
        AppModule.abrirModal('Confirmar Fechamento', html, [
            { label: 'Cancelar', class: 'btn-outline', action: () => AppModule.fecharModal() },
            { label: '✅ Confirmar Fechamento', class: 'btn-primary', action: () => this.confirmarFechamento(negocio.id, newStage) }
        ]);
    },

    confirmarFechamento(negocioId, newStage) {
        const negocio = DB.getNegocios().find(n => n.id === negocioId);
        if (!negocio) return;

        const data = document.getElementById('fechamento-data').value;
        if (!data) { AppModule.showToast('Informe a data do fechamento!', 'error'); return; }

        negocio.stage = newStage;
        negocio.dataFechamento = data;
        negocio.atualizadoEm = new Date().toISOString();
        DB.saveNegocio(negocio);

        // 1. Cria venda automaticamente
        this.criarVendaAutomatica(negocio);

        // 2. Cria viagem se serviço for de passagens/pacote
        this.criarViagemAutomatica(negocio);

        // 3. Cria card de gestão de milhas se serviço for "grupo wpp"
        this.criarMilhasAutomatica(negocio);

        AppModule.fecharModal();
        this.render();
        AppModule.showToast('Negócio fechado com sucesso! 🎉', 'success');
    },

    /* ========== CRIAÇÃO AUTOMÁTICA DE VENDA ========== */
    criarVendaAutomatica(negocio) {
        const venda = {
            id: DB.gerarId('venda'),
            negocioId: negocio.id,
            clienteId: negocio.clienteId,
            titulo: negocio.titulo,
            servico: negocio.servico || '',
            valorOriginal: negocio.valor || 0,
            valorVenda: negocio.valor || 0,
            tipoVenda: 'dinheiro',
            nomeTerceiro: '',
            dataFechamento: negocio.dataFechamento || '',
            novo: true,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        DB.saveVenda(venda);
        negocio.vendaId = venda.id;
        DB.saveNegocio(negocio);
    },

    /* ========== CRIAÇÃO AUTOMÁTICA DE VIAGEM ========== */
    criarViagemAutomatica(negocio) {
        const servico = (negocio.servico || '').toLowerCase();
        const precisaViagem =
            servico.includes('emissão de passagens') ||
            servico.includes('emissao de passagens') ||
            servico.includes('pacote de viagem') ||
            servico.includes('pacote completo');
        if (!precisaViagem) return;

        const viagem = {
            id: DB.gerarId('viagem'),
            clienteId: negocio.clienteId,
            destino: '',
            dataIda: '',
            dataVolta: '',
            servico: negocio.servico,
            companhia: '',
            valor: negocio.valor || 0,
            status: 'Pendente',
            necessitaCheckin: 'sim',
            checkin: null,
            origem: 'automatica',
            negocioId: negocio.id,
            vendaId: negocio.vendaId || '',
            notas: 'Criada automaticamente a partir do pipeline',
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        DB.saveViagem(viagem);
        DB.logAtividade('viagem', `Viagem criada automaticamente: ${negocio.titulo}`);
        AppModule.showToast('✈️ Viagem criada automaticamente!', 'info');
    },

    /* ========== CRIAÇÃO AUTOMÁTICA DE CARD DE MILHAS ========== */
    criarMilhasAutomatica(negocio) {
        const servico = (negocio.servico || '').toLowerCase();
        if (!servico.includes('grupo wpp') && !servico.includes('grupo whatsapp')) return;

        const milha = {
            id: DB.gerarId('milha'),
            negocioId: negocio.id,
            clienteId: negocio.clienteId,
            titulo: negocio.titulo,
            tipoPlano: 'Gestão Mensal',
            diagnostico: '',
            objetivo: '',
            dataFechamento: negocio.dataFechamento || '',
            dataApresentacaoDiagnostico: '',
            dataApresentacaoPlano: '',
            dataApresentacaoRelatorio: '',
            status: 'Em andamento',
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        DB.saveMilha(milha);
        DB.logAtividade('milhas', `Card de Gestão de Milhas criado: ${negocio.titulo}`);
        AppModule.showToast('💎 Card de Gestão de Milhas criado!', 'info');
    },

    /* ========== MODAL DE NEGÓCIO ========== */
    abrirModalNegocio(stagePredefinida, negocioId) {
        const negocio = negocioId ? DB.getNegocios().find(n => n.id === negocioId) : null;
        const clientes = DB.getClientes();
        const stages = DB.getPipelineStages();
        const origens = DB.getOrigensLead();
        const servicos = DB.getServicos();
        const stage = negocio ? negocio.stage : (stagePredefinida || stages[0]);

        const optionsClientes = clientes.map(c => `<option value="${c.id}" ${negocio && negocio.clienteId === c.id ? 'selected' : ''}>${c.nome}</option>`).join('');
        const optionsStages = stages.map(s => `<option value="${s}" ${stage === s ? 'selected' : ''}>${s}</option>`).join('');
        const optionsOrigens = origens.map(o => `<option value="${o}" ${negocio && negocio.origemLead === o ? 'selected' : ''}>${o}</option>`).join('');
        const optionsServicos = servicos.map(s => `<option value="${s}" ${negocio && negocio.servico === s ? 'selected' : ''}>${s}</option>`).join('');

        const html = `
            <form id="form-negocio" onsubmit="CRMModule.salvarNegocio(event, '${negocioId || ''}')">
                <input type="hidden" id="neg-id" value="${negocio ? negocio.id : ''}">
                <div class="form-group"><label>Título do Negócio *</label><input type="text" id="neg-titulo" value="${negocio ? negocio.titulo : ''}" required></div>
                <div class="form-row">
                    <div class="form-group"><label>Cliente</label><select id="neg-cliente"><option value="">Selecione...</option>${optionsClientes}</select></div>
                    <div class="form-group"><label>Serviço</label><select id="neg-servico"><option value="">Selecione...</option>${optionsServicos}</select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Valor (R$)</label><input type="number" id="neg-valor" step="0.01" value="${negocio ? negocio.valor || '' : ''}"></div>
                    <div class="form-group"><label>Probabilidade (%)</label><input type="number" id="neg-probabilidade" min="0" max="100" value="${negocio ? negocio.probabilidade || '' : ''}"></div>
                </div>
                <div class="form-group"><label>Etapa</label><select id="neg-stage">${optionsStages}</select></div>
                <div class="form-row">
                    <div class="form-group"><label>📌 Origem do Lead</label><select id="neg-origem"><option value="">Selecione...</option>${optionsOrigens}</select></div>
                    <div class="form-group"><label>📢 Nome da Campanha</label><input type="text" id="neg-campanha" value="${negocio ? negocio.campanha || '' : ''}" placeholder="Ex: Férias de Verão 2026"></div>
                </div>
                <div class="form-group"><label>Descrição</label><textarea id="neg-descricao" rows="3">${negocio ? negocio.descricao || '' : ''}</textarea></div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="AppModule.fecharModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">💾 Salvar</button>
                </div>
            </form>
        `;
        AppModule.abrirModal(negocio ? 'Editar Negócio' : 'Novo Negócio', html);
    },

    salvarNegocio(event, editId) {
        event.preventDefault();
        const newStage = document.getElementById('neg-stage').value;
        const negocio = {
            id: editId || DB.gerarId('negocio'),
            titulo: document.getElementById('neg-titulo').value,
            clienteId: document.getElementById('neg-cliente').value || null,
            servico: document.getElementById('neg-servico').value,
            valor: parseFloat(document.getElementById('neg-valor').value) || 0,
            probabilidade: parseInt(document.getElementById('neg-probabilidade').value) || 0,
            stage: newStage,
            origemLead: document.getElementById('neg-origem').value,
            campanha: document.getElementById('neg-campanha').value,
            descricao: document.getElementById('neg-descricao').value,
            criadoEm: editId ? (DB.getNegocios().find(n => n.id === editId)?.criadoEm || new Date().toISOString()) : new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        const existente = editId ? DB.getNegocios().find(n => n.id === editId) : null;
        if (existente) {
            negocio.vendaId = existente.vendaId;
            negocio.dataFechamento = existente.dataFechamento;
        }

        const oldStage = existente ? existente.stage : null;
        DB.saveNegocio(negocio);

        // Se moveu para Fechado (Ganho) e ainda não tem venda
        if (this.isFechadoGanho(newStage) && oldStage !== newStage && !negocio.vendaId) {
            this.solicitarDataFechamento(negocio, newStage);
            AppModule.fecharModal();
            return;
        }

        AppModule.fecharModal();
        this.render();
        AppModule.showToast('Negócio salvo com sucesso! ✅', 'success');
    },

    excluirNegocio(id) {
        if (!confirm('Tem certeza que deseja excluir este negócio?')) return;
        const negocio = DB.getNegocios().find(n => n.id === id);
        if (negocio && negocio.vendaId) DB.deleteVenda(negocio.vendaId);
        DB.deleteNegocio(id);
        this.render();
        AppModule.showToast('Negócio excluído 🗑️', 'info');
    }
};
