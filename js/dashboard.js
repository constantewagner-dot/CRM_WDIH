var DashboardModule = {
    render() {
        this.renderKPIs();
        this.renderPipeline();
        this.renderFechadosRecentes();
        this.renderCheckins();
        this.renderTarefas();
        this.renderAtividades();
        this.renderMilhas();
        this.updateDateTime();
    },

    updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('pt-BR', options);
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const el1 = document.getElementById('dashboard-data-hora');
        const el2 = document.getElementById('dashboard-data-hora-header');

        if (el1) el1.textContent = `${dateStr} • ${timeStr}`;
        if (el2) el2.textContent = `${dateStr} • ${timeStr}`;
    },

    renderKPIs() {
        const negocios = DB.get('negocios', []);
        const vendas = DB.get('vendas', []);
        const clientes = DB.get('clientes', []);

        const ativos = negocios.filter(n => n.stage !== 'Fechado (Ganho)' && n.stage !== 'Perdido').length;
        const fechados = negocios.filter(n => n.stage === 'Fechado (Ganho)').length;
        const receitaTotal = vendas.reduce((s, v) => s + (parseFloat(v.valorVenda) || 0), 0);
        const taxaConversao = negocios.length ? ((fechados / negocios.length) * 100).toFixed(1) : 0;

        const mesAtual = new Date().getMonth();
        const anoAtual = new Date().getFullYear();
        const fechadosMes = vendas.filter(v => {
            const d = new Date(v.criadoEm);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).length;
        const receitaMes = vendas.filter(v => {
            const d = new Date(v.criadoEm);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).reduce((s, v) => s + (parseFloat(v.valorVenda) || 0), 0);
        const ticketMedio = fechadosMes ? receitaMes / fechadosMes : 0;

        document.getElementById('stat-negocios-ativos').textContent = ativos;
        document.getElementById('stat-fechados-total').textContent = fechados;
        document.getElementById('stat-receita-total').textContent = AppModule.formatCurrency(receitaTotal);
        document.getElementById('stat-taxa-conversao').textContent = `${taxaConversao}%`;
        document.getElementById('stat-fechados-mes').textContent = fechadosMes;
        document.getElementById('stat-receita-mes').textContent = AppModule.formatCurrency(receitaMes);
        document.getElementById('stat-ticket-medio').textContent = AppModule.formatCurrency(ticketMedio);
        document.getElementById('stat-clientes-ativos').textContent = clientes.length;
    },

    renderPipeline() {
        const negocios = DB.get('negocios', []);
        const config = DB.get('config', {});
        const etapas = config.pipeline || [];

        const container = document.getElementById('dashboard-pipeline');
        const summary = document.getElementById('pipeline-summary');
        if (!container) return;

        if (!etapas.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma etapa configurada.</p>';
            if (summary) summary.innerHTML = '';
            return;
        }

        let totalPipeline = 0;
        const rows = etapas.map(etapa => {
            const cards = negocios.filter(n => n.stage === etapa);
            const valor = cards.reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
            totalPipeline += valor;
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${AppModule.escapeHtml(etapa)}</h4>
                        <small>${cards.length} negócio(s)</small>
                    </div>
                    <div style="font-weight:700;color:var(--primary);">${AppModule.formatCurrency(valor)}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = rows || '<p class="dashboard-empty">Nenhum negócio no pipeline.</p>';
        if (summary) summary.innerHTML = `<strong>Total: ${AppModule.formatCurrency(totalPipeline)}</strong>`;
    },

    renderFechadosRecentes() {
        const negocios = DB.get('negocios', []).filter(n => n.stage === 'Fechado (Ganho)');
        const container = document.getElementById('dashboard-fechados-recentes');
        if (!container) return;

        if (!negocios.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhum negócio fechado ainda.</p>';
            return;
        }

        const recentes = negocios.sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm)).slice(0, 5);
        container.innerHTML = recentes.map(n => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${AppModule.escapeHtml(n.titulo)}</h4>
                    <small>${AppModule.escapeHtml(DB.getClienteNome(n.clienteId))} • ${AppModule.formatDate(n.atualizadoEm)}</small>
                </div>
                <div style="font-weight:700;color:var(--success);">${AppModule.formatCurrency(n.valor)}</div>
            </div>
        `).join('');
    },

    renderCheckins() {
        const viagens = DB.get('viagens', []).filter(v => !v.checkinFeito);
        const container = document.getElementById('dashboard-checkins');
        if (!container) return;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const proximas = viagens
            .filter(v => {
                const dataIda = new Date(v.dataIda);
                dataIda.setHours(0, 0, 0, 0);
                const diff = (dataIda - hoje) / (1000 * 60 * 60 * 24);
                return diff >= 0 && diff <= 7;
            })
            .sort((a, b) => new Date(a.dataIda) - new Date(b.dataIda));

        if (!proximas.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhum check-in pendente nos próximos 7 dias.</p>';
            return;
        }

        container.innerHTML = proximas.map(v => {
            const dias = Math.ceil((new Date(v.dataIda) - hoje) / (1000 * 60 * 60 * 24));
            const badge = dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `Em ${dias} dias`;
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${AppModule.escapeHtml(v.destino)}</h4>
                        <small>${AppModule.escapeHtml(DB.getClienteNome(v.clienteId))} • ${AppModule.formatDate(v.dataIda)}</small>
                    </div>
                    <div>
                        <span class="badge badge-warning">${badge}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderTarefas() {
        const tarefas = DB.get('tarefas', []);
        const container = document.getElementById('dashboard-tarefas');
        if (!container) return;

        const pendentes = tarefas.filter(t => t.status !== 'concluida');
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const atrasadas = pendentes.filter(t => {
            if (!t.prazo) return false;
            const prazo = new Date(t.prazo);
            prazo.setHours(0, 0, 0, 0);
            return prazo < hoje;
        });

        const proximas = pendentes.filter(t => {
            if (!t.prazo) return false;
            const prazo = new Date(t.prazo);
            prazo.setHours(0, 0, 0, 0);
            const diff = (prazo - hoje) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7;
        });

        if (!pendentes.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma tarefa pendente.</p>';
            return;
        }

        let html = '';

        if (atrasadas.length) {
            html += `<div style="margin-bottom:12px;"><strong style="color:var(--danger);">⚠️ ${atrasadas.length} atrasada(s)</strong></div>`;
            html += atrasadas.slice(0, 3).map(t => `
                <div class="list-item" style="border-left:3px solid var(--danger);padding-left:10px;">
                    <div class="list-item-info">
                        <h4>${AppModule.escapeHtml(t.titulo)}</h4>
                        <small style="color:var(--danger);">Atrasada desde ${AppModule.formatDate(t.prazo)}</small>
                    </div>
                </div>
            `).join('');
        }

        if (proximas.length) {
            html += `<div style="margin:12px 0 8px;"><strong>📅 ${proximas.length} nos próximos 7 dias</strong></div>`;
            html += proximas.slice(0, 3).map(t => `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${AppModule.escapeHtml(t.titulo)}</h4>
                        <small>Prazo: ${AppModule.formatDate(t.prazo)}</small>
                    </div>
                </div>
            `).join('');
        }

        container.innerHTML = html || '<p class="dashboard-empty">Nenhuma tarefa urgente.</p>';
    },

    renderAtividades() {
        const atividades = DB.get('atividades', []);
        const container = document.getElementById('dashboard-atividades');
        if (!container) return;

        if (!atividades.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma atividade registrada.</p>';
            return;
        }

        const recentes = atividades.slice(-10).reverse();
        container.innerHTML = recentes.map(a => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${AppModule.escapeHtml(a.descricao)}</h4>
                    <small>${AppModule.formatDate(a.data)}</small>
                </div>
            </div>
        `).join('');
    },

    renderMilhas() {
        const milhas = DB.get('milhas', { emissoes: [] });
        const emissoes = milhas.emissoes || [];

        let totalEconomia = 0;
        emissoes.forEach(e => {
            const calc = MilhasModule.calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.companhia);
            totalEconomia += calc.economia;
        });

        const kpiGrid = document.querySelector('#page-dashboard .kpi-grid');
        if (kpiGrid) {
            let card = document.getElementById('stat-economia-milhas');
            if (!card) {
                card = document.createElement('div');
                card.className = 'kpi-card';
                card.id = 'stat-economia-milhas';
                kpiGrid.appendChild(card);
            }
            card.innerHTML = `
                <label>Economia em Milhas</label>
                <span style="color:var(--success);">${AppModule.formatCurrency(totalEconomia)}</span>
            `;
        }
    },

    renderComissoes() {
        const resumo = AppModule.obterResumoComissoes();

        const kpiGrid = document.querySelector('#page-dashboard .kpi-grid');
        if (kpiGrid) {
            let card = document.getElementById('stat-comissoes');
            if (!card) {
                card = document.createElement('div');
                card.className = 'kpi-card';
                card.id = 'stat-comissoes';
                kpiGrid.appendChild(card);
            }
            card.innerHTML = `
                <label>Comissões (${resumo.comissaoPadrao}%)</label>
                <span style="color:var(--primary);">${AppModule.formatCurrency(resumo.total)}</span>
            `;
        }
    }
};
