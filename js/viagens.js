const ViagensModule = {
    render() {
        const viagens = DB.get('viagens', []);
        const container = document.getElementById('viagens-list');

        if (!viagens.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma viagem cadastrada.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr><th>Cliente</th><th>Destino</th><th>Data Ida</th><th>Data Volta</th><th>Status</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                        ${viagens.map(v => `
                            <tr>
                                <td>${AppModule.escapeHtml(v.cliente_nome)}</td>
                                <td>${AppModule.escapeHtml(v.destino)}</td>
                                <td>${AppModule.formatDate(v.data_ida)}</td>
                                <td>${AppModule.formatDate(v.data_volta)}</td>
                                <td><span class="badge badge-info">${AppModule.escapeHtml(v.status)}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="ViagensModule.editar('${v.id}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="ViagensModule.excluir('${v.id}')">Excluir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    novaViagem() {
        this.abrirFormulario();
    },

    editar(id) {
        const viagem = DB.get('viagens', []).find(v => v.id === id);
        if (viagem) this.abrirFormulario(viagem);
    },

    abrirFormulario(viagem = null) {
        const isEdit = !!viagem;
        const clientes = DB.get('clientes', []);

        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Cliente *</label>
                    <select id="viagem-cliente" class="form-control">
                        <option value="">Selecione...</option>
                        ${clientes.map(c => `<option value="${c.id}" ${viagem?.cliente_id === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Destino *</label><input type="text" id="viagem-destino" class="form-control" value="${AppModule.escapeHtml(viagem?.destino || '')}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Data Ida</label><input type="date" id="viagem-ida" class="form-control" value="${AppModule.escapeHtml(viagem?.data_ida || '')}"></div>
                <div class="form-group"><label>Data Volta</label><input type="date" id="viagem-volta" class="form-control" value="${AppModule.escapeHtml(viagem?.data_volta || '')}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Status</label>
                    <select id="viagem-status" class="form-control">
                        <option ${viagem?.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option ${viagem?.status === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                        <option ${viagem?.status === 'Realizada' ? 'selected' : ''}>Realizada</option>
                        <option ${viagem?.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </div>
                <div class="form-group"><label>Companhia</label><input type="text" id="viagem-companhia" class="form-control" value="${AppModule.escapeHtml(viagem?.companhia || '')}"></div>
            </div>
            <div class="form-group"><label>Observações</label><textarea id="viagem-obs" class="form-control" rows="3">${AppModule.escapeHtml(viagem?.observacoes || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ViagensModule.salvar('${viagem?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Viagem' : 'Nova Viagem', html, footer);
    },

    salvar(id) {
        const clienteId = document.getElementById('viagem-cliente').value;
        const destino = document.getElementById('viagem-destino').value.trim();

        if (!clienteId || !destino) {
            AppModule.toast('Preencha cliente e destino.');
            return;
        }

        const clientes = DB.get('clientes', []);
        const cliente = clientes.find(c => c.id === clienteId);
        const viagens = DB.get('viagens', []);
        const index = viagens.findIndex(v => v.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            cliente_id: clienteId,
            cliente_nome: cliente ? cliente.nome : '',
            destino,
            data_ida: document.getElementById('viagem-ida').value,
            data_volta: document.getElementById('viagem-volta').value,
            status: document.getElementById('viagem-status').value,
            companhia: document.getElementById('viagem-companhia').value.trim(),
            observacoes: document.getElementById('viagem-obs').value.trim(),
            data_criacao: new Date().toISOString()
        };

        if (index >= 0) {
            viagens[index] = { ...viagens[index], ...dados };
            AppModule.addAtividade(`Viagem para ${destino} atualizada.`);
        } else {
            viagens.push(dados);
            AppModule.addAtividade(`Viagem para ${destino} cadastrada.`);
        }

        DB.set('viagens', viagens);
        AppModule.closeModal();
        AppModule.toast('Viagem salva com sucesso!');
        this.render();
    },

    excluir(id) {
        if (!confirm('Deseja excluir esta viagem?')) return;
        const viagens = DB.get('viagens', []).filter(v => v.id !== id);
        DB.set('viagens', viagens);
        AppModule.addAtividade('Viagem excluída.');
        AppModule.toast('Viagem excluída.');
        this.render();
    }
};
