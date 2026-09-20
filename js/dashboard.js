var DashboardModule = {
    render() {
        const negocios = DB.get('negocios', []);
        const vendas = DB.get('vendas', []);
        const clientes = DB.get('clientes', []);
        const viagens = DB.get('viagens', []);
        const atividades = DB.get('atividades', []);

        const ativos = negocios.filter(n => n.stage !== 'Fechado (Ganho)' && n.stage !== 'Perdido');
        const fechados = negocios.filter(n => n.stage === 'Fechado (Ganho)');
        const receitaTotal = vendas.reduce((s, v) => s + (parseFloat(v.valorVenda) || 0), 0);
        const taxa = negocios.length ? Math.round((fechados.length / negocios.length) * 100) : 0;

        document.getElementById('stat-negocios-ativos').textContent = ativos.length;
        document.getElementById('stat-fechados-total').textContent = fechados.length;
        document.getElementById('stat-receita-total').textContent = AppModule.formatCurrency(receitaTotal);
        document.getElementById('stat-taxa-conversao').textContent = taxa + '%';
        document.getElementById('stat-fechados-mes').textContent = fechados.length;
        document.getElementById('stat-receita-mes').textContent = AppModule.formatCurrency(receitaTotal);
        document.getElementById('stat-ticket-medio').textContent = AppModule.formatCurrency(vendas.length ? receitaTotal / vendas.length : 0);
        document.getElementById('stat-clientes-ativos').textContent = clientes.length;

        this.renderPipelineSummary(negocios);
        this.renderFechadosRecentes(negocios);
        this.renderCheckins(viagens);
        this.renderAtividades(atividades);
    },

    renderPipelineSummary(negocios) {
        const config = DB.get('config', {});
        const etapas = config.pipeline || [];
        const container = document.getElementById('pipeline-summary');
        const dashboardPipeline = document.getElementById('dashboard-pipeline');
        let html = '';

        etapas.forEach(e => {
            const qtd = negocios.filter(n => n.stage === e).length;
            const valor = negocios.filter(n => n.stage === e).reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
            html += `<div class="pipeline-mini-row" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
                <span>${this.escapeHtml(e)}</span>
                <strong>${qtd} · ${AppModule.formatCurrency(valor)}</strong>
            </div>`;
        });

        if (dashboardPipeline) dashboardPipeline.innerHTML = html;
        if (container) {
            container.innerHTML = `<strong>Valor Total: ${AppModule.formatCurrency(negocios.reduce((s, n) => s + (parseFloat(n.valor) || 0), 0))}</strong>`;
        }
    },

    renderFechadosRecentes(negocios) {
        const container = document.getElementById('dashboard-fechados-recentes');
        const fechados = negocios
            .filter(n => n.stage === 'Fechado (Ganho)')
            .sort((a, b) => new Date(b.fechadoEm || b.atualizadoEm || b.criadoEm) - new Date(a.fechadoEm || a.atualizadoEm || a.criadoEm))
            .slice(0, 5);

        if (!fechados.length) {
            if (container) {
                container.innerHTML = `
                    <div class="dashboard-empty">
                        <div style="font-size:32px;margin-bottom:8px;">🏆</div>
                        <p>Nenhuma venda fechada ainda.</p>
                        <p style="font-size:11px;">Mova os cards no Pipeline para "Fechado (Ganho)"</p>
                    </div>`;
            }
            return;
        }

        if (container) {
            container.innerHTML = fechados.map(n => `
                <div class="fechado-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                    <div class="fechado-info">
                        <div style="font-weight:600;">${this.escapeHtml(n.titulo)}</div>
                        <div style="font-size:12px;color:var(--text-muted);">👤 ${this.escapeHtml(this.getClienteNome(n.clienteId))}</div>
                    </div>
                    <div style="font-weight:700;color:var(--success);">${n.valor ? AppModule.formatCurrency(n.valor) : '-'}</div>
                </div>
            `).join('');
        }
    },

    renderCheckins(viagens) {
        const container = document.getElementById('dashboard-checkins');
        if (!container) return;

        if (!viagens.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma viagem cadastrada</p>';
            return;
        }

        container.innerHTML = viagens.map(v => {
            const cliente = this.getClienteNome(v.clienteId);
            const statusHtml = v.checkinFeito
                ? `<span class="badge badge-success">✅ Realizado</span> <small style="color:var(--text-muted);">${AppModule.formatDate(v.checkinData)}</small>`
                : `<span class="badge badge-warning">⏳ Pendente</span>`;

            return `
                <div class="checkin-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                    <div>
                        <strong>${this.escapeHtml(cliente)} → ${this.escapeHtml(v.destino)}</strong>
                        <div style="font-size:11px;color:var(--text-muted);">${this.escapeHtml(v.servico || '')}</div>
                    </div>
                    <div>${statusHtml}</div>
                </div>`;
        }).join('');
    },

    renderAtividades(atividades) {
        const container = document.getElementById('dashboard-atividades');
        if (!container) return;

        if (!atividades.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma atividade recente.</p>';
            return;
        }

        container.innerHTML = atividades.slice(0, 10).map(a => `
            <div class="atividade-item" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
                <span class="atividade-dot activity-${a.tipo}" style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0;"></span>
                <span class="atividade-text" style="flex:1;">${this.escapeHtml(a.descricao)}</span>
                <span class="atividade-time" style="font-size:11px;color:var(--text-muted);">${AppModule.formatDateTime(a.data)}</span>
            </div>
        `).join('');
    },

    escapeHtml(text) {
        if (typeof AppModule !== 'undefined' && AppModule.escapeHtml) return AppModule.escapeHtml(text);
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    getClienteNome(clienteId) {
        if (typeof DB !== 'undefined' && DB.getClienteNome) return DB.getClienteNome(clienteId);
        const clientes = DB.get('clientes', []);
        const c = clientes.find(x => x.id === clienteId);
        return c ? c.nome : '—';
    }
};
