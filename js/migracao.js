const MigracaoModule = {
    detectarFormato(json) {
        if (!json || typeof json !== 'object') return 'desconhecido';
        if (json.config && (json.config.pipeline || json.config.agencia || json.config.servicos)) return 'novo';
        if (json.agencia || Array.isArray(json.pipelineStages) || Array.isArray(json.clientes) || Array.isArray(json.negocios)) return 'legacy';
        return 'desconhecido';
    },

    migrar(legacy) {
        const config = DB.get('config', {});
        const clientes = [];
        const negocios = [];
        const vendas = [];
        const viagens = [];
        const transacoes = [];
        const milhas = DB.get('milhas', {});
        const atividades = [];

        // 1. Agência
        if (legacy.agencia) {
            config.agencia = {
                nome: legacy.agencia.nome || '',
                cnpj: legacy.agencia.cnpj || '',
                telefone: legacy.agencia.telefone || '',
                email: legacy.agencia.email || '',
                comissao: parseFloat(legacy.agencia.comissao) || 10
            };
        }

        // 2. Listas de configuração
        if (Array.isArray(legacy.pipelineStages)) config.pipeline = legacy.pipelineStages;
        if (Array.isArray(legacy.servicos)) config.servicos = legacy.servicos;
        if (Array.isArray(legacy.companhias)) config.companhias = legacy.companhias;
        if (Array.isArray(legacy.programas)) config.programas = legacy.programas;
        if (Array.isArray(legacy.cartoes)) config.cartoes = legacy.cartoes;
        if (!config.receitas) config.receitas = ['Venda de Passagem', 'Pacote Turístico', 'Comissão', 'Serviço'];
        if (!config.despesas) config.despesas = ['Fornecedor', 'Taxa', 'Marketing', 'Operacional', 'Imposto'];

        // 3. Clientes
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

        // Mapa clienteId -> nome
        const clienteNome = {};
        clientes.forEach(c => { clienteNome[c.id] = c.nome; });

        // 4. Negócios
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

        // 5. Vendas
        (legacy.vendas || []).forEach(v => {
            const valorOriginal = parseFloat(v.valorOriginal) || 0;
            const valorVenda = parseFloat(v.valorVenda) || 0;
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
                descricao: v.descricao || '',
                data: v.criadoEm || new Date().toISOString()
            });
        });

        // 6. Viagens
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
                valor: parseFloat(v.valor) || 0,
                status: v.status || 'Pendente',
                checkin_feito: !!v.checkinFeito,
                checkin_data: v.checkinData || '',
                numero_voo: v.numeroVoo || '',
                categoria_assento: v.categoriaAssento || '',
                concluida: !!v.concluida,
                observacoes: v.notas || '',
                data_criacao: v.criadoEm || new Date().toISOString()
            });
        });

        // 7. Transações
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

        // 8. Atividades
        (legacy.atividades || []).forEach(a => {
            atividades.push({
                id: a.id || AppModule.generateId(),
                tipo: a.tipo || '',
                descricao: a.descricao || '',
                data: a.data || new Date().toISOString()
            });
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

        return {
            clientes: clientes.length,
            negocios: negocios.length,
            vendas: vendas.length,
            viagens: viagens.length,
            transacoes: transacoes.length,
            atividades: atividades.length
        };
    }
};
