const DB = {
    prefix: 'crm_wdih_',

    get(key, defaultValue) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Erro ao ler do localStorage:', e);
            return defaultValue;
        }
    },

    set(key, val) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(val));
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
        }
    },

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    },

    getClienteNome(clienteId) {
        const clientes = this.get('clientes', []);
        const cliente = clientes.find(c => c.id === clienteId);
        return cliente ? cliente.nome : '—';
    },

    init() {
        if (!this.get('inicializado', false)) {
            this.set('config', {
                agencia: {
                    nome: '',
                    cnpj: '',
                    telefone: '',
                    email: '',
                    comissao: 10
                },
                pipeline: [
                    'Novo Lead',
                    'Qualificado',
                    'Proposta Enviada',
                    'Negociação',
                    'Fechado (Ganho)',
                    'Perdido'
                ],
                servicos: [
                    'Passagem Aérea',
                    'Hotel',
                    'Pacote',
                    'Seguro Viagem',
                    'Carro',
                    'Cruzeiro',
                    'Outro'
                ],
                companhias: [],
                programas: [],
                cartoes: [],
                receitas: ['Venda', 'Comissão', 'Serviço', 'Outro'],
                despesas: ['Fornecedor', 'Marketing', 'Operacional', 'Tributos', 'Outro']
            });

            this.set('clientes', []);
            this.set('negocios', []);
            this.set('vendas', []);
            this.set('viagens', []);
            this.set('transacoes', []);
            this.set('milhas', {
                clubes: [],
                investimentos: [],
                vendas: [],
                orcamentos: [],
                cartoes: [],
                bilhetes: []
            });
            this.set('atividades', []);
            this.set('inicializado', true);
        }
    }
};

DB.init();
