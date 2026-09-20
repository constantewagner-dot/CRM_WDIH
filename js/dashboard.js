const DashboardModule = {
    render() {
        const negocios = DB.get('negocios', []);
        const vendas = DB.get('vendas', []);
        const clientes = DB.get('clientes', []);
        const viagens = DB.get('viagens', []);
        const atividades = DB.get('atividades', []);

        const ativos = negocios.filter(n => n.etapa !== 'Fechado' && n.etapa !== 'Perdido');
        const fechados = negocios.filter(n => n.etapa === 'Fechado');
        const receitaTotal = vendas.reduce((sum, v) => sum + (parseFloat(v.valor_total) || 0), 0);
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
        const container = document.getElementById('dashboard-pipeline');
        const summary = document.getElementById('pipeline-summary');

        let html = '';
        etapas.forEach(etapa => {
            const qtd = negocios.filter(n => n.etapa === etapa).length;
            const valor = negocios.filter(n => n.etapa === etapa).reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
            html += `<div class="pipeline-mini-row">
                <span>${AppModule.escapeHtml(etapa)}</span>
                <strong>${qtd} · ${AppModule.formatCurrency(valor)}</strong>
            </div>`;
        });

        container.innerHTML = html;

        const total = negocios.reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
        summary.innerHTML = `<strong>Valor total em pipeline: ${AppModule.formatCurrency(total)}</strong>`;
    },

    renderFechadosRecentes(negocios) {
        const container = document.getElementById('dashboard-fechados-recentes');
        const fechados = negocios.filter(n => n.etapa === 'Fechado').sort((a, b) => new Date(b.data_fechamento) - new Date(a.data_fechamento)).slice(0, 5);

        if (!fechados.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhum negócio fechado ainda.</p>';
            return;
        }

        container.innerHTML = fechados.map(n => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${AppModule.escapeHtml(n.titulo)}</h4>
                    <small>${AppModule.escapeHtml(n.cliente_nome || '')}</small>
                </div>
                <span class="badge badge-success">${AppModule.formatCurrency(n.valor)}</span>
            </div>
        `).join('');
    },

    renderCheckins(viagens) {
        const container = document.getElementById('dashboard-checkins');
        const pendentes = viagens.filter(v => v.status === 'Pendente' || v.status === 'Confirmada').slice(0, 5);

        if (!pendentes.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhum check-in pendente.</p>';
            return;
        }

        container.innerHTML = pendentes.map(v => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${AppModule.escapeHtml(v.destino || v.titulo)}</h4>
                    <small>${AppModule.formatDate(v.data_ida)} · ${AppModule.escapeHtml(v.cliente_nome || '')}</small>
                </div>
                <span class="badge badge-warning">${AppModule.escapeHtml(v.status)}</span>
            </div>
        `).join('');
    },

    renderAtividades(atividades) {
        const container = document.getElementById('dashboard-atividades');

        if (!atividades.length) {
            container.innerHTML = '<p class="dashboard-empty">Nenhuma atividade recente.</p>';
            return;
        }

        container.innerHTML = atividades.slice(0, 5).map(a => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${AppModule.escapeHtml(a.descricao)}</h4>
                    <small>${AppModule.formatDateTime(a.data)}</small>
                </div>
            </div>
        `).join('');
    }
};
