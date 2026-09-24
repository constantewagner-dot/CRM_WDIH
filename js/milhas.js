var MilhasModule = {
    tabAtual: 'visao',

    // ============ NAVEGAÇÃO ============
    render() {
        this.abrirTab(this.tabAtual || 'visao');
    },

    abrirTab(tab) {
        this.tabAtual = tab;
        document.querySelectorAll('.milhas-tab').forEach(t => t.classList.remove('active'));
        const btn = document.querySelector(`.milhas-tab[data-tab="${tab}"]`);
        if (btn) btn.classList.add('active');

        document.querySelectorAll('.milhas-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(`milhas-panel-${tab}`);
        if (panel) panel.classList.add('active');

        switch (tab) {
            case 'visao': this.renderVisao(); break;
            case 'programas': this.renderProgramas(); break;
            case 'cartoes': this.renderCartoes(); break;
            case 'emissoes': this.renderEmissoes(); break;
        }
    },

    // ============ DADOS ============
    getData() {
        const milhas = DB.get('milhas', {});
        if (!Array.isArray(milhas.programas)) milhas.programas = [];
        if (!Array.isArray(milhas.cartoes)) milhas.cartoes = [];
        if (!Array.isArray(milhas.emissoes)) milhas.emissoes = [];
        return milhas;
    },

    salvarData(milhas) {
        DB.set('milhas', milhas);
    },

    getCustoMilhaPadrao() {
        const config = DB.get('config', {});
        return parseFloat(config.valorMilhaPadrao) || 0.025;
    },

    fmtMilhas(n) {
        return (parseFloat(n) || 0).toLocaleString('pt-BR');
    },

    // ============ HELPERS DE CLIENTE ============
    getClienteNome(clienteId) {
        return DB.getClienteNome(clienteId);
    },

    getProgramasCliente(clienteId) {
        return this.getData().programas.filter(p => p.clienteId === clienteId);
    },

    getCartoesCliente(clienteId) {
        return this.getData().cartoes.filter(c => c.clienteId === clienteId);
    },

    getEmissoesCliente(clienteId) {
        return this.getData().emissoes.filter(e => e.clienteId === clienteId);
    },

    getViagensCliente(clienteId) {
        return DB.get('viagens', []).filter(v => v.clienteId === clienteId);
    },

    getSaldoAtual(programa) {
        const h = programa.historico || [];
        return h.length ? parseFloat(h[h.length - 1].saldo) || 0 : 0;
    },

    getVariacao(programa) {
        const h = programa.historico || [];
        if (h.length < 2) return 0;
        return this.getSaldoAtual(programa) - (parseFloat(h[h.length - 2].saldo) || 0);
    },

    getTotalMilhasCliente(clienteId) {
        return this.getProgramasCliente(clienteId)
            .reduce((s, p) => s + this.getSaldoAtual(p), 0);
    },

    calcEmissao(mercado, taxas, milhas, custoMilha) {
        const m = parseFloat(mercado) || 0;
        const t = parseFloat(taxas) || 0;
        const q = parseFloat(milhas) || 0;
        const c = (custoMilha !== '' && custoMilha !== null && custoMilha !== undefined)
            ? (parseFloat(custoMilha) || 0)
            : this.getCustoMilhaPadrao();

        const valorEmitido = t + (q * c);
        const economia = m - valorEmitido;
        const cpm = q > 0 ? ((m - t) / q) * 100 : 0;

        return { valorEmitido, economia, cpm };
    },

    getEconomiaCliente(clienteId) {
        return this.getEmissoesCliente(clienteId).reduce((s, e) => {
            const calc = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.custoMilha);
            return s + calc.economia;
        }, 0);
    },

    getValorMercadoCliente(clienteId) {
        return this.getEmissoesCliente(clienteId).reduce((s, e) => {
            return s + (parseFloat(e.valorMercado) || 0);
        }, 0);
    },

    // ============ VERIFICAR SE CLIENTE TEM MOVIMENTAÇÃO ============
    clienteTemMovimentacao(clienteId) {
        const programas = this.getProgramasCliente(clienteId);
        const cartoes = this.getCartoesCliente(clienteId);
        const emissoes = this.getEmissoesCliente(clienteId);
        const viagens = this.getViagensCliente(clienteId);
        return programas.length > 0 || cartoes.length > 0 || emissoes.length > 0 || viagens.length > 0;
    },

    // ============ VISÃO GERAL ============
    renderVisao() {
        const panel = document.getElementById('milhas-panel-visao');
        if (!panel) return;

        const clientes = DB.get('clientes', []);
        const data = this.getData();

        const totalMilhas = data.programas.reduce((s, p) => s + this.getSaldoAtual(p), 0);
        const totalEconomia = data.emissoes.reduce((s, e) => {
            const c = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.custoMilha);
            return s + c.economia;
        }, 0);
        const totalEmissoes = data.emissoes.length;

        let kpis = `
            <div class="kpi-grid">
                <div class="kpi-card"><label>Total de Milhas</label><span>${this.fmtMilhas(totalMilhas)}</span></div>
                <div class="kpi-card"><label>Emissões</label><span>${totalEmissoes}</span></div>
                <div class="kpi-card"><label>Economia Total</label><span style="color:var(--success);">${AppModule.formatCurrency(totalEconomia)}</span></div>
                <div class="kpi-card"><label>Clientes com Programas</label><span>${clientes.filter(c => this.getProgramasCliente(c.id).length).length}</span></div>
            </div>
        `;

        if (!clientes.length) {
            panel.innerHTML = kpis + '<p class="dashboard-empty">Nenhum cliente cadastrado ainda.</p>';
            return;
        }

        // Filtrar apenas clientes com movimentação
        const clientesComMovimentacao = clientes.filter(c => this.clienteTemMovimentacao(c.id));

        if (!clientesComMovimentacao.length) {
            panel.innerHTML = kpis + '<p class="dashboard-empty">Nenhum cliente com movimentação de milhas.</p>';
            return;
        }

        const cards = clientesComMovimentacao.map(c => {
            const totalCliente = this.getTotalMilhasCliente(c.id);
            const nProgramas = this.getProgramasCliente(c.id).length;
            const nCartoes = this.getCartoesCliente(c.id).length;
            const nViagens = this.getViagensCliente(c.id).length;
            const economia = this.getEconomiaCliente(c.id);

            return `
                <div class="cliente-card">
                    <div class="cliente-card-header">
                        <div>
                            <div class="cliente-card-nome">${AppModule.escapeHtml(c.nome)}</div>
                            <div class="cliente-card-sub">${AppModule.escapeHtml(c.email || c.telefone || '—')}</div>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="MilhasModule.portalCliente('${c.id}')">🔍 Portal do Cliente</button>
                    </div>
                    <div class="cliente-card-stats">
                        <div class="stat"><label>Milhas</label><span>${this.fmtMilhas(totalCliente)}</span></div>
                        <div class="stat"><label>Programas</label><span>${nProgramas}</span></div>
                        <div class="stat"><label>Cartões</label><span>${nCartoes}</span></div>
                        <div class="stat"><label>Viagens</label><span>${nViagens}</span></div>
                    </div>
                    ${economia ? `<div class="cliente-card-economia">💰 Economia: ${AppModule.formatCurrency(economia)}</div>` : ''}
                </div>
            `;
        }).join('');

        panel.innerHTML = kpis + `<div class="cliente-card-grid">${cards}</div>`;
    },

    // ============ PORTAL DO CLIENTE (POPUP DETALHADO) ============
    portalCliente(clienteId) {
        const c = DB.get('clientes', []).find(x => x.id === clienteId);
        if (!c) return;

        const programas = this.getProgramasCliente(clienteId);
        const cartoes = this.getCartoesCliente(clienteId);
        const emissoes = this.getEmissoesCliente(clienteId);
        const viagens = this.getViagensCliente(clienteId);

        // Calcular totais
        const totalMilhas = this.getTotalMilhasCliente(clienteId);
        const totalValorMercado = this.getValorMercadoCliente(clienteId);
        const totalEconomia = this.getEconomiaCliente(clienteId);
        const percentualEconomia = totalValorMercado > 0 ? ((totalEconomia / totalValorMercado) * 100) : 0;
        const totalVoos = emissoes.length;

        // Cabeçalho com dados do cliente
        let html = `
            <div style="background: linear-gradient(135deg, var(--primary), var(--primary-dark)); padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
                <h2 style="margin: 0 0 10px 0; font-size: 24px;">${AppModule.escapeHtml(c.nome)}</h2>
                <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; opacity: 0.95;">
                    ${c.email ? `<span>📧 ${AppModule.escapeHtml(c.email)}</span>` : ''}
                    ${c.telefone ? `<span>📱 ${AppModule.escapeHtml(c.telefone)}</span>` : ''}
                    ${c.documento ? `<span>📄 ${AppModule.escapeHtml(c.documento)}</span>` : ''}
                </div>
            </div>
        `;

        // Cards de resumo
        html += `
            <div class="kpi-grid" style="margin-bottom: 24px;">
                <div class="kpi-card" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white;">
                    <label style="color: rgba(255,255,255,0.9);">✈️ Vôos</label>
                    <span style="font-size: 28px; font-weight: 700;">${totalVoos}</span>
                </div>
                <div class="kpi-card" style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white;">
                    <label style="color: rgba(255,255,255,0.9);">💎 Valor de Mercado</label>
                    <span style="font-size: 20px; font-weight: 700;">${AppModule.formatCurrency(totalValorMercado)}</span>
                </div>
                <div class="kpi-card" style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white;">
                    <label style="color: rgba(255,255,255,0.9);">💰 Economia</label>
                    <span style="font-size: 20px; font-weight: 700;">${AppModule.formatCurrency(totalEconomia)}</span>
                </div>
                <div class="kpi-card" style="background: linear-gradient(135deg, #43e97b, #38f9d7); color: white;">
                    <label style="color: rgba(255,255,255,0.9);">📊 % Economia</label>
                    <span style="font-size: 28px; font-weight: 700;">${percentualEconomia.toFixed(1)}%</span>
                </div>
            </div>
        `;

        // Seção: Programas de Fidelidade
        html += `<h3 style="margin: 24px 0 12px 0; color: var(--text); border-bottom: 2px solid var(--primary); padding-bottom: 8px;">🎯 Programas de Fidelidade (${programas.length})</h3>`;
        if (!programas.length) {
            html += '<p style="color: var(--text-muted); font-style: italic;">Nenhum programa cadastrado.</p>';
        } else {
            html += '<div style="display: grid; gap: 10px;">';
            html += programas.map(p => {
                const saldo = this.getSaldoAtual(p);
                const variacao = this.getVariacao(p);
                return `
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="font-size: 15px;">${AppModule.escapeHtml(p.programa)}</strong>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 16px; font-weight: 600; color: var(--primary);">${this.fmtMilhas(saldo)} milhas</div>
                            ${variacao !== 0 ? `<small style="color: ${variacao >= 0 ? 'var(--success)' : 'var(--danger)'};">${variacao >= 0 ? '+' : ''}${this.fmtMilhas(variacao)}</small>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            html += '</div>';
        }

        // Seção: Cartões
        html += `<h3 style="margin: 24px 0 12px 0; color: var(--text); border-bottom: 2px solid var(--primary); padding-bottom: 8px;">💳 Cartões (${cartoes.length})</h3>`;
        if (!cartoes.length) {
            html += '<p style="color: var(--text-muted); font-style: italic;">Nenhum cartão cadastrado.</p>';
        } else {
            html += '<div style="display: grid; gap: 10px;">';
            html += cartoes.map(cartao => `
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span class="badge badge-info">${AppModule.escapeHtml(cartao.bandeira)}</span>
                        <strong style="margin-left: 8px;">${AppModule.escapeHtml(cartao.banco)}</strong>
                        ${cartao.nome ? `<div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${AppModule.escapeHtml(cartao.nome)}</div>` : ''}
                    </div>
                    ${cartao.limite ? `<div style="font-weight: 600;">${AppModule.formatCurrency(cartao.limite)}</div>` : ''}
                </div>
            `).join('');
            html += '</div>';
        }

        // Seção: Emissões
        html += `<h3 style="margin: 24px 0 12px 0; color: var(--text); border-bottom: 2px solid var(--primary); padding-bottom: 8px;">🎫 Emissões (${emissoes.length})</h3>`;
        if (!emissoes.length) {
            html += '<p style="color: var(--text-muted); font-style: italic;">Nenhuma emissão registrada.</p>';
        } else {
            html += '<div class="table-wrap"><table class="table">';
            html += `
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Rota</th>
                        <th>Valor Mercado</th>
                        <th>Valor Emitido</th>
                        <th>Economia</th>
                    </tr>
                </thead>
                <tbody>
            `;
            html += emissoes.sort((a, b) => new Date(b.data) - new Date(a.data)).map(e => {
                const calc = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.custoMilha);
                return `
                    <tr>
                        <td>${AppModule.formatDate(e.data)}</td>
                        <td><strong>${AppModule.escapeHtml(e.origem)} → ${AppModule.escapeHtml(e.destino)}</strong></td>
                        <td>${AppModule.formatCurrency(e.valorMercado)}</td>
                        <td>${AppModule.formatCurrency(calc.valorEmitido)}</td>
                        <td style="color: ${calc.economia >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">${AppModule.formatCurrency(calc.economia)}</td>
                    </tr>
                `;
            }).join('');
            html += '</tbody></table></div>';
        }

        // Seção: Viagens
        html += `<h3 style="margin: 24px 0 12px 0; color: var(--text); border-bottom: 2px solid var(--primary); padding-bottom: 8px;">✈️ Viagens (${viagens.length})</h3>`;
        if (!viagens.length) {
            html += '<p style="color: var(--text-muted); font-style: italic;">Nenhuma viagem registrada.</p>';
        } else {
            html += '<div style="display: grid; gap: 10px;">';
            html += viagens.map(v => `
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${AppModule.formatDate(v.dataIda)} → ${AppModule.escapeHtml(v.destino)}</strong>
                        ${v.dataVolta ? `<div style="font-size: 13px; color: var(--text-muted);">Retorno: ${AppModule.formatDate(v.dataVolta)}</div>` : ''}
                    </div>
                    <span class="badge ${v.checkinFeito ? 'badge-success' : 'badge-warning'}">${v.checkinFeito ? '✅ Check-in feito' : '⏳ Pendente'}</span>
                </div>
            `).join('');
            html += '</div>';
        }

        const footer = `<button class="btn btn-primary" onclick="AppModule.closeModal()">Fechar</button>`;
        AppModule.openModal(`Portal do Cliente`, html, footer);
    },

    // ============ PROGRAMAS ============
    renderProgramas() {
        const panel = document.getElementById('milhas-panel-programas');
        if (!panel) return;

        const data = this.getData();
        const programas = data.programas;

        let html = `<div style="margin-bottom:16px;"><button class="btn btn-primary" onclick="MilhasModule.novoPrograma()">+ Novo Programa</button></div>`;

        if (!programas.length) {
            html += '<p class="dashboard-empty">Nenhum programa cadastrado.</p>';
            panel.innerHTML = html;
            return;
        }

        html += `
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Cliente</th><th>Programa</th><th>Saldo Atual</th><th>Variação</th><th>Última Atualização</th><th>Ações</th></tr></thead>
                    <tbody>
                        ${programas.map(p => {
                            const saldo = this.getSaldoAtual(p);
                            const variacao = this.getVariacao(p);
                            const ultimo = (p.historico || [])[p.historico.length - 1];
                            return `
                                <tr>
                                    <td>${AppModule.escapeHtml(this.getClienteNome(p.clienteId))}</td>
                                    <td><strong>${AppModule.escapeHtml(p.programa)}</strong></td>
                                    <td>${this.fmtMilhas(saldo)}</td>
                                    <td style="color:${variacao >= 0 ? 'var(--success)' : 'var(--danger)'};">${variacao >= 0 ? '+' : ''}${this.fmtMilhas(variacao)}</td>
                                    <td>${ultimo ? ultimo.data : '—'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-success" onclick="MilhasModule.atualizarSaldo('${p.id}')">Atualizar saldo</button>
                                        <button class="btn btn-sm btn-secondary" onclick="MilhasModule.verHistorico('${p.id}')">Histórico</button>
                                        <button class="btn btn-sm btn-secondary" onclick="MilhasModule.editarPrograma('${p.id}')">Editar</button>
                                        <button class="btn btn-sm btn-danger" onclick="MilhasModule.excluirPrograma('${p.id}')">Excluir</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        panel.innerHTML = html;
    },

    novoPrograma() { this.abrirFormPrograma(); },

    editarPrograma(id) {
        const p = this.getData().programas.find(x => x.id === id);
        if (p) this.abrirFormPrograma(p);
    },

    abrirFormPrograma(programa = null) {
        const isEdit = !!programa;
        const clientes = DB.get('clientes', []);

        const html = `
            <div class="form-group"><label>Cliente *</label>
                <select id="prg-cliente" class="form-control">
                    <option value="">— Selecionar —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${programa?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Programa *</label>
                <input type="text" id="prg-programa" class="form-control" list="dl-programas" value="${AppModule.escapeHtml(programa?.programa || '')}">
            </div>
            ${!isEdit ? `
                <div class="form-grid">
                    <div class="form-group"><label>Saldo Inicial</label><input type="number" id="prg-saldo" class="form-control" value="0"></div>
                    <div class="form-group"><label>Mês de Referência</label><input type="month" id="prg-mes" class="form-control" value="${new Date().toISOString().slice(0,7)}"></div>
                </div>
            ` : ''}
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarPrograma('${programa?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Programa' : 'Novo Programa', html, footer);
    },

    salvarPrograma(id) {
        const clienteId = document.getElementById('prg-cliente').value;
        const programa = document.getElementById('prg-programa').value.trim();
        if (!clienteId || !programa) { AppModule.toast('Informe cliente e programa.'); return; }

        const data = this.getData();
        const index = data.programas.findIndex(p => p.id === id);

        if (index >= 0) {
            data.programas[index].programa = programa;
            data.programas[index].clienteId = clienteId;
        } else {
            const novo = { id: id || AppModule.generateId(), clienteId, programa, historico: [] };
            const saldoInicial = document.getElementById('prg-saldo')?.value;
            const mesInicial = document.getElementById('prg-mes')?.value;
            if (saldoInicial !== undefined && mesInicial) {
                novo.historico.push({
                    id: AppModule.generateId(),
                    data: mesInicial,
                    saldo: parseFloat(saldoInicial) || 0,
                    observacao: 'Saldo inicial'
                });
            }
            data.programas.push(novo);
        }

        this.salvarData(data);
        AppModule.closeModal();
        AppModule.toast('Programa salvo!');
        this.renderProgramas();
    },

    excluirPrograma(id) {
        if (!confirm('Excluir este programa e todo o histórico?')) return;
        const data = this.getData();
        data.programas = data.programas.filter(p => p.id !== id);
        this.salvarData(data);
        AppModule.toast('Programa excluído.');
        this.renderProgramas();
    },

    atualizarSaldo(id) {
        const p = this.getData().programas.find(x => x.id === id);
        if (!p) return;
        const saldoAtual = this.getSaldoAtual(p);

        const html = `
            <div class="form-group"><label>Mês de Referência *</label><input type="month" id="sal-mes" class="form-control" value="${new Date().toISOString().slice(0,7)}"></div>
            <div class="form-group"><label>Saldo Atual</label><input type="number" id="sal-atual" class="form-control" value="${saldoAtual}" disabled></div>
            <div class="form-group"><label>Novo Saldo *</label><input type="number" id="sal-novo" class="form-control" value="${saldoAtual}"></div>
            <div class="form-group"><label>Observação</label><input type="text" id="sal-obs" class="form-control" placeholder="Ex: pontuação do cartão de crédito"></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarSaldo('${p.id}')">Salvar</button>
        `;

        AppModule.openModal(`Atualizar saldo — ${p.programa}`, html, footer);
    },

    salvarSaldo(id) {
        const mes = document.getElementById('sal-mes').value;
        const novoSaldo = parseFloat(document.getElementById('sal-novo').value);
        if (!mes || isNaN(novoSaldo)) { AppModule.toast('Informe o mês e o novo saldo.'); return; }

        const data = this.getData();
        const p = data.programas.find(x => x.id === id);
        if (!p) return;

        if (!Array.isArray(p.historico)) p.historico = [];

        p.historico = p.historico.filter(h => h.data !== mes);

        p.historico.push({
            id: AppModule.generateId(),
            data: mes,
            saldo: novoSaldo,
            observacao: document.getElementById('sal-obs').value.trim()
        });

        p.historico.sort((a, b) => a.data.localeCompare(b.data));

        this.salvarData(data);
        AppModule.closeModal();
        AppModule.toast('Saldo atualizado!');
        this.renderProgramas();
    },

    verHistorico(id) {
        const p = this.getData().programas.find(x => x.id === id);
        if (!p) return;

        const h = (p.historico || []).slice().reverse();
        let html = '';

        if (!h.length) {
            html = '<p class="dashboard-empty">Nenhum histórico ainda. Clique em "Atualizar saldo".</p>';
        } else {
            html = `
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr><th>Mês</th><th>Saldo</th><th>Variação</th><th>Observação</th></tr></thead>
                        <tbody>
                            ${h.map((entry, i, arr) => {
                                const anterior = arr[i + 1];
                                const variacao = anterior ? (entry.saldo - anterior.saldo) : 0;
                                return `
                                    <tr>
                                        <td>${entry.data}</td>
                                        <td><strong>${this.fmtMilhas(entry.saldo)}</strong></td>
                                        <td style="color:${variacao >= 0 ? 'var(--success)' : 'var(--danger)'};">${variacao >= 0 ? '+' : ''}${this.fmtMilhas(variacao)}</td>
                                        <td>${AppModule.escapeHtml(entry.observacao || '—')}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        const footer = `<button class="btn btn-primary" onclick="AppModule.closeModal()">Fechar</button>`;
        AppModule.openModal(`Histórico — ${p.programa} (${this.getClienteNome(p.clienteId)})`, html, footer);
    },

    // ============ CARTÕES ============
    renderCartoes() {
        const panel = document.getElementById('milhas-panel-cartoes');
        if (!panel) return;

        const cartoes = this.getData().cartoes;

        let html = `<div style="margin-bottom:16px;"><button class="btn btn-primary" onclick="MilhasModule.novoCartao()">+ Novo Cartão</button></div>`;

        if (!cartoes.length) {
            html += '<p class="dashboard-empty">Nenhum cartão cadastrado.</p>';
            panel.innerHTML = html;
            return;
        }

        html += `
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Cliente</th><th>Bandeira</th><th>Banco</th><th>Nome do Cartão</th><th>Limite</th><th>Ações</th></tr></thead>
                    <tbody>
                        ${cartoes.map(c => `
                            <tr>
                                <td>${AppModule.escapeHtml(this.getClienteNome(c.clienteId))}</td>
                                <td><span class="badge badge-info">${AppModule.escapeHtml(c.bandeira)}</span></td>
                                <td>${AppModule.escapeHtml(c.banco)}</td>
                                <td>${AppModule.escapeHtml(c.nome || '—')}</td>
                                <td>${c.limite ? AppModule.formatCurrency(c.limite) : '—'}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="MilhasModule.editarCartao('${c.id}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="MilhasModule.excluirCartao('${c.id}')">Excluir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        panel.innerHTML = html;
    },

    novoCartao() { this.abrirFormCartao(); },

    editarCartao(id) {
        const c = this.getData().cartoes.find(x => x.id === id);
        if (c) this.abrirFormCartao(c);
    },

    abrirFormCartao(cartao = null) {
        const isEdit = !!cartao;
        const clientes = DB.get('clientes', []);
        const bandeiras = ['Visa', 'Mastercard', 'American Express', 'Elo', 'Hipercard', 'Diners Club'];

        const html = `
            <div class="form-group"><label>Cliente *</label>
                <select id="crt-cliente" class="form-control">
                    <option value="">— Selecionar —</option>
                    ${clientes.map(c => `<option value="${c.id}" ${cartao?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Bandeira *</label>
                    <select id="crt-bandeira" class="form-control">
                        ${bandeiras.map(b => `<option value="${b}" ${cartao?.bandeira === b ? 'selected' : ''}>${b}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Banco *</label>
                    <input type="text" id="crt-banco" class="form-control" list="dl-bancos" value="${AppModule.escapeHtml(cartao?.banco || '')}">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Nome do Cartão</label><input type="text" id="crt-nome" class="form-control" placeholder="Ex: Pão de Açúcar Visa Infinite" value="${AppModule.escapeHtml(cartao?.nome || '')}"></div>
                <div class="form-group"><label>Limite (R$)</label><input type="number" id="crt-limite" class="form-control" step="0.01" value="${cartao?.limite || ''}"></div>
            </div>
            <div class="form-group"><label>Observações</label><textarea id="crt-obs" class="form-control" rows="2">${AppModule.escapeHtml(cartao?.observacoes || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarCartao('${cartao?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Cartão' : 'Novo Cartão', html, footer);
    },

    salvarCartao(id) {
        const clienteId = document.getElementById('crt-cliente').value;
        const bandeira = document.getElementById('crt-bandeira').value;
        const banco = document.getElementById('crt-banco').value.trim();
        if (!clienteId || !bandeira || !banco) { AppModule.toast('Informe cliente, bandeira e banco.'); return; }

        const data = this.getData();
        const index = data.cartoes.findIndex(c => c.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            clienteId,
            bandeira,
            banco,
            nome: document.getElementById('crt-nome').value.trim(),
            limite: parseFloat(document.getElementById('crt-limite').value) || 0,
            observacoes: document.getElementById('crt-obs').value.trim()
        };

        if (index >= 0) {
            data.cartoes[index] = { ...data.cartoes[index], ...dados };
        } else {
            data.cartoes.push(dados);
        }

        this.salvarData(data);
        AppModule.closeModal();
        AppModule.toast('Cartão salvo!');
        this.renderCartoes();
    },

    excluirCartao(id) {
        if (!confirm('Excluir este cartão?')) return;
        const data = this.getData();
        data.cartoes = data.cartoes.filter(c => c.id !== id);
        this.salvarData(data);
        AppModule.toast('Cartão excluído.');
        this.renderCartoes();
    },

    // ============ EMISSÕES ============
    renderEmissoes() {
        const panel = document.getElementById('milhas-panel-emissoes');
        if (!panel) return;

        const emissoes = this.getData().emissoes;

        let totalEconomia = 0, totalMilhas = 0;
        emissoes.forEach(e => {
            const c = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.custoMilha);
            totalEconomia += c.economia;
            totalMilhas += parseFloat(e.milhasUtilizadas) || 0;
        });

        let html = `
            <div class="kpi-grid">
                <div class="kpi-card"><label>Emissões</label><span>${emissoes.length}</span></div>
                <div class="kpi-card"><label>Milhas Utilizadas</label><span>${this.fmtMilhas(totalMilhas)}</span></div>
                <div class="kpi-card"><label>Economia Total</label><span style="color:var(--success);">${AppModule.formatCurrency(totalEconomia)}</span></div>
            </div>
            <div style="margin:16px 0;"><button class="btn btn-primary" onclick="MilhasModule.novaEmissao()">+ Nova Emissão</button></div>
        `;

        if (!emissoes.length) {
            html += '<p class="dashboard-empty">Nenhuma emissão registrada.</p>';
            panel.innerHTML = html;
            return;
        }

        html += `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr><th>Data</th><th>Cliente</th><th>Rota</th><th>Milhas</th><th>Taxas</th><th>Valor Mercado</th><th>Valor Emitido</th><th>Economia</th><th>CPM</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                        ${emissoes.sort((a, b) => new Date(b.data) - new Date(a.data)).map(e => {
                            const calc = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.custoMilha);
                            return `
                                <tr>
                                    <td>${AppModule.formatDate(e.data)}</td>
                                    <td>${AppModule.escapeHtml(this.getClienteNome(e.clienteId))}</td>
                                    <td>${AppModule.escapeHtml(e.origem)}→${AppModule.escapeHtml(e.destino)}</td>
                                    <td>${this.fmtMilhas(e.milhasUtilizadas)}</td>
                                    <td>${AppModule.formatCurrency(e.taxas)}</td>
                                    <td>${AppModule.formatCurrency(e.valorMercado)}</td>
                                    <td>${AppModule.formatCurrency(calc.valorEmitido)}</td>
                                    <td style="color:${calc.economia >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:700;">${AppModule.formatCurrency(calc.economia)}</td>
                                    <td>${calc.cpm.toFixed(1).replace('.', ',')}</td>
                                    <td>
                                        <button class="btn btn-sm btn-secondary" onclick="MilhasModule.editarEmissao('${e.id}')">Editar</button>
                                        <button class="btn btn-sm btn-danger" onclick="MilhasModule.excluirEmissao('${e.id}')">Excluir</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <p style="font-size:11px;color:var(--text-muted);margin-top:8px;">CPM = centavos por milha (economia ÷ milhas × 100)</p>
        `;

        panel.innerHTML = html;
    },

    novaEmissao() { this.abrirFormEmissao(); },

    editarEmissao(id) {
        const e = this.getData().emissoes.find(x => x.id === id);
        if (e) this.abrirFormEmissao(e);
    },

    abrirFormEmissao(emissao = null) {
        const isEdit = !!emissao;
        const clientes = DB.get('clientes', []);
        const custoPadrao = this.getCustoMilhaPadrao();

        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Cliente *</label>
                    <select id="ems-cliente" class="form-control" onchange="MilhasModule.atualizarProgramasEmissao()">
                        <option value="">— Selecionar —</option>
                        ${clientes.map(c => `<option value="${c.id}" ${emissao?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Programa *</label>
                    <select id="ems-programa" class="form-control"></select>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Data *</label><input type="date" id="ems-data" class="form-control" value="${emissao?.data || new Date().toISOString().slice(0,10)}"></div>
                <div class="form-group"><label>Localizador</label><input type="text" id="ems-localizador" class="form-control" value="${AppModule.escapeHtml(emissao?.localizador || '')}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Origem *</label><input type="text" id="ems-origem" class="form-control" placeholder="GRU" value="${AppModule.escapeHtml(emissao?.origem || '')}"></div>
                <div class="form-group"><label>Destino *</label><input type="text" id="ems-destino" class="form-control" placeholder="MIA" value="${AppModule.escapeHtml(emissao?.destino || '')}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Milhas Utilizadas *</label><input type="number" id="ems-milhas" class="form-control" value="${emissao?.milhasUtilizadas || 0}"></div>
                <div class="form-group"><label>Taxas (R$) *</label><input type="number" id="ems-taxas" class="form-control" step="0.01" value="${emissao?.taxas || 0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Valor de Mercado (R$) *</label><input type="number" id="ems-mercado" class="form-control" step="0.01" value="${emissao?.valorMercado || 0}"></div>
                <div class="form-group"><label>Custo da Milha (R$)</label><input type="number" id="ems-custo" class="form-control" step="0.0001" placeholder="Padrão: ${custoPadrao}" value="${emissao?.custoMilha ?? ''}"></div>
            </div>
            <div class="form-group"><label>Observações</label><textarea id="ems-obs" class="form-control" rows="2">${AppModule.escapeHtml(emissao?.observacoes || '')}</textarea></div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarEmissao('${emissao?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Emissão' : 'Nova Emissão', html, footer);

        setTimeout(() => this.atualizarProgramasEmissao(emissao?.programa), 50);
    },

    atualizarProgramasEmissao(programaSelecionado = '') {
        const clienteId = document.getElementById('ems-cliente')?.value;
        const select = document.getElementById('ems-programa');
        if (!select) return;

        const programas = clienteId ? this.getProgramasCliente(clienteId) : [];
        select.innerHTML = programas.length
            ? programas.map(p => `<option value="${AppModule.escapeHtml(p.programa)}" ${programaSelecionado === p.programa ? 'selected' : ''}>${AppModule.escapeHtml(p.programa)}</option>`).join('')
            : '<option value="">— Sem programas —</option>';
    },

    salvarEmissao(id) {
        const clienteId = document.getElementById('ems-cliente').value;
        const programa = document.getElementById('ems-programa').value;
        const origem = document.getElementById('ems-origem').value.trim();
        const destino = document.getElementById('ems-destino').value.trim();
        const milhas = parseFloat(document.getElementById('ems-milhas').value);

        if (!clienteId || !programa || !origem || !destino || !milhas) {
            AppModule.toast('Preencha cliente, programa, rota e milhas.');
            return;
        }

        const data = this.getData();
        const index = data.emissoes.findIndex(e => e.id === id);

        const custoMilhaInput = document.getElementById('ems-custo').value;
        const dados = {
            id: id || AppModule.generateId(),
            clienteId,
            programa,
            data: document.getElementById('ems-data').value,
            localizador: document.getElementById('ems-localizador').value.trim(),
            origem,
            destino,
            milhasUtilizadas: milhas,
            taxas: parseFloat(document.getElementById('ems-taxas').value) || 0,
            valorMercado: parseFloat(document.getElementById('ems-mercado').value) || 0,
            custoMilha: custoMilhaInput !== '' ? parseFloat(custoMilhaInput) : null,
            observacoes: document.getElementById('ems-obs').value.trim()
        };

        if (index >= 0) {
            data.emissoes[index] = { ...data.emissoes[index], ...dados };
        } else {
            data.emissoes.push(dados);
        }

        this.salvarData(data);
        AppModule.closeModal();
        AppModule.toast('Emissão salva!');
        this.renderEmissoes();
    },

    excluirEmissao(id) {
        if (!confirm('Excluir esta emissão?')) return;
        const data = this.getData();
        data.emissoes = data.emissoes.filter(e => e.id !== id);
        this.salvarData(data);
        AppModule.toast('Emissão excluída.');
        this.renderEmissoes();
    }
};
