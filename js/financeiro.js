const FinanceiroModule = {
    render() {
        const transacoes = DB.get('transacoes', []);
        const receitas = transacoes.filter(t => t.tipo === 'Receita').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const despesas = transacoes.filter(t => t.tipo === 'Despesa').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const saldo = receitas - despesas;
        const ticket = transacoes.length ? saldo / transacoes.length : 0;

        document.getElementById('fin-receitas').textContent = AppModule.formatCurrency(receitas);
        document.getElementById('fin-despesas').textContent = AppModule.formatCurrency(despesas);
        document.getElementById('fin-saldo').textContent = AppModule.formatCurrency(saldo);
        document.getElementById('fin-ticket').textContent = AppModule.formatCurrency(ticket);

        const tbody = document.querySelector('#tabela-transacoes tbody');
        if (!transacoes.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="dashboard-empty">Nenhuma transação registrada.</td></tr>';
            return;
        }

        tbody.innerHTML = transacoes.sort((a, b) => new Date(b.data) - new Date(a.data)).map(t => `
            <tr>
                <td>${AppModule.formatDate(t.data)}</td>
                <td>${AppModule.escapeHtml(t.descricao)}</td>
                <td>${AppModule.escapeHtml(t.categoria)}</td>
                <td><span class="badge ${t.tipo === 'Receita' ? 'badge-success' : 'badge-danger'}">${t.tipo}</span></td>
                <td>${AppModule.formatCurrency(t.valor)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="FinanceiroModule.editar('${t.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="FinanceiroModule.excluir('${t.id}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    },

    novaTransacao() {
        this.abrirFormulario();
    },

    editar(id) {
        const t = DB.get('transacoes', []).find(x => x.id === id);
        if (t) this.abrirFormulario(t);
    },

    abrirFormulario(transacao = null) {
        const isEdit = !!transacao;
        const config = DB.get('config', {});
        const receitas = config.receitas || [];
        const despesas = config.despesas || [];

        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Tipo *</label>
                    <select id="fin-tipo" class="form-control" onchange="FinanceiroModule.atualizarCategorias()">
                        <option value="Receita" ${transacao?.tipo === 'Receita' ? 'selected' : ''}>Receita</option>
                        <option value="Despesa" ${transacao?.tipo === 'Despesa' ? 'selected' : ''}>Despesa</option>
                    </select>
                </div>
                <div class="form-group"><label>Data *</label><input type="date" id="fin-data" class="form-control" value="${AppModule.escapeHtml(transacao?.data || new Date().toISOString().split('T')[0])}"></div>
            </div>
            <div class="form-group"><label>Descrição *</label><input type="text" id="fin-descricao" class="form-control" value="${AppModule.escapeHtml(transacao?.descricao || '')}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Categoria</label>
                    <select id="fin-categoria" class="form-control">
                        ${this.optionsCategorias(transacao?.tipo, transacao?.categoria, receitas, despesas)}
                    </select>
                </div>
                <div class="form-group"><label>Valor *</label><input type="number" id="fin-valor" class="form-control" step="0.01" value="${AppModule.escapeHtml(transacao?.valor || '')}"></div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="FinanceiroModule.salvar('${transacao?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Transação' : 'Nova Transação', html, footer);
    },

    optionsCategorias(tipo, selecionada, receitas, despesas) {
        const lista = tipo === 'Despesa' ? despesas : receitas;
        return lista.map(c => `<option value="${AppModule.escapeHtml(c)}" ${selecionada === c ? 'selected' : ''}>${AppModule.escapeHtml(c)}</option>`).join('');
    },

    atualizarCategorias() {
        const tipo = document.getElementById('fin-tipo').value;
        const config = DB.get('config', {});
        const receitas = config.receitas || [];
        const despesas = config.despesas || [];
        document.getElementById('fin-categoria').innerHTML = this.optionsCategorias(tipo, '', receitas, despesas);
    },

    salvar(id) {
        const descricao = document.getElementById('fin-descricao').value.trim();
        const valor = parseFloat(document.getElementById('fin-valor').value) || 0;
        const data = document.getElementById('fin-data').value;

        if (!descricao || !valor || !data) {
            AppModule.toast('Preencha descrição, valor e data.');
            return;
        }

        const transacoes = DB.get('transacoes', []);
        const index = transacoes.findIndex(t => t.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            tipo: document.getElementById('fin-tipo').value,
            descricao,
            categoria: document.getElementById('fin-categoria').value,
            valor,
            data
        };

        if (index >= 0) {
            transacoes[index] = { ...transacoes[index], ...dados };
            AppModule.addAtividade(`Transação ${descricao} atualizada.`);
        } else {
            transacoes.push(dados);
            AppModule.addAtividade(`Transação ${descricao} registrada.`);
        }

        DB.set('transacoes', transacoes);
        AppModule.closeModal();
        AppModule.toast('Transação salva com sucesso!');
        this.render();
    },

    excluir(id) {
        if (!confirm('Deseja excluir esta transação?')) return;
        const transacoes = DB.get('transacoes', []).filter(t => t.id !== id);
        DB.set('transacoes', transacoes);
        AppModule.addAtividade('Transação excluída.');
        AppModule.toast('Transação excluída.');
        this.render();
    }
};
