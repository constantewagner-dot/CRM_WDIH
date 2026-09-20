const ConfigModule = {
    render() {
        const config = DB.get('config', {});
        const agencia = config.agencia || {};

        document.getElementById('cfg-agencia-nome').value = agencia.nome || '';
        document.getElementById('cfg-agencia-cnpj').value = agencia.cnpj || '';
        document.getElementById('cfg-agencia-telefone').value = agencia.telefone || '';
        document.getElementById('cfg-agencia-email').value = agencia.email || '';
        document.getElementById('cfg-agencia-comissao').value = agencia.comissao || '';

        this.renderLista('cfg-pipeline-list', config.pipeline || [], 'etapa');
        this.renderLista('cfg-servicos-list', config.servicos || [], 'servico');
        this.renderLista('cfg-companhias-list', config.companhias || [], 'companhia');
        this.renderLista('cfg-programas-list', config.programas || [], 'programa');
        this.renderLista('cfg-cartoes-list', config.cartoes || [], 'cartao');
        this.renderLista('cfg-receitas-list', config.receitas || [], 'receita');
        this.renderLista('cfg-despesas-list', config.despesas || [], 'despesa');
    },

    renderLista(elementId, lista, tipo) {
        const container = document.getElementById(elementId);
        container.innerHTML = lista.map((item, idx) => `
            <div class="list-item">
                <span>${AppModule.escapeHtml(item)}</span>
                <button class="btn btn-sm btn-danger" onclick="ConfigModule.remover('${tipo}', ${idx})">Remover</button>
            </div>
        `).join('');
    },

    salvarAgencia() {
        const config = DB.get('config', {});
        config.agencia = {
            nome: document.getElementById('cfg-agencia-nome').value.trim(),
            cnpj: document.getElementById('cfg-agencia-cnpj').value.trim(),
            telefone: document.getElementById('cfg-agencia-telefone').value.trim(),
            email: document.getElementById('cfg-agencia-email').value.trim(),
            comissao: parseFloat(document.getElementById('cfg-agencia-comissao').value) || 0
        };
        DB.set('config', config);
        AppModule.toast('Dados da agência salvos.');
    },

    adicionarItem(campo, tipo) {
        const inputId = 'cfg-novo-' + tipo;
        const input = document.getElementById(inputId);
        const valor = input.value.trim();
        if (!valor) return;

        const config = DB.get('config', {});
        if (!config[campo]) config[campo] = [];
        config[campo].push(valor);
        DB.set('config', config);

        input.value = '';
        this.render();
        AppModule.toast('Item adicionado.');
    },

    adicionarEtapa() { this.adicionarItem('pipeline', 'etapa'); },
    adicionarServico() { this.adicionarItem('servicos', 'servico'); },
    adicionarCompanhia() { this.adicionarItem('companhias', 'companhia'); },
    adicionarPrograma() { this.adicionarItem('programas', 'programa'); },
    adicionarCartao() { this.adicionarItem('cartoes', 'cartao'); },
    adicionarReceita() { this.adicionarItem('receitas', 'receita'); },
    adicionarDespesa() { this.adicionarItem('despesas', 'despesa'); },

    remover(tipo, idx) {
        const mapa = {
            etapa: 'pipeline',
            servico: 'servicos',
            companhia: 'companhias',
            programa: 'programas',
            cartao: 'cartoes',
            receita: 'receitas',
            despesa: 'despesas'
        };
        const campo = mapa[tipo];
        const config = DB.get('config', {});
        if (config[campo]) {
            config[campo].splice(idx, 1);
            DB.set('config', config);
        }
        this.render();
        AppModule.toast('Item removido.');
    }
};
