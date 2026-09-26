var PipelineModule = {
    init() {
        this.render();
    },

    getEtapas() {
        return DB.get('pipelineEtapas', [
            { id: 'etapa-1', nome: 'Novo', ordem: 1 },
            { id: 'etapa-2', nome: 'Em negociação', ordem: 2 },
            { id: 'etapa-3', nome: 'Proposta enviada', ordem: 3 },
            { id: 'etapa-4', nome: 'Fechado (ganho)', ordem: 4 },
            { id: 'etapa-5', nome: 'Fechado (perdido)', ordem: 5 }
        ]);
    },

    getNegocios() {
        return DB.get('negocios', []);
    },

    getServicos() {
        return DB.get('servicos', ['Emissão de Passagens', 'Pacote de Viagem', 'Hotel', 'Seguro Viagem', 'Aluguel de Carro', 'Consultoria']);
    },

    render() {
        const board = document.getElementById('pipeline-board');
        if (!board) return;
        const etapas = this.getEtapas().sort((a, b) => a.ordem - b.ordem);
        const negocios = this.getNegocios();

        board.innerHTML = etapas.map(etapa => {
            const cards = negocios.filter(n => n.status === etapa.nome);
            return `
                <div class="pipeline-col" data-status="${AppModule.escapeHtml(etapa.nome)}">
                    <div class="pipeline-col-header">${AppModule.escapeHtml(etapa.nome)}</div>
                    <div class="pipeline-col-body" ondrop="PipelineModule.drop(event)" ondragover="PipelineModule.allowDrop(event)">
                        ${cards.map(n => this.cardHtml(n)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },

    cardHtml(n) {
        const cliente = (DB.get('clientes', []).find(c => c.id === n.clienteId) || {}).nome || '—';
        return `
            <div class="pipeline-card" draggable="true" ondragstart="PipelineModule.drag(event)" data-id="${n.id}">
                <div class="pipeline-card-title">${AppModule.escapeHtml(n.titulo)}</div>
                <div class="pipeline-card-meta">${AppModule.escapeHtml(cliente)}</div>
                <div class="pipeline-card-meta">${AppModule.escapeHtml(n.servico)} • ${AppModule.formatCurrency(n.valor)}</div>
            </div>
        `;
    },

    allowDrop(ev) { ev.preventDefault(); },

    drag(ev) { ev.dataTransfer.setData('text', ev.target.dataset.id); },

    drop(ev) {
        ev.preventDefault();
        const id = ev.dataTransfer.getData('text');
        const col = ev.target.closest('.pipeline-col');
        if (!col) return;
        const novoStatus = col.dataset.status;
        const negocios = this.getNegocios();
        const neg = negocios.find(n => n.id === id);
        if (!neg || neg.status === novoStatus) return;

        if (novoStatus === 'Fechado (ganho)' && this.ehEmissaoPassagens(neg.servico)) {
            this.abrirModalFechamentoEmissao(neg, novoStatus);
            return;
        }

        neg.status = novoStatus;
        if (novoStatus === 'Fechado (ganho)') neg.dataFechamento = new Date().toISOString().slice(0, 10);
        DB.set('negocios', negocios);
        this.render();
        AppModule.toast(`Negócio movido para ${novoStatus}`);
    },

    ehEmissaoPassagens(servico) {
        const s = (servico || '').toLowerCase();
        return s.includes('emissão') && s.includes('passagen');
    },

    abrirModalFechamentoEmissao(neg, novoStatus) {
        this._negocioFechamento = neg;
        this._novoStatusFechamento = novoStatus;

        const cliente = DB.get('clientes', []).find(c => c.id === neg.clienteId);
        const programasCliente = (typeof MilhasModule !== 'undefined' && MilhasModule.getProgramasCliente)
            ? MilhasModule.getProgramasCliente(cliente.id)
            : [];
        const programasPadrao = DB.get('programasFidelidade', ['Smiles', 'LATAM Pass', 'TudoAzul', 'Livelo']);
        const opcoesPrograma = programasCliente.length
            ? programasCliente.map(p => `<option value="${AppModule.escapeHtml(p.programa || p.nome)}">${AppModule.escapeHtml(p.programa || p.nome)}</option>`).join('')
            : programasPadrao.map(p => `<option value="${AppModule.escapeHtml(p)}">${AppModule.escapeHtml(p)}</option>`).join('');

        const hoje = new Date().toISOString().slice(0, 10);
        const html = `
            <div class="form-group"><label>Cliente</label><input type="text" class="form-control" value="${AppModule.escapeHtml(cliente?.nome || '—')}" disabled></div>
            <div class="form-group"><label>Serviço</label><input type="text" class="form-control" value="${AppModule.escapeHtml(neg.servico)}" disabled></div>
            <div class="form-grid">
                <div class="form-group"><label>Origem *</label><input type="text" id="fech-origem" class="form-control" placeholder="GRU"></div>
                <div class="form-group"><label>Destino *</label><input type="text" id="fech-destino" class="form-control" placeholder="MIA"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Data da Ida *</label><input type="date" id="fech-data-ida" class="form-control" value="${hoje}"></div>
                <div class="form-group"><label>Data da Volta</label><input type="date" id="fech-data-volta" class="form-control"></div>
            </div>
            <div class="form-group"><label>Programa de Fidelidade *</label>
                <select id="fech-programa" class="form-control">${opcoesPrograma}</select>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Milhas Utilizadas *</label><input type="number" id="fech-milhas" class="form-control" value="0"></div>
                <div class="form-group"><label>Taxas (R$) *</label><input type="number" id="fech-taxas" class="form-control" step="0.01" value="0"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Valor de Mercado (R$) *</label><input type="number" id="fech-mercado" class="form-control" step="0.01" value="${parseFloat(neg.valor) || 0}"></div>
                <div class="form-group"><label>Custo da Milha (R$)</label><input type="number" id="fech-custo" class="form-control" step="0.0001" placeholder="Padrão"></div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.confirmarFechamentoEmissao()">Confirmar Fechamento</button>
        `;

        AppModule.openModal('Fechamento - Emissão de Passagens', html, footer);
    },

    confirmarFechamentoEmissao() {
        const neg = this._negocioFechamento;
        const novoStatus = this._novoStatusFechamento;
        const clienteId = neg.clienteId;

        const origem = document.getElementById('fech-origem').value.trim().toUpperCase();
        const destino = document.getElementById('fech-destino').value.trim().toUpperCase();
        const dataIda = document.getElementById('fech-data-ida').value;
        const dataVolta = document.getElementById('fech-data-volta').value;
        const programa = document.getElementById('fech-programa').value;
        const milhas = parseInt(document.getElementById('fech-milhas').value) || 0;
        const taxas = parseFloat(document.getElementById('fech-taxas').value) || 0;
        const mercado = parseFloat(document.getElementById('fech-mercado').value) || 0;
        const custoInput = document.getElementById('fech-custo').value;
        const custoMilha = custoInput !== '' ? parseFloat(custoInput) : null;

        if (!origem || !destino || !dataIda || !programa || !milhas) {
            AppModule.toast('Preencha origem, destino, data da ida, programa e milhas.');
            return;
        }

        // 1. Criar viagem
        const viagens = DB.get('viagens', []);
        const novaViagem = {
            id: AppModule.generateId(),
            clienteId,
            origem,
            destino,
            dataIda,
            dataVolta: dataVolta || null,
            checkinFeito: false,
            observacao: `Voo ${origem} → ${destino}`,
            dataCriacao: new Date().toISOString()
        };
        viagens.push(novaViagem);
        DB.set('viagens', viagens);

        // 2. Criar venda
        const vendas = DB.get('vendas', []);
        const novaVenda = {
            id: AppModule.generateId(),
            clienteId,
            servico: neg.servico,
            status: 'Novo',
            valor: mercado,
            data: new Date().toISOString().slice(0, 10),
            observacoes: `Origem: ${origem} | Destino: ${destino} | Ida: ${dataIda}${dataVolta ? ' | Volta: ' + dataVolta : ''}`,
            origemPipeline: true
        };
        vendas.push(novaVenda);
        DB.set('vendas', vendas);

        // 3. Criar emissão em milhas
        const milhasData = DB.get('milhas', {});
        if (!Array.isArray(milhasData.emissoes)) milhasData.emissoes = [];
        const novaEmissao = {
            id: AppModule.generateId(),
            clienteId,
            programa,
            data: new Date().toISOString().slice(0, 10),
            origem,
            destino,
            milhasUtilizadas: milhas,
            taxas,
            valorMercado: mercado,
            custoMilha: custoMilha
        };
        milhasData.emissoes.push(novaEmissao);
        DB.set('milhas', milhasData);

        // 4. Criar eventos no calendário
        const eventos = DB.get('eventos', []);
        eventos.push({
            id: AppModule.generateId(),
            tipo: 'viagem',
            titulo: `✈️ Ida: ${origem} → ${destino}`,
            data: dataIda,
            clienteId,
            referenciaId: novaViagem.id
        });
        if (dataVolta) {
            eventos.push({
                id: AppModule.generateId(),
                tipo: 'viagem',
                titulo: `✈️ Volta: ${destino} → ${origem}`,
                data: dataVolta,
                clienteId,
                referenciaId: novaViagem.id
            });
        }
        DB.set('eventos', eventos);

        // Atualiza negócio
        const negocios = this.getNegocios();
        const n = negocios.find(x => x.id === neg.id);
        if (n) {
            n.status = novoStatus;
            n.dataFechamento = new Date().toISOString().slice(0, 10);
            n.viagemId = novaViagem.id;
            n.vendaId = novaVenda.id;
            n.emissaoId = novaEmissao.id;
        }
        DB.set('negocios', negocios);

        AppModule.closeModal();
        this.render();
        AppModule.toast('Fechamento realizado: viagem, venda e emissão criadas!');

        delete this._negocioFechamento;
        delete this._novoStatusFechamento;
    },

    // ============ CRUD NEGÓCIOS ============
    novoNegocio() { this.abrirFormNegocio(); },

    editarNegocio(id) {
        const n = this.getNegocios().find(x => x.id === id);
        if (n) this.abrirFormNegocio(n);
    },

    abrirFormNegocio(negocio = null) {
        const isEdit = !!negocio;
        const clientes = DB.get('clientes', []);
        const etapas = this.getEtapas().sort((a, b) => a.ordem - b.ordem);
        const servicos = this.getServicos();

        const html = `
            <div class="form-group"><label>Cliente *</label>
                <select id="neg-cliente" class="form-control">
                    <option value="">— Selecionar —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${negocio?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Título *</label><input type="text" id="neg-titulo" class="form-control" value="${AppModule.escapeHtml(negocio?.titulo || '')}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Serviço *</label>
                    <select id="neg-servico" class="form-control">
                        ${servicos.map(s => `<option value="${AppModule.escapeHtml(s)}" ${negocio?.servico === s ? 'selected' : ''}>${AppModule.escapeHtml(s)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Valor (R$)</label><input type="number" id="neg-valor" class="form-control" step="0.01" value="${negocio?.valor || 0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Status</label>
                    <select id="neg-status" class="form-control">
                        ${etapas.map(e => `<option value="${AppModule.escapeHtml(e.nome)}" ${negocio?.status === e.nome ? 'selected' : ''}>${AppModule.escapeHtml(e.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Data de Fechamento</label><input type="date" id="neg-data-fechamento" class="form-control" value="${negocio?.dataFechamento || ''}"></div>
            </div>
            <div class="form-group"><label>Observações</label><textarea id="neg-obs" class="form-control" rows="2">${AppModule.escapeHtml(negocio?.observacoes || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="PipelineModule.salvarNegocio('${negocio?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Cotação' : 'Nova Cotação', html, footer);
    },

    salvarNegocio(id) {
        const clienteId = document.getElementById('neg-cliente').value;
        const titulo = document.getElementById('neg-titulo').value.trim();
        const servico = document.getElementById('neg-servico').value;
        if (!clienteId || !titulo || !servico) { AppModule.toast('Preencha cliente, título e serviço.'); return; }

        const negocios = this.getNegocios();
        const index = negocios.findIndex(n => n.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            clienteId,
            titulo,
            servico,
            valor: parseFloat(document.getElementById('neg-valor').value) || 0,
            status: document.getElementById('neg-status').value,
            dataFechamento: document.getElementById('neg-data-fechamento').value || null,
            observacoes: document.getElementById('neg-obs').value.trim()
        };

        if (index >= 0) {
            negocios[index] = { ...negocios[index], ...dados };
        } else {
            negocios.push(dados);
        }

        DB.set('negocios', negocios);
        AppModule.closeModal();
        AppModule.toast('Cotação salva!');
        this.render();
    },

    excluirNegocio(id) {
        if (!confirm('Excluir esta cotação?')) return;
        const negocios = this.getNegocios().filter(n => n.id !== id);
        DB.set('negocios', negocios);
        AppModule.toast('Cotação excluída.');
        this.render();
    }
};
