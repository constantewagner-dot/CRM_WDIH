var MilhasModule = {
    render() {
        this.renderResumo();
        this.renderClientes();
        this.renderEmissaoForm();
        this.renderListaEmissao();
        this.renderProgramas();
        this.renderCartoes();
        this.renderExtrato();
    },

    // ===== CÁLCULO DE EMISSÃO =====
    calcEmissao(valorMercado, taxas, milhasUtilizadas, companhia) {
        const valor = parseFloat(valorMercado) || 0;
        const taxasVal = parseFloat(taxas) || 0;
        const milhas = parseFloat(milhasUtilizadas) || 0;
        const config = DB.get('config', {});
        const custoMilha = parseFloat(config.milhas?.custoMilha) || 0.015;
        
        const custoMilhas = milhas * custoMilha;
        const totalPago = custoMilhas + taxasVal;
        const economia = valor - totalPago;
        const percentual = valor > 0 ? ((economia / valor) * 100) : 0;
        
        return {
            custoMilhas,
            totalPago,
            economia: Math.max(0, economia),
            percentual: Math.max(0, percentual)
        };
    },

    // ===== RESUMO =====
    renderResumo() {
        const container = document.getElementById('milhas-resumo');
        if (!container) return;

        const milhas = DB.get('milhas', { emissoes: [] });
        const emissoes = milhas.emissoes || [];
        const viagens = DB.get('viagens', []);

        const totalEmissao = emissoes.length;
        const totalEconomia = emissoes.reduce((s, e) => {
            const calc = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.companhia);
            return s + calc.economia;
        }, 0);
        const totalInvestido = emissoes.reduce((s, e) => {
            const calc = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.companhia);
            return s + calc.totalPago;
        }, 0);

        const hoje = new Date();
        const proximas = viagens.filter(v => {
            if (v.checkinFeito) return false;
            const dataIda = new Date(v.dataIda);
            return dataIda >= hoje;
        }).length;

        container.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <label>Total de Emissões</label>
                    <span>${totalEmissao}</span>
                </div>
                <div class="kpi-card">
                    <label>Economia Total</label>
                    <span style="color:var(--success);">${AppModule.formatCurrency(totalEconomia)}</span>
                </div>
                <div class="kpi-card">
                    <label>Investimento Total</label>
                    <span>${AppModule.formatCurrency(totalInvestido)}</span>
                </div>
                <div class="kpi-card">
                    <label>Próximas Viagens</label>
                    <span style="color:var(--warning);">${proximas}</span>
                </div>
            </div>
        `;
    },

    // ===== CLIENTES COM MOVIMENTAÇÃO =====
    renderClientes() {
        const container = document.getElementById('milhas-clientes');
        if (!container) return;

        const clientes = DB.get('clientes', []);
        const milhas = DB.get('milhas', { emissoes: [] });
        const emissoes = milhas.emissoes || [];

        // Filtrar apenas clientes com emissões
        const clientesComMovimento = clientes.filter(c => 
            emissoes.some(e => e.clienteId === c.id)
        );

        if (!clientesComMovimento.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhum cliente com movimentação de milhas.</p>';
            return;
        }

        container.innerHTML = `
            <h3 style="margin-bottom:12px;">Clientes com Movimentação</h3>
            <div class="grid-3">
                ${clientesComMovimento.map(c => {
                    const emissoesCliente = emissoes.filter(e => e.clienteId === c.id);
                    const totalEmissao = emissoesCliente.length;
                    const totalEconomia = emissoesCliente.reduce((s, e) => {
                        const calc = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.companhia);
                        return s + calc.economia;
                    }, 0);

                    return `
                        <div class="card" style="position:relative;">
                            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                                <div>
                                    <h4 style="margin:0;">${AppModule.escapeHtml(c.nome)}</h4>
                                    <small style="color:var(--text-muted);">${AppModule.escapeHtml(c.email || '—')}</small>
                                </div>
                                <span class="badge badge-info">${totalEmissao} emissões</span>
                            </div>
                            <div style="margin:12px 0;">
                                <div style="font-size:12px;color:var(--text-muted);">Economia Total</div>
                                <div style="font-size:18px;font-weight:700;color:var(--success);">${AppModule.formatCurrency(totalEconomia)}</div>
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="MilhasModule.abrirPortalCliente('${c.id}')" style="width:100%;">
                                🚪 Portal do Cliente
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // ===== PORTAL DO CLIENTE =====
    abrirPortalCliente(clienteId) {
        const cliente = DB.get('clientes', []).find(c => c.id === clienteId);
        if (!cliente) return;

        const milhas = DB.get('milhas', { emissoes: [], programas: [], cartoes: [] });
        const emissoes = (milhas.emissoes || []).filter(e => e.clienteId === clienteId);
        const programas = (milhas.programas || []).filter(p => p.clienteId === clienteId);
        const cartoes = (milhas.cartoes || []).filter(c => c.clienteId === clienteId);

        // Cálculos
        const totalVoos = emissoes.length;
        const valorMercado = emissoes.reduce((s, e) => s + (parseFloat(e.valorMercado) || 0), 0);
        const totalEconomia = emissoes.reduce((s, e) => {
            const calc = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.companhia);
            return s + calc.economia;
        }, 0);
        const percentualEconomia = valorMercado > 0 ? ((totalEconomia / valorMercado) * 100) : 0;

        const html = `
            <div style="padding:20px;">
                <!-- HEADER DO CLIENTE -->
                <div style="background:linear-gradient(135deg, #2563eb 0%, #1e40af 100%);color:white;padding:24px;border-radius:12px;margin-bottom:24px;">
                    <div style="display:flex;align-items:center;gap:16px;">
                        <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;">
                            ${cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <div style="flex:1;">
                            <h2 style="margin:0;font-size:24px;">${AppModule.escapeHtml(cliente.nome)}</h2>
                            <div style="margin-top:4px;opacity:0.9;">
                                ${cliente.email ? `<span>📧 ${AppModule.escapeHtml(cliente.email)}</span>` : ''}
                                ${cliente.telefone ? `<span style="margin-left:16px;"> 📱 ${AppModule.escapeHtml(cliente.telefone)}</span>` : ''}
                            </div>
                            <div style="margin-top:8px;font-size:13px;opacity:0.8;">
                                Cliente desde ${AppModule.formatDate(cliente.criadoEm)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CARDS DE KPI -->
                <div class="kpi-grid" style="margin-bottom:24px;">
                    <div class="kpi-card" style="border-left:4px solid #2563eb;">
                        <label style="font-size:12px;color:var(--text-muted);">QUANTIDADE DE VOOS</label>
                        <span style="font-size:28px;font-weight:700;color:#2563eb;">${totalVoos}</span>
                    </div>
                    <div class="kpi-card" style="border-left:4px solid #7c3aed;">
                        <label style="font-size:12px;color:var(--text-muted);">VALOR DE MERCADO</label>
                        <span style="font-size:20px;font-weight:700;color:#7c3aed;">${AppModule.formatCurrency(valorMercado)}</span>
                    </div>
                    <div class="kpi-card" style="border-left:4px solid #10b981;">
                        <label style="font-size:12px;color:var(--text-muted);">VALOR DE ECONOMIA</label>
                        <span style="font-size:20px;font-weight:700;color:#10b981;">${AppModule.formatCurrency(totalEconomia)}</span>
                    </div>
                    <div class="kpi-card" style="border-left:4px solid #f59e0b;">
                        <label style="font-size:12px;color:var(--text-muted);">% DE ECONOMIA</label>
                        <span style="font-size:28px;font-weight:700;color:#f59e0b;">${percentualEconomia.toFixed(1)}%</span>
                    </div>
                </div>

                <!-- PROGRAMAS DE FIDELIDADE -->
                <div style="margin-bottom:24px;">
                    <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                        🏆 Programas de Fidelidade
                        <span class="badge badge-info">${programas.length}</span>
                    </h3>
                    ${programas.length ? `
                        <div class="grid-2">
                            ${programas.map(p => `
                                <div class="card" style="padding:16px;">
                                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                                        <strong style="font-size:16px;">${AppModule.escapeHtml(p.nome)}</strong>
                                        <span class="badge ${p.status === 'ativo' ? 'badge-success' : 'badge-secondary'}">${p.status || 'ativo'}</span>
                                    </div>
                                    <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">
                                        Número: ${AppModule.escapeHtml(p.numero || '—')}
                                    </div>
                                    <div style="display:flex;justify-content:space-between;align-items:center;">
                                        <div>
                                            <div style="font-size:11px;color:var(--text-muted);">Saldo</div>
                                            <div style="font-weight:700;color:#2563eb;">${AppModule.formatCurrency(p.saldo || 0)}</div>
                                        </div>
                                        <div>
                                            <div style="font-size:11px;color:var(--text-muted);">Status</div>
                                            <div style="font-weight:600;">${AppModule.escapeHtml(p.nivel || 'Básico')}</div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="dashboard-empty">Nenhum programa cadastrado.</p>'}
                </div>

                <!-- CARTÕES -->
                <div style="margin-bottom:24px;">
                    <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                        💳 Cartões
                        <span class="badge badge-info">${cartoes.length}</span>
                    </h3>
                    ${cartoes.length ? `
                        <div class="grid-2">
                            ${cartoes.map(c => `
                                <div class="card" style="padding:16px;background:linear-gradient(135deg, #1e293b 0%, #334155 100%);color:white;">
                                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
                                        <div>
                                            <div style="font-size:11px;opacity:0.7;">Titular</div>
                                            <div style="font-weight:600;">${AppModule.escapeHtml(c.titular || cliente.nome)}</div>
                                        </div>
                                        <div style="font-size:20px;">💳</div>
                                    </div>
                                    <div style="font-size:18px;letter-spacing:2px;margin-bottom:16px;font-family:monospace;">
                                        ${AppModule.escapeHtml(c.numero || '•••• •••• •••• ••••')}
                                    </div>
                                    <div style="display:flex;justify-content:space-between;align-items:end;">
                                        <div>
                                            <div style="font-size:11px;opacity:0.7;">Limite</div>
                                            <div style="font-weight:700;">${AppModule.formatCurrency(c.limite || 0)}</div>
                                        </div>
                                        <div>
                                            <div style="font-size:11px;opacity:0.7;">Validade</div>
                                            <div style="font-weight:600;">${AppModule.escapeHtml(c.validade || '—')}</div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="dashboard-empty">Nenhum cartão cadastrado.</p>'}
                </div>

                <!-- EMISSÕES -->
                <div>
                    <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                        ✈️ Emissões
                        <span class="badge badge-info">${emissoes.length}</span>
                    </h3>
                    ${emissoes.length ? `
                        <div class="table-wrap">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Destino</th>
                                        <th>Companhia</th>
                                        <th>Milhas</th>
                                        <th>Valor Mercado</th>
                                        <th>Economia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${emissoes.sort((a, b) => new Date(b.data) - new Date(a.data)).map(e => {
                                        const calc = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.companhia);
                                        return `
                                            <tr>
                                                <td>${AppModule.formatDate(e.data)}</td>
                                                <td>${AppModule.escapeHtml(e.destino || '—')}</td>
                                                <td>${AppModule.escapeHtml(e.companhia || '—')}</td>
                                                <td>${parseFloat(e.milhasUtilizadas || 0).toLocaleString('pt-BR')}</td>
                                                <td style="font-weight:600;">${AppModule.formatCurrency(e.valorMercado)}</td>
                                                <td style="color:var(--success);font-weight:700;">${AppModule.formatCurrency(calc.economia)}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<p class="dashboard-empty">Nenhuma emissão registrada.</p>'}
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Fechar</button>
        `;

        AppModule.openModal(`Portal do Cliente - ${cliente.nome}`, html, footer);
    },

    // ===== FORMULÁRIO DE EMISSÃO =====
    renderEmissaoForm() {
        const container = document.getElementById('milhas-form');
        if (!container) return;

        const clientes = DB.get('clientes', []);
        const companhias = DB.get('config', {}).companhias || ['Azul', 'LATAM', 'GOL'];

        container.innerHTML = `
            <div class="card">
                <h3>Nova Emissão</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Cliente *</label>
                        <select id="emissao-cliente" class="form-control">
                            <option value="">— Selecionar —</option>
                            ${clientes.map(c => `<option value="${c.id}">${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Data *</label>
                        <input type="date" id="emissao-data" class="form-control" value="${new Date().toISOString().slice(0,10)}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Destino *</label>
                        <input type="text" id="emissao-destino" class="form-control" placeholder="Ex: São Paulo - GRU">
                    </div>
                    <div class="form-group">
                        <label>Companhia *</label>
                        <select id="emissao-companhia" class="form-control">
                            ${companhias.map(c => `<option value="${AppModule.escapeHtml(c)}">${AppModule.escapeHtml(c)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Valor de Mercado (R$) *</label>
                        <input type="number" id="emissao-valor" class="form-control" step="0.01" placeholder="0,00">
                    </div>
                    <div class="form-group">
                        <label>Taxas (R$)</label>
                        <input type="number" id="emissao-taxas" class="form-control" step="0.01" value="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Milhas Utilizadas *</label>
                    <input type="number" id="emissao-milhas" class="form-control" placeholder="0">
                </div>
                <div id="emissao-preview" style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;display:none;">
                    <h4 style="margin-top:0;">Prévia da Emissão</h4>
                    <div id="emissao-preview-content"></div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-secondary" onclick="MilhasModule.calcularPreview()">📊 Calcular</button>
                    <button class="btn btn-primary" onclick="MilhasModule.salvarEmissao()">💾 Salvar Emissão</button>
                </div>
            </div>
        `;
    },

    calcularPreview() {
        const valor = parseFloat(document.getElementById('emissao-valor').value) || 0;
        const taxas = parseFloat(document.getElementById('emissao-taxas').value) || 0;
        const milhas = parseFloat(document.getElementById('emissao-milhas').value) || 0;
        const companhia = document.getElementById('emissao-companhia').value;

        if (!valor || !milhas) {
            AppModule.toast('Preencha valor e milhas.', 'warning');
            return;
        }

        const calc = this.calcEmissao(valor, taxas, milhas, companhia);
        const preview = document.getElementById('emissao-preview');
        const content = document.getElementById('emissao-preview-content');

        content.innerHTML = `
            <div class="grid-2">
                <div><strong>Custo das Milhas:</strong> ${AppModule.formatCurrency(calc.custoMilhas)}</div>
                <div><strong>Total Pago:</strong> ${AppModule.formatCurrency(calc.totalPago)}</div>
                <div><strong>Economia:</strong> <span style="color:var(--success);font-weight:700;">${AppModule.formatCurrency(calc.economia)}</span></div>
                <div><strong>% Economia:</strong> <span style="color:var(--success);font-weight:700;">${calc.percentual.toFixed(1)}%</span></div>
            </div>
        `;

        preview.style.display = 'block';
    },

    salvarEmissao() {
        const clienteId = document.getElementById('emissao-cliente').value;
        const data = document.getElementById('emissao-data').value;
        const destino = document.getElementById('emissao-destino').value.trim();
        const companhia = document.getElementById('emissao-companhia').value;
        const valor = parseFloat(document.getElementById('emissao-valor').value);
        const taxas = parseFloat(document.getElementById('emissao-taxas').value) || 0;
        const milhas = parseFloat(document.getElementById('emissao-milhas').value);

        if (!clienteId || !data || !destino || !valor || !milhas) {
            AppModule.toast('Preencha todos os campos obrigatórios.', 'warning');
            return;
        }

        const milhasData = DB.get('milhas', { emissoes: [] });
        const emissoes = milhasData.emissoes || [];

        emissoes.push({
            id: AppModule.generateId(),
            clienteId,
            data,
            destino,
            companhia,
            valorMercado: valor,
            taxas,
            milhasUtilizadas: milhas,
            criadoEm: new Date().toISOString()
        });

        milhasData.emissoes = emissoes;
        DB.set('milhas', milhasData);

        AppModule.addAtividade(`Emissão de milhas registrada para ${DB.getClienteNome(clienteId)} - ${destino}`, 'milhas');
        AppModule.toast('Emissão registrada com sucesso!');
        
        this.render();
    },

    // ===== LISTA DE EMISSÕES =====
    renderListaEmissao() {
        const container = document.getElementById('milhas-lista');
        if (!container) return;

        const milhas = DB.get('milhas', { emissoes: [] });
        const emissoes = milhas.emissoes || [];

        if (!emissoes.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma emissão registrada.</p>';
            return;
        }

        container.innerHTML = `
            <div class="card">
                <h3>Histórico de Emissões</h3>
                <div class="table-wrap">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Destino</th>
                                <th>Companhia</th>
                                <th>Milhas</th>
                                <th>Valor Mercado</th>
                                <th>Economia</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${emissoes.sort((a, b) => new Date(b.data) - new Date(a.data)).map(e => {
                                const calc = this.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.companhia);
                                return `
                                    <tr>
                                        <td>${AppModule.formatDate(e.data)}</td>
                                        <td>${AppModule.escapeHtml(DB.getClienteNome(e.clienteId))}</td>
                                        <td>${AppModule.escapeHtml(e.destino)}</td>
                                        <td>${AppModule.escapeHtml(e.companhia)}</td>
                                        <td>${parseFloat(e.milhasUtilizadas).toLocaleString('pt-BR')}</td>
                                        <td>${AppModule.formatCurrency(e.valorMercado)}</td>
                                        <td style="color:var(--success);font-weight:700;">${AppModule.formatCurrency(calc.economia)}</td>
                                        <td>
                                            <button class="btn btn-sm btn-danger" onclick="MilhasModule.excluirEmissao('${e.id}')">Excluir</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    excluirEmissao(id) {
        if (!confirm('Excluir esta emissão?')) return;

        const milhas = DB.get('milhas', { emissoes: [] });
        milhas.emissoes = (milhas.emissoes || []).filter(e => e.id !== id);
        DB.set('milhas', milhas);

        AppModule.toast('Emissão excluída.');
        this.render();
    },

    // ===== PROGRAMAS DE FIDELIDADE =====
    renderProgramas() {
        const container = document.getElementById('milhas-programas');
        if (!container) return;

        const milhas = DB.get('milhas', { programas: [] });
        const programas = milhas.programas || [];
        const clientes = DB.get('clientes', []);

        container.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="margin:0;">Programas de Fidelidade</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.abrirFormPrograma()">+ Novo Programa</button>
                </div>
                ${programas.length ? `
                    <div class="grid-2">
                        ${programas.map(p => `
                            <div class="card" style="padding:16px;">
                                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                                    <div>
                                        <strong>${AppModule.escapeHtml(p.nome)}</strong>
                                        <div style="font-size:12px;color:var(--text-muted);">${AppModule.escapeHtml(DB.getClienteNome(p.clienteId))}</div>
                                    </div>
                                    <span class="badge ${p.status === 'ativo' ? 'badge-success' : 'badge-secondary'}">${p.status || 'ativo'}</span>
                                </div>
                                <div style="font-size:13px;margin:8px 0;">Número: ${AppModule.escapeHtml(p.numero || '—')}</div>
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div>
                                        <div style="font-size:11px;color:var(--text-muted);">Saldo</div>
                                        <div style="font-weight:700;color:#2563eb;">${AppModule.formatCurrency(p.saldo || 0)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size:11px;color:var(--text-muted);">Nível</div>
                                        <div style="font-weight:600;">${AppModule.escapeHtml(p.nivel || 'Básico')}</div>
                                    </div>
                                </div>
                                <div style="margin-top:12px;display:flex;gap:8px;">
                                    <button class="btn btn-sm btn-secondary" onclick="MilhasModule.editarPrograma('${p.id}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="MilhasModule.excluirPrograma('${p.id}')">Excluir</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="dashboard-empty">Nenhum programa cadastrado.</p>'}
            </div>
        `;
    },

    abrirFormPrograma(programa = null) {
        const isEdit = !!programa;
        const clientes = DB.get('clientes', []);

        const html = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Cliente *</label>
                    <select id="prog-cliente" class="form-control">
                        <option value="">— Selecionar —</option>
                        ${clientes.map(c => `<option value="${c.id}" ${programa?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Nome do Programa *</label>
                    <input type="text" id="prog-nome" class="form-control" value="${AppModule.escapeHtml(programa?.nome || '')}" placeholder="Ex: Smiles, Latam Pass">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Número</label>
                    <input type="text" id="prog-numero" class="form-control" value="${AppModule.escapeHtml(programa?.numero || '')}">
                </div>
                <div class="form-group">
                    <label>Saldo</label>
                    <input type="number" id="prog-saldo" class="form-control" value="${programa?.saldo || 0}">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Nível</label>
                    <input type="text" id="prog-nivel" class="form-control" value="${AppModule.escapeHtml(programa?.nivel || 'Básico')}" placeholder="Ex: Ouro, Platino">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="prog-status" class="form-control">
                        <option value="ativo" ${programa?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="inativo" ${programa?.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarPrograma('${programa?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Programa' : 'Novo Programa', html, footer);
    },

    editarPrograma(id) {
        const programa = DB.get('milhas', { programas: [] }).programas?.find(p => p.id === id);
        if (programa) this.abrirFormPrograma(programa);
    },

    salvarPrograma(id) {
        const clienteId = document.getElementById('prog-cliente').value;
        const nome = document.getElementById('prog-nome').value.trim();

        if (!clienteId || !nome) {
            AppModule.toast('Preencha cliente e nome.', 'warning');
            return;
        }

        const milhas = DB.get('milhas', { programas: [] });
        const programas = milhas.programas || [];
        const index = programas.findIndex(p => p.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            clienteId,
            nome,
            numero: document.getElementById('prog-numero').value.trim(),
            saldo: parseFloat(document.getElementById('prog-saldo').value) || 0,
            nivel: document.getElementById('prog-nivel').value.trim(),
            status: document.getElementById('prog-status').value
        };

        if (index >= 0) {
            programas[index] = { ...programas[index], ...dados };
        } else {
            programas.push(dados);
        }

        milhas.programas = programas;
        DB.set('milhas', milhas);

        AppModule.closeModal();
        AppModule.toast('Programa salvo!');
        this.render();
    },

    excluirPrograma(id) {
        if (!confirm('Excluir este programa?')) return;

        const milhas = DB.get('milhas', { programas: [] });
        milhas.programas = (milhas.programas || []).filter(p => p.id !== id);
        DB.set('milhas', milhas);

        AppModule.toast('Programa excluído.');
        this.render();
    },

    // ===== CARTÕES =====
    renderCartoes() {
        const container = document.getElementById('milhas-cartoes');
        if (!container) return;

        const milhas = DB.get('milhas', { cartoes: [] });
        const cartoes = milhas.cartoes || [];
        const clientes = DB.get('clientes', []);

        container.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="margin:0;">Cartões</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.abrirFormCartao()">+ Novo Cartão</button>
                </div>
                ${cartoes.length ? `
                    <div class="grid-2">
                        ${cartoes.map(c => `
                            <div class="card" style="padding:16px;background:linear-gradient(135deg, #1e293b 0%, #334155 100%);color:white;">
                                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
                                    <div>
                                        <div style="font-size:11px;opacity:0.7;">Titular</div>
                                        <div style="font-weight:600;">${AppModule.escapeHtml(c.titular || DB.getClienteNome(c.clienteId))}</div>
                                        <div style="font-size:11px;opacity:0.7;margin-top:4px;">${AppModule.escapeHtml(DB.getClienteNome(c.clienteId))}</div>
                                    </div>
                                    <div style="font-size:20px;">💳</div>
                                </div>
                                <div style="font-size:18px;letter-spacing:2px;margin-bottom:16px;font-family:monospace;">
                                    ${AppModule.escapeHtml(c.numero || '•••• •••• •••• ••••')}
                                </div>
                                <div style="display:flex;justify-content:space-between;align-items:end;">
                                    <div>
                                        <div style="font-size:11px;opacity:0.7;">Limite</div>
                                        <div style="font-weight:700;">${AppModule.formatCurrency(c.limite || 0)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size:11px;opacity:0.7;">Validade</div>
                                        <div style="font-weight:600;">${AppModule.escapeHtml(c.validade || '—')}</div>
                                    </div>
                                </div>
                                <div style="margin-top:12px;display:flex;gap:8px;">
                                    <button class="btn btn-sm btn-secondary" onclick="MilhasModule.editarCartao('${c.id}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="MilhasModule.excluirCartao('${c.id}')">Excluir</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="dashboard-empty">Nenhum cartão cadastrado.</p>'}
            </div>
        `;
    },

    abrirFormCartao(cartao = null) {
        const isEdit = !!cartao;
        const clientes = DB.get('clientes', []);

        const html = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Cliente *</label>
                    <select id="cartao-cliente" class="form-control">
                        <option value="">— Selecionar —</option>
                        ${clientes.map(c => `<option value="${c.id}" ${cartao?.clienteId === c.id ? 'selected' : ''}>${AppModule.escapeHtml(c.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Titular</label>
                    <input type="text" id="cartao-titular" class="form-control" value="${AppModule.escapeHtml(cartao?.titular || '')}" placeholder="Deixe em branco para usar o nome do cliente">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Número do Cartão *</label>
                    <input type="text" id="cartao-numero" class="form-control" value="${AppModule.escapeHtml(cartao?.numero || '')}" placeholder="0000 0000 0000 0000">
                </div>
                <div class="form-group">
                    <label>Validade *</label>
                    <input type="text" id="cartao-validade" class="form-control" value="${AppModule.escapeHtml(cartao?.validade || '')}" placeholder="MM/AA">
                </div>
            </div>
            <div class="form-group">
                <label>Limite (R$)</label>
                <input type="number" id="cartao-limite" class="form-control" step="0.01" value="${cartao?.limite || 0}">
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarCartao('${cartao?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar Cartão' : 'Novo Cartão', html, footer);
    },

    editarCartao(id) {
        const cartao = DB.get('milhas', { cartoes: [] }).cartoes?.find(c => c.id === id);
        if (cartao) this.abrirFormCartao(cartao);
    },

    salvarCartao(id) {
        const clienteId = document.getElementById('cartao-cliente').value;
        const numero = document.getElementById('cartao-numero').value.trim();
        const validade = document.getElementById('cartao-validade').value.trim();

        if (!clienteId || !numero || !validade) {
            AppModule.toast('Preencha cliente, número e validade.', 'warning');
            return;
        }

        const milhas = DB.get('milhas', { cartoes: [] });
        const cartoes = milhas.cartoes || [];
        const index = cartoes.findIndex(c => c.id === id);

        const dados = {
            id: id || AppModule.generateId(),
            clienteId,
            titular: document.getElementById('cartao-titular').value.trim(),
            numero,
            validade,
            limite: parseFloat(document.getElementById('cartao-limite').value) || 0
        };

        if (index >= 0) {
            cartoes[index] = { ...cartoes[index], ...dados };
        } else {
            cartoes.push(dados);
        }

        milhas.cartoes = cartoes;
        DB.set('milhas', milhas);

        AppModule.closeModal();
        AppModule.toast('Cartão salvo!');
        this.render();
    },

    excluirCartao(id) {
        if (!confirm('Excluir este cartão?')) return;

        const milhas = DB.get('milhas', { cartoes: [] });
        milhas.cartoes = (milhas.cartoes || []).filter(c => c.id !== id);
        DB.set('milhas', milhas);

        AppModule.toast('Cartão excluído.');
        this.render();
    },

    // ===== EXTRATO DE PONTOS =====
    renderExtrato() {
        const container = document.getElementById('milhas-extrato');
        if (!container) return;

        const milhas = DB.get('milhas', { extrato: [] });
        const extrato = milhas.extrato || [];

        const entradas = extrato.filter(e => e.tipo === 'entrada').reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
        const saidas = extrato.filter(e => e.tipo === 'saida').reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
        const saldo = entradas - saidas;

        container.innerHTML = `
            <div class="card">
                <h3>Extrato de Pontos</h3>
                <div class="kpi-grid" style="margin-bottom:16px;">
                    <div class="kpi-card" style="border-left:4px solid #10b981;">
                        <label style="font-size:12px;color:var(--text-muted);">ENTRADAS (90D)</label>
                        <span style="font-size:24px;font-weight:700;color:#10b981;">+${entradas.toLocaleString('pt-BR')}</span>
                    </div>
                    <div class="kpi-card" style="border-left:4px solid #ef4444;">
                        <label style="font-size:12px;color:var(--text-muted);">SAÍDAS (90D)</label>
                        <span style="font-size:24px;font-weight:700;color:#ef4444;">-${saidas.toLocaleString('pt-BR')}</span>
                    </div>
                    <div class="kpi-card" style="border-left:4px solid #2563eb;">
                        <label style="font-size:12px;color:var(--text-muted);">SALDO ATUAL</label>
                        <span style="font-size:24px;font-weight:700;color:#2563eb;">${saldo.toLocaleString('pt-BR')}</span>
                    </div>
                </div>
                ${extrato.length ? `
                    <div class="table-wrap">
                        <table class="table">
                            <thead>
                                <tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr>
                            </thead>
                            <tbody>
                                ${extrato.sort((a, b) => new Date(b.data) - new Date(a.data)).map(e => `
                                    <tr>
                                        <td>${AppModule.formatDate(e.data)}</td>
                                        <td>${AppModule.escapeHtml(e.descricao)}</td>
                                        <td><span class="badge ${e.tipo === 'entrada' ? 'badge-success' : 'badge-danger'}">${e.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                                        <td style="font-weight:700;color:${e.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)'};">
                                            ${e.tipo === 'entrada' ? '+' : '-'}${parseFloat(e.valor).toLocaleString('pt-BR')}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="dashboard-empty">Nenhuma transação registrada.</p>'}
            </div>
        `;
    }
};
