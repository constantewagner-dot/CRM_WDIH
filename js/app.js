const AppModule = {
    _alertas: [],
    _filtroAtivo: 'all',

    init() {
        this.setupNavigation();
        this.setupSidebar();
        this.setupModal();
        this.updateDashboard();
    },

    formatCurrency(value) {
        const n = Number(value) || 0;
        const abs = Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return (n < 0 ? '-R$ ' : 'R$ ') + abs;
    },

    formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return d.toLocaleDateString('pt-BR');
    },

    formatRelativeTime(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return '';
        const diff = Date.now() - d.getTime();
        const min = Math.floor(diff / 60000);
        if (min < 1) return 'agora mesmo';
        if (min < 60) return `há ${min} min`;
        const h = Math.floor(min / 60);
        if (h < 24) return `há ${h}h`;
        const dias = Math.floor(h / 24);
        if (dias < 7) return `há ${dias}d`;
        return this.formatDate(iso);
    },

    generateId(prefix) {
        const base = Date.now().toString(36) + Math.random().toString(36).substr(2, 7);
        return prefix ? prefix + '_' + base : base;
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo(item.dataset.page); });
        });
    },

    navigateTo(page) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const nav = document.querySelector(`[data-page="${page}"]`);
        if (nav) nav.classList.add('active');

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pg = document.getElementById(`page-${page}`);
        if (pg) pg.classList.add('active');

        const titles = {
            dashboard: 'Dashboard', pipeline: 'Pipeline', vendas: 'Vendas',
            viagens: 'Viagens', milhas: 'Milhas', clientes: 'Clientes', config: 'Configurações'
        };
        const t = document.getElementById('page-title');
        if (t) t.textContent = titles[page] || page;

        try {
            if (page === 'dashboard') this.updateDashboard();
            if (page === 'pipeline') PipelineModule.render();
            if (page === 'vendas') VendasModule.render();
            if (page === 'viagens') ViagensModule.render();
            if (page === 'milhas') MilhasModule.render();
            if (page === 'clientes') ClientesModule.render();
        } catch (e) { console.error('Erro ao renderizar ' + page, e); }
    },

    setupSidebar() {
        const btn = document.getElementById('btn-toggle-sidebar');
        if (btn) btn.addEventListener('click', () => {
            const sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('collapsed');
        });
    },

    setupModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeModal(); });
    },

    // ================================================
    // 🎯 DASHBOARD CFO VIEW
    // ================================================
    updateDashboard() {
        this.renderAlertas();
        this.renderKPIs();
        this.renderTopClientes();
        this.renderMixServicos();
        this.renderPipelineEtapas();
        this.renderAtividades();
    },

    // ================================================
    // 🚨 ALERTAS E AÇÕES PRIORITÁRIAS (otimizado)
    // ================================================
    coletarAlertas() {
        const alertas = [];
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // 1) Viagens próximas sem check-in
        DB.getViagens().forEach(v => {
            if (v.concluida || v.checkinFeito || !v.dataIda) return;
            const dataIda = new Date(v.dataIda + 'T00:00:00');
            const dias = Math.ceil((dataIda - hoje) / 86400000);
            if (dias < 0) return;
            if (dias <= 3) {
                alertas.push({
                    tipo: 'critical', icon: '🔴',
                    title: `Check-in URGENTE: ${DB.getClienteNome(v.clienteId)}`,
                    desc: `Viagem para ${v.destino || '—'} ${dias === 0 ? 'é HOJE' : `em ${dias} dia(s)`} (${this.formatDate(v.dataIda)}). Check-in não realizado.`,
                    action: 'Fazer check-in →', page: 'viagens',
                    tempo: dias === 0 ? 'HOJE' : `${dias} dia(s)`, urgente: true
                });
            } else if (dias <= 7) {
                alertas.push({
                    tipo: 'warning', icon: '🟡',
                    title: `Viagem próxima: ${DB.getClienteNome(v.clienteId)}`,
                    desc: `Viagem para ${v.destino || '—'} em ${dias} dias (${this.formatDate(v.dataIda)}). Check-in pendente.`,
                    action: 'Ver viagem →', page: 'viagens',
                    tempo: `${dias} dias`, urgente: false
                });
            }
        });

        // 2) Negócios parados
        DB.getNegocios().forEach(n => {
            if (n.stage === 'Fechado (Ganho)' || n.stage === 'Perdido') return;
            const atualizado = new Date(n.atualizadoEm || n.criadoEm);
            const diasParado = Math.floor((Date.now() - atualizado.getTime()) / 86400000);
            if (diasParado >= 15) {
                alertas.push({
                    tipo: 'warning', icon: '⏸️',
                    title: `Negócio parado: ${DB.getClienteNome(n.clienteId)}`,
                    desc: `"${n.titulo || '—'}" sem atualização há ${diasParado} dias. Etapa: ${n.stage}.`,
                    action: 'Ir para Pipeline →', page: 'pipeline',
                    tempo: `${diasParado} dias parado`, urgente: false
                });
            }
        });

        // 3) Propostas aguardando follow-up
        DB.getNegocios().forEach(n => {
            if (n.stage !== 'Proposta Enviada') return;
            const atualizado = new Date(n.atualizadoEm || n.criadoEm);
            const dias = Math.floor((Date.now() - atualizado.getTime()) / 86400000);
            if (dias >= 7) {
                alertas.push({
                    tipo: 'info', icon: '📞',
                    title: `Follow-up: ${DB.getClienteNome(n.clienteId)}`,
                    desc: `Proposta enviada há ${dias} dias. Hora de cobrar retorno.`,
                    action: 'Ir para Pipeline →', page: 'pipeline',
                    tempo: `há ${dias} dias`, urgente: false
                });
            }
        });

        // 4) Viagens atrasadas
        DB.getViagens().forEach(v => {
            if (v.concluida || v.checkinFeito || !v.dataIda) return;
            const dataIda = new Date(v.dataIda + 'T00:00:00');
            const dias = Math.ceil((dataIda - hoje) / 86400000);
            if (dias < 0) {
                alertas.push({
                    tipo: 'critical', icon: '⚠️',
                    title: `Viagem ATRASADA: ${DB.getClienteNome(v.clienteId)}`,
                    desc: `Viagem para ${v.destino || '—'} era para ${this.formatDate(v.dataIda)} e não foi concluída.`,
                    action: 'Ver viagem →', page: 'viagens',
                    tempo: 'ATRASADA', urgente: true
                });
            }
        });

        const ordem = { critical: 0, warning: 1, info: 2 };
        alertas.sort((a, b) => ordem[a.tipo] - ordem[b.tipo]);
        return alertas;
    },

    renderAlertas() {
        const el = document.getElementById('alertas-list');
        if (!el) return;

        const alertas = this.coletarAlertas();
        this._alertas = alertas;
        this._filtroAtivo = 'all';

        // Subtítulo
        const sub = document.getElementById('alerts-subtitle');
        if (sub) sub.textContent = alertas.length
            ? `${alertas.length} ação(ões) precisando de atenção`
            : 'Nenhuma pendência no momento';

        // Contadores (stats clicáveis)
        const statsEl = document.getElementById('alerts-stats');
        if (statsEl) {
            const critical = alertas.filter(a => a.tipo === 'critical').length;
            const warning = alertas.filter(a => a.tipo === 'warning').length;
            const info = alertas.filter(a => a.tipo === 'info').length;
            statsEl.innerHTML = `
                <div class="alert-stat critical" onclick="AppModule.filterAlertas('critical')">
                    <span class="dot"></span> ${critical} Crítico(s)
                </div>
                <div class="alert-stat warning" onclick="AppModule.filterAlertas('warning')">
                    <span class="dot"></span> ${warning} Atenção
                </div>
                <div class="alert-stat info" onclick="AppModule.filterAlertas('info')">
                    <span class="dot"></span> ${info} Informativo(s)
                </div>`;
        }

        // Esconde filtros se não houver alertas
        const filtersEl = document.getElementById('alerts-filters');
        if (filtersEl) filtersEl.style.display = alertas.length ? 'flex' : 'none';

        this.renderAlertasGrid(alertas, 'all');
    },

    filterAlertas(filtro) {
        this._filtroAtual = filtro;

        // Atualiza botões de filtro
        document.querySelectorAll('.alert-filter').forEach(b => {
            b.classList.toggle('active', b.dataset.filter === filtro);
        });

        // Atualiza stats ativos
        document.querySelectorAll('.alert-stat').forEach(s => {
            s.classList.toggle('active', s.classList.contains(filtro));
        });

        this.renderAlertasGrid(this._alertas, filtro);
    },

    renderAlertasGrid(alertas, filtro) {
        const el = document.getElementById('alertas-list');
        if (!el) return;

        const lista = filtro === 'all' ? alertas : alertas.filter(a => a.tipo === filtro);

        if (lista.length === 0) {
            const msg = alertas.length === 0
                ? '✅ Tudo em ordem! Nenhuma pendência no momento.'
                : 'Nenhum alerta nesta categoria ✓';
            el.innerHTML = `<div class="alerts-empty ${alertas.length === 0 ? 'success' : ''}">${msg}</div>`;
            return;
        }

        el.innerHTML = lista.map(a => `
            <div class="alert-item alert-${a.tipo}">
                <div class="alert-icon">${a.icon}</div>
                <div class="alert-content">
                    <div class="alert-title">${a.title}</div>
                    <div class="alert-desc">${a.desc}</div>
                    <div class="alert-footer">
                        <span class="alert-action" onclick="AppModule.navigateTo('${a.page}')">${a.action}</span>
                        <span class="alert-tempo ${a.urgente ? 'urgent' : ''}">${a.tempo}</span>
                    </div>
                </div>
            </div>`).join('');
    },

    // 💰 KPIs
    renderKPIs() {
        const vendas = DB.getVendas();
        const negocios = DB.getNegocios();

        const receita = vendas.reduce((s, v) => s + (Number(v.valorVenda) || 0), 0);
        const lucro = vendas.reduce((s, v) => s + ((Number(v.valorVenda) || 0) - (Number(v.valorOriginal) || 0)), 0);
        const margem = receita > 0 ? (lucro / receita) * 100 : 0;
        const ticket = vendas.length > 0 ? receita / vendas.length : 0;
        const fechados = negocios.filter(n => n.stage === 'Fechado (Ganho)').length;
        const totalNegocios = negocios.filter(n => n.stage !== 'Perdido').length;
        const conversao = totalNegocios > 0 ? (fechados / totalNegocios) * 100 : 0;
        const pipelineAtivo = negocios
            .filter(n => n.stage !== 'Fechado (Ganho)' && n.stage !== 'Perdido')
            .reduce((s, n) => s + (Number(n.valor) || 0), 0);

        const agora = new Date();
        const mesAtual = agora.getMonth();
        const anoAtual = agora.getFullYear();
        const vendasMesAtual = vendas.filter(v => {
            const d = new Date(v.criadoEm);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).reduce((s, v) => s + (Number(v.valorVenda) || 0), 0);

        const mesAnterior = new Date(anoAtual, mesAtual - 1, 1);
        const vendasMesAnterior = vendas.filter(v => {
            const d = new Date(v.criadoEm);
            return d.getMonth() === mesAnterior.getMonth() && d.getFullYear() === mesAnterior.getFullYear();
        }).reduce((s, v) => s + (Number(v.valorVenda) || 0), 0);

        const crescimento = vendasMesAnterior > 0
            ? ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100
            : (vendasMesAtual > 0 ? 100 : 0);

        const set = (id, txt, cls) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = txt;
            if (cls !== undefined) { el.className = 'kpi-sub ' + cls; }
        };

        set('kpi-receita', this.formatCurrency(receita));
        set('kpi-receita-sub', `Mês atual: ${this.formatCurrency(vendasMesAtual)}`, '');
        set('kpi-lucro', this.formatCurrency(lucro));
        set('kpi-lucro-sub', lucro >= 0 ? 'Resultado positivo ✓' : 'Resultado negativo ⚠', lucro >= 0 ? 'positive' : 'negative');
        set('kpi-margem', margem.toFixed(1) + '%');
        set('kpi-margem-sub', `Meta saudável: 15%+`, margem >= 15 ? 'positive' : '');
        set('kpi-ticket', this.formatCurrency(ticket));
        set('kpi-ticket-sub', `${vendas.length} venda(s) realizada(s)`, '');
        set('kpi-conversao', conversao.toFixed(1) + '%');
        set('kpi-conversao-sub', `${fechados} ganho(s) de ${totalNegocios} negócio(s)`, conversao >= 30 ? 'positive' : '');
        set('kpi-pipeline', this.formatCurrency(pipelineAtivo));
        const crescTxt = crescimento !== 0 ? `${crescimento > 0 ? '↑' : '↓'} ${Math.abs(crescimento).toFixed(0)}% vs mês anterior` : 'Sem comparação';
        set('kpi-pipeline-sub', crescTxt, crescimento > 0 ? 'positive' : crescimento < 0 ? 'negative' : '');
    },

    // 🏆 TOP CLIENTES
    renderTopClientes() {
        const el = document.getElementById('top-clientes');
        if (!el) return;
        const vendas = DB.getVendas();
        const map = {};
        vendas.forEach(v => {
            if (!v.clienteId) return;
            map[v.clienteId] = (map[v.clienteId] || 0) + (Number(v.valorVenda) || 0);
        });
        const top = Object.entries(map)
            .map(([id, total]) => ({ nome: DB.getClienteNome(id), total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        if (top.length === 0) {
            el.innerHTML = '<div class="empty-chart">Nenhuma venda registrada ainda</div>';
            return;
        }
        const max = top[0].total;
        el.innerHTML = top.map((c, i) => `
            <div class="bar-chart-item">
                <div class="bar-label">${i + 1}. ${c.nome}</div>
                <div class="bar-container"><div class="bar-fill fill-royal" style="width:${(c.total / max * 100).toFixed(1)}%"></div></div>
                <div class="bar-value">${this.formatCurrency(c.total)}</div>
            </div>`).join('');
    },

    // 🛎️ MIX DE SERVIÇOS
    renderMixServicos() {
        const el = document.getElementById('mix-servicos');
        if (!el) return;
        const vendas = DB.getVendas();
        const map = {};
        vendas.forEach(v => {
            const s = v.servico || 'Outros';
            map[s] = (map[s] || 0) + 1;
        });
        const mix = Object.entries(map)
            .map(([servico, qtd]) => ({ servico, qtd }))
            .sort((a, b) => b.qtd - a.qtd);

        if (mix.length === 0) {
            el.innerHTML = '<div class="empty-chart">Nenhuma venda registrada ainda</div>';
            return;
        }
        const max = mix[0].qtd;
        const cores = ['fill-royal', 'fill-success', 'fill-purple', 'fill-warning', 'fill-cyan', 'fill-pink'];
        el.innerHTML = mix.map((s, i) => `
            <div class="bar-chart-item">
                <div class="bar-label">${s.servico}</div>
                <div class="bar-container"><div class="bar-fill ${cores[i % cores.length]}" style="width:${(s.qtd / max * 100).toFixed(1)}%"></div></div>
                <div class="bar-value">${s.qtd} venda(s)</div>
            </div>`).join('');
    },

    // 📋 PIPELINE POR ETAPA
    renderPipelineEtapas() {
        const el = document.getElementById('pipeline-etapas');
        if (!el) return;
        const negocios = DB.getNegocios();
        const stages = DB.getPipelineStages();
        const data = stages.map(s => ({
            stage: s,
            count: negocios.filter(n => n.stage === s).length,
            valor: negocios.filter(n => n.stage === s).reduce((sum, n) => sum + (Number(n.valor) || 0), 0)
        }));
        const max = Math.max(...data.map(d => d.count), 1);
        const cores = ['fill-cyan', 'fill-royal', 'fill-purple', 'fill-warning', 'fill-success', 'fill-pink'];

        el.innerHTML = data.map((d, i) => `
            <div class="bar-chart-item">
                <div class="bar-label" title="${d.stage}">${d.stage}</div>
                <div class="bar-container"><div class="bar-fill ${cores[i % cores.length]}" style="width:${(d.count / max * 100).toFixed(1)}%">${d.count}</div></div>
                <div class="bar-value">${this.formatCurrency(d.valor)}</div>
            </div>`).join('');
    },

    // 📢 ATIVIDADES RECENTES
    renderAtividades() {
        const el = document.getElementById('atividades-recentes');
        if (!el) return;
        const atividades = DB.getAtividades().slice(0, 8);
        if (atividades.length === 0) {
            el.innerHTML = '<div class="empty-chart">Nenhuma atividade registrada</div>';
            return;
        }
        const icones = { cliente: '👤', venda: '💰', viagem: '✈️', negocio: '📋', milha: '💠' };
        el.innerHTML = atividades.map(a => `
            <div class="atividade-item">
                <div class="atividade-icon">${icones[a.tipo] || '📌'}</div>
                <div class="atividade-content">
                    <div class="atividade-desc">${a.descricao}</div>
                    <div class="atividade-time">${this.formatRelativeTime(a.data)}</div>
                </div>
            </div>`).join('');
    },

    showToast(message, type = 'info') {
        const c = document.getElementById('toast-container');
        if (!c) return;
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = message;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    openModal(title, bodyHTML, footerHTML = '') {
        const o = document.getElementById('modal-overlay');
        if (!o) return;
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-footer').innerHTML = footerHTML;
        o.classList.add('active');
    },

    closeModal() {
        const o = document.getElementById('modal-overlay');
        if (o) o.classList.remove('active');
    }
};
