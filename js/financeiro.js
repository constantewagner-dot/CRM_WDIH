var FinanceiroModule = {
    filtroStatus: 'todos',
    filtroTipo: 'todos',

    render() {
        this.renderResumo();
        this.renderLista();
    },

    // ===== DADOS =====
    getTransacoes() {
        const transacoes = DB.get('transacoes', []);
        return transacoes.map(t => {
            const atualizado = { ...t };
            if (atualizado.status !== 'pago' && atualizado.vencimento && !atualizado.pago) {
                const venc = new Date(atualizado.vencimento);
                venc.setHours(0, 0, 0, 0);
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                if (venc < hoje) atualizado.status = 'atrasado';
            }
            return atualizado;
        });
    },

    salvarTransacoes(transacoes) {
        DB.set('transacoes', transacoes);
    },

    // ===== RESUMO / FLUXO DE CAIXA =====
    renderResumo() {
        const container = document.getElementById('financeiro-resumo');
        if (!container) return;

        const transacoes = this.getTransacoes();

        const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const despesas = transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const saldo = receitas - despesas;

        const pendentesReceber = transacoes.filter(t => t.tipo === 'receita' && t.status !== 'pago').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const pendentesPagar = transacoes.filter(t => t.tipo === 'despesa' && t.status !== 'pago').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);

        const atrasados = transacoes.filter(t => t.status === 'atrasado');
        const atrasadosReceber = atrasados.filter(t => t.tipo === 'receita').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const atrasadosPagar = atrasados.filter(t => t.tipo === 'despesa').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);

        const mesAtual = new Date().getMonth();
        const anoAtual = new Date().getFullYear();
        const receitasMes = transacoes.filter(t => {
            if (t.tipo !== 'receita' || t.status !== 'pago') return false;
            const d = new Date(t.data);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const despesasMes = transacoes.filter(t => {
            if (t.tipo !== 'despesa' || t.status !== 'pago') return false;
            const d = new Date(t.data);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const saldoMes = receitasMes - despesasMes;

        container.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <label>Entradas (Total)</label>
                    <span style="color:var(--success);">${AppModule.formatCurrency(receitas)}</span>
                </div>
                <div class="kpi-card">
                    <label>Saídas (Total)</label>
                    <span style="color:var(--danger);">${AppModule.formatCurrency(despesas)}</span>
                </div>
                <div class="kpi-card">
                    <label>Saldo Geral</label>
                    <span style="color:${saldo >= 0 ? 'var(--success)' : 'var(--danger)'};">${AppModule.formatCurrency(saldo)}</span>
                </div>
                <div class="kpi-card">
                    <label>Saldo no Mês</label>
                    <span style="color:${saldoMes >= 0 ? 'var(--success)' : 'var(--danger)'};">${AppModule.formatCurrency(saldoMes)}</span>
                </div>
            </div>

            <div class="grid-2" style="margin-top:16px;">
                <div class="card">
                    <h3>Contas a Receber</h3>
                    <div class="list-item">
                        <span>Total pendente</span>
                        <strong style="color:var(--success);">${AppModule.formatCurrency(pendentesReceber)}</strong>
                    </div>
                    <div class="list-item">
                        <span>Atrasadas</span>
                        <strong style="color:var(--danger);">${AppModule.formatCurrency(atrasadosReceber)}</strong>
                    </div>
                    <div style="margin-top:10px;">
                        ${this.renderPendentes('receita', 3)}
                    </div>
                </div>
                <div class="card">
                    <h3>Contas a Pagar</h3>
                    <div class="list-item">
                        <span>Total pendente</span>
                        <strong style="color:var(--danger);">${AppModule.formatCurrency(pendentesPagar)}</strong>
                    </div>
                    <div class="list-item">
                        <span>Atrasadas</span>
                        <strong style="color:var(--danger);">${AppModule.formatCurrency(atrasadosPagar)}</strong>
                    </div>
                    <div style="margin-top:10px;">
                        ${this.renderPendentes('despesa', 3)}
                    </div>
                </div>
            </div>
        `;
    },

    renderPendentes(tipo, limite = 3) {
        const transacoes = this.getTransacoes();
        const pendentes = transacoes
            .filter(t => t.tipo === tipo && t.status !== 'pago')
            .sort((a, b) => new Date(a.vencimento || a.data) - new Date(b.vencimento || b.data))
            .slice(0, limite);

        if (!pendentes.length) {
            return '<p class="dashboard-empty">Nenhum lançamento pendente.</p>';
        }

        return pendentes.map(t => {
            const atrasado = t.status === 'atrasado';
            return `
                <div class="list-item" style="${atrasado ? 'border-left:3px solid var(--danger);padding-left:8px;' : ''}">
                    <div>
                        <div><strong>${AppModule.escapeHtml(t.descricao)}</strong></div>
                        <small style="${atrasado ? 'color:var(--danger);' : 'color:var(--text-muted);'}">
                            Venc: ${AppModule.formatDate(t.vencimento || t.data)} ${atrasado ? '• ATRASADO' : ''}
                        </small>
                    </div>
                    <strong>${AppModule.formatCurrency(t.valor)}</strong>
                </div>
            `;
        }).join('');
    },

    // ===== LISTA =====
    renderLista() {
        const container = document.getElementById('financeiro-list');
        if (!container) return;

        const transacoes = this.getTransacoes();

        const filtradas = transacoes.filter(t => {
            if (this.filtroTipo !== 'todos' && t.tipo !== this.filtroTipo) return false;
            if (this.filtroStatus !== 'todos' && t.status !== this.filtroStatus) return false;
            return true;
        });

        let html = `
            <div class="card">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
                    <h3 style="margin:0;border:none;padding:0;">Lançamentos</h3>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <select id="fin-filtro-tipo" class="form-control" style="width:auto;" onchange="FinanceiroModule.mudarFiltroTipo(this.value)">
                            <option value="todos">Todos os tipos</option>
                            <option value="receita">Receitas</option>
                            <option value="despesa">Despesas</option>
                        </select>
                        <select id="fin-filtro-status" class="form-control" style="width:auto;" onchange="FinanceiroModule.mudarFiltroStatus(this.value)">
                            <option value="todos">Todos os status</option>
                            <option value="pago">Pago</option>
                            <option value="pendente">Pendente</option>
                            <option value="atrasado">Atrasado</option>
                        </select>
                        <button class="btn btn-primary" onclick="FinanceiroModule.novaTransacao()">+ Nova Transação</button>
                    </div>
                </div>

                ${filtradas.length ? `
                    <div class="table-wrap">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th>
                                    <th>Vencimento</th><th>Status</th><th>Valor</th><th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtradas.sort((a, b) => new Date(b.data) - new Date(a.data)).map(t => `
                                    <tr>
                                        <td>${AppModule.formatDate(t.data)}</td>
                                        <td><strong>${AppModule.escapeHtml(t.descricao)}</strong></td>
                                        <td>${AppModule.escapeHtml(t.categoria || '—')}</td>
                                        <td>
                                            <span class="badge ${t.tipo === 'receita' ? 'badge-success' : 'badge-danger'}">
                                                ${t.tipo === 'receita' ? 'Receita' : 'Despesa'}
                                            </span>
                                        </td>
                                        <td>${t.vencimento ? AppModule.formatDate(t.vencimento) : '—'}</td>
                                        <td>
                                            <span class="badge ${t.status === 'pago' ? 'badge-success' : t.status === 'atrasado' ? 'badge-danger' : 'badge-warning'}">
                                                ${this.statusLabel(t.status)}
                                            </span>
                                        </td>
                                        <td style="font-weight:700;color:${t.tipo === 'receita' ? 'var(--success)' : 'var(--danger)'};">${AppModule.formatCurrency(t.valor)}</td>
                                        <td>
                                            <div class="row-actions">
                                                <button class="btn btn-sm btn-success" onclick="FinanceiroModule.marcarPago('${t.id}')" ${t.status === 'pago' ? 'disabled' : ''}>Pagar</button>
                                                <button class="btn btn-sm btn-secondary" onclick="FinanceiroModule.editarTransacao('${t.id}')">Editar</button>
                                                <button class="btn btn-sm btn-danger" onclick="FinanceiroModule.excluir('${t.id}')">Excluir</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="dashboard-empty">Nenhuma transação encontrada para os filtros selecionados.</p>'}
            </div>
        `;

        container.innerHTML = html;

        const selTipo = document.getElementById('fin-filtro-tipo');
        const selStatus = document.getElementById('fin-filtro-status');
        if (selTipo) selTipo.value = this.filtroTipo;
        if (selStatus) selStatus.value = this.filtroStatus;
    },

    statusLabel(status) {
        switch (status) {
            case 'pago': return 'Pago';
            case 'pendente': return 'Pendente';
            case 'atrasado': return 'Atrasado';
            default: return status;
        }
    },

    mudarFiltroTipo(valor) {
        this.filtroTipo = valor;
        this.renderLista();
    },

    mudarFiltroStatus(valor) {
        this.filtroStatus = valor;
        this.renderLista();
    },

    // ===== FORMULÁRIO =====
    novaTransacao() {
        this.abrirForm();
    },

    editarTransacao(id) {
        const t = this.getTransacoes().find(x => x.id === id);
        if (t) this.abrirForm(t);
    },

    abrirForm(transacao = null) {
        const isEdit = !!transacao;
        const config = DB.get('config', {});
        const clientes = DB.get('clientes', []);
        const receitas = config.receitas || [];
        const despesas = config.despesas || [];

        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Tipo *</label>
                    <select id="fin-tipo" class="form-control" onchange="FinanceiroModule.atualizarCategorias()">
                        <option value="receita" ${!transacao || transacao.tipo === 'receita' ? 'selected' : ''}>Receita</option>
                        <option value="despesa" ${transacao?.tipo === 'despesa' ? 'selected' : ''}>Despesa</option>
                    </select>
                </div>
                <div class="form-group"><label>Data *</label><input type="date" id="fin-data" class="form-control" value="${transacao?.data || new Date().toISOString().slice(0,10)}"></div>
            </div>
            <div class="form-group"><label>Descrição *</label><input type="text" id="fin-desc" class="form-control" value="${AppModule.escapeHtml(transacao?.descricao || '')}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Categoria *</label>
                    <select id="fin-categoria" class="form-control"></select>
                </div>
                <div class="form-group"><label>Valor (R$) *</label><input type="number" id="fin-valor" class="form-control" step="0.01" value="${transacao?.valor || 0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Vencimento</label><input type="date" id="fin-vencimento" class="form-control" value="${transacao?.vencimento || ''}"></div>
                <div class="form-group"><label>Status</label>
                    <select id="fin-status" class="form-control">
                        <option value="pago" ${!transacao || transacao.status === 'pago' ? 'selected' : ''}>Pago</option>
                        <option value="pendente" ${transacao?.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Forma de Pagamento</label>
                <select id="fin-forma" class="form-control">
                    <option value="">— Selecionar —</option>
                    <option value="Pix" ${transacao?.formaPagamento === 'Pix' ? 'selected' : ''}>Pix</option>
                    <option value="Cartão de Crédito" ${transacao?.formaPagamento === 'Cartão de Crédito' ? 'selected' : ''}>Cartão de Crédito</option>
                    <option value="Cartão de Débito" ${transacao?.formaPagamento === 'Cartão de Débito' ? 'selected' : ''}>Cartão de Débito</option>
                    <option value="Transferência" ${transacao?.formaPagamento === 'Transferência' ? 'selected' : ''}>Transferência</option>
                    <option value="Dinheiro" ${transacao?.formaPagamento === 'Dinheiro' ? 'selected' : ''}>Dinheiro</option>
                    <option value="Boleto" ${transacao?.formaPagamento === 'Boleto' ? 'selected' : ''}>Boleto</option>
                </select>
            </div>
            <div class="form-group"><label>Cliente</label>
                <select id="fin-cliente" class="form-control">
                    <option value="">— Nenhum —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${transacao?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Observações</label><textarea id="fin-obs" class="form-control" rows="2">${AppModule.escapeHtml(transacao?.observacoes || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="FinanceiroModule.salvar('${transacao?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Transação' : 'Nova Transação', html, footer);

        setTimeout(() => this.atualizarCategorias(transacao?.categoria), 50);
    },

    atualizarCategorias(categoriaSelecionada = '') {
        const tipo = document.getElementById('fin-tipo')?.value;
        const select = document.getElementById('fin-categoria');
        if (!select) return;

        const config = DB.get('config', {});
        const categorias = tipo === 'receita' ? (config.receitas || []) : (config.despesas || []);

        select.innerHTML = categorias.length
            ? categorias.map(c => `<option value="${AppModule.escapeHtml(c)}" ${categoriaSelecionada === c ? 'selected' : ''}>${AppModule.escapeHtml(c)}</option>`).join('')
            : '<option value="">— Sem categorias —</option>';
    },

    salvar(id) {
        const descricao = document.getElementById('fin-desc').value.trim();
        const valor = parseFloat(document.getElementById('fin-valor').value);
        const data = document.getElementById('fin-data').value;

        if (!descricao || !valor || !data) {
            AppModule.toast('Preencha descrição, valor e data.');
            return;
        }

        const transacoes = DB.get('transacoes', []);
        const index = transacoes.findIndex(t => t.id === id);
        const tipo = document.getElementById('fin-tipo').value;
        const vencimento = document.getElementById('fin-vencimento').value;
        const status = document.getElementById('fin-status').value;

        const dados = {
            id: id || AppModule.generateId(),
            tipo,
            descricao,
            categoria: document.getElementById('fin-categoria').value,
            valor,
            data,
            vencimento: vencimento || null,
            status,
            formaPagamento: document.getElementById('fin-forma').value,
            clienteId: document.getElementById('fin-cliente').value,
            observacoes: document.getElementById('fin-obs').value.trim(),
            criadoEm: index >= 0 ? transacoes[index].criadoEm : new Date().toISOString()
        };

        if (index >= 0) {
            transacoes[index] = { ...transacoes[index], ...dados };
        } else {
            transacoes.push(dados);
        }

        DB.set('transacoes', transacoes);
        AppModule.addAtividade(`Transação "${descricao}" ${id ? 'atualizada' : 'criada'}`, 'financeiro');
        AppModule.closeModal();
        AppModule.toast('Transação salva!');
        this.render();
    },

    marcarPago(id) {
        const transacoes = DB.get('transacoes', []);
        const index = transacoes.findIndex(t => t.id === id);
        if (index >= 0) {
            transacoes[index].status = 'pago';
            transacoes[index].pago = true;
            transacoes[index].data = transacoes[index].data || new Date().toISOString().slice(0, 10);
            DB.set('transacoes', transacoes);
            AppModule.toast('Transação marcada como paga!');
            this.render();
        }
    },

    excluir(id) {
        if (!confirm('Excluir esta transação?')) return;
        const transacoes = DB.get('transacoes', []);
        DB.set('transacoes', transacoes.filter(t => t.id !== id));
        AppModule.toast('Transação excluída.');
        this.render();
    }
};
