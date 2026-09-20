var RelatoriosModule = {
    periodoAtual: 'todos',

    render() {
        const range = this.calcularPeriodo();
        const vendas = this.filtrarPorPeriodo(DB.get('vendas', []), range, 'criadoEm');
        const negocios = DB.get('negocios', []);
        const clientes = DB.get('clientes', []);

        this.renderKPIs(vendas, negocios, clientes);
        this.renderReceitaPorMes(vendas);
        this.renderReceitaPorServico(vendas);
        this.renderTopClientes(vendas);
        this.renderPipeline(negocios);
    },

    aplicarPreset(valor) {
        this.periodoAtual = valor;
        const iniWrap = document.getElementById('rel-data-ini-wrap');
        const fimWrap = document.getElementById('rel-data-fim-wrap');
        if (valor === 'custom') {
            iniWrap.style.display = 'block';
            fimWrap.style.display = 'block';
        } else {
            iniWrap.style.display = 'none';
            fimWrap.style.display = 'none';
        }
        this.render();
    },

    calcularPeriodo() {
        const hoje = new Date();
        const ini = new Date(hoje);
        const fim = new Date(hoje);
        fim.setHours(23, 59, 59, 999);

        switch (this.periodoAtual) {
            case 'mes-atual':
                ini.setDate(1); ini.setHours(0, 0, 0, 0); break;
            case 'mes-anterior':
                ini.setMonth(ini.getMonth() - 1); ini.setDate(1); ini.setHours(0, 0, 0, 0); fim.setDate(0); break;
            case 'trimestre': ini.setMonth(ini.getMonth() - 3); break;
            case 'semestre': ini.setMonth(ini.getMonth() - 6); break;
            case 'ano': ini.setMonth(0); ini.setDate(1); ini.setHours(0, 0, 0, 0); break;
            case 'custom': {
                const di = document.getElementById('rel-data-ini').value;
                const df = document.getElementById('rel-data-fim').value;
                return { inicio: di ? new Date(di + 'T00:00:00') : null, fim: df ? new Date(df + 'T23:59:59') : null };
            }
            default: return { inicio: null, fim: null };
        }
        return { inicio: ini, fim };
    },

    filtrarPorPeriodo(lista, range, campo) {
        if (!range.inicio && !range.fim) return lista;
        return lista.filter(item => {
            const d = new Date(item[campo]);
            if (isNaN(d.getTime())) return false;
            if (range.inicio && d < range.inicio) return false;
            if (range.fim && d > range.fim) return false;
            return true;
        });
    },

    renderKPIs(vendas, negocios, clientes) {
        const receita = vendas.reduce((s, v) => s + (parseFloat(v.valorVenda) || 0), 0);
        const ticket = vendas.length ? receita / vendas.length : 0;
        const fechados = negocios.filter(n => n.stage === 'Fechado (Ganho)').length;
        const perdidos = negocios.filter(n => n.stage === 'Perdido').length;
        const taxa = negocios.length ? Math.round((fechados / (fechados + perdidos || 1)) * 100) : 0;

        document.getElementById('rel-kpis').innerHTML = `
            <div class="kpi-card"><label>Vendas no Período</label><span>${vendas.length}</span></div>
            <div class="kpi-card"><label>Receita no Período</label><span>${AppModule.formatCurrency(receita)}</span></div>
            <div class="kpi-card"><label>Ticket Médio</label><span>${AppModule.formatCurrency(ticket)}</span></div>
            <div class="kpi-card"><label>Taxa de Conversão</label><span>${taxa}%</span></div>
        `;
    },

    renderReceitaPorMes(vendas) {
        const container = document.getElementById('rel-receita-mes');
        const grupos = {};
        vendas.forEach(v => {
            const d = new Date(v.criadoEm);
            if (isNaN(d.getTime())) return;
            const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            grupos[chave] = (grupos[chave] || 0) + (parseFloat(v.valorVenda) || 0);
        });

        const chaves = Object.keys(grupos).sort();
        if (!chaves.length) { container.innerHTML = '<p class="dashboard-empty">Sem vendas no período.</p>'; return; }

        const max = Math.max(...Object.values(grupos));
        container.innerHTML = chaves.map(c => {
            const pct = max ? (grupos[c] / max) * 100 : 0;
            const [ano, mes] = c.split('-');
            const label = this.mesNome(parseInt(mes)) + '/' + ano.slice(2);
            return `<div class="bar-row">
                <span class="bar-label">${label}</span>
                <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                <span class="bar-value">${AppModule.formatCurrency(grupos[c])}</span>
            </div>`;
        }).join('');
    },

    renderReceitaPorServico(vendas) {
        const container = document.getElementById('rel-receita-servico');
        const grupos = {};
        vendas.forEach(v => {
            const s = v.servico || '—';
            grupos[s] = (grupos[s] || 0) + (parseFloat(v.valorVenda) || 0);
        });

        const chaves = Object.keys(grupos).sort((a, b) => grupos[b] - grupos[a]);
        if (!chaves.length) { container.innerHTML = '<p class="dashboard-empty">Sem vendas no período.</p>'; return; }

        const max = Math.max(...Object.values(grupos));
        container.innerHTML = chaves.map(c => {
            const pct = max ? (grupos[c] / max) * 100 : 0;
            return `<div class="bar-row">
                <span class="bar-label">${AppModule.escapeHtml(c)}</span>
                <div class="bar-track"><div class="bar-fill bar-fill-alt" style="width:${pct}%"></div></div>
                <span class="bar-value">${AppModule.formatCurrency(grupos[c])}</span>
            </div>`;
        }).join('');
    },

    renderTopClientes(vendas) {
        const container = document.getElementById('rel-top-clientes');
        const grupos = {};
        vendas.forEach(v => {
            const nome = DB.getClienteNome(v.clienteId) || '—';
            grupos[nome] = (grupos[nome] || 0) + (parseFloat(v.valorVenda) || 0);
        });

        const top = Object.entries(grupos).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (!top.length) { container.innerHTML = '<p class="dashboard-empty">Sem vendas no período.</p>'; return; }

        container.innerHTML = top.map(([nome, valor], i) => `
            <div class="list-item">
                <div class="list-item-info"><h4>${i + 1}. ${AppModule.escapeHtml(nome)}</h4></div>
                <span style="font-weight:700;color:var(--success);">${AppModule.formatCurrency(valor)}</span>
            </div>
        `).join('');
    },

    renderPipeline(negocios) {
        const container = document.getElementById('rel-pipeline');
        const config = DB.get('config', {});
        const etapas = config.pipeline || [];

        const contagem = {};
        etapas.forEach(e => { contagem[e] = 0; });
        negocios.forEach(n => { if (contagem[n.stage] !== undefined) contagem[n.stage]++; });

        const max = Math.max(1, ...Object.values(contagem));
        container.innerHTML = etapas.map(e => {
            const pct = (contagem[e] / max) * 100;
            return `<div class="bar-row">
                <span class="bar-label">${AppModule.escapeHtml(e)}</span>
                <div class="bar-track"><div class="bar-fill bar-fill-green" style="width:${pct}%"></div></div>
                <span class="bar-value">${contagem[e]}</span>
            </div>`;
        }).join('');
    },

    mesNome(m) {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return meses[m - 1] || '';
    },

    exportarCSV() {
        const range = this.calcularPeriodo();
        const vendas = this.filtrarPorPeriodo(DB.get('vendas', []), range, 'criadoEm');

        const linhas = [['Data', 'Cliente', 'Serviço', 'Título', 'Valor Total', 'Tipo Venda']];
        vendas.forEach(v => {
            linhas.push([
                AppModule.formatDate(v.criadoEm),
                DB.getClienteNome(v.clienteId) || '',
                v.servico || '',
                v.titulo || '',
                (parseFloat(v.valorVenda) || 0).toFixed(2),
                v.tipoVenda || ''
            ]);
        });

        const csv = linhas.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-vendas-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        AppModule.toast('CSV exportado!');
    }
};
