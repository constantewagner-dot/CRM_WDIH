/* ============================================================
   milhas.js — Gestão de Milhas (7 abas)
   ============================================================ */

const MilhasModule = {
    dados: {
        clubes: [],
        investimentos: [],
        vendasMilhas: [],
        orcamentos: [],
        cartoes: [],
        bilhetes: []
    },

    init() {
        this.carregar();
        this.render();
    },

    /* ---- Persistência ---- */
    carregar() {
        const raw = localStorage.getItem('wdih_milhas_completo');
        if (raw) {
            try { this.dados = JSON.parse(raw); } catch(e) {}
        }
        // Garantir arrays
        ['clubes','investimentos','vendasMilhas','orcamentos','cartoes','bilhetes'].forEach(k => {
            if (!Array.isArray(this.dados[k])) this.dados[k] = [];
        });
    },

    salvar() {
        localStorage.setItem('wdih_milhas_completo', JSON.stringify(this.dados));
    },

    /* ---- Navegação de Abas ---- */
    abrirTab(tab) {
        document.querySelectorAll('.milhas-tab').forEach(b =>
            b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.milhas-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById('milhas-panel-' + tab);
        if (panel) panel.classList.add('active');
        this.renderTab(tab);
    },

    /* ---- Render Geral ---- */
    render() {
        this.renderVisaoGeral();
        // Renderiza a aba ativa
        const activeTab = document.querySelector('.milhas-tab.active');
        if (activeTab) this.renderTab(activeTab.dataset.tab);
    },

    renderTab(tab) {
        switch(tab) {
            case 'visao': this.renderVisaoGeral(); break;
            case 'clubes': this.renderClubes(); break;
            case 'investimentos': this.renderInvestimentos(); break;
            case 'vendas': this.renderVendasMilhas(); break;
            case 'orcamento': this.renderOrcamentos(); break;
            case 'cartoes': this.renderCartoes(); break;
            case 'bilhetes': this.renderBilhetes(); break;
        }
    },

    /* ================================================================
       📊 VISÃO GERAL
       ================================================================ */
    renderVisaoGeral() {
        const el = document.getElementById('milhas-panel-visao');
        if (!el) return;

        const inv = this.dados.investimentos;
        const vnd = this.dados.vendasMilhas;
        const orc = this.dados.orcamentos;
        const blt = this.dados.bilhetes;

        const totalInvestido = inv.reduce((s, i) => s + (Number(i.valor) || 0), 0);
        const totalVendido = vnd.reduce((s, v) => s + (Number(v.valorVenda) || 0), 0);
        const totalMilhasInv = inv.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
        const totalMilhasVnd = vnd.reduce((s, v) => s + (Number(v.quantidade) || 0), 0);
        const saldoMilhas = totalMilhasInv - totalMilhasVnd;
        const lucro = totalVendido - totalInvestido;
        const milheiro = totalMilhasVnd > 0 ? (totalVendido / totalMilhasVnd) * 1000 : 0;

        const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
        const fmtM = v => Number(v).toLocaleString('pt-BR');

        // Atividades recentes
        const atividades = this.getAtividadesRecentes(8);

        el.innerHTML = `
            <div class="milhas-kpi-grid">
                <div class="milhas-kpi kpi-investido">
                    <label>Total Investido</label>
                    <span>${fmt(totalInvestido)}</span>
                    <small>${inv.length} registro(s)</small>
                </div>
                <div class="milhas-kpi kpi-vendido">
                    <label>Total Vendido</label>
                    <span>${fmt(totalVendido)}</span>
                    <small>${vnd.length} venda(s)</small>
                </div>
                <div class="milhas-kpi kpi-lucro">
                    <label>Lucro</label>
                    <span style="color:${lucro >= 0 ? '#15803d' : '#dc2626'}">${fmt(lucro)}</span>
                    <small>${lucro >= 0 ? '✅ Positivo' : '⚠️ Negativo'}</small>
                </div>
                <div class="milhas-kpi kpi-saldo">
                    <label>Saldo de Milhas</label>
                    <span>${fmtM(saldoMilhas)}</span>
                    <small>${fmtM(totalMilhasInv)} compradas · ${fmtM(totalMilhasVnd)} vendidas</small>
                </div>
                <div class="milhas-kpi kpi-milheiro">
                    <label>Milheiro Médio</label>
                    <span>${fmt(milheiro)}</span>
                    <small>por 1.000 milhas</small>
                </div>
                <div class="milhas-kpi kpi-expirando">
                    <label>Orçamentos</label>
                    <span>${orc.length}</span>
                    <small>${orc.filter(o => o.status === 'Pendente').length} pendente(s)</small>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="card">
                    <h3>📊 Investimentos por Mês</h3>
                    ${this.renderGraficoMes(inv, 'valor')}
                </div>
                <div class="card">
                    <h3>💰 Vendas por Mês</h3>
                    ${this.renderGraficoMes(vnd, 'valorVenda')}
                </div>
            </div>

            <div class="card">
                <h3>📋 Atividades Recentes</h3>
                ${atividades.length ? atividades.map(a => `
                    <div class="atividade-item">
                        <div class="atividade-icon">${a.icon}</div>
                        <div class="atividade-content">
                            <div class="atividade-desc">${a.desc}</div>
                            <div class="atividade-time">${AppModule.formatDate(a.data)}</div>
                        </div>
                    </div>
                `).join('') : '<p style="color:#64748b;font-size:13px;">Nenhuma atividade registrada</p>'}
            </div>
        `;
    },

    renderGraficoMes(lista, campo) {
        const meses = {};
        const agora = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
            const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
            meses[key] = { label: d.toLocaleDateString('pt-BR', {month:'short'}).replace('.',''), valor: 0 };
        }
        lista.forEach(item => {
            if (!item.data) return;
            const d = new Date(item.data + 'T00:00:00');
            const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
            if (meses[key]) meses[key].valor += Number(item[campo]) || 0;
        });
        const maxVal = Math.max(...Object.values(meses).map(m => m.valor), 1);
        return `<div class="mes-chart">
            ${Object.entries(meses).map(([k, m]) => `
                <div class="mes-bar">
                    <div class="mes-fill" style="height:${(m.valor/maxVal)*100}%" title="R$ ${m.valor.toFixed(2)}"></div>
                    <span>${m.label}</span>
                </div>
            `).join('')}
        </div>`;
    },

    getAtividadesRecentes(n) {
        const atividades = [];
        this.dados.investimentos.forEach(i => {
            atividades.push({icon:'📥', desc:`Investimento: ${i.quantidade || 0} milhas (${i.programa || '—'})`, data: i.data || i.criadoEm});
        });
        this.dados.vendasMilhas.forEach(v => {
            atividades.push({icon:'💰', desc:`Venda: ${v.quantidade || 0} milhas — R$ ${Number(v.valorVenda||0).toFixed(2)}`, data: v.data || v.criadoEm});
        });
        this.dados.orcamentos.forEach(o => {
            atividades.push({icon:'🧾', desc:`Orçamento: ${o.cliente || '—'} — ${o.status || 'Pendente'}`, data: o.data || o.criadoEm});
        });
        this.dados.bilhetes.forEach(b => {
            atividades.push({icon:'🎫', desc:`Bilhete: ${b.passageiro || '—'} → ${b.destino || '—'}`, data: b.data || b.criadoEm});
        });
        return atividades.sort((a,b) => new Date(b.data) - new Date(a.data)).slice(0, n);
    },

    /* ================================================================
       🏦 CLUBES
       ================================================================ */
    renderClubes() {
        const el = document.getElementById('milhas-panel-clubes');
        if (!el) return;
        const clubes = this.dados.clubes;
        el.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3>🏦 Clubes de Milhas</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.formClube()">+ Novo Clube</button>
                </div>
                ${clubes.length ? `
                <div class="table-wrap"><table class="table">
                    <thead><tr><th>Programa</th><th>Clube</th><th>Assinatura</th><th>Valor Mensal</th><th>Milhas/mês</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>${clubes.map((c,i) => `
                        <tr>
                            <td>${c.programa || '—'}</td>
                            <td><strong>${c.nome || '—'}</strong></td>
                            <td>${c.assinatura || '—'}</td>
                            <td>${AppModule.formatCurrency(c.valorMensal)}</td>
                            <td>${Number(c.milhasMes||0).toLocaleString('pt-BR')}</td>
                            <td><span class="badge ${c.status==='Ativo'?'badge-ativo':'badge-pendente'}">${c.status||'Ativo'}</span></td>
                            <td>
                                <button class="btn-icon" onclick="MilhasModule.formClube(${i})">✏️</button>
                                <button class="btn-icon" onclick="MilhasModule.excluir('clubes',${i})">🗑️</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>` : '<p style="color:#64748b;font-size:13px;">Nenhum clube cadastrado</p>'}
            </div>`;
    },

    formClube(idx) {
        const c = idx !== undefined ? this.dados.clubes[idx] : {};
        const programas = DB.getProgramas ? DB.getProgramas() : ['Smiles','LATAM Pass','TudoAzul','Livelo','Esfera'];
        const body = `
            <div class="form-grid">
                <div class="form-group"><label>Programa</label>
                    <select id="mc-programa" class="form-control">${programas.map(p=>`<option ${p===c.programa?'selected':''}>${p}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Nome do Clube</label><input type="text" id="mc-nome" class="form-control" value="${c.nome||''}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Tipo de Assinatura</label>
                    <select id="mc-assinatura" class="form-control">
                        ${['Mensal','Anual','Sem assinatura'].map(a=>`<option ${a===c.assinatura?'selected':''}>${a}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Valor Mensal (R$)</label><input type="number" id="mc-valorMensal" class="form-control" step="0.01" value="${c.valorMensal||0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Milhas por mês</label><input type="number" id="mc-milhasMes" class="form-control" value="${c.milhasMes||0}"></div>
                <div class="form-group"><label>Status</label>
                    <select id="mc-status" class="form-control">
                        <option ${c.status==='Ativo'?'selected':''}>Ativo</option>
                        <option ${c.status==='Inativo'?'selected':''}>Inativo</option>
                    </select>
                </div>
            </div>`;
        AppModule.openModal(idx !== undefined ? 'Editar Clube' : 'Novo Clube', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarClube(${idx !== undefined ? idx : 'null'})">Salvar</button>`);
    },

    salvarClube(idx) {
        const obj = {
            programa: document.getElementById('mc-programa').value,
            nome: document.getElementById('mc-nome').value,
            assinatura: document.getElementById('mc-assinatura').value,
            valorMensal: parseFloat(document.getElementById('mc-valorMensal').value)||0,
            milhasMes: parseInt(document.getElementById('mc-milhasMes').value)||0,
            status: document.getElementById('mc-status').value,
            criadoEm: new Date().toISOString()
        };
        if (idx !== null) { this.dados.clubes[idx] = {...this.dados.clubes[idx], ...obj}; }
        else { this.dados.clubes.push(obj); }
        this.salvar(); AppModule.closeModal(); this.renderClubes();
        AppModule.showToast('Clube salvo!', 'success');
    },

    /* ================================================================
       📥 INVESTIMENTOS (Compra de Milhas)
       ================================================================ */
    renderInvestimentos() {
        const el = document.getElementById('milhas-panel-investimentos');
        if (!el) return;
        const inv = this.dados.investimentos;
        const total = inv.reduce((s,i)=>s+(Number(i.valor)||0),0);
        const totalMilhas = inv.reduce((s,i)=>s+(Number(i.quantidade)||0),0);

        el.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3>📥 Investimentos (Compra de Milhas)</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.formInvestimento()">+ Novo Investimento</button>
                </div>
                <div style="display:flex;gap:20px;margin-bottom:14px;font-size:13px;">
                    <span><strong>Total investido:</strong> ${AppModule.formatCurrency(total)}</span>
                    <span><strong>Total de milhas:</strong> ${totalMilhas.toLocaleString('pt-BR')}</span>
                </div>
                ${inv.length ? `
                <div class="table-wrap"><table class="table">
                    <thead><tr><th>Data</th><th>Programa</th><th>Clube</th><th>Qtd. Milhas</th><th>Valor</th><th>Milheiro</th><th>Ações</th></tr></thead>
                    <tbody>${inv.map((item,i)=>{
                        const milheiro = item.quantidade > 0 ? (item.valor / item.quantidade)*1000 : 0;
                        return `<tr>
                            <td>${AppModule.formatDate(item.data)}</td>
                            <td>${item.programa||'—'}</td>
                            <td>${item.clube||'—'}</td>
                            <td><strong>${Number(item.quantidade||0).toLocaleString('pt-BR')}</strong></td>
                            <td>${AppModule.formatCurrency(item.valor)}</td>
                            <td>${AppModule.formatCurrency(milheiro)}</td>
                            <td>
                                <button class="btn-icon" onclick="MilhasModule.formInvestimento(${i})">✏️</button>
                                <button class="btn-icon" onclick="MilhasModule.excluir('investimentos',${i})">🗑️</button>
                            </td>
                        </tr>`;
                    }).join('')}</tbody>
                </table></div>` : '<p style="color:#64748b;font-size:13px;">Nenhum investimento registrado</p>'}
            </div>`;
    },

    formInvestimento(idx) {
        const item = idx !== undefined ? this.dados.investimentos[idx] : {};
        const programas = DB.getProgramas ? DB.getProgramas() : ['Smiles','LATAM Pass','TudoAzul','Livelo','Esfera'];
        const clubes = this.dados.clubes.map(c=>c.nome).filter(Boolean);
        const body = `
            <div class="form-grid">
                <div class="form-group"><label>Data</label><input type="date" id="mi-data" class="form-control" value="${item.data||new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Programa</label>
                    <select id="mi-programa" class="form-control">${programas.map(p=>`<option ${p===item.programa?'selected':''}>${p}</option>`).join('')}</select>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Clube</label>
                    <select id="mi-clube" class="form-control"><option value="">—</option>${clubes.map(c=>`<option ${c===item.clube?'selected':''}>${c}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Quantidade de Milhas</label><input type="number" id="mi-quantidade" class="form-control" value="${item.quantidade||0}"></div>
            </div>
            <div class="form-group"><label>Valor Investido (R$)</label><input type="number" id="mi-valor" class="form-control" step="0.01" value="${item.valor||0}"></div>
            <div class="form-group"><label>Observações</label><textarea id="mi-obs" class="form-control">${item.obs||''}</textarea></div>`;
        AppModule.openModal(idx !== undefined ? 'Editar Investimento' : 'Novo Investimento', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarInvestimento(${idx !== undefined ? idx : 'null'})">Salvar</button>`);
    },

    salvarInvestimento(idx) {
        const obj = {
            data: document.getElementById('mi-data').value,
            programa: document.getElementById('mi-programa').value,
            clube: document.getElementById('mi-clube').value,
            quantidade: parseInt(document.getElementById('mi-quantidade').value)||0,
            valor: parseFloat(document.getElementById('mi-valor').value)||0,
            obs: document.getElementById('mi-obs').value,
            criadoEm: new Date().toISOString()
        };
        if (idx !== null) { this.dados.investimentos[idx] = {...this.dados.investimentos[idx], ...obj}; }
        else { this.dados.investimentos.push(obj); }
        this.salvar(); AppModule.closeModal(); this.renderInvestimentos();
        AppModule.showToast('Investimento salvo!', 'success');
    },

    /* ================================================================
       💰 VENDAS DE MILHAS
       ================================================================ */
    renderVendasMilhas() {
        const el = document.getElementById('milhas-panel-vendas');
        if (!el) return;
        const vnd = this.dados.vendasMilhas;
        const totalVendido = vnd.reduce((s,v)=>s+(Number(v.valorVenda)||0),0);
        const totalMilhas = vnd.reduce((s,v)=>s+(Number(v.quantidade)||0),0);

        el.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3>💰 Vendas de Milhas</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.formVendaMilha()">+ Nova Venda</button>
                </div>
                <div style="display:flex;gap:20px;margin-bottom:14px;font-size:13px;">
                    <span><strong>Total vendido:</strong> ${AppModule.formatCurrency(totalVendido)}</span>
                    <span><strong>Milhas vendidas:</strong> ${totalMilhas.toLocaleString('pt-BR')}</span>
                </div>
                ${vnd.length ? `
                <div class="table-wrap"><table class="table">
                    <thead><tr><th>Data</th><th>Cliente</th><th>Programa</th><th>Qtd. Milhas</th><th>Valor</th><th>Milheiro</th><th>Ações</th></tr></thead>
                    <tbody>${vnd.map((v,i)=>{
                        const milheiro = v.quantidade > 0 ? (v.valorVenda / v.quantidade)*1000 : 0;
                        return `<tr>
                            <td>${AppModule.formatDate(v.data)}</td>
                            <td>${v.cliente||'—'}</td>
                            <td>${v.programa||'—'}</td>
                            <td><strong>${Number(v.quantidade||0).toLocaleString('pt-BR')}</strong></td>
                            <td>${AppModule.formatCurrency(v.valorVenda)}</td>
                            <td>${AppModule.formatCurrency(milheiro)}</td>
                            <td>
                                <button class="btn-icon" onclick="MilhasModule.formVendaMilha(${i})">✏️</button>
                                <button class="btn-icon" onclick="MilhasModule.excluir('vendasMilhas',${i})">🗑️</button>
                            </td>
                        </tr>`;
                    }).join('')}</tbody>
                </table></div>` : '<p style="color:#64748b;font-size:13px;">Nenhuma venda registrada</p>'}
            </div>`;
    },

    formVendaMilha(idx) {
        const v = idx !== undefined ? this.dados.vendasMilhas[idx] : {};
        const programas = DB.getProgramas ? DB.getProgramas() : ['Smiles','LATAM Pass','TudoAzul','Livelo','Esfera'];
        const body = `
            <div class="form-grid">
                <div class="form-group"><label>Data</label><input type="date" id="mv-data" class="form-control" value="${v.data||new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Cliente</label><input type="text" id="mv-cliente" class="form-control" value="${v.cliente||''}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Programa</label>
                    <select id="mv-programa" class="form-control">${programas.map(p=>`<option ${p===v.programa?'selected':''}>${p}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Quantidade de Milhas</label><input type="number" id="mv-quantidade" class="form-control" value="${v.quantidade||0}"></div>
            </div>
            <div class="form-group"><label>Valor da Venda (R$)</label><input type="number" id="mv-valorVenda" class="form-control" step="0.01" value="${v.valorVenda||0}"></div>
            <div class="form-group"><label>Observações</label><textarea id="mv-obs" class="form-control">${v.obs||''}</textarea></div>`;
        AppModule.openModal(idx !== undefined ? 'Editar Venda' : 'Nova Venda de Milhas', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarVendaMilha(${idx !== undefined ? idx : 'null'})">Salvar</button>`);
    },

    salvarVendaMilha(idx) {
        const obj = {
            data: document.getElementById('mv-data').value,
            cliente: document.getElementById('mv-cliente').value,
            programa: document.getElementById('mv-programa').value,
            quantidade: parseInt(document.getElementById('mv-quantidade').value)||0,
            valorVenda: parseFloat(document.getElementById('mv-valorVenda').value)||0,
            obs: document.getElementById('mv-obs').value,
            criadoEm: new Date().toISOString()
        };
        if (idx !== null) { this.dados.vendasMilhas[idx] = {...this.dados.vendasMilhas[idx], ...obj}; }
        else { this.dados.vendasMilhas.push(obj); }
        this.salvar(); AppModule.closeModal(); this.renderVendasMilhas();
        AppModule.showToast('Venda salva!', 'success');
    },

    /* ================================================================
       🧾 ORÇAMENTOS
       ================================================================ */
    renderOrcamentos() {
        const el = document.getElementById('milhas-panel-orcamento');
        if (!el) return;
        const orc = this.dados.orcamentos;

        el.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3>🧾 Orçamentos</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.formOrcamento()">+ Novo Orçamento</button>
                </div>
                ${orc.length ? `
                <div class="table-wrap"><table class="table">
                    <thead><tr><th>Data</th><th>Cliente</th><th>Descrição</th><th>Qtd. Milhas</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>${orc.map((o,i)=>`
                        <tr>
                            <td>${AppModule.formatDate(o.data)}</td>
                            <td>${o.cliente||'—'}</td>
                            <td>${o.descricao||'—'}</td>
                            <td>${Number(o.quantidade||0).toLocaleString('pt-BR')}</td>
                            <td>${AppModule.formatCurrency(o.valor)}</td>
                            <td><span class="badge ${o.status==='Aprovado'?'badge-ativo':o.status==='Recusado'?'badge-pendente':'badge-emandamento'}">${o.status||'Pendente'}</span></td>
                            <td>
                                <button class="btn-icon" onclick="MilhasModule.formOrcamento(${i})">✏️</button>
                                <button class="btn-icon" onclick="MilhasModule.excluir('orcamentos',${i})">🗑️</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>` : '<p style="color:#64748b;font-size:13px;">Nenhum orçamento registrado</p>'}
            </div>`;
    },

    formOrcamento(idx) {
        const o = idx !== undefined ? this.dados.orcamentos[idx] : {};
        const body = `
            <div class="form-grid">
                <div class="form-group"><label>Data</label><input type="date" id="mo-data" class="form-control" value="${o.data||new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Cliente</label><input type="text" id="mo-cliente" class="form-control" value="${o.cliente||''}"></div>
            </div>
            <div class="form-group"><label>Descrição</label><input type="text" id="mo-descricao" class="form-control" value="${o.descricao||''}"></div>
            <div class="form-grid">
                <div class="form-group"><label>Quantidade de Milhas</label><input type="number" id="mo-quantidade" class="form-control" value="${o.quantidade||0}"></div>
                <div class="form-group"><label>Valor (R$)</label><input type="number" id="mo-valor" class="form-control" step="0.01" value="${o.valor||0}"></div>
            </div>
            <div class="form-group"><label>Status</label>
                <select id="mo-status" class="form-control">
                    ${['Pendente','Aprovado','Recusado','Em Negociação'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Observações</label><textarea id="mo-obs" class="form-control">${o.obs||''}</textarea></div>`;
        AppModule.openModal(idx !== undefined ? 'Editar Orçamento' : 'Novo Orçamento', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarOrcamento(${idx !== undefined ? idx : 'null'})">Salvar</button>`);
    },

    salvarOrcamento(idx) {
        const obj = {
            data: document.getElementById('mo-data').value,
            cliente: document.getElementById('mo-cliente').value,
            descricao: document.getElementById('mo-descricao').value,
            quantidade: parseInt(document.getElementById('mo-quantidade').value)||0,
            valor: parseFloat(document.getElementById('mo-valor').value)||0,
            status: document.getElementById('mo-status').value,
            obs: document.getElementById('mo-obs').value,
            criadoEm: new Date().toISOString()
        };
        if (idx !== null) { this.dados.orcamentos[idx] = {...this.dados.orcamentos[idx], ...obj}; }
        else { this.dados.orcamentos.push(obj); }
        this.salvar(); AppModule.closeModal(); this.renderOrcamentos();
        AppModule.showToast('Orçamento salvo!', 'success');
    },

    /* ================================================================
       💳 CARTÕES
       ================================================================ */
    renderCartoes() {
        const el = document.getElementById('milhas-panel-cartoes');
        if (!el) return;
        const cartoes = this.dados.cartoes;

        el.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3>💳 Cartões de Crédito</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.formCartao()">+ Novo Cartão</button>
                </div>
                ${cartoes.length ? `
                <div class="table-wrap"><table class="table">
                    <thead><tr><th>Banco</th><th>Cartão</th><th>Programa</th><th>Anuidade</th><th>Fator Multiplicador</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>${cartoes.map((c,i)=>`
                        <tr>
                            <td>${c.banco||'—'}</td>
                            <td><strong>${c.nome||'—'}</strong></td>
                            <td>${c.programa||'—'}</td>
                            <td>${AppModule.formatCurrency(c.anuidade)}</td>
                            <td>${c.fator||'—'}x</td>
                            <td><span class="badge ${c.status==='Ativo'?'badge-ativo':'badge-pendente'}">${c.status||'Ativo'}</span></td>
                            <td>
                                <button class="btn-icon" onclick="MilhasModule.formCartao(${i})">✏️</button>
                                <button class="btn-icon" onclick="MilhasModule.excluir('cartoes',${i})">🗑️</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>` : '<p style="color:#64748b;font-size:13px;">Nenhum cartão cadastrado</p>'}
            </div>`;
    },

    formCartao(idx) {
        const c = idx !== undefined ? this.dados.cartoes[idx] : {};
        const bancos = DB.getCartoes ? DB.getCartoes() : ['C6 Bank','XP','Santander','Bradesco','Itaú','BB','Nubank','Inter'];
        const programas = DB.getProgramas ? DB.getProgramas() : ['Smiles','LATAM Pass','TudoAzul','Livelo','Esfera'];
        const body = `
            <div class="form-grid">
                <div class="form-group"><label>Banco</label>
                    <select id="mcr-banco" class="form-control">${bancos.map(b=>`<option ${b===c.banco?'selected':''}>${b}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Nome do Cartão</label><input type="text" id="mcr-nome" class="form-control" value="${c.nome||''}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Programa de Milhas</label>
                    <select id="mcr-programa" class="form-control">${programas.map(p=>`<option ${p===c.programa?'selected':''}>${p}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Anuidade (R$)</label><input type="number" id="mcr-anuidade" class="form-control" step="0.01" value="${c.anuidade||0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Fator Multiplicador (pts/R$)</label><input type="number" id="mcr-fator" class="form-control" step="0.01" value="${c.fator||2}"></div>
                <div class="form-group"><label>Status</label>
                    <select id="mcr-status" class="form-control">
                        <option ${c.status==='Ativo'?'selected':''}>Ativo</option>
                        <option ${c.status==='Inativo'?'selected':''}>Inativo</option>
                    </select>
                </div>
            </div>`;
        AppModule.openModal(idx !== undefined ? 'Editar Cartão' : 'Novo Cartão', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarCartao(${idx !== undefined ? idx : 'null'})">Salvar</button>`);
    },

    salvarCartao(idx) {
        const obj = {
            banco: document.getElementById('mcr-banco').value,
            nome: document.getElementById('mcr-nome').value,
            programa: document.getElementById('mcr-programa').value,
            anuidade: parseFloat(document.getElementById('mcr-anuidade').value)||0,
            fator: parseFloat(document.getElementById('mcr-fator').value)||2,
            status: document.getElementById('mcr-status').value,
            criadoEm: new Date().toISOString()
        };
        if (idx !== null) { this.dados.cartoes[idx] = {...this.dados.cartoes[idx], ...obj}; }
        else { this.dados.cartoes.push(obj); }
        this.salvar(); AppModule.closeModal(); this.renderCartoes();
        AppModule.showToast('Cartão salvo!', 'success');
    },

    /* ================================================================
       🎫 BILHETES (Emissão de Passagens com Milhas)
       ================================================================ */
    renderBilhetes() {
        const el = document.getElementById('milhas-panel-bilhetes');
        if (!el) return;
        const blt = this.dados.bilhetes;
        const totalMilhas = blt.reduce((s,b)=>s+(Number(b.milhasUsadas)||0),0);
        const totalTaxas = blt.reduce((s,b)=>s+(Number(b.taxas)||0),0);

        el.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3>🎫 Bilhetes Emitidos com Milhas</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.formBilhete()">+ Novo Bilhete</button>
                </div>
                <div style="display:flex;gap:20px;margin-bottom:14px;font-size:13px;">
                    <span><strong>Milhas utilizadas:</strong> ${totalMilhas.toLocaleString('pt-BR')}</span>
                    <span><strong>Taxas pagas:</strong> ${AppModule.formatCurrency(totalTaxas)}</span>
                </div>
                ${blt.length ? `
                <div class="table-wrap"><table class="table">
                    <thead><tr><th>Data</th><th>Passageiro</th><th>Destino</th><th>CIA</th><th>Milhas</th><th>Taxas</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>${blt.map((b,i)=>`
                        <tr>
                            <td>${AppModule.formatDate(b.data)}</td>
                            <td>${b.passageiro||'—'}</td>
                            <td>${b.destino||'—'}</td>
                            <td>${b.cia||'—'}</td>
                            <td><strong>${Number(b.milhasUsadas||0).toLocaleString('pt-BR')}</strong></td>
                            <td>${AppModule.formatCurrency(b.taxas)}</td>
                            <td><span class="badge ${b.status==='Emitido'?'badge-ativo':b.status==='Cancelado'?'badge-pendente':'badge-emandamento'}">${b.status||'Pendente'}</span></td>
                            <td>
                                <button class="btn-icon" onclick="MilhasModule.formBilhete(${i})">✏️</button>
                                <button class="btn-icon" onclick="MilhasModule.excluir('bilhetes',${i})">🗑️</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>` : '<p style="color:#64748b;font-size:13px;">Nenhum bilhete registrado</p>'}
            </div>`;
    },

    formBilhete(idx) {
        const b = idx !== undefined ? this.dados.bilhetes[idx] : {};
        const cias = DB.getCompanhias ? DB.getCompanhias() : ['LATAM','Gol','Azul','American Airlines','Delta','United'];
        const programas = DB.getProgramas ? DB.getProgramas() : ['Smiles','LATAM Pass','TudoAzul','Livelo','Esfera'];
        const body = `
            <div class="form-grid">
                <div class="form-group"><label>Data da Emissão</label><input type="date" id="mb-data" class="form-control" value="${b.data||new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Passageiro</label><input type="text" id="mb-passageiro" class="form-control" value="${b.passageiro||''}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Destino</label><input type="text" id="mb-destino" class="form-control" value="${b.destino||''}"></div>
                <div class="form-group"><label>Companhia</label>
                    <select id="mb-cia" class="form-control">${cias.map(c=>`<option ${c===b.cia?'selected':''}>${c}</option>`).join('')}</select>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Programa</label>
                    <select id="mb-programa" class="form-control">${programas.map(p=>`<option ${p===b.programa?'selected':''}>${p}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Milhas Utilizadas</label><input type="number" id="mb-milhasUsadas" class="form-control" value="${b.milhasUsadas||0}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Taxas (R$)</label><input type="number" id="mb-taxas" class="form-control" step="0.01" value="${b.taxas||0}"></div>
                <div class="form-group"><label>Status</label>
                    <select id="mb-status" class="form-control">
                        ${['Pendente','Emitido','Cancelado','Voado'].map(s=>`<option ${s===b.status?'selected':''}>${s}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Observações</label><textarea id="mb-obs" class="form-control">${b.obs||''}</textarea></div>`;
        AppModule.openModal(idx !== undefined ? 'Editar Bilhete' : 'Novo Bilhete', body, `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarBilhete(${idx !== undefined ? idx : 'null'})">Salvar</button>`);
    },

    salvarBilhete(idx) {
        const obj = {
            data: document.getElementById('mb-data').value,
            passageiro: document.getElementById('mb-passageiro').value,
            destino: document.getElementById('mb-destino').value,
            cia: document.getElementById('mb-cia').value,
            programa: document.getElementById('mb-programa').value,
            milhasUsadas: parseInt(document.getElementById('mb-milhasUsadas').value)||0,
            taxas: parseFloat(document.getElementById('mb-taxas').value)||0,
            status: document.getElementById('mb-status').value,
            obs: document.getElementById('mb-obs').value,
            criadoEm: new Date().toISOString()
        };
        if (idx !== null) { this.dados.bilhetes[idx] = {...this.dados.bilhetes[idx], ...obj}; }
        else { this.dados.bilhetes.push(obj); }
        this.salvar(); AppModule.closeModal(); this.renderBilhetes();
        AppModule.showToast('Bilhete salvo!', 'success');
    },

    /* ================================================================
       🗑️ EXCLUIR (genérico)
       ================================================================ */
    excluir(categoria, idx) {
        if (!confirm('Excluir este registro?')) return;
        this.dados[categoria].splice(idx, 1);
        this.salvar();
        this.renderTab(document.querySelector('.milhas-tab.active')?.dataset.tab || 'visao');
        AppModule.showToast('Registro excluído.', 'danger');
    }
};
