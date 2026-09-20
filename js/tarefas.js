const TarefasModule = {
    render() {
        const tarefas = DB.get('tarefas', []);
        const busca = (document.getElementById('tarefas-busca')?.value || '').toLowerCase();
        const filtroStatus = document.getElementById('tarefas-filtro-status')?.value || '';
        const filtroPrioridade = document.getElementById('tarefas-filtro-prioridade')?.value || '';

        const filtradas = tarefas.filter(t => {
            if (busca && !t.titulo.toLowerCase().includes(busca) && !(t.descricao || '').toLowerCase().includes(busca)) return false;
            if (filtroStatus && t.status !== filtroStatus) return false;
            if (filtroPrioridade && t.prioridade !== filtroPrioridade) return false;
            return true;
        }).sort((a, b) => {
            const ordem = { alta: 0, media: 1, baixa: 2 };
            if (a.status === 'concluida' && b.status !== 'concluida') return 1;
            if (b.status === 'concluida' && a.status !== 'concluida') return -1;
            if (ordem[a.prioridade] !== ordem[b.prioridade]) return ordem[a.prioridade] - ordem[b.prioridade];
            return new Date(a.prazo || '9999') - new Date(b.prazo || '9999');
        });

        const container = document.getElementById('tarefas-list');
        if (!filtradas.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma tarefa encontrada.</p>';
            return;
        }

        container.innerHTML = filtradas.map(t => {
            const atrasada = this.verificarAtraso(t);
            const clienteNome = t.cliente_id ? DB.getClienteNome(t.cliente_id) : '';
            const negocio = t.negocio_id ? DB.get('negocios', []).find(n => n.id === t.negocio_id) : null;

            return `
                <div class="tarefa-item ${t.status === 'concluida' ? 'tarefa-concluida' : ''} ${atrasada ? 'tarefa-atrasada' : ''}">
                    <div class="tarefa-check">
                        <input type="checkbox" ${t.status === 'concluida' ? 'checked' : ''} onchange="TarefasModule.alternarStatus('${t.id}')">
                    </div>
                    <div class="tarefa-info">
                        <div class="tarefa-titulo">${AppModule.escapeHtml(t.titulo)}</div>
                        ${t.descricao ? `<div class="tarefa-desc">${AppModule.escapeHtml(t.descricao)}</div>` : ''}
                        <div class="tarefa-meta">
                            <span class="badge badge-${this.corPrioridade(t.prioridade)}">${t.prioridade || 'média'}</span>
                            ${t.prazo ? `<span class="tarefa-prazo ${atrasada ? 'atrasada' : ''}">📅 ${AppModule.formatDate(t.prazo)}${atrasada ? ' ⚠️' : ''}</span>` : ''}
                            ${clienteNome ? `<span>👤 ${AppModule.escapeHtml(clienteNome)}</span>` : ''}
                            ${negocio ? `<span>🎯 ${AppModule.escapeHtml(negocio.titulo)}</span>` : ''}
                        </div>
                    </div>
                    <div class="tarefa-acoes">
                        <button class="btn btn-sm btn-secondary" onclick="TarefasModule.editar('${t.id}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="TarefasModule.excluir('${t.id}')">Excluir</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    verificarAtraso(t) {
        if (t.status === 'concluida' || !t.prazo) return false;
        return new Date(t.prazo + 'T23:59:59') < new Date();
    },

    corPrioridade(p) {
        return { alta: 'danger', media: 'warning', baixa: 'info' }[p] || 'gray';
    },

    novaTarefa() {
        this.abrirFormulario();
    },

    editar(id) {
        const t = DB.get('tarefas', []).find(x => x.id === id);
        if (t) this.abrirFormulario(t);
    },

    abrirFormulario(tarefa = null) {
        const clientes = DB.get('clientes', []);
        const negocios = DB.get('negocios', []);
        const isEdit = !!tarefa;

        const html = `
            <div class="form-group"><label>Título *</label><input type="text" id="tar-titulo" class="form-control" value="${AppModule.escapeHtml(tarefa?.titulo || '')}"></div>
            <div class="form-group"><label>Descrição</label><textarea id="tar-descricao" class="form-control" rows="3">${AppModule.escapeHtml(tarefa?.descricao || '')}</textarea></div>
            <div class="form-grid">
                <div class="form-group"><label>Prioridade</label>
                    <select id="tar-prioridade" class="form-control">
                        <option value="baixa" ${tarefa?.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                        <option value="media" ${!tarefa?.prioridade || tarefa?.prioridade === 'media' ? 'selected' : ''}>Média</option>
                        <option value="alta" ${tarefa?.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                    </select>
                </div>
                <div class="form-group"><label>Status</label>
                    <select id="tar-status" class="form-control">
                        <option value="pendente" ${!tarefa?.status || tarefa?.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="em_andamento" ${tarefa?.status === 'em_andamento' ? 'selected' : ''}>Em andamento</option>
                        <option value="concluida" ${tarefa?.status === 'concluida' ? 'selected' : ''}>Concluída</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Prazo</label><input type="date" id="tar-prazo" class="form-control" value="${AppModule.escapeHtml(tarefa?.prazo || '')}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Vincular Cliente</label>
                    <select id="tar-cliente" class="form-control">
                        <option value="">— Nenhum —</option>
                        ${clientes.map(c => `<option value="${c.id}" ${tarefa?.cliente_id === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Vincular Negócio</label>
                    <select id="tar-negocio" class="form-control">
                        <option value="">— Nenhum —</option>
                        ${negocios.map(n => `<option value="${n.id}" ${tarefa?.negocio_id === n.id ? 'selected' : ''}>${AppModule.escapeHtml(n.titulo)}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="TarefasModule.salvar('${tarefa?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Tarefa' : 'Nova Tarefa', html, footer);
    },

    salvar(id) {
        const titulo = document.getElementById('tar-titulo').value.trim();
        if (!titulo) {
            AppModule.toast('Informe o título da tarefa.');
            return;
        }

        const tarefas = DB.get('tarefas', []);
        const index = tarefas.findIndex(t => t.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            titulo,
            descricao: document.getElementById('tar-descricao').value.trim(),
            prioridade: document.getElementById('tar-prioridade').value,
            status: document.getElementById('tar-status').value,
            prazo: document.getElementById('tar-prazo').value,
            cliente_id: document.getElementById('tar-cliente').value,
            negocio_id: document.getElementById('tar-negocio').value,
            criado_em: new Date().toISOString()
        };

        if (index >= 0) {
            tarefas[index] = { ...tarefas[index], ...dados };
        } else {
            tarefas.push(dados);
        }

        DB.set('tarefas', tarefas);
        AppModule.closeModal();
        AppModule.toast('Tarefa salva!');
        this.render();
    },

    alternarStatus(id) {
        const tarefas = DB.get('tarefas', []);
        const t = tarefas.find(x => x.id === id);
        if (!t) return;
        t.status = t.status === 'concluida' ? 'pendente' : 'concluida';
        DB.set('tarefas', tarefas);
        this.render();
    },

    excluir(id) {
        if (!confirm('Excluir esta tarefa?')) return;
        const tarefas = DB.get('tarefas', []).filter(t => t.id !== id);
        DB.set('tarefas', tarefas);
        AppModule.toast('Tarefa excluída.');
        this.render();
    }
};
