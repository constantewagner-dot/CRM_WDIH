var ViagensModule = {
    render() {
        const viagens = DB.get('viagens', []);
        const list = document.getElementById('viagens-list');

        if (!list) return;

        if (!viagens.length) {
            list.innerHTML = '<p class="dashboard-empty">Nenhuma viagem cadastrada.</p>';
            return;
        }

        list.innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Cliente</th><th>Destino</th><th>Ida</th><th>Volta</th><th>Companhia</th><th>Status</th><th>Check-in</th><th>Ações</th></tr></thead>
                    <tbody>
                        ${viagens.sort((a, b) => new Date(b.dataIda) - new Date(a.dataIda)).map(v => `
                            <tr>
                                <td>${AppModule.escapeHtml(DB.getClienteNome(v.clienteId))}</td>
                                <td style="font-weight:600;">${AppModule.escapeHtml(v.destino || '—')}</td>
                                <td>${AppModule.formatDate(v.dataIda)}</td>
                                <td>${AppModule.formatDate(v.dataVolta)}</td>
                                <td>${AppModule.escapeHtml(v.companhia || '—')}</td>
                                <td>${AppModule.escapeHtml(v.status || '—')}</td>
                                <td>${v.checkinFeito ? '<span class="badge badge-success">✅ Feito</span>' : '<span class="badge badge-warning">⏳ Pendente</span>'}</td>
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
        const v = DB.get('viagens', []).find(x => x.id === id);
        if (v) this.abrirFormulario(v);
    },

    abrirFormulario(viagem = null) {
        const clientes = DB.get('clientes', []);
        const config = DB.get('config', {});
        const companhias = config.companhias || [];
        const isEdit = !!viagem;

        const html = `
            <div class="form-group"><label>Cliente *</label>
                <select id="via-cliente" class="form-control">
                    <option value="">— Selecionar —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${viagem?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Destino *</label><input type="text" id="via-destino" class="form-control" value="${AppModule.escapeHtml(viagem?.destino || '')}"></div>
                <div class="form-group"><label>Companhia</label>
                    <select id="via-companhia" class="form-control">
                        <option value="">— Selecionar —</option>
                        ${companhias.map(c => `<option value="${AppModule.escapeHtml(c)}" ${viagem?.companhia === c ? 'selected' : ''}>${AppModule.escapeHtml(c)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Data Ida</label><input type="date" id="via-ida" class="form-control" value="${viagem?.dataIda || ''}"></div>
                <div class="form-group"><label>Data Volta</label><input type="date" id="via-volta" class="form-control" value="${viagem?.dataVolta || ''}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Número do Voo</label><input type="text" id="via-voo" class="form-control" value="${AppModule.escapeHtml(viagem?.numeroVoo || '')}"></div>
                <div class="form-group"><label>Status</label>
                    <select id="via-status" class="form-control">
                        <option value="Pendente" ${!viagem?.status || viagem?.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="Em andamento" ${viagem?.status === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
                        <option value="Concluída" ${viagem?.status === 'Concluída' ? 'selected' : ''}>Concluída</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Notas</label><textarea id="via-notas" class="form-control" rows="2">${AppModule.escapeHtml(viagem?.notas || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="ViagensModule.salvar('${viagem?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Viagem' : 'Nova Viagem', html, footer);
    },

    salvar(id) {
        const clienteId = document.getElementById('via-cliente').value;
        const destino = document.getElementById('via-destino').value.trim();
        if (!clienteId || !destino) {
            AppModule.toast('Informe o cliente e o destino.');
            return;
        }

        const viagens = DB.get('viagens', []);
        const index = viagens.findIndex(v => v.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            clienteId,
            destino,
            companhia: document.getElementById('via-companhia').value,
            dataIda: document.getElementById('via-ida').value,
            dataVolta: document.getElementById('via-volta').value,
            numeroVoo: document.getElementById('via-voo').value.trim(),
            status: document.getElementById('via-status').value,
            notas: document.getElementById('via-notas').value.trim(),
            checkinFeito: index >= 0 ? viagens[index].checkinFeito : false,
            criadoEm: index >= 0 ? viagens[index].criadoEm : new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        if (index >= 0) {
            viagens[index] = { ...viagens[index], ...dados };
        } else {
            viagens.push(dados);
        }

        DB.set('viagens', viagens);
        AppModule.addAtividade(`Viagem "${destino}" salva`, 'viagem');
        AppModule.closeModal();
        AppModule.toast('Viagem salva!');
        this.render();
    },

    excluir(id) {
        if (!confirm('Excluir esta viagem?')) return;
        const viagens = DB.get('viagens', []).filter(v => v.id !== id);
        DB.set('viagens', viagens);
        AppModule.toast('Viagem excluída.');
        this.render();
    }
};
