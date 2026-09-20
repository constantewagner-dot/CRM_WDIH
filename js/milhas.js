const MilhasModule = {
    abaAtiva: 'visao',

    render() {
        this.abrirTab(this.abaAtiva);
    },

    abrirTab(tab) {
        this.abaAtiva = tab;

        document.querySelectorAll('.milhas-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.milhas-panel').forEach(p => p.classList.remove('active'));

        const tabBtn = document.querySelector(`.milhas-tab[data-tab="${tab}"]`);
        const panel = document.getElementById('milhas-panel-' + tab);
        if (tabBtn) tabBtn.classList.add('active');
        if (panel) {
            panel.classList.add('active');
            this['render' + this.capitalizar(tab)](panel);
        }
    },

    capitalizar(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    renderVisao(panel) {
        const milhas = DB.get('milhas', {});
        const totalInvestido = (milhas.investimentos || []).reduce((s, i) => s + (parseFloat(i.valor) || 0), 0);
        const totalVendas = (milhas.vendas || []).reduce((s, v) => s + (parseFloat(v.valor) || 0), 0);

        panel.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card"><label>Total Investido</label><span>${AppModule.formatCurrency(totalInvestido)}</span></div>
                <div class="kpi-card"><label>Total em Vendas</label><span>${AppModule.formatCurrency(totalVendas)}</span></div>
                <div class="kpi-card"><label>Clubes</label><span>${(milhas.clubes || []).length}</span></div>
                <div class="kpi-card"><label>Cartões</label><span>${(milhas.cartoes || []).length}</span></div>
            </div>
            <p class="dashboard-empty">Visão geral consolidada do módulo de milhas.</p>
        `;
    },

    renderClubes(panel) {
        this.renderListaSimples(panel, 'clubes', 'Clube', ['nome', 'programa', 'custo']);
    },

    renderInvestimentos(panel) {
        this.renderListaSimples(panel, 'investimentos', 'Investimento', ['data', 'programa', 'valor', 'milhas']);
    },

    renderVendas(panel) {
        this.renderListaSimples(panel, 'vendas', 'Venda', ['data', 'programa', 'valor', 'milhas']);
    },

    renderOrcamento(panel) {
        this.renderListaSimples(panel, 'orcamentos', 'Orçamento', ['data', 'origem', 'destino', 'valor']);
    },

    renderCartoes(panel) {
        this.renderListaSimples(panel, 'cartoes', 'Cartão', ['nome', 'banco', 'anuidade']);
    },

    renderBilhetes(panel) {
        this.renderListaSimples(panel, 'bilhetes', 'Bilhete', ['data', 'passageiro', 'trecho', 'milhas']);
    },

    renderListaSimples(panel, chave, titulo, campos) {
        const milhas = DB.get('milhas', {});
        const lista = milhas[chave] || [];

        if (!lista.length) {
            panel.innerHTML = `<p class="dashboard-empty">Nenhum ${titulo.toLowerCase()} cadastrado.</p>
                <button class="btn btn-primary" onclick="MilhasModule.novo('${chave}', '${titulo}')">+ Novo ${titulo}</button>`;
            return;
        }

        panel.innerHTML = `
            <button class="btn btn-primary" style="margin-bottom:12px;" onclick="MilhasModule.novo('${chave}', '${titulo}')">+ Novo ${titulo}</button>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr>${campos.map(c => `<th>${AppModule.escapeHtml(c)}</th>`).join('')}<th>Ações</th></tr></thead>
                    <tbody>
                        ${lista.map(item => `
                            <tr>
                                ${campos.map(c => `<td>${AppModule.escapeHtml(item[c] || '')}</td>`).join('')}
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="MilhasModule.editar('${chave}', '${item.id}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="MilhasModule.excluir('${chave}', '${item.id}')">Excluir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    novo(chave, titulo) {
        this.abrirFormulario(chave, titulo);
    },

    editar(chave, id) {
        const milhas = DB.get('milhas', {});
        const item = (milhas[chave] || []).find(x => x.id === id);
        if (item) this.abrirFormulario(chave, this.capitalizar(chave), item);
    },

    abrirFormulario(chave, titulo, item = null) {
        const isEdit = !!item;
        const campos = {
            clubes: [
                { id: 'nome', label: 'Nome', type: 'text' },
                { id: 'programa', label: 'Programa', type: 'text' },
                { id: 'custo', label: 'Custo', type: 'number' }
            ],
            investimentos: [
                { id: 'data', label: 'Data', type: 'date' },
                { id: 'programa', label: 'Programa', type: 'text' },
                { id: 'valor', label: 'Valor', type: 'number' },
                { id: 'milhas', label: 'Milhas', type: 'number' }
            ],
            vendas: [
                { id: 'data', label: 'Data', type: 'date' },
                { id: 'programa', label: 'Programa', type: 'text' },
                { id: 'valor', label: 'Valor', type: 'number' },
                { id: 'milhas', label: 'Milhas', type: 'number' }
            ],
            orcamentos: [
                { id: 'data', label: 'Data', type: 'date' },
                { id: 'origem', label: 'Origem', type: 'text' },
                { id: 'destino', label: 'Destino', type: 'text' },
                { id: 'valor', label: 'Valor', type: 'number' }
            ],
            cartoes: [
                { id: 'nome', label: 'Nome', type: 'text' },
                { id: 'banco', label: 'Banco', type: 'text' },
                { id: 'anuidade', label: 'Anuidade', type: 'number' }
            ],
            bilhetes: [
                { id: 'data', label: 'Data', type: 'date' },
                { id: 'passageiro', label: 'Passageiro', type: 'text' },
                { id: 'trecho', label: 'Trecho', type: 'text' },
                { id: 'milhas', label: 'Milhas', type: 'number' }
            ]
        };

        const html = (campos[chave] || []).map(c => `
            <div class="form-group">
                <label>${AppModule.escapeHtml(c.label)}</label>
                <input type="${c.type}" id="mil-${c.id}" class="form-control" value="${AppModule.escapeHtml(item?.[c.id] || '')}">
            </div>
        `).join('');

        const footer = `
            <button class="btn btn-secondary" onclick="AppModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MilhasModule.salvar('${chave}', '${item?.id || ''}')">Salvar</button>
        `;

        AppModule.openModal(isEdit ? 'Editar ' + titulo : 'Novo ' + titulo, html, footer);
    },

    salvar(chave, id) {
        const milhas = DB.get('milhas', {});
        const lista = milhas[chave] || [];
        const index = lista.findIndex(x => x.id === id);

        const inputs = document.querySelectorAll('#modal-body input');
        const dados = { id: id || AppModule.generateId() };
        inputs.forEach(input => {
            dados[input.id.replace('mil-', '')] = input.type === 'number' ? (parseFloat(input.value) || 0) : input.value;
        });

        if (index >= 0) {
            lista[index] = { ...lista[index], ...dados };
        } else {
            lista.push(dados);
        }

        milhas[chave] = lista;
        DB.set('milhas', milhas);
        AppModule.closeModal();
        AppModule.toast('Registro salvo com sucesso!');
        this.render();
    },

    excluir(chave, id) {
        if (!confirm('Deseja excluir este registro?')) return;
        const milhas = DB.get('milhas', {});
        milhas[chave] = (milhas[chave] || []).filter(x => x.id !== id);
        DB.set('milhas', milhas);
        AppModule.toast('Registro excluído.');
        this.render();
    }
};
