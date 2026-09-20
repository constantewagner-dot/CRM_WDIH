var CalendarioModule = {
    dataAtual: new Date(),
    diaSelecionado: null,

    render() {
        const ano = this.dataAtual.getFullYear();
        const mes = this.dataAtual.getMonth();
        const titulo = document.getElementById('cal-titulo');
        if (titulo) {
            titulo.textContent = this.mesNome(mes) + ' ' + ano;
        }
        this.renderGrid(ano, mes);
        this.renderDiaSelecionado();
    },

    renderGrid(ano, mes) {
        const grid = document.getElementById('cal-grid');
        if (!grid) return;

        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);
        const diaSemana = primeiroDia.getDay();
        const totalDias = ultimoDia.getDate();

        const eventos = this.coletarEventos(ano, mes);

        let html = `
            <div class="cal-header">
                <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
            </div>
            <div class="cal-body">
        `;

        for (let i = 0; i < diaSemana; i++) {
            html += '<div class="cal-dia cal-dia-vazio"></div>';
        }

        const hoje = new Date();
        for (let d = 1; d <= totalDias; d++) {
            const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const evts = eventos[dataStr] || [];
            const isHoje = hoje.getFullYear() === ano && hoje.getMonth() === mes && hoje.getDate() === d;
            const isSelecionado = this.diaSelecionado === dataStr;

            html += `
                <div class="cal-dia ${isHoje ? 'cal-hoje' : ''} ${isSelecionado ? 'cal-selecionado' : ''}" onclick="CalendarioModule.selecionarDia('${dataStr}')">
                    <div class="cal-dia-num">${d}</div>
                    ${evts.length ? `<div class="cal-dia-eventos">${evts.slice(0, 3).map(e => `<div class="cal-evt cal-evt-${e.tipo}">${AppModule.escapeHtml(e.titulo)}</div>`).join('')}${evts.length > 3 ? `<div class="cal-evt-mais">+${evts.length - 3}</div>` : ''}</div>` : ''}
                </div>
            `;
        }

        html += '</div>';
        grid.innerHTML = html;
    },

    coletarEventos(ano, mes) {
        const eventos = {};
        const tarefas = DB.get('tarefas', []);
        const viagens = DB.get('viagens', []);

        tarefas.forEach(t => {
            if (!t.prazo) return;
            const d = new Date(t.prazo);
            if (d.getFullYear() === ano && d.getMonth() === mes) {
                const dataStr = t.prazo;
                if (!eventos[dataStr]) eventos[dataStr] = [];
                eventos[dataStr].push({
                    tipo: 'tarefa',
                    titulo: t.titulo,
                    prioridade: t.prioridade,
                    status: t.status,
                    id: t.id
                });
            }
        });

        viagens.forEach(v => {
            if (v.dataIda) {
                const d = new Date(v.dataIda);
                if (d.getFullYear() === ano && d.getMonth() === mes) {
                    if (!eventos[v.dataIda]) eventos[v.dataIda] = [];
                    eventos[v.dataIda].push({
                        tipo: 'viagem',
                        titulo: '✈️ ' + (v.destino || 'Viagem'),
                        cliente: DB.getClienteNome(v.clienteId)
                    });
                }
            }
        });

        return eventos;
    },

    selecionarDia(dataStr) {
        this.diaSelecionado = dataStr;
        this.render();
    },

    renderDiaSelecionado() {
        const titulo = document.getElementById('cal-dia-titulo');
        const lista = document.getElementById('cal-dia-lista');
        if (!titulo || !lista) return;

        if (!this.diaSelecionado) {
            titulo.textContent = 'Clique em um dia para ver os eventos';
            lista.innerHTML = '';
            return;
        }

        const d = new Date(this.diaSelecionado + 'T00:00:00');
        titulo.textContent = 'Eventos em ' + d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

        const tarefas = DB.get('tarefas', []).filter(t => t.prazo === this.diaSelecionado);
        const viagens = DB.get('viagens', []).filter(v => v.dataIda === this.diaSelecionado || v.dataVolta === this.diaSelecionado);

        let html = '';

        if (!tarefas.length && !viagens.length) {
            html = '<p class="dashboard-empty">Nenhum evento neste dia.</p>';
        } else {
            tarefas.forEach(t => {
                html += `
                    <div class="list-item">
                        <div class="list-item-info">
                            <h4>✅ ${AppModule.escapeHtml(t.titulo)}</h4>
                            <small>${t.prioridade || 'média'} · ${t.status || 'pendente'}${t.descricao ? ' · ' + AppModule.escapeHtml(t.descricao) : ''}</small>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="TarefasModule.editar('${t.id}'); AppModule.openPage('tarefas');">Abrir</button>
                    </div>
                `;
            });

            viagens.forEach(v => {
                const tipo = v.dataIda === this.diaSelecionado ? '🛫 Ida' : '🛬 Volta';
                html += `
                    <div class="list-item">
                        <div class="list-item-info">
                            <h4>${tipo} → ${AppModule.escapeHtml(v.destino)}</h4>
                            <small>${AppModule.escapeHtml(DB.getClienteNome(v.clienteId))} ${v.companhia ? '· ' + AppModule.escapeHtml(v.companhia) : ''}</small>
                        </div>
                    </div>
                `;
            });
        }

        html += `<button class="btn btn-primary" style="margin-top:12px;" onclick="TarefasModule.novaTarefaComData('${this.diaSelecionado}')">+ Adicionar Tarefa neste dia</button>`;
        lista.innerHTML = html;
    },

    navegar(delta) {
        this.dataAtual.setMonth(this.dataAtual.getMonth() + delta);
        this.render();
    },

    hoje() {
        this.dataAtual = new Date();
        this.diaSelecionado = null;
        this.render();
    },

    mesNome(m) {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return meses[m];
    }
};

TarefasModule.novaTarefaComData = function(data) {
    this.abrirFormulario();
    setTimeout(() => {
        const input = document.getElementById('tar-prazo');
        if (input) input.value = data;
    }, 50);
};
