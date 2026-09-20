var DB = {
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
                companhias: [
                    { nome: 'LATAM', cpm: 2.50 },
                    { nome: 'GOL', cpm: 2.20 },
                    { nome: 'Azul', cpm: 2.30 },
                    { nome: 'Avianca', cpm: 2.80 },
                    { nome: 'TAP', cpm: 3.00 }
                ],
                programas: [
                    'Smiles',
                    'LATAM Pass',
                    'TudoAzul',
                    'Livelo'
                ],
                cartoes: [
                    'Itaú',
                    'Bradesco',
                    'Santander',
                    'Banco do Brasil',
                    'Caixa'
                ],
                receitas: ['Venda', 'Comissão', 'Serviço', 'Outro'],
                despesas: ['Fornecedor', 'Marketing', 'Operacional', 'Tributos', 'Outro']
            });

            this.set('clientes', []);
            this.set('negocios', []);
            this.set('vendas', []);
            this.set('viagens', []);
            this.set('transacoes', []);
            this.set('milhas', {
                programas: [],
                cartoes: [],
                emissoes: []
            });
            this.set('atividades', []);
            this.set('tarefas', []);
            this.set('inicializado', true);
        }
    }
};

DB.init();
