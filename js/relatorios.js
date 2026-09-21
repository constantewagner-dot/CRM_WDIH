var RelatoriosModule = {
    tipoAtual: 'vendas',
    periodoInicio: '',
    periodoFim: '',

    render() {
        this.renderTabs();
        this.renderRelatorio();
    },

    renderTabs() {
        const container = document.getElementById('relatorios-tabs');
        if (!container) return;

        const tipos = [
            { id: 'vendas', label: 'Vendas e Comissões', icon: '💼' },
            { id: 'financeiro', label: 'Financeiro', icon: '💰' },
            { id: 'viagens', label: 'Viagens e Check-ins', icon: '✈️' },
            { id: 'pipeline', label: 'Pipeline', icon: '📊' }
        ];

        container.innerHTML = `
            <div class="milhas-tabs">
                ${tipos.map(t => `
                    <button class="milhas-tab ${this.tipoAtual === t.id ? 'active' : ''}" onclick="RelatoriosModule.mudarTipo('${t.id}')">
                        ${t.icon} ${t.label}
                    </button>
                `).join('')}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:flex-end;">
                <div class="form-group" style="margin:0;">
                    <label>De</label>
                    <input type="date" id="rel-inicio" class="form-control" value="${this.periodoInicio}">
                </div>
                <div class="form-group" style="margin:0;">
                    <label>Até</label>
                    <input type="date" id="rel-fim" class="form-control" value="${this.periodoFim}">
                </div>
                <button class="btn btn-primary" onclick="RelatoriosModule.aplicarPeriodo()">📊 Aplicar</button>
                <button class="btn btn-success" onclick="RelatoriosModule.exportarCSV()">⬇️ Exportar CSV</button>
                <button class="btn btn-secondary" onclick="RelatoriosModule.imprimir()">🖨️ Imprimir</button>
            </div>
        `;
    },

    mudarTipo(tipo) {
        this.tipoAtual = tipo;
        this.renderTabs();
        this.renderRelatorio();
    },

    aplicarPeriodo() {
        this.periodoInicio = document.getElementById('rel-inicio').value;
        this.periodoFim = document.getElementById('rel-fim').value;
        this.renderRelatorio();
    },

    // ===== FILTRO DE PERÍODO =====
    filtraPorPeriodo(itens, campoData = 'criadoEm') {
        const inicio = this.periodoInicio ? new Date(this.periodoInicio) : null;
        const fim = this.periodoFim ? new Date(this.periodoFim) : null;

        return itens.filter(item => {
            const data = new Date(item[campoData] || item.data);
            if (inicio && data < inicio) return false;
            if (fim) {
                const fimFim = new Date(fim);
                fimFim.setHours(23, 59, 59, 999);
                if (data > fimFim) return false;
            }
            return true;
        });
    },

    // ===== RELATÓRIO DE VENDAS =====
    renderRelatorio() {
        const container = document.getElementById('relatorios-conteudo');
        if (!container) return;

        switch (this.tipoAtual) {
            case 'vendas': container.innerHTML = this.renderVendas(); break;
            case 'financeiro': container.innerHTML = this.renderFinanceiro(); break;
            case 'viagens': container.innerHTML = this.renderViagens(); break;
            case 'pipeline': container.innerHTML = this.renderPipeline(); break;
        }
    },

    renderVendas() {
        const todasVendas = DB.get('vendas', []);
        const vendas = this.filtraPorPeriodo(todasVendas, 'dataVenda');

        const totalVendas = vendas.reduce((s, v) => s + (parseFloat(v.valorVenda) || 0), 0);
        const totalComissao = vendas.reduce((s, v) => s + AppModule.calcularComissaoVenda(v), 0);
        const numVendas = vendas.length;
        const ticket = numVendas ? totalVendas / numVendas : 0;

        // Vendas mensais (últimos 6 meses)
        const vendasMensais = this.vendasMensais(todasVendas);

        // Top serviços
        const porServico = {};
        vendas.forEach(v => {
            const s = v.servico || 'Outro';
            porServico[s] = (porServico[s] || 0) + (parseFloat(v.valorVenda) || 0);
        });

        let html = `
            <div class="kpi-grid">
                <div class="kpi-card"><label>Total de Vendas</label><span style="color:var(--success);">${AppModule.formatCurrency(totalVendas)}</span></div>
                <div class="kpi-card"><label>Nº de Vendas</label><span>${numVendas}</span></div>
                <div class="kpi-card"><label>Ticket Médio</label><span>${AppModule.formatCurrency(ticket)}</span></div>
                <div class="kpi-card"><label>Comissões</label><span style="color:var(--primary);">${AppModule.formatCurrency(totalComissao)}</span></div>
            </div>

            <div class="grid-2" style="margin-top:16px;">
                <div class="card">
                    <h3>Vendas por Mês (últimos 6)</h3>
                    ${this.renderBarrasVendas(vendasMensais)}
                </div>
                <div class="card">
                    <h3>Vendas por Serviço</h3>
                    ${this.renderBarrasPorServico(porServico, totalVendas)}
                </div>
            </div>

            <div class="card" style="margin-top:16px;">
                <h3>Detalhamento</h3>
                ${this.renderTabelaVendas(vendas)}
            </div>
        `;

        return html;
    },

    vendasMensais(todasVendas) {
        const meses = [];
        const hoje = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const rotulo = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            const total = todasVendas
                .filter(v => {
                    const data = new Date(v.dataVenda);
                    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}` === chave;
                })
                .reduce((s, v) => s + (parseFloat(v.valorVenda) || 0), 0);
            meses.push({ rotulo, total });
        }
        return meses;
    },

    renderBarrasVendas(meses) {
        const max = Math.max(...meses.map(m => m.total), 1);
        return meses.map(m => `
            <div class="bar-row">
                <div class="bar-label">${m.rotulo}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${(m.total / max) * 100}%;"></div>
                </div>
                <div class="bar-value">${AppModule.formatCurrency(m.total)}</div>
            </div>
        `).join('') || '<p class="dashboard-empty">Sem dados.</p>';
    },

    renderBarrasPorServico(porServico, total) {
        if (!Object.keys(porServico).length) return '<p class="dashboard-empty">Sem dados.</p>';
        const max = Math.max(...Object.values(porServico), 1);
        return Object.entries(porServico).sort((a, b) => b[1] - a[1]).map(([servico, valor]) => `
            <div class="bar-row">
                <div class="bar-label">${AppModule.escapeHtml(servico)}</div>
                <div class="bar-track">
                    <div class="bar-fill bar-fill-green" style="width:${(valor / max) * 100}%;"></div>
                </div>
                <div class="bar-value">${AppModule.formatCurrency(valor)}</div>
            </div>
        `).join('');
    },

    renderTabelaVendas(vendas) {
        if (!vendas.length) return '<p class="dashboard-empty">Nenhuma venda no período.</p>';

        return `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Data</th><th>Cliente</th><th>Serviço</th><th>Destino</th>
                            <th>Valor</th><th>%</th><th>Comissão</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vendas.sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda)).map(v => `
                            <tr>
                                <td>${AppModule.formatDate(v.dataVenda)}</td>
                                <td>${AppModule.escapeHtml(DB.getClienteNome(v.clienteId))}</td>
                                <td>${AppModule.escapeHtml(v.servico || '—')}</td>
                                <td>${AppModule.escapeHtml(v.destino || '—')}</td>
                                <td style="color:var(--success);font-weight:600;">${AppModule.formatCurrency(v.valorVenda)}</td>
                                <td>${v.comissaoPercentual || 10}%</td>
                                <td style="color:var(--primary);font-weight:600;">${AppModule.formatCurrency(AppModule.calcularComissaoVenda(v))}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ===== RETORNO FINANCEIRO =====
    renderFinanceiro() {
        const transacoes = FinanceiroModule.getTransacoes();
        const filtradas = this.filtraPorPeriodo(transacoes, 'data');

        const receitas = filtradas.filter(t => t.tipo === 'receita');
        const despesas = filtradas.filter(t => t.tipo === 'despesa');
        const totalReceitas = receitas.reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const totalDespesas = despesas.reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const saldo = totalReceitas - totalDespesas;

        // Por categoria
        const porCategoria = {};
        filtradas.forEach(t => {
            const cat = t.categoria || (t.tipo === 'receita' ? 'Outras receitas' : 'Outras despesas');
            if (!porCategoria[cat]) porCategoria[cat] = { receita: 0, despesa: 0 };
            porCategoria[cat][t.tipo] += parseFloat(t.valor) || 0;
        });

        // Pendentes
        const contasReceber = filtradas.filter(t => t.tipo === 'receita' && t.status !== 'pago').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const contasPagar = filtradas.filter(t => t.tipo === 'despesa' && t.status !== 'pago').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
        const atrasados = filtradas.filter(t => t.status === 'atrasado').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);

        let html = `
            <div class="kpi-grid">
                <div class="kpi-card"><label>Receitas</label><span style="color:var(--success);">${AppModule.formatCurrency(totalReceitas)}</span></div>
                <div class="kpi-card"><label>Despesas</label><span style="color:var(--danger);">${AppModule.formatCurrency(totalDespesas)}</span></div>
                <div class="kpi-card"><label>Saldo</label><span style="color:${saldo >= 0 ? 'var(--success)' : 'var(--danger)'};">${AppModule.formatCurrency(saldo)}</span></div>
                <div class="kpi-card"><label>Pendente/ Atrasado</label><span style="color:var(--danger);">${AppModule.formatCurrency(atrasados)}</span></div>
            </div>

            <div class="grid-2" style="margin-top:16px;">
                <div class="card">
                    <h3>Entradas × Saídas (por categoria)</h3>
                    ${Object.keys(porCategoria).length ? this.renderBarrasCategorias(porCategoria) : '<p class="dashboard-empty">Sem dados no período.</p>'}
                </div>
                <div class="card">
                    <h3>Resumo</h3>
                    <div class="list-item"><span>Contas a receber</span><strong style="color:var(--success);">${AppModule.formatCurrency(contasReceber)}</strong></div>
                    <div class="list-item"><span>Contas a pagar</span><strong style="color:var(--danger);">${AppModule.formatCurrency(contasPagar)}</strong></div>
                    <div class="list-item"><span>Lançamentos</span><strong>${filtradas.length}</strong></div>
                </div>
            </div>

            <div class="card" style="margin-top:16px;">
                <h3>Lançamentos no Período</h3>
                ${this.renderTabelaFinanceiro(filtradas)}
            </div>
        `;

        return html;
    },

    renderBarrasCategorias(porCategoria) {
        const todos = Object.entries(porCategoria);
        const max = Math.max(...todos.map(([, v]) => Math.max(v.receita, v.despesa)), 1);

        return todos.sort((a, b) => (b[1].receita + b[1].despesa) - (a[1].receita + a[1].despesa)).map(([cat, valores]) => `
            <div style="margin-bottom:12px;">
                <div style="font-size:12px;font-weight:600;margin-bottom:4px;">${AppModule.escapeHtml(cat)}</div>
                <div class="bar-row" style="margin-bottom:4px;">
                    <div class="bar-label" style="color:var(--success);">Entradas</div>
                    <div class="bar-track">
                        <div class="bar-fill bar-fill-green" style="width:${(valores.receita / max) * 100}%;"></div>
                    </div>
                    <div class="bar-value">${AppModule.formatCurrency(valores.receita)}</div>
                </div>
                <div class="bar-row">
                    <div class="bar-label" style="color:var(--danger);">Saídas</div>
                    <div class="bar-track">
                        <div class="bar-fill bar-fill-alt" style="width:${(valores.despesa / max) * 100}%;"></div>
                    </div>
                    <div class="bar-value">${AppModule.formatCurrency(valores.despesa)}</div>
                </div>
            </div>
        `).join('');
    },

    renderTabelaFinanceiro(transacoes) {
        if (!transacoes.length) return '<p class="dashboard-empty">Nenhum lançamento no período.</p>';

        return `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Status</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
                        ${transacoes.sort((a, b) => new Date(b.data) - new Date(a.data)).map(t => `
                            <tr>
                                <td>${AppModule.formatDate(t.data)}</td>
                                <td>${AppModule.escapeHtml(t.descricao)}</td>
                                <td>${AppModule.escapeHtml(t.categoria || '—')}</td>
                                <td><span class="badge ${t.tipo === 'receita' ? 'badge-success' : 'badge-danger'}">${t.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td>
                                <td><span class="badge ${t.status === 'pago' ? 'badge-success' : t.status === 'atrasado' ? 'badge-danger' : 'badge-warning'}">${FinanceiroModule.statusLabel(t.status)}</span></td>
                                <td style="font-weight:600;color:${t.tipo === 'receita' ? 'var(--success)' : 'var(--danger)'};">${AppModule.formatCurrency(t.valor)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ===== RELATÓRIO DE VIAGENS =====
    renderViagens() {
        const viagens = DB.get('viagens', []);
        const filtradas = this.filtraPorPeriodo(viagens, 'dataIda');

        const totalViagens = filtradas.length;
        const checkinsFeitos = filtradas.filter(v => v.checkinFeito).length;
        const checkinsPendentes = filtradas.filter(v => !v.checkinFeito).length;
        const proximas = filtradas.filter(v => {
            const dataIda = new Date(v.dataIda);
            return dataIda >= new Date();
        }).length;

        let html = `
            <div class="kpi-grid">
                <div class="kpi-card"><label>Total de Viagens</label><span>${totalViagens}</span></div>
                <div class="kpi-card"><label>Com Check-in</label><span style="color:var(--success);">${checkinsFeitos}</span></div>
                <div class="kpi-card"><label>Check-ins Pendentes</label><span style="color:var(--warning);">${checkinsPendentes}</span></div>
                <div class="kpi-card"><label>Próximas</label><span style="color:var(--primary);">${proximas}</span></div>
            </div>

            <div class="card" style="margin-top:16px;">
                <h3>Viagens no Período</h3>
                ${this.renderTabelaViagens(filtradas)}
            </div>
        `;

        return html;
    },

    renderTabelaViagens(viagens) {
        if (!viagens.length) return '<p class="dashboard-empty">Nenhuma viagem no período.</p>';

        return `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr><th>Cliente</th><th>Destino</th><th>Data Ida</th><th>Data Volta</th><th>Companhia</th><th>Check-in</th></tr>
                    </thead>
                    <tbody>
                        ${viagens.sort((a, b) => new Date(b.dataIda) - new Date(a.dataIda)).map(v => `
                            <tr>
                                <td>${AppModule.escapeHtml(DB.getClienteNome(v.clienteId))}</td>
                                <td>${AppModule.escapeHtml(v.destino)}</td>
                                <td>${AppModule.formatDate(v.dataIda)}</td>
                                <td>${AppModule.formatDate(v.dataVolta)}</td>
                                <td>${AppModule.escapeHtml(v.companhia || '—')}</td>
                                <td>
                                    <span class="badge ${v.checkinFeito ? 'badge-success' : 'badge-warning'}">
                                        ${v.checkinFeito ? 'Feito' : 'Pendente'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ===== RELATÓRIO DE PIPELINE =====
    renderPipeline() {
        const config = DB.get('config', {});
        const etapas = config.pipeline || [];
        const negocios = DB.get('negocios', []);
        const filtrados = this.filtraPorPeriodo(negocios);

        const ganhos = filtrados.filter(n => n.stage === 'Fechado (Ganho)');
        const perdidos = filtrados.filter(n => n.stage === 'Perdido');
        const emAndamento = filtrados.filter(n => n.stage !== 'Fechado (Ganho)' && n.stage !== 'Perdido');

        const totalGanhos = ganhos.reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
        const totalAndamento = emAndamento.reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
        const conversao = filtrados.length ? ((ganhos.length / filtrados.length) * 100).toFixed(1) : 0;

        // Por etapa
        let html = `
            <div class="kpi-grid">
                <div class="kpi-card"><label>Em Andamento</label><span>${emAndamento.length}</span></div>
                <div class="kpi-card"><label>Ganhos</label><span style="color:var(--success);">${ganhos.length}</span></div>
                <div class="kpi-card"><label>Perdidos</label><span style="color:var(--danger);">${perdidos.length}</span></div>
                <div class="kpi-card"><label>Taxa de Conversão</label><span>${conversao}%</span></div>
            </div>

            <div class="card" style="margin-top:16px;">
                <h3>Valor por Etapa</h3>
                ${
                    etapas.length ? etapas.map(etapa => {
                        const cards = filtrados.filter(n => n.stage === etapa);
                        const valor = cards.reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
                        return `
                            <div class="list-item">
                                <div>
                                    <strong>${AppModule.escapeHtml(etapa)}</strong>
                                    <small style="display:block;color:var(--text-muted);">${cards.length} negócio(s)</small>
                                </div>
                                <strong>${AppModule.formatCurrency(valor)}</strong>
                            </div>
                        `;
                    }).join('') : '<p class="dashboard-empty">Nenhuma etapa configurada.</p>'
                }
            </div>

            <div class="card" style="margin-top:16px;">
                <h3>Negócios no Período</h3>
                ${this.renderTabelaPipeline(filtrados)}
            </div>
        `;

        return html;
    },

    renderTabelaPipeline(negocios) {
        if (!negocios.length) return '<p class="dashboard-empty">Nenhum negócio no período.</p>';

        return `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr><th>Título</th><th>Cliente</th><th>Etapa</th><th>Prob.</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
                        ${negocios.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).map(n => `
                            <tr>
                                <td>${AppModule.escapeHtml(n.titulo)}</td>
                                <td>${AppModule.escapeHtml(DB.getClienteNome(n.clienteId))}</td>
                                <td><span class="badge badge-info">${AppModule.escapeHtml(n.stage)}</span></td>
                                <td>${n.probabilidade || 0}%</td>
                                <td style="font-weight:600;color:var(--primary);">${AppModule.formatCurrency(n.valor)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ===== EXPORTAÇÃO CSV =====
    exportarCSV() {
        let titulo = '';
        let transacoes = [];
        let headers = [];

        switch (this.tipoAtual) {
            case 'vendas': {
                titulo = 'Vendas';
                headers = ['ID', 'Data', 'Cliente', 'Serviço', 'Destino', 'Valor', 'Comissão %', 'Comissão'];
                const vendas = this.filtraPorPeriodo(DB.get('vendas', []), 'dataVenda');
                transacoes = vendas.map(v => [
                    v.id, v.dataVenda, DB.getClienteNome(v.clienteId), v.servico || '', v.destino || '',
                    parseFloat(v.valorVenda) || 0, v.comissaoPercentual || 10,
                    parseFloat(AppModule.calcularComissaoVenda(v)).toFixed(2)
                ]);
                break;
            }
            case 'financeiro': {
                titulo = 'Financeiro';
                headers = ['ID', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Status', 'Vencimento', 'Valor', 'Forma Pagamento'];
                const trans = FinanceiroModule.getTransacoes();
                const filtradas = this.filtraPorPeriodo(trans, 'data');
                transacoes = filtradas.map(t => [
                    t.id, t.data, t.descricao, t.categoria || '', t.tipo, t.status,
                    t.vencimento || '', parseFloat(t.valor).toFixed(2), t.formaPagamento || ''
                ]);
                break;
            }
            case 'viagens': {
                titulo = 'Viagens';
                headers = ['ID', 'Cliente', 'Destino', 'Data Ida', 'Data Volta', 'Companhia', 'Check-in'];
                const viagens = this.filtraPorPeriodo(DB.get('viagens', []), 'dataIda');
                transacoes = viagens.map(v => [
                    v.id, DB.getClienteNome(v.clienteId), v.destino,
                    v.dataIda, v.dataVolta, v.companhia || '', v.checkinFeito ? 'Feito' : 'Pendente'
                ]);
                break;
            }
            case 'pipeline': {
                titulo = 'Pipeline';
                headers = ['ID', 'Título', 'Cliente', 'Etapa', 'Probabilidade', 'Valor', 'Criado Em'];
                const negocios = this.filtraPorPeriodo(DB.get('negocios', []));
                transacoes = negocios.map(n => [
                    n.id, n.titulo, DB.getClienteNome(n.clienteId), n.stage,
                    n.probabilidade || 0, parseFloat(n.valor).toFixed(2), n.criadoEm
                ]);
                break;
            }
        }

        // Gera CSV
        const linhas = [headers.join(';'), ...transacoes.map(row =>
            row.map(cel => `"${String(cel || '').replace(/"/g, '""')}"`).join(';')
        )];

        const csv = '\uFEFF' + linhas.join('\n'); // BOM para Excel
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${titulo}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        AppModule.toast('Relatório exportado com sucesso!');
    },

    // ===== IMPRESSÃO =====
    imprimir() {
        const container = document.getElementById('relatorios-conteudo');
        if (!container) return;

        const titulos = {
            vendas: 'Relatório de Vendas e Comissões',
            financeiro: 'Relatório Financeiro',
            viagens: 'Relatório de Viagens',
            pipeline: 'Relatório de Pipeline'
        };

        const titulo = titulos[this.tipoAtual] || 'Relatório';
        const periodo = this.periodoInicio || this.periodoFim
            ? `Período: ${this.periodoInicio ? AppModule.formatDate(this.periodoInicio) : 'Início'} a ${this.periodoFim ? AppModule.formatDate(this.periodoFim) : 'Hoje'}`
            : 'Período: Todo histórico';

        const config = DB.get('config', {});
        const nomeAgencia = config.agencia?.nome || 'CRM WDIH';

        const janela = window.open('', '_blank', 'width=900,height=700');
        if (!janela) {
            AppModule.toast('Permita pop-ups para imprimir.', 'warning');
            return;
        }

        janela.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>${titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 32px; color: #1e293b; }
                    h1 { font-size: 22px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
                    h2 { font-size: 18px; margin-top: 16px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
                    .periodo { color: #64748b; font-size: 13px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
                    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                    th { background: #f1f5f9; }
                    .kpi-grid { display: flex; gap: 16px; margin-top: 16px; }
                    .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; flex: 1; text-align: center; }
                    .kpi label { display: block; font-size: 11px; color: #64748b; }
                    .kpi span { font-size: 16px; font-weight: 700; }
                    .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${titulo}</h1>
                    <div class="periodo">${periodo}<br>Emitido em: ${new Date().toLocaleString('pt-BR')}</div>
                </div>
                <h2>${nomeAgencia}</h2>
                ${container.innerHTML}
                <div class="footer">Gerado por CRM WDIH</div>
                <script>window.print();<\/script>
            </body>
            </html>
        `);

        janela.document.close();
    }
};
