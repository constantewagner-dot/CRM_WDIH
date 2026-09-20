var MigracaoModule = {
    detectarFormato(json) {
        if (!json || typeof json !== 'object') return 'desconhecido';
        if (json.config && (json.config.pipeline || json.config.agencia)) return 'novo';
        if (Array.isArray(json.clientes) || Array.isArray(json.negocios) || Array.isArray(json.pipelineStages)) return 'legacy';
        return 'desconhecido';
    },

    migrar(json) {
        const log = { clientes: 0, negocios: 0, vendas: 0, viagens: 0, transacoes: 0, atividades: 0, avisos: [] };

        const legacy = { ...json };
        if (json.config && typeof json.config === 'object') {
            legacy.agencia = legacy.agencia || json.config.agencia;
            legacy.pipelineStages = legacy.pipelineStages || json.config.pipeline;
            legacy.servicos = legacy.servicos || json.config.servicos;
            legacy.companhias = legacy.companhias || json.config.companhias;
            legacy.programas = legacy.programas || json.config.programas;
            legacy.cartoes = legacy.cartoes || json.config.cartoes;
            legacy.receitas = legacy.receitas || json.config.receitas;
            legacy.despesas = legacy.despesas || json.config.despesas;
        }

        const config = DB.get('config', {});
        if (legacy.agencia) {
            config.agencia = {
                nome: legacy.agencia.nome || '',
                cnpj: legacy.agencia.cnpj || '',
                telefone: legacy.agencia.telefone || '',
                email: legacy.agencia.email || '',
                comissao: parseFloat(legacy.agencia.comissao) || 10
            };
        }
        if (Array.isArray(legacy.pipelineStages) && legacy.pipelineStages.length) config.pipeline = legacy.pipelineStages;
        if (Array.isArray(legacy.servicos) && legacy.servicos.length) config.servicos = legacy.servicos;
        if (Array.isArray(legacy.companhias) && legacy.companhias.length) config.companhias = legacy.companhias;
        if (Array.isArray(legacy.programas) && legacy.programas.length) config.programas = legacy.programas;
        if (Array.isArray(legacy.cartoes) && legacy.cartoes.length) config.cartoes = legacy.cartoes;
        if (Array.isArray(legacy.receitas) && legacy.receitas.length) config.receitas = legacy.receitas;
        if (Array.isArray(legacy.despesas) && legacy.despesas.length) config.despesas = legacy.despesas;
        if (!config.receitas || !config.receitas.length) config.receitas = ['Venda', 'Comissão', 'Serviço', 'Outro'];
        if (!config.despesas || !config.despesas.length) config.despesas = ['Fornecedor', 'Marketing', 'Operacional', 'Tributos', 'Outro'];

        const clientes = Array.isArray(legacy.clientes) ? legacy.clientes : [];
        const negocios = Array.isArray(legacy.negocios) ? legacy.negocios : [];
        const vendas = Array.isArray(legacy.vendas) ? legacy.vendas : [];
        const viagens = Array.isArray(legacy.viagens) ? legacy.viagens : [];
        const transacoes = Array.isArray(legacy.transacoes) ? legacy.transacoes : [];
        const atividades = Array.isArray(legacy.atividades) ? legacy.atividades : [];
        const tarefas = Array.isArray(legacy.tarefas) ? legacy.tarefas : DB.get('tarefas', []);
        const milhas = DB.get('milhas', { clubes: [], investimentos: [], vendas: [], orcamentos: [], cartoes: [], bilhetes: [] });
        if (legacy.milhas && typeof legacy.milhas === 'object') Object.assign(milhas, legacy.milhas);

        log.clientes = clientes.length;
        log.negocios = negocios.length;
        log.vendas = vendas.length;
        log.viagens = viagens.length;
        log.transacoes = transacoes.length;
        log.atividades = atividades.length;

        DB.set('config', config);
        DB.set('clientes', clientes);
        DB.set('negocios', negocios);
        DB.set('vendas', vendas);
        DB.set('viagens', viagens);
        DB.set('transacoes', transacoes);
        DB.set('milhas', milhas);
        DB.set('tarefas', tarefas);
        DB.set('atividades', atividades);
        DB.set('inicializado', true);

        return log;
    }
};
