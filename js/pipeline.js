const PipelineModule = {
    render() {
        const negocios = DB.get('negocios', []);
        const config = DB.get('config', {});
        const etapas = config.pipeline || [];
        const board = document.getElementById('pipeline-board');

        board.innerHTML = etapas.map(etapa => {
            const itens = negocios.filter(n => n.etapa === etapa);
            return `
                <div class="pipeline-col">
                    <div class="pipeline-col-header">${AppModule.escapeHtml(etapa)} (${itens.length})</div>
                    ${itens.map(n => `
                        <div class="pipeline-card" onclick="PipelineModule.editar('${n.id}')">
                            <div class="pipeline-card-title">${AppModule.escapeHtml(n.titulo)}</div>
                            <div class="pipeline-card-meta">${AppModule.escapeHtml(n.cliente_nome || '')}</div>
                            <div class="pipeline-card-meta">${AppModule.formatCurrency(n.valor)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('');
    },

    novoNegocio() {
        this.abrirFormulario();
    },

    editar(id) {
        const negocio = DB.get('negocios', []).find(n => n.id === id);
        if (negocio) this.abrirFormulario(negocio);
    },

    abrirFormulario(negocio = null) {
        const isEdit = !!negocio;
        const clientes = DB.get('clientes', []);
        const config = DB.get('config', {});
        const etapas = config.pipeline || [];

        const html = `
            <div class="form-group"><label>Título *</label><input type="text" id="neg-titulo" class="form-control" value="${AppModule.escapeHtml(negocio?.titulo || '')}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Cliente</label>
                    <select id="neg-cliente" class="form-control">
                        <option value="">Selecione...</option>
                        ${clientes.map(c => `<option value="${c.id}" ${negocio?.cliente_id === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Valor</label><input type="number" id="neg-valor" class="form-control" step="0.01" value="${AppModule.escapeHtml(negocio?.valor || '')}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Etapa</label>
                    <select id="neg-etapa" class="form-control">
                        ${etapas.map(e => `<option value="${AppModule.escapeHtml(e)}" ${negocio?.etapa === e ? 'selected' : ''}>${AppModule.escapeHtml(e)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Data de Fechamento</label><input type="date" id="neg-data-fechamento" class="form-control" value="${AppModule.escapeHtml(negocio?.data_fechamento || '')}"></div>
            </div>
            <div class="form-group"><label>Descrição</label><textarea id="neg-descricao" class="form-control" rows="3">${AppModule.escapeHtml(negocio?.descricao || '')}</textarea></div>
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
            AppModule.toast('Preencha o título da cotação.');
            return;
        }

        const clientes = DB.get('clientes', []);
        const clienteId = document.getElementById('neg-cliente').value;
        const cliente = clientes.find(c => c.id === clienteId);

        const negocios = DB.get('negocios', []);
        const index = negocios.findIndex(n => n.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            titulo,
            cliente_id: clienteId,
            cliente_nome: cliente ? cliente.nome : '',
            valor: parseFloat(document.getElementById('neg-valor').value) || 0,
            etapa: document.getElementById('neg-etapa').value,
            data_fechamento: document.getElementById('neg-data-fechamento').value,
            descricao: document.getElementById('neg-descricao').value.trim(),
            data_criacao: new Date().toISOString()
        };

        if (index >= 0) {
            negocios[index] = { ...negocios[index], ...dados };
            AppModule.addAtividade(`Cotação ${titulo} atualizada.`);
        } else {
            negocios.push(dados);
            AppModule.addAtividade(`Cotação ${titulo} criada.`);
        }

        DB.set('negocios', negocios);
        AppModule.closeModal();
        AppModule.toast('Cotação salva com sucesso!');
        this.render();
    },

    excluir(id) {
        if (!confirm('Deseja excluir esta cotação?')) return;
        const negocios = DB.get('negocios', []).filter(n => n.id !== id);
        DB.set('negocios', negocios);
        AppModule.addAtividade('Cotação excluída.');
        AppModule.toast('Cotação excluída.');
        this.render();
    }
};
