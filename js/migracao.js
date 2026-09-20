const MigracaoModule = {
    detectarFormato(json) {
        if (!json || typeof json !== 'object') return 'desconhecido';
        // Formato novo tem prefixo crm_wdih_ nas chaves OU tem config.pipeline
        if (json.config && (json.config.pipeline || json.config.agencia)) return 'novo';
        // Formato legado tem clientes/negocios/vendas no topo + pipelineStages
        if (Array.isArray(json.clientes) || Array.isArray(json.negocios) || Array.isArray(json.pipelineStages)) return 'legacy';
        return 'desconhecido';
    },

    migrar(legacy) {
        const log = {
            clientes: 0, negocios: 0, vendas: 0, viagens: 0,
            transacoes: 0, tarefas: 0, atividades: 0,
            avisos: []
        };

        // 1. Configuração
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

        if (Array.isArray(legacy.pipelineStages)) config.pipeline = legacy.pipelineStages;
        if (Array.isArray(legacy.servicos)) config.servicos = legacy.servicos;
        if (Array.isArray(legacy.companhias)) config.companhias = legacy.companhias;
        if (Array.isArray(legacy.programas)) config.programas = legacy.programas;
        if (Array.isArray(legacy.cartoes)) config.cartoes = legacy.cartoes;
        if (!config.receitas || !config.receitas.length) config.receitas = ['Venda', 'Comissão', 'Serviço', 'Outro'];
        if (!config.despesas || !config.despesas.length) config.despesas = ['Fornecedor', 'Marketing', 'Operacional', 'Tributos', 'Outro'];

        // 2. Clientes
        const clientes = [];
        (legacy.clientes || []).forEach(c => {
            clientes.push({
                id: c.id || AppModule.generateId(),
                nome: c.nome || '',
                email: c.email || '',
                telefone: c.telefone || '',
                nascimento: c.nascimento || c.dataNascimento || '',
                cpf: c.cpf || '',
                endereco: c.endereco || '',
                status: c.status || 'Ativo',
                observacoes: c.notas || c.observacoes || '',
                data_cadastro: c.criadoEm || new Date().toISOString()
            });
        });
        log.clientes = clientes.length;

        const clienteNome = {};
        clientes.forEach(c => { clienteNome[c.id] = c.nome; });

        // 3. Negócios
        const negocios = [];
        (legacy.negocios || []).forEach(n => {
            negocios.push({
                id: n.id || AppModule.generateId(),
                titulo: n.titulo || '',
                cliente_id: n.clienteId || '',
                cliente_nome: clienteNome[n.clienteId] || '',
                servico: n.servico || '',
                valor: parseFloat(n.valor) || 0,
                etapa: n.stage || n.etapa || '',
                probabilidade: parseFloat(n.probabilidade) || 0,
                origemLead: n.origemLead || '',
                campanha: n.campanha || '',
                descricao: n.descricao || '',
                data_fechamento: (n.fechadoEm || n.data_fechamento || '').slice(0, 10),
                vendaId: n.vendaId || '',
                data_criacao: n.criadoEm || new Date().toISOString(),
                atualizadoEm: n.atualizadoEm || ''
            });
        });
        log.negocios = negocios.length;

        // 4. Vendas (mapeamento completo dos campos)
        const vendas = [];
        (legacy.vendas || []).forEach(v => {
            const valorOriginal = parseFloat(v.valorOriginal) || 0;
            const valorVenda = parseFloat(v.valorVenda) || 0;

            // Determinar categoria de receita com base no tipo de venda
            let categoria = 'Venda';
            if (v.tipoVenda === 'milhas_terceiros') categoria = 'Comissão';
            else if (v.tipoVenda === 'dinheiro') categoria = 'Venda';

            vendas.push({
                id: v.id || AppModule.generateId(),
                negocioId: v.negocioId || '',
                cliente_id: v.clienteId || '',
                cliente_nome: clienteNome[v.clienteId] || '',
                titulo: v.titulo || '',
                servico: v.servico || '',
                valor_total: valorVenda,
                valor_original: valorOriginal,
                comissao: valorVenda - valorOriginal,
                tipo_venda: v.tipoVenda || '',
                nome_terceiro: v.nomeTerceiro || '',
                necessidade_checkin: v.necessidadeCheckin || '',
                checkin_realizado_em: v.checkinRealizadoEm || '',
                categoria_receita: categoria,
                descricao: v.descricao || '',
                data: v.criadoEm || new Date().toISOString()
            });
        });
        log.vendas = vendas.length;

        // 5. Viagens (mapeamento completo)
        const viagens = [];
        (legacy.viagens || []).forEach(v => {
            viagens.push({
                id: v.id || AppModule.generateId(),
                cliente_id: v.clienteId || '',
                cliente_nome: clienteNome[v.clienteId] || '',
                destino: v.destino || '',
                data_ida: v.dataIda || '',
                data_volta: v.dataVolta || '',
                servico: v.servico || '',
                companhia: v.companhia || '',
                numero_voo: v.numeroVoo || '',
                categoria_assento: v.categoriaAssento || '',
                valor: parseFloat(v.valor) || 0,
                status: v.status || 'Pendente',
                checkin_feito: !!v.checkinFeito,
                checkin_data: v.checkinData || '',
                concluida: !!v.concluida,
                observacoes: v.notas || '',
                data_criacao: v.criadoEm || new Date().toISOString()
            });
        });
        log.viagens = viagens.length;

        // 6. Transações
        const transacoes = [];
        (legacy.transacoes || []).forEach(t => {
            transacoes.push({
                id: t.id || AppModule.generateId(),
                tipo: t.tipo || '',
                descricao: t.descricao || '',
                categoria: t.categoria || '',
                valor: parseFloat(t.valor) || 0,
                data: t.data || new Date().toISOString()
            });
        });
        log.transacoes = transacoes.length;

        // 7. Atividades
        const atividades = [];
        (legacy.atividades || []).forEach(a => {
            atividades.push({
                id: a.id || AppModule.generateId(),
                tipo: a.tipo || '',
                descricao: a.descricao || '',
                data: a.data || new Date().toISOString()
            });
        });
        log.atividades = atividades.length;

        // 8. Milhas (preservar se já existir, senão inicializar)
        const milhas = DB.get('milhas', {
            clubes: [], investimentos: [], vendas: [],
            orcamentos: [], cartoes: [], bilhetes: []
        });

        // 9. Salvar tudo
        DB.set('config', config);
        DB.set('clientes', clientes);
        DB.set('negocios', negocios);
        DB.set('vendas', vendas);
        DB.set('viagens', viagens);
        DB.set('transacoes', transacoes);
        DB.set('milhas', milhas);
        DB.set('atividades', atividades);
        DB.set('inicializado', true);

        // Adicionar atividade de migração
        AppModule.addAtividade(`Backup legado importado: ${log.clientes} clientes, ${log.negocios} negócios, ${log.vendas} vendas, ${log.viagens} viagens`, 'backup');

        return log;
    }
};
