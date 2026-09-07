// ============================================================
// 💠 MÓDULO DE GESTÃO DE MILHAS — CRM WDIH
// Autossuficiente: não depende de app.js nem de outros módulos.
// Baseado em: Planilha GDM + Milhas-trading-FDM-2023
// ============================================================

const MilhasModule = {
    PREFIX: 'wdih_milhas_',

    PROGRAMAS: ['Latam Pass', 'Smiles', 'Tudo Azul', 'Livelo', 'Esfera', 'Avios', 'TAP Miles&Go', 'Executive Club', 'Iberia Plus'],
    TIPOS_INVESTIMENTO: ['Clube', 'Compra de pontos', 'Compra de produto', 'Outras'],
    ORIGENS_VENDA: ['Venda direta', 'MaxMilhas', 'HotMilhas', 'Venda de produto', 'Outras'],
    MESES: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],

    // ---------- Persistência (localStorage próprio) ----------
    _load(key, fallback) {
        try {
            const raw = localStorage.getItem(this.PREFIX + key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) { return fallback; }
    },
    _save(key, data) {
        localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
    },
    _uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 7);
    },

    // ---------- UI autossuficiente (modal + toast) ----------
    _modal(titulo, corpo, rodape) {
        let root = document.getElementById('milhas-modal-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'milhas-modal-root';
            document.body.appendChild(root);
        }
        root.innerHTML = `
            <div class="modal-backdrop" onclick="if(event.target===this) MilhasModule._closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${titulo}</h3>
                        <button class="modal-close" onclick="MilhasModule._closeModal()">×</button>
                    </div>
                    <div class="modal-body">${corpo}</div>
                    <div class="modal-footer">${rodape || ''}</div>
                </div>
            </div>`;
    },
    _closeModal() {
        const root = document.getElementById('milhas-modal-root');
        if (root) root.innerHTML = '';
    },
    _toast(mensagem, tipo = 'info') {
        let root = document.getElementById('milhas-toast-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'milhas-toast-root';
            document.body.appendChild(root);
        }
        const el = document.createElement('div');
        el.className = 'toast ' + tipo;
        el.textContent = mensagem;
        root.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    },

    // ---------- Acesso a dados ----------
    getClubes() { return this._load('clubes', []); },
    getInvestimentos() { return this._load('investimentos', []); },
    getVendas() { return this._load('vendas', []); },
    getOrcamento() { return this._load('orcamento', { despesas: [], milheiroMeta: 18, bonusMeta: 0 }); },
    getCartoes() { return this._load('cartoes', []); },
    getBilhetes() { return this._load('bilhetes', []); },

    saveClubes(d) { this._save('clubes', d); },
    saveInvestimentos(d) { this._save('investimentos', d); },
    saveVendas(d) { this._save('vendas', d); },
    saveOrcamento(d) { this._save('orcamento', d); },
    saveCartoes(d) { this._save('cartoes', d); },
    saveBilhetes(d) { this._save('bilhetes', d); },

    // ---------- Utilidades ----------
    fmt(n) {
        return (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    moeda(n) {
        return 'R$ ' + this.fmt(n);
    },
    num(n) {
        return (Number(n) || 0).toLocaleString('pt-BR');
    },
    data(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return isNaN(d) ? iso : d.toLocaleDateString('pt-BR');
    },
    milheiro(qtdMilhas, valorTotal) {
        const q = Number(qtdMilhas) || 0;
        const v = Number(valorTotal) || 0;
        return q > 0 ? (v / q) * 1000 : 0;
    },

    // ============================================================
    // 🌱 SEEDS — valores reais extraídos das planilhas
    // ============================================================
    _ensureSeeded() {
        if (this._load('seeded', false)) return;

        this._save('clubes', [
            { id: 'c1', programa: 'Smiles', titular: 'Wagner', cpf: '', numeroCliente: '', login: '', senha: '', plano: 'Clube Smiles', saldoInicial: 0, saldoAtual: 0, pontosAExpirar: 0, dataExpiracao: '', mensalidade: 42.00, milheiroAssinatura: 9.13, dataAdesao: '2024-12-10', cartaoCobranca: '', metas: '' },
            { id: 'c2', programa: 'Smiles', titular: 'Wagner', cpf: '', numeroCliente: '', login: '', senha: '', plano: 'Assinatura (renegociação 3 meses)', saldoInicial: 0, saldoAtual: 0, pontosAExpirar: 0, dataExpiracao: '', mensalidade: 14.90, milheiroAssinatura: 14.90, dataAdesao: '2025-04-23', cartaoCobranca: '', metas: '' },
            { id: 'c3', programa: 'Livelo', titular: 'Denize', cpf: '', numeroCliente: '', login: '', senha: '', plano: 'Clube Livelo', saldoInicial: 0, saldoAtual: 0, pontosAExpirar: 0, dataExpiracao: '', mensalidade: 42.66, milheiroAssinatura: 21.33, dataAdesao: '2025-04-15', cartaoCobranca: '', metas: '' },
            { id: 'c4', programa: 'Esfera', titular: '', cpf: '', numeroCliente: '', login: '', senha: '', plano: '', saldoInicial: 0, saldoAtual: 0, pontosAExpirar: 0, dataExpiracao: '', mensalidade: 39.90, milheiroAssinatura: 14, dataAdesao: '2024-01-02', cartaoCobranca: 'Elo Nanquim', metas: '' }
        ]);

        this._save('investimentos', [
            { id: 'i1', tipo: 'Clube', titular: 'Denize', detalhes: 'Assinatura', dataCompra: '2025-04-15', programa: 'Livelo', qtdMilhas: 24000, valorMilheiro: 21.33, total: 511.86, qtdParcelas: 12, mesPrimeira: 'May/2025', mesUltima: 'April/2026' },
            { id: 'i2', tipo: 'Compra de pontos', titular: 'Denize', detalhes: 'Turbo Livelo', dataCompra: '', programa: 'Livelo', qtdMilhas: 5202, valorMilheiro: 31.00, total: 161.26, qtdParcelas: 3, mesPrimeira: 'June/2023', mesUltima: 'August/2023' },
            { id: 'i3', tipo: 'Clube', titular: 'Wagner', detalhes: 'Assinatura', dataCompra: '2024-12-10', programa: 'Smiles', qtdMilhas: 23000, valorMilheiro: 9.13, total: 210.00, qtdParcelas: 5, mesPrimeira: 'December/2024', mesUltima: 'April/2025' },
            { id: 'i4', tipo: 'Compra de pontos', titular: 'Wagner', detalhes: 'Compra Pontos', dataCompra: '2024-12-15', programa: 'Smiles', qtdMilhas: 37000, valorMilheiro: 21.00, total: 777.00, qtdParcelas: 1, mesPrimeira: 'December/2024', mesUltima: 'December/2024' },
            { id: 'i5', tipo: 'Clube', titular: 'Wagner', detalhes: 'Assinatura (renegociação 3 meses)', dataCompra: '2025-04-23', programa: 'Smiles', qtdMilhas: 3000, valorMilheiro: 14.90, total: 44.70, qtdParcelas: 3, mesPrimeira: 'May/2025', mesUltima: 'July/2025' }
        ]);

        this._save('vendas', [
            { id: 'v1', origem: 'Venda direta', titular: '', detalhes: '', dataVenda: '2026-02-01', qtdPassageiros: 1, programa: 'Smiles', qtdMilhas: 41000, valorMilheiro: 21.95, valor: 900.00, recebido: true, qtdParcelas: 2, mesPrimeira: 'February/2026', mesUltima: 'March/2026' }
        ]);

        this._save('orcamento', {
            milheiroMeta: 18,
            bonusMeta: 0,
            despesas: [
                { id: 'o1', nome: 'Aluguel', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o2', nome: 'Conta de Luz', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o3', nome: 'Conta de Água', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o4', nome: 'Conta de Gás', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o5', nome: 'Plano de Saúde', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o6', nome: 'Celular', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o7', nome: 'Internet', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o8', nome: 'Alimentação (Ifood)', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o9', nome: 'Colégio', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o10', nome: 'Cursos', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o11', nome: 'Combustível', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o12', nome: 'Crédito Uber', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o13', nome: 'Compras de Mercado', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) },
                { id: 'o14', nome: 'Livelo', vencimento: '', cartao: '', potencialAnual: 0, valores: Array(12).fill(0) }
            ]
        });

        this._save('cartoes', [
            {
                id: 'k1',
                cartao: 'Bradesco American Express Platinum',
                emissor: 'Bradesco',
                coBranded: '',
                bandeira: 'American Express',
                nivel: 'Platinum',
                versao: '',
                anuidade: 0,
                limite: 0,
                adicionais: 2,
                gastoMedio: 5000,
                clube: 'Membership Rewards / Livelo',
                pontosMin: 2.2,
                pontosMax: 3.0,
                salasVip: 'Salas Bradesco com convidado; Salas American Express; Salas Delta (voando na cia)',
                beneficios: 'Anuidade grátis para gastos acima de R$ 5 mil por mês; 3 pontos por dólar em compras no exterior; Status elite em locadoras de veículos e redes de hotéis; 2 cartões adicionais grátis'
            }
        ]);

        this._save('bilhetes', []);
        this._save('seeded', true);
    },

    // ---------- Renderização principal ----------
    render() {
        this._ensureSeeded();
        this.abrirTab('visao');
    },

    // ---------- Sistema de abas ----------
    abrirTab(tab) {
        document.querySelectorAll('.milhas-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.milhas-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById('milhas-panel-' + tab);
        if (panel) panel.classList.add('active');

        const renderers = {
            visao: 'renderVisao', clubes: 'renderClubes', investimentos: 'renderInvestimentos',
            vendas: 'renderVendas', orcamento: 'renderOrcamento', cartoes: 'renderCartoes', bilhetes: 'renderBilhetes'
        };
        if (renderers[tab]) this[renderers[tab]]();
    },

    // ============================================================
    // 📊 VISÃO GERAL
    // ============================================================
    renderVisao() {
        const el = document.getElementById('milhas-panel-visao');
        if (!el) return;

        const invest = this.getInvestimentos();
        const vendas = this.getVendas();
        const clubes = this.getClubes();

        const totalInvestido = invest.reduce((s, i) => s + (Number(i.total) || 0), 0);
        const totalMilhasCompradas = invest.reduce((s, i) => s + (Number(i.qtdMilhas) || 0), 0);
        const totalVendido = vendas.reduce((s, v) => s + (Number(v.valor) || 0), 0);
        const totalMilhasVendidas = vendas.reduce((s, v) => s + (Number(v.qtdMilhas) || 0), 0);

        const milheiroCompra = totalMilhasCompradas > 0 ? (totalInvestido / totalMilhasCompradas) * 1000 : 0;
        const custoVendido = (totalMilhasVendidas / 1000) * milheiroCompra;
        const lucroEstimado = totalVendido - custoVendido;

        const saldoTotal = clubes.reduce((s, c) => s + (Number(c.saldoAtual) || 0), 0);
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const limite = new Date(hoje.getTime() + 90 * 86400000);
        const expirando = clubes.filter(c => c.pontosAExpirar > 0 && c.dataExpiracao && new Date(c.dataExpiracao) <= limite)
            .reduce((s, c) => s + (Number(c.pontosAExpirar) || 0), 0);

        el.innerHTML = `
            <div class="milhas-kpi-grid">
                <div class="milhas-kpi kpi-investido"><label>💸 Total Investido</label><span>${this.moeda(totalInvestido)}</span><small>${this.num(totalMilhasCompradas)} milhas</small></div>
                <div class="milhas-kpi kpi-vendido"><label>💰 Receita em Vendas</label><span>${this.moeda(totalVendido)}</span><small>${this.num(totalMilhasVendidas)} milhas</small></div>
                <div class="milhas-kpi kpi-lucro"><label>📈 Lucro Estimado</label><span>${this.moeda(lucroEstimado)}</span><small>${lucroEstimado >= 0 ? 'Positivo ✓' : 'Negativo ⚠'}</small></div>
                <div class="milhas-kpi kpi-saldo"><label>💠 Saldo em Clubes</label><span>${this.num(saldoTotal)}</span><small>pontos acumulados</small></div>
                <div class="milhas-kpi kpi-expirando"><label>⚠️ Pontos a Expirar (90d)</label><span>${this.num(expirando)}</span><small>${expirando > 0 ? 'Atenção!' : 'Tudo em dia'}</small></div>
                <div class="milhas-kpi kpi-milheiro"><label>🏷️ Milheiro Médio Compra</label><span>${this.moeda(milheiroCompra)}</span><small>por 1.000 pts</small></div>
            </div>

            <div class="milhas-grid-2">
                ${this._cardPrecoMedio()}
                ${this._cardSaldoProgramas()}
            </div>
            <div class="card">${this._graficoMensal()}</div>
        `;
    },

    _cardPrecoMedio() {
        const invest = this.getInvestimentos();
        const map = {};
        invest.forEach(i => {
            const p = i.programa || 'Outros';
            if (!map[p]) map[p] = { qtd: 0, total: 0 };
            map[p].qtd += (Number(i.qtdMilhas) || 0);
            map[p].total += (Number(i.total) || 0);
        });
        const linhas = Object.entries(map)
            .map(([p, d]) => ({ programa: p, milheiro: d.qtd > 0 ? (d.total / d.qtd) * 1000 : 0 }))
            .sort((a, b) => b.milheiro - a.milheiro);

        const body = linhas.length ? linhas.map(l => `
            <div class="bar-chart-item">
                <div class="bar-label">${l.programa}</div>
                <div class="bar-container"><div class="bar-fill fill-royal" style="width:${(l.milheiro / (linhas[0].milheiro || 1) * 100).toFixed(1)}%"></div></div>
                <div class="bar-value">${this.moeda(l.milheiro)}</div>
            </div>`).join('') : '<div class="empty-chart">Sem investimentos registrados</div>';

        return `<div class="card"><h3>🏷️ Preço Médio por Programa (milheiro)</h3>${body}</div>`;
    },

    _cardSaldoProgramas() {
        const clubes = this.getClubes();
        const map = {};
        clubes.forEach(c => { map[c.programa || 'Outros'] = (map[c.programa || 'Outros'] || 0) + (Number(c.saldoAtual) || 0); });
        const linhas = Object.entries(map).sort((a, b) => b[1] - a[1]);
        const body = linhas.length ? linhas.map(([p, s]) => `
            <div class="bar-chart-item">
                <div class="bar-label">${p}</div>
                <div class="bar-container"><div class="bar-fill fill-success" style="width:${(s / (linhas[0][1] || 1) * 100).toFixed(1)}%"></div></div>
                <div class="bar-value">${this.num(s)} pts</div>
            </div>`).join('') : '<div class="empty-chart">Sem clubes cadastrados</div>';
        return `<div class="card"><h3>💠 Saldo por Programa</h3>${body}</div>`;
    },

    _graficoMensal() {
        const orc = this.getOrcamento();
        const clubes = this.getClubes();
        const totais = Array(12).fill(0);

        orc.despesas.forEach(d => {
            (d.valores || []).forEach((v, i) => totais[i] += (Number(v) || 0));
        });

        clubes.forEach(c => {
            const pts = Math.round((Number(c.mensalidade) || 0) / ((Number(c.milheiroAssinatura) || 14) / 1000));
            if (pts > 0) for (let i = 0; i < 12; i++) totais[i] += pts;
        });

        const max = Math.max(...totais, 1);
        const barras = totais.map((t, i) => `
            <div class="mes-bar" title="${this.MESES[i]}: ${this.num(t)} pts">
                <div class="mes-fill" style="height:${(t / max * 100).toFixed(1)}%"></div>
                <span>${this.MESES[i].slice(0, 3)}</span>
            </div>`).join('');

        return `<h3>📅 Milhas Geradas por Mês (projeção orçamento + clubes)</h3>
            <div class="mes-chart">${barras}</div>`;
    },

    // ============================================================
    // 🏦 CLUBES
    // ============================================================
    renderClubes() {
        const el = document.getElementById('milhas-panel-clubes');
        if (!el) return;
        const clubes = this.getClubes();

        const linhas = clubes.length ? clubes.map(c => `
            <tr>
                <td><strong>${c.programa || '—'}</strong></td>
                <td>${c.titular || '—'}</td>
                <td>${c.cpf || '—'}</td>
                <td>${c.plano || '—'}</td>
                <td class="num">${this.num(c.saldoInicial)}</td>
                <td class="num">${this.num(c.saldoAtual)}</td>
                <td>${this._badgeExpirar(c)}</td>
                <td>${this.moeda(c.mensalidade)}</td>
                <td>${this.data(c.dataAdesao)}</td>
                <td class="actions">
                    <button class="btn-icon" title="Editar" onclick="MilhasModule.editarClube('${c.id}')">✏️</button>
                    <button class="btn-icon btn-danger" title="Excluir" onclick="MilhasModule.excluirClube('${c.id}')">🗑️</button>
                </td>
            </tr>`).join('') : `<tr><td colspan="10" class="empty-chart">Nenhum clube cadastrado</td></tr>`;

        el.innerHTML = `
            <div class="card">
                <div class="card-head">
                    <h3>🏦 Gestão dos Clubes e Pontos</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.novoClube()">+ Novo Clube</button>
                </div>
                <div class="table-wrap"><table class="table">
                    <thead><tr>
                        <th>Programa</th><th>Titular</th><th>CPF</th><th>Plano</th>
                        <th>Saldo Inicial</th><th>Saldo Atual</th><th>Expirar</th>
                        <th>Mensalidade</th><th>Adesão</th><th>Ações</th>
                    </tr></thead>
                    <tbody>${linhas}</tbody>
                </table></div>
            </div>`;
    },

    _badgeExpirar(c) {
        const pts = Number(c.pontosAExpirar) || 0;
        if (pts <= 0) return '<span class="badge badge-ativo">Sem expirar</span>';
        const dt = new Date(c.dataExpiracao);
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const urg = dt <= new Date(hoje.getTime() + 60 * 86400000);
        return `<span class="badge ${urg ? 'badge-pendente' : 'badge-emandamento'}">${this.num(pts)} pts<br><small>${this.data(c.dataExpiracao)}</small></span>`;
    },

    novoClube() {
        const programas = this.PROGRAMAS.map(p => `<option>${p}</option>`).join('');
        this._modal('🏦 Novo Clube', `
            <div class="form-grid">
                <div class="form-group"><label>Programa</label><select id="c-programa" class="form-control">${programas}</select></div>
                <div class="form-group"><label>Titular</label><input id="c-titular" class="form-control"></div>
                <div class="form-group"><label>CPF</label><input id="c-cpf" class="form-control"></div>
                <div class="form-group"><label>Nº do Cliente</label><input id="c-numero" class="form-control"></div>
                <div class="form-group"><label>Login</label><input id="c-login" class="form-control"></div>
                <div class="form-group"><label>Senha</label><input id="c-senha" type="password" class="form-control"></div>
                <div class="form-group"><label>Plano</label><input id="c-plano" class="form-control"></div>
                <div class="form-group"><label>Saldo Inicial</label><input id="c-saldo-ini" type="number" class="form-control" value="0"></div>
                <div class="form-group"><label>Saldo Atual</label><input id="c-saldo-atual" type="number" class="form-control" value="0"></div>
                <div class="form-group"><label>Pontos a Expirar</label><input id="c-expirar" type="number" class="form-control" value="0"></div>
                <div class="form-group"><label>Data de Expiração</label><input id="c-exp-data" type="date" class="form-control"></div>
                <div class="form-group"><label>Mensalidade (R$)</label><input id="c-mensalidade" type="number" step="0.01" class="form-control" value="0"></div>
                <div class="form-group"><label>Milheiro da Assinatura (R$/1000)</label><input id="c-milheiro-assin" type="number" step="0.01" class="form-control" value="14"></div>
                <div class="form-group"><label>Data de Adesão</label><input id="c-adesao" type="date" class="form-control"></div>
                <div class="form-group"><label>Cartão de Cobrança</label><input id="c-cartao" class="form-control"></div>
                <div class="form-group full"><label>Metas</label><input id="c-metas" class="form-control" placeholder="Ex.: acumular 100k até dez/2026"></div>
            </div>`, `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarClube()">Salvar</button>`);
    },

    editarClube(id) {
        const c = this.getClubes().find(x => x.id === id);
        if (!c) return;
        const programas = this.PROGRAMAS.map(p => `<option ${p === c.programa ? 'selected' : ''}>${p}</option>`).join('');
        this._modal('✏️ Editar Clube', `
            <div class="form-grid">
                <div class="form-group"><label>Programa</label><select id="c-programa" class="form-control">${programas}</select></div>
                <div class="form-group"><label>Titular</label><input id="c-titular" class="form-control" value="${c.titular || ''}"></div>
                <div class="form-group"><label>CPF</label><input id="c-cpf" class="form-control" value="${c.cpf || ''}"></div>
                <div class="form-group"><label>Nº do Cliente</label><input id="c-numero" class="form-control" value="${c.numeroCliente || ''}"></div>
                <div class="form-group"><label>Login</label><input id="c-login" class="form-control" value="${c.login || ''}"></div>
                <div class="form-group"><label>Senha</label><input id="c-senha" type="password" class="form-control" value="${c.senha || ''}"></div>
                <div class="form-group"><label>Plano</label><input id="c-plano" class="form-control" value="${c.plano || ''}"></div>
                <div class="form-group"><label>Saldo Inicial</label><input id="c-saldo-ini" type="number" class="form-control" value="${c.saldoInicial || 0}"></div>
                <div class="form-group"><label>Saldo Atual</label><input id="c-saldo-atual" type="number" class="form-control" value="${c.saldoAtual || 0}"></div>
                <div class="form-group"><label>Pontos a Expirar</label><input id="c-expirar" type="number" class="form-control" value="${c.pontosAExpirar || 0}"></div>
                <div class="form-group"><label>Data de Expiração</label><input id="c-exp-data" type="date" class="form-control" value="${c.dataExpiracao || ''}"></div>
                <div class="form-group"><label>Mensalidade (R$)</label><input id="c-mensalidade" type="number" step="0.01" class="form-control" value="${c.mensalidade || 0}"></div>
                <div class="form-group"><label>Milheiro da Assinatura</label><input id="c-milheiro-assin" type="number" step="0.01" class="form-control" value="${c.milheiroAssinatura || 14}"></div>
                <div class="form-group"><label>Data de Adesão</label><input id="c-adesao" type="date" class="form-control" value="${c.dataAdesao || ''}"></div>
                <div class="form-group"><label>Cartão de Cobrança</label><input id="c-cartao" class="form-control" value="${c.cartaoCobranca || ''}"></div>
                <div class="form-group full"><label>Metas</label><input id="c-metas" class="form-control" value="${c.metas || ''}"></div>
            </div>`, `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarClube('${id}')">Salvar</button>`);
    },

    salvarClube(id) {
        const val = i => document.getElementById(i).value;
        const clubes = this.getClubes();
        const dados = {
            programa: val('c-programa'), titular: val('c-titular'), cpf: val('c-cpf'),
            numeroCliente: val('c-numero'), login: val('c-login'), senha: val('c-senha'),
            plano: val('c-plano'), saldoInicial: Number(val('c-saldo-ini')) || 0,
            saldoAtual: Number(val('c-saldo-atual')) || 0, pontosAExpirar: Number(val('c-expirar')) || 0,
            dataExpiracao: val('c-exp-data'), mensalidade: Number(val('c-mensalidade')) || 0,
            milheiroAssinatura: Number(val('c-milheiro-assin')) || 14,
            dataAdesao: val('c-adesao'), cartaoCobranca: val('c-cartao'), metas: val('c-metas')
        };
        if (id) {
            const i = clubes.findIndex(x => x.id === id);
            clubes[i] = { ...clubes[i], ...dados };
        } else {
            clubes.push({ id: this._uid(), ...dados });
        }
        this.saveClubes(clubes);
        this._closeModal();
        this._toast('Clube salvo com sucesso', 'success');
        this.renderClubes();
    },

    excluirClube(id) {
        if (!confirm('Excluir este clube?')) return;
        this.saveClubes(this.getClubes().filter(x => x.id !== id));
        this.renderClubes();
    },

    // ============================================================
    // 📥 INVESTIMENTOS
    // ============================================================
    renderInvestimentos() {
        const el = document.getElementById('milhas-panel-investimentos');
        if (!el) return;
        const inv = this.getInvestimentos();
        const linhas = inv.length ? inv.map(i => `
            <tr>
                <td>${i.tipo}</td>
                <td>${i.titular || '—'}</td>
                <td>${i.detalhes || '—'}</td>
                <td>${this.data(i.dataCompra)}</td>
                <td><strong>${i.programa}</strong></td>
                <td class="num">${this.num(i.qtdMilhas)}</td>
                <td class="num">${this.moeda(i.valorMilheiro)}</td>
                <td class="num">${this.moeda(i.total)}</td>
                <td class="num">${i.qtdParcelas || 1}x</td>
                <td class="actions">
                    <button class="btn-icon" onclick="MilhasModule.editarInvestimento('${i.id}')">✏️</button>
                    <button class="btn-icon btn-danger" onclick="MilhasModule.excluirInvestimento('${i.id}')">🗑️</button>
                </td>
            </tr>`).join('') : `<tr><td colspan="10" class="empty-chart">Nenhum investimento registrado</td></tr>`;

        el.innerHTML = `
            <div class="card">
                <div class="card-head">
                    <h3>📥 Investimentos (Compra de Milhas)</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.novoInvestimento()">+ Novo Investimento</button>
                </div>
                <div class="table-wrap"><table class="table">
                    <thead><tr>
                        <th>Tipo</th><th>Titular</th><th>Detalhes</th><th>Data</th><th>Programa</th>
                        <th>Milhas</th><th>Milheiro</th><th>Total</th><th>Parcelas</th><th>Ações</th>
                    </tr></thead>
                    <tbody>${linhas}</tbody>
                </table></div>
            </div>`;
    },

    novoInvestimento() {
        const programas = this.PROGRAMAS.map(p => `<option>${p}</option>`).join('');
        const tipos = this.TIPOS_INVESTIMENTO.map(t => `<option>${t}</option>`).join('');
        this._modal('📥 Novo Investimento', `
            <div class="form-grid">
                <div class="form-group"><label>Tipo</label><select id="i-tipo" class="form-control">${tipos}</select></div>
                <div class="form-group"><label>Titular do CPF</label><input id="i-titular" class="form-control"></div>
                <div class="form-group"><label>Detalhes</label><input id="i-detalhes" class="form-control" placeholder="Assinatura, Turbo, etc."></div>
                <div class="form-group"><label>Data da Compra</label><input id="i-data" type="date" class="form-control"></div>
                <div class="form-group"><label>Programa</label><select id="i-programa" class="form-control">${programas}</select></div>
                <div class="form-group"><label>Quantidade de Milhas</label><input id="i-milhas" type="number" class="form-control" value="0" oninput="MilhasModule.calcMilheiroInvest()"></div>
                <div class="form-group"><label>Valor do Milheiro (R$)</label><input id="i-milheiro" type="number" step="0.01" class="form-control" value="0" oninput="MilhasModule.calcTotalInvest()"></div>
                <div class="form-group"><label>Total (R$)</label><input id="i-total" type="number" step="0.01" class="form-control" value="0" oninput="MilhasModule.calcMilheiroInvest()"></div>
                <div class="form-group"><label>Nº de Parcelas</label><input id="i-parcelas" type="number" class="form-control" value="1"></div>
                <div class="form-group"><label>Mês 1ª Parcela</label><input id="i-mes1" class="form-control" placeholder="May/2025"></div>
                <div class="form-group"><label>Mês Última Parcela</label><input id="i-mesu" class="form-control" placeholder="April/2026"></div>
            </div>`, `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarInvestimento()">Salvar</button>`);
    },

    editarInvestimento(id) {
        const i = this.getInvestimentos().find(x => x.id === id);
        if (!i) return;
        const programas = this.PROGRAMAS.map(p => `<option ${p === i.programa ? 'selected' : ''}>${p}</option>`).join('');
        const tipos = this.TIPOS_INVESTIMENTO.map(t => `<option ${t === i.tipo ? 'selected' : ''}>${t}</option>`).join('');
        this._modal('✏️ Editar Investimento', `
            <div class="form-grid">
                <div class="form-group"><label>Tipo</label><select id="i-tipo" class="form-control">${tipos}</select></div>
                <div class="form-group"><label>Titular do CPF</label><input id="i-titular" class="form-control" value="${i.titular || ''}"></div>
                <div class="form-group"><label>Detalhes</label><input id="i-detalhes" class="form-control" value="${i.detalhes || ''}"></div>
                <div class="form-group"><label>Data da Compra</label><input id="i-data" type="date" class="form-control" value="${i.dataCompra || ''}"></div>
                <div class="form-group"><label>Programa</label><select id="i-programa" class="form-control">${programas}</select></div>
                <div class="form-group"><label>Quantidade de Milhas</label><input id="i-milhas" type="number" class="form-control" value="${i.qtdMilhas || 0}" oninput="MilhasModule.calcMilheiroInvest()"></div>
                <div class="form-group"><label>Valor do Milheiro (R$)</label><input id="i-milheiro" type="number" step="0.01" class="form-control" value="${i.valorMilheiro || 0}" oninput="MilhasModule.calcTotalInvest()"></div>
                <div class="form-group"><label>Total (R$)</label><input id="i-total" type="number" step="0.01" class="form-control" value="${i.total || 0}" oninput="MilhasModule.calcMilheiroInvest()"></div>
                <div class="form-group"><label>Nº de Parcelas</label><input id="i-parcelas" type="number" class="form-control" value="${i.qtdParcelas || 1}"></div>
                <div class="form-group"><label>Mês 1ª Parcela</label><input id="i-mes1" class="form-control" value="${i.mesPrimeira || ''}"></div>
                <div class="form-group"><label>Mês Última Parcela</label><input id="i-mesu" class="form-control" value="${i.mesUltima || ''}"></div>
            </div>`, `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarInvestimento('${id}')">Salvar</button>`);
    },

    calcMilheiroInvest() {
        const q = Number(document.getElementById('i-milhas').value) || 0;
        const t = Number(document.getElementById('i-total').value) || 0;
        document.getElementById('i-milheiro').value = q > 0 ? ((t / q) * 1000).toFixed(2) : 0;
    },
    calcTotalInvest() {
        const q = Number(document.getElementById('i-milhas').value) || 0;
        const m = Number(document.getElementById('i-milheiro').value) || 0;
        document.getElementById('i-total').value = ((q / 1000) * m).toFixed(2);
    },

    salvarInvestimento(id) {
        const val = i => document.getElementById(i).value;
        const inv = this.getInvestimentos();
        const dados = {
            tipo: val('i-tipo'), titular: val('i-titular'), detalhes: val('i-detalhes'),
            dataCompra: val('i-data'), programa: val('i-programa'),
            qtdMilhas: Number(val('i-milhas')) || 0,
            valorMilheiro: Number(val('i-milheiro')) || 0,
            total: Number(val('i-total')) || 0,
            qtdParcelas: Number(val('i-parcelas')) || 1,
            mesPrimeira: val('i-mes1'), mesUltima: val('i-mesu')
        };
        if (id) {
            const i = inv.findIndex(x => x.id === id);
            inv[i] = { ...inv[i], ...dados };
        } else {
            inv.push({ id: this._uid(), ...dados });
        }
        this.saveInvestimentos(inv);
        this._closeModal();
        this._toast('Investimento salvo', 'success');
        this.renderInvestimentos();
    },

    excluirInvestimento(id) {
        if (!confirm('Excluir este investimento?')) return;
        this.saveInvestimentos(this.getInvestimentos().filter(x => x.id !== id));
        this.renderInvestimentos();
    },

    // ============================================================
    // 💰 VENDAS
    // ============================================================
    renderVendas() {
        const el = document.getElementById('milhas-panel-vendas');
        if (!el) return;
        const vendas = this.getVendas();
        const linhas = vendas.length ? vendas.map(v => `
            <tr>
                <td>${v.origem}</td>
                <td>${v.titular || '—'}</td>
                <td>${v.detalhes || '—'}</td>
                <td>${this.data(v.dataVenda)}</td>
                <td><strong>${v.programa}</strong></td>
                <td class="num">${this.num(v.qtdMilhas)}</td>
                <td class="num">${this.moeda(v.valorMilheiro)}</td>
                <td class="num">${this.moeda(v.valor)}</td>
                <td>${v.recebido ? '✅ Sim' : '⏳ Não'}</td>
                <td class="num">${v.qtdParcelas || 1}x</td>
                <td class="actions">
                    <button class="btn-icon" onclick="MilhasModule.editarVenda('${v.id}')">✏️</button>
                    <button class="btn-icon btn-danger" onclick="MilhasModule.excluirVenda('${v.id}')">🗑️</button>
                </td>
            </tr>`).join('') : `<tr><td colspan="11" class="empty-chart">Nenhuma venda registrada</td></tr>`;

        el.innerHTML = `
            <div class="card">
                <div class="card-head">
                    <h3>💰 Vendas de Milhas (Receita)</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.novaVenda()">+ Nova Venda</button>
                </div>
                <div class="table-wrap"><table class="table">
                    <thead><tr>
                        <th>Origem</th><th>Titular</th><th>Detalhes</th><th>Data</th><th>Programa</th>
                        <th>Milhas</th><th>Milheiro</th><th>Valor</th><th>Recebido</th><th>Parcelas</th><th>Ações</th>
                    </tr></thead>
                    <tbody>${linhas}</tbody>
                </table></div>
            </div>`;
    },

    novaVenda() {
        const programas = this.PROGRAMAS.map(p => `<option>${p}</option>`).join('');
        const origens = this.ORIGENS_VENDA.map(o => `<option>${o}</option>`).join('');
        this._modal('💰 Nova Venda', `
            <div class="form-grid">
                <div class="form-group"><label>Origem</label><select id="v-origem" class="form-control">${origens}</select></div>
                <div class="form-group"><label>Titular do CPF</label><input id="v-titular" class="form-control"></div>
                <div class="form-group"><label>Detalhes</label><input id="v-detalhes" class="form-control" placeholder="Destino, cliente, etc."></div>
                <div class="form-group"><label>Data da Venda</label><input id="v-data" type="date" class="form-control"></div>
                <div class="form-group"><label>Qtd. Passageiros</label><input id="v-passageiros" type="number" class="form-control" value="1"></div>
                <div class="form-group"><label>Programa</label><select id="v-programa" class="form-control">${programas}</select></div>
                <div class="form-group"><label>Quantidade de Milhas</label><input id="v-milhas" type="number" class="form-control" value="0" oninput="MilhasModule.calcMilheiroVenda()"></div>
                <div class="form-group"><label>Valor do Milheiro (R$)</label><input id="v-milheiro" type="number" step="0.01" class="form-control" value="0" oninput="MilhasModule.calcTotalVenda()"></div>
                <div class="form-group"><label>Valor (R$)</label><input id="v-valor" type="number" step="0.01" class="form-control" value="0" oninput="MilhasModule.calcMilheiroVenda()"></div>
                <div class="form-group"><label>Recebido</label><select id="v-recebido" class="form-control"><option value="1">Sim</option><option value="0">Não</option></select></div>
                <div class="form-group"><label>Nº de Parcelas</label><input id="v-parcelas" type="number" class="form-control" value="1"></div>
                <div class="form-group"><label>Mês 1ª Parcela</label><input id="v-mes1" class="form-control" placeholder="February/2026"></div>
                <div class="form-group"><label>Mês Última Parcela</label><input id="v-mesu" class="form-control" placeholder="March/2026"></div>
            </div>`, `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarVenda()">Salvar</button>`);
    },

    editarVenda(id) {
        const v = this.getVendas().find(x => x.id === id);
        if (!v) return;
        const programas = this.PROGRAMAS.map(p => `<option ${p === v.programa ? 'selected' : ''}>${p}</option>`).join('');
        const origens = this.ORIGENS_VENDA.map(o => `<option ${o === v.origem ? 'selected' : ''}>${o}</option>`).join('');
        this._modal('✏️ Editar Venda', `
            <div class="form-grid">
                <div class="form-group"><label>Origem</label><select id="v-origem" class="form-control">${origens}</select></div>
                <div class="form-group"><label>Titular do CPF</label><input id="v-titular" class="form-control" value="${v.titular || ''}"></div>
                <div class="form-group"><label>Detalhes</label><input id="v-detalhes" class="form-control" value="${v.detalhes || ''}"></div>
                <div class="form-group"><label>Data da Venda</label><input id="v-data" type="date" class="form-control" value="${v.dataVenda || ''}"></div>
                <div class="form-group"><label>Qtd. Passageiros</label><input id="v-passageiros" type="number" class="form-control" value="${v.qtdPassageiros || 1}"></div>
                <div class="form-group"><label>Programa</label><select id="v-programa" class="form-control">${programas}</select></div>
                <div class="form-group"><label>Quantidade de Milhas</label><input id="v-milhas" type="number" class="form-control" value="${v.qtdMilhas || 0}" oninput="MilhasModule.calcMilheiroVenda()"></div>
                <div class="form-group"><label>Valor do Milheiro (R$)</label><input id="v-milheiro" type="number" step="0.01" class="form-control" value="${v.valorMilheiro || 0}" oninput="MilhasModule.calcTotalVenda()"></div>
                <div class="form-group"><label>Valor (R$)</label><input id="v-valor" type="number" step="0.01" class="form-control" value="${v.valor || 0}" oninput="MilhasModule.calcMilheiroVenda()"></div>
                <div class="form-group"><label>Recebido</label><select id="v-recebido" class="form-control"><option value="1" ${v.recebido ? 'selected' : ''}>Sim</option><option value="0" ${!v.recebido ? 'selected' : ''}>Não</option></select></div>
                <div class="form-group"><label>Nº de Parcelas</label><input id="v-parcelas" type="number" class="form-control" value="${v.qtdParcelas || 1}"></div>
                <div class="form-group"><label>Mês 1ª Parcela</label><input id="v-mes1" class="form-control" value="${v.mesPrimeira || ''}"></div>
                <div class="form-group"><label>Mês Última Parcela</label><input id="v-mesu" class="form-control" value="${v.mesUltima || ''}"></div>
            </div>`, `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarVenda('${id}')">Salvar</button>`);
    },

    calcMilheiroVenda() {
        const q = Number(document.getElementById('v-milhas').value) || 0;
        const t = Number(document.getElementById('v-valor').value) || 0;
        document.getElementById('v-milheiro').value = q > 0 ? ((t / q) * 1000).toFixed(2) : 0;
    },
    calcTotalVenda() {
        const q = Number(document.getElementById('v-milhas').value) || 0;
        const m = Number(document.getElementById('v-milheiro').value) || 0;
        document.getElementById('v-valor').value = ((q / 1000) * m).toFixed(2);
    },

    salvarVenda(id) {
        const val = i => document.getElementById(i).value;
        const vendas = this.getVendas();
        const dados = {
            origem: val('v-origem'), titular: val('v-titular'), detalhes: val('v-detalhes'),
            dataVenda: val('v-data'), qtdPassageiros: Number(val('v-passageiros')) || 1,
            programa: val('v-programa'), qtdMilhas: Number(val('v-milhas')) || 0,
            valorMilheiro: Number(val('v-milheiro')) || 0, valor: Number(val('v-valor')) || 0,
            recebido: val('v-recebido') === '1', qtdParcelas: Number(val('v-parcelas')) || 1,
            mesPrimeira: val('v-mes1'), mesUltima: val('v-mesu')
        };
        if (id) {
            const i = vendas.findIndex(x => x.id === id);
            vendas[i] = { ...vendas[i], ...dados };
        } else {
            vendas.push({ id: this._uid(), ...dados });
        }
        this.saveVendas(vendas);
        this._closeModal();
        this._toast('Venda salva', 'success');
        this.renderVendas();
    },

    excluirVenda(id) {
        if (!confirm('Excluir esta venda?')) return;
        this.saveVendas(this.getVendas().filter(x => x.id !== id));
        this.renderVendas();
    },

    // ============================================================
    // 🧾 ORÇAMENTO
    // ============================================================
    renderOrcamento() {
        const el = document.getElementById('milhas-panel-orcamento');
        if (!el) return;
        const orc = this.getOrcamento();
        const despesas = orc.despesas || [];

        const head = this.MESES.map(m => `<th>${m.slice(0, 3)}</th>`).join('');
        const linhas = despesas.length ? despesas.map(d => {
            const total = (d.valores || []).reduce((s, v) => s + (Number(v) || 0), 0);
            const cells = (d.valores || []).map((v, i) => `<td><input class="cell-input" type="number" value="${v || 0}" onchange="MilhasModule.setOrcamentoValor('${d.id}', ${i}, this.value)"></td>`).join('');
            return `<tr>
                <td>${d.nome}</td><td>${d.vencimento || '—'}</td><td>${d.cartao || '—'}</td>
                ${cells}<td class="num">${this.moeda(total)}</td>
                <td class="actions"><button class="btn-icon btn-danger" onclick="MilhasModule.excluirDespesa('${d.id}')">🗑️</button></td>
            </tr>`;
        }).join('') : `<tr><td colspan="16" class="empty-chart">Nenhuma despesa cadastrada</td></tr>`;

        const totaisMes = Array(12).fill(0);
        despesas.forEach(d => (d.valores || []).forEach((v, i) => totaisMes[i] += (Number(v) || 0)));
        const totalGeral = totaisMes.reduce((s, v) => s + v, 0);
        const totalPotencial = despesas.reduce((s, d) => s + (Number(d.potencialAnual) || 0), 0);

        const totalRow = `<tr class="total-row"><td colspan="3"><strong>Total em R$</strong></td>${totaisMes.map(t => `<td class="num">${this.moeda(t)}</td>`).join('')}<td class="num"><strong>${this.moeda(totalGeral)}</strong></td><td></td></tr>`;

        el.innerHTML = `
            <div class="card">
                <div class="card-head">
                    <h3>🧾 Alocação de Orçamento (Pontos gerados)</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.novaDespesa()">+ Nova Despesa</button>
                </div>
                <div class="orcamento-meta">
                    <div class="form-group"><label>Milheiro Meta (R$/1000)</label><input id="o-milheiro-meta" type="number" step="0.01" class="form-control" value="${orc.milheiroMeta || 18}"></div>
                    <div class="form-group"><label>Bônus Meta (%)</label><input id="o-bonus-meta" type="number" step="0.1" class="form-control" value="${orc.bonusMeta || 0}"></div>
                    <div class="form-group"><label>Projeção em R$</label><input class="form-control" disabled value="${this.moeda((totalPotencial / 1000) * (orc.milheiroMeta || 18))}"></div>
                    <button class="btn btn-primary" onclick="MilhasModule.salvarMetaOrcamento()">Salvar Metas</button>
                </div>
                <div class="table-wrap"><table class="table orcamento-table">
                    <thead><tr><th>Despesa</th><th>Venc.</th><th>Cartão</th>${head}<th>Total</th><th></th></tr></thead>
                    <tbody>${linhas}${totalRow}</tbody>
                </table></div>
            </div>`;
    },

    novaDespesa() {
        const cartoes = this.getCartoes().map(c => `<option>${c.cartao}</option>`).join('');
        this._modal('🧾 Nova Despesa', `
            <div class="form-grid">
                <div class="form-group"><label>Despesa</label><input id="d-nome" class="form-control" placeholder="Aluguel, Luz, Ifood..."></div>
                <div class="form-group"><label>Vencimento</label><input id="d-vencimento" class="form-control" placeholder="Dia 10"></div>
                <div class="form-group"><label>Cartão Utilizado</label><select id="d-cartao" class="form-control"><option>—</option>${cartoes}</select></div>
                <div class="form-group"><label>Potencial Anual de Pontos</label><input id="d-potencial" type="number" class="form-control" value="0"></div>
            </div>
            <div class="form-grid">${this.MESES.map((m, i) => `<div class="form-group"><label>${m}</label><input id="d-mes-${i}" type="number" step="0.01" class="form-control" value="0"></div>`).join('')}</div>`, `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarDespesa()">Salvar</button>`);
    },

    salvarDespesa() {
        const val = i => document.getElementById(i).value;
        const orc = this.getOrcamento();
        orc.despesas.push({
            id: this._uid(), nome: val('d-nome'), vencimento: val('d-vencimento'),
            cartao: val('d-cartao'), potencialAnual: Number(val('d-potencial')) || 0,
            valores: this.MESES.map((_, i) => Number(val(`d-mes-${i}`)) || 0)
        });
        this.saveOrcamento(orc);
        this._closeModal();
        this.renderOrcamento();
    },

    setOrcamentoValor(id, idx, valor) {
        const orc = this.getOrcamento();
        const d = orc.despesas.find(x => x.id === id);
        if (!d) return;
        d.valores[idx] = Number(valor) || 0;
        this.saveOrcamento(orc);
        this.renderOrcamento();
    },

    excluirDespesa(id) {
        if (!confirm('Excluir esta despesa?')) return;
        const orc = this.getOrcamento();
        orc.despesas = orc.despesas.filter(x => x.id !== id);
        this.saveOrcamento(orc);
        this.renderOrcamento();
    },

    salvarMetaOrcamento() {
        const orc = this.getOrcamento();
        orc.milheiroMeta = Number(document.getElementById('o-milheiro-meta').value) || 18;
        orc.bonusMeta = Number(document.getElementById('o-bonus-meta').value) || 0;
        this.saveOrcamento(orc);
        this._toast('Metas salvas', 'success');
        this.renderOrcamento();
    },

    // ============================================================
    // 💳 CARTÕES E BENEFÍCIOS
    // ============================================================
    renderCartoes() {
        const el = document.getElementById('milhas-panel-cartoes');
        if (!el) return;
        const cartoes = this.getCartoes();
        const cards = cartoes.length ? cartoes.map(c => `
            <div class="viagem-card">
                <div class="viagem-card-header">
                    <div>
                        <span class="viagem-cliente">💳 ${c.cartao}</span>
                        <span class="viagem-destino">${c.emissor || '—'} • ${c.bandeira || '—'} • Nível ${c.nivel || '—'}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="MilhasModule.editarCartao('${c.id}')">✏️</button>
                        <button class="btn-icon btn-danger" onclick="MilhasModule.excluirCartao('${c.id}')">🗑️</button>
                    </div>
                </div>
                <div class="viagem-info-grid">
                    <div class="viagem-info"><label>Anuidade</label><span>${this.moeda(c.anuidade)}</span></div>
                    <div class="viagem-info"><label>Limite</label><span>${this.moeda(c.limite)}</span></div>
                    <div class="viagem-info"><label>Gasto Médio</label><span>${this.moeda(c.gastoMedio)}</span></div>
                    <div class="viagem-info"><label>Clube</label><span>${c.clube || '—'}</span></div>
                    <div class="viagem-info"><label>Pts/Dólar</label><span>${c.pontosMin || 0}–${c.pontosMax || 0}</span></div>
                    <div class="viagem-info"><label>Adicionais</label><span>${c.adicionais || 0}</span></div>
                </div>
                ${c.beneficios ? `<div class="alert-desc" style="margin-bottom:8px;"><strong>Benefícios:</strong> ${c.beneficios}</div>` : ''}
                ${c.salasVip ? `<div class="alert-desc"><strong>🏛️ Salas VIP:</strong> ${c.salasVip}</div>` : ''}
            </div>`).join('') : '<div class="empty-chart">Nenhum cartão cadastrado</div>';

        el.innerHTML = `
            <div class="card">
                <div class="card-head">
                    <h3>💳 Cartões e Benefícios</h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.novoCartao()">+ Novo Cartão</button>
                </div>
                ${cards}
            </div>`;
    },

    novoCartao() {
        this._modal('💳 Novo Cartão', this._formCartao(), `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarCartao()">Salvar</button>`);
    },

    editarCartao(id) {
        const c = this.getCartoes().find(x => x.id === id);
        if (!c) return;
        this._modal('✏️ Editar Cartão', this._formCartao(c), `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarCartao('${id}')">Salvar</button>`);
    },

    _formCartao(c = {}) {
        const g = (k) => c[k] || '';
        return `<div class="form-grid">
            <div class="form-group"><label>Cartão</label><input id="k-cartao" class="form-control" value="${g('cartao')}"></div>
            <div class="form-group"><label>Emissor</label><input id="k-emissor" class="form-control" value="${g('emissor')}"></div>
            <div class="form-group"><label>Co-branded</label><input id="k-cobranded" class="form-control" value="${g('coBranded')}"></div>
            <div class="form-group"><label>Bandeira</label><input id="k-bandeira" class="form-control" value="${g('bandeira')}"></div>
            <div class="form-group"><label>Nível</label><input id="k-nivel" class="form-control" value="${g('nivel')}"></div>
            <div class="form-group"><label>Versão</label><input id="k-versao" class="form-control" value="${g('versao')}"></div>
            <div class="form-group"><label>Anuidade (R$)</label><input id="k-anuidade" type="number" step="0.01" class="form-control" value="${g('anuidade') || 0}"></div>
            <div class="form-group"><label>Limite (R$)</label><input id="k-limite" type="number" step="0.01" class="form-control" value="${g('limite') || 0}"></div>
            <div class="form-group"><label>Nº Cartões Adicionais</label><input id="k-adicionais" type="number" class="form-control" value="${g('adicionais') || 0}"></div>
            <div class="form-group"><label>Gasto Médio (R$)</label><input id="k-gasto" type="number" step="0.01" class="form-control" value="${g('gastoMedio') || 0}"></div>
            <div class="form-group"><label>Clube</label><input id="k-clube" class="form-control" value="${g('clube')}"></div>
            <div class="form-group"><label>Pts/Dólar (Mín)</label><input id="k-min" type="number" step="0.1" class="form-control" value="${g('pontosMin') || 0}"></div>
            <div class="form-group"><label>Pts/Dólar (Máx)</label><input id="k-max" type="number" step="0.1" class="form-control" value="${g('pontosMax') || 0}"></div>
            <div class="form-group full"><label>Salas VIP</label><input id="k-vip" class="form-control" value="${g('salasVip')}"></div>
            <div class="form-group full"><label>Outros Benefícios</label><textarea id="k-beneficios" class="form-control" rows="3">${g('beneficios')}</textarea></div>
        </div>`;
    },

    salvarCartao(id) {
        const val = i => document.getElementById(i).value;
        const cartoes = this.getCartoes();
        const dados = {
            cartao: val('k-cartao'), emissor: val('k-emissor'), coBranded: val('k-cobranded'),
            bandeira: val('k-bandeira'), nivel: val('k-nivel'), versao: val('k-versao'),
            anuidade: Number(val('k-anuidade')) || 0, limite: Number(val('k-limite')) || 0,
            adicionais: Number(val('k-adicionais')) || 0, gastoMedio: Number(val('k-gasto')) || 0,
            clube: val('k-clube'), pontosMin: Number(val('k-min')) || 0, pontosMax: Number(val('k-max')) || 0,
            salasVip: val('k-vip'), beneficios: val('k-beneficios')
        };
        if (id) {
            const i = cartoes.findIndex(x => x.id === id);
            cartoes[i] = { ...cartoes[i], ...dados };
        } else {
            cartoes.push({ id: this._uid(), ...dados });
        }
        this.saveCartoes(cartoes);
        this._closeModal();
        this._toast('Cartão salvo', 'success');
        this.renderCartoes();
    },

    excluirCartao(id) {
        if (!confirm('Excluir este cartão?')) return;
        this.saveCartoes(this.getCartoes().filter(x => x.id !== id));
        this.renderCartoes();
    },

    // ============================================================
    // 🎫 BILHETES
    // ============================================================
    renderBilhetes() {
        const el = document.getElementById('milhas-panel-bilhetes');
        if (!el) return;
        const bilhetes = this.getBilhetes();
        const linhas = bilhetes.length ? bilhetes.map(b => `
            <tr>
                <td>${this.data(b.dataEmissao)}</td>
                <td>${b.tipoEmissao || '—'}</td>
                <td>${b.origem || '—'} → ${b.destino || '—'}</td>
                <td>${b.classe || '—'}</td>
                <td><strong>${b.programa}</strong></td>
                <td class="num">${this.num(b.valorMilhas)}</td>
                <td class="num">${this.moeda(b.valorMilheiro)}</td>
                <td class="num">${this.moeda(b.taxaEmbarque)}</td>
                <td class="num">${this.moeda(b.lucroGestor)}</td>
                <td class="num">${b.percentGestor || 0}%</td>
                <td class="num"><strong>${this.moeda(b.precoFinal)}</strong></td>
                <td class="actions">
                    <button class="btn-icon" onclick="MilhasModule.editarBilhete('${b.id}')">✏️</button>
                    <button class="btn-icon btn-danger" onclick="MilhasModule.excluirBilhete('${b.id}')">🗑️</button>
                </td>
            </tr>`).join('') : `<tr><td colspan="12" class="empty-chart">Nenhum bilhete emitido</td></tr>`;

        const totalLucro = bilhetes.reduce((s, b) => s + (Number(b.lucroGestor) || 0), 0);

        el.innerHTML = `
            <div class="card">
                <div class="card-head">
                    <h3>🎫 Emissão de Bilhetes <span class="badge badge-concluida">Lucro total: ${this.moeda(totalLucro)}</span></h3>
                    <button class="btn btn-primary btn-sm" onclick="MilhasModule.novoBilhete()">+ Novo Bilhete</button>
                </div>
                <div class="table-wrap"><table class="table">
                    <thead><tr>
                        <th>Emissão</th><th>Tipo</th><th>Rota</th><th>Classe</th><th>Programa</th>
                        <th>Milhas</th><th>Milheiro</th><th>Taxas</th><th>Lucro</th><th>%</th><th>Preço Final</th><th>Ações</th>
                    </tr></thead>
                    <tbody>${linhas}</tbody>
                </table></div>
            </div>`;
    },

    novoBilhete() {
        this._modal('🎫 Novo Bilhete', this._formBilhete(), `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarBilhete()">Salvar</button>`);
    },

    editarBilhete(id) {
        const b = this.getBilhetes().find(x => x.id === id);
        if (!b) return;
        this._modal('✏️ Editar Bilhete', this._formBilhete(b), `
            <button class="btn btn-secondary" onclick="MilhasModule._closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvarBilhete('${id}')">Salvar</button>`);
    },

    _formBilhete(b = {}) {
        const g = (k) => b[k] || '';
        const programas = this.PROGRAMAS.map(p => `<option ${p === b.programa ? 'selected' : ''}>${p}</option>`).join('');
        return `<div class="form-grid">
            <div class="form-group"><label>Data da Emissão</label><input id="t-emissao" type="date" class="form-control" value="${g('dataEmissao')}"></div>
            <div class="form-group"><label>Tipo de Emissão</label><input id="t-tipo" class="form-control" value="${g('tipoEmissao')}"></div>
            <div class="form-group"><label>Data Ida</label><input id="t-ida" type="date" class="form-control" value="${g('dataIda')}"></div>
            <div class="form-group"><label>Check-in Ida</label><input id="t-checkin-ida" type="datetime-local" class="form-control" value="${g('checkinIda')}"></div>
            <div class="form-group"><label>Data Volta</label><input id="t-volta" type="date" class="form-control" value="${g('dataVolta')}"></div>
            <div class="form-group"><label>Check-in Volta</label><input id="t-checkin-volta" type="datetime-local" class="form-control" value="${g('checkinVolta')}"></div>
            <div class="form-group"><label>Status</label><input id="t-status" class="form-control" value="${g('status') || 'Confirmado'}"></div>
            <div class="form-group"><label>Classe</label><input id="t-classe" class="form-control" value="${g('classe')}"></div>
            <div class="form-group"><label>Origem</label><input id="t-origem" class="form-control" value="${g('origem')}"></div>
            <div class="form-group"><label>Destino</label><input id="t-destino" class="form-control" value="${g('destino')}"></div>
            <div class="form-group"><label>Localizador</label><input id="t-localizador" class="form-control" value="${g('localizador')}"></div>
            <div class="form-group"><label>Preço de Ancoragem (R$)</label><input id="t-ancoragem" type="number" step="0.01" class="form-control" value="${g('precoAncoragem') || 0}"></div>
            <div class="form-group"><label>Programa</label><select id="t-programa" class="form-control">${programas}</select></div>
            <div class="form-group"><label>Parceiro</label><input id="t-parceiro" class="form-control" value="${g('parceiro')}"></div>
            <div class="form-group"><label>Valor em Milhas</label><input id="t-milhas" type="number" class="form-control" value="${g('valorMilhas') || 0}" oninput="MilhasModule.calcBilhete()"></div>
            <div class="form-group"><label>Valor do Milheiro (R$)</label><input id="t-milheiro" type="number" step="0.01" class="form-control" value="${g('valorMilheiro') || 0}" oninput="MilhasModule.calcBilhete()"></div>
            <div class="form-group"><label>Taxa Embarque e Outros (R$)</label><input id="t-taxa" type="number" step="0.01" class="form-control" value="${g('taxaEmbarque') || 0}" oninput="MilhasModule.calcBilhete()"></div>
            <div class="form-group"><label>Preço com Milhas (R$)</label><input id="t-preco-milhas" class="form-control" disabled value="${g('precoComMilhas')}"></div>
            <div class="form-group"><label>% Gestor</label><input id="t-percent" type="number" step="0.1" class="form-control" value="${g('percentGestor') || 0}" oninput="MilhasModule.calcBilhete()"></div>
            <div class="form-group"><label>Preço Final ao Cliente (R$)</label><input id="t-final" type="number" step="0.01" class="form-control" value="${g('precoFinal') || 0}" oninput="MilhasModule.calcBilhete()"></div>
            <div class="form-group full"><label>💼 Lucro do Gestor (R$)</label><input id="t-lucro" class="form-control lucro-pos" disabled value="${g('lucroGestor')}"></div>
        </div>`;
    },

    calcBilhete() {
        const milhas = Number(document.getElementById('t-milhas').value) || 0;
        const milheiro = Number(document.getElementById('t-milheiro').value) || 0;
        const taxa = Number(document.getElementById('t-taxa').value) || 0;
        const final = Number(document.getElementById('t-final').value) || 0;

        const custo = (milhas / 1000) * milheiro + taxa;
        document.getElementById('t-preco-milhas').value = custo.toFixed(2);
        document.getElementById('t-lucro').value = (final - custo).toFixed(2);
    },

    salvarBilhete(id) {
        const val = i => document.getElementById(i).value;
        const bilhetes = this.getBilhetes();
        const milhas = Number(val('t-milhas')) || 0;
        const milheiro = Number(val('t-milheiro')) || 0;
        const taxa = Number(val('t-taxa')) || 0;
        const final = Number(val('t-final')) || 0;
        const precoComMilhas = (milhas / 1000) * milheiro + taxa;
        const lucroGestor = final - precoComMilhas;

        const dados = {
            dataEmissao: val('t-emissao'), tipoEmissao: val('t-tipo'),
            dataIda: val('t-ida'), checkinIda: val('t-checkin-ida'),
            dataVolta: val('t-volta'), checkinVolta: val('t-checkin-volta'),
            status: val('t-status'), classe: val('t-classe'), origem: val('t-origem'), destino: val('t-destino'),
            localizador: val('t-localizador'), precoAncoragem: Number(val('t-ancoragem')) || 0,
            programa: val('t-programa'), parceiro: val('t-parceiro'),
            valorMilhas: milhas, valorMilheiro: milheiro, taxaEmbarque: taxa,
            precoComMilhas, percentGestor: Number(val('t-percent')) || 0,
            precoFinal: final, lucroGestor
        };
        if (id) {
            const i = bilhetes.findIndex(x => x.id === id);
            bilhetes[i] = { ...bilhetes[i], ...dados };
        } else {
            bilhetes.push({ id: this._uid(), ...dados });
        }
        this.saveBilhetes(bilhetes);
        this._closeModal();
        this._toast('Bilhete salvo', 'success');
        this.renderBilhetes();
    },

    excluirBilhete(id) {
        if (!confirm('Excluir este bilhete?')) return;
        this.saveBilhetes(this.getBilhetes().filter(x => x.id !== id));
        this.renderBilhetes();
    }
};
