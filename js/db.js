/* ============================================================
   db.js — Camada de dados do CRM WDIH (localStorage)
   Versão completa: getters, setters, CRUD e utilitários
   ============================================================ */

const DB = {

    KEYS: {
        agencia: 'wdih_agencia',
        clientes: 'wdih_clientes',
        negocios: 'wdih_negocios',
        vendas: 'wdih_vendas',
        viagens: 'wdih_viagens',
        transacoes: 'wdih_transacoes',
        servicos: 'wdih_servicos',
        pipelineStages: 'wdih_pipelineStages',
        companhias: 'wdih_companhias',
        programas: 'wdih_programas',
        cartoes: 'wdih_cartoes',
        atividades: 'wdih_atividades',
        milhas: 'wdih_milhas'
    },

    _defaults: {
        agencia: {},
        clientes: [],
        negocios: [],
        vendas: [],
        viagens: [],
        transacoes: [],
        servicos: [],
        pipelineStages: ['Prospecção', 'Qualificação', 'Proposta', 'Fechamento'],
        companhias: [],
        programas: ['Smiles', 'LATAM', 'TudoAzul', 'Livelo'],
        cartoes: [],
        atividades: [],
        milhas: []
    },

    /* ============================================================
       LEITURA / ESCRITA GENÉRICA
       ============================================================ */
    _get(campo) {
        try {
            const raw = localStorage.getItem(this.KEYS[campo]);
            if (raw !== null && raw !== undefined) return JSON.parse(raw);
        } catch (e) { }
        const padrao = this._defaults[campo] ?? [];
        return Array.isArray(padrao) ? [...padrao] : JSON.parse(JSON.stringify(padrao));
    },

    _set(campo, valor) {
        localStorage.setItem(this.KEYS[campo], JSON.stringify(valor));
    },

    /* ============================================================
       UTILITÁRIOS
       ============================================================ */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    },

    formatCurrency(valor) {
        const v = parseFloat(valor) || 0;
        return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatDate(data) {
        if (!data) return '';
        const d = new Date(data);
        if (isNaN(d.getTime())) return data;
        return d.toLocaleDateString('pt-BR');
    },

    formatDateTime(data) {
        if (!data) return '';
        const d = new Date(data);
        if (isNaN(d.getTime())) return data;
        return d.toLocaleString('pt-BR');
    },

    /* ============================================================
       CLIENTES
       ============================================================ */
    getClientes() { return this._get('clientes'); },

    getClientesOrdenados() {
        const lista = this._get('clientes');
        return [...lista].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    },

    getClienteById(id) {
        return this.getClientes().find(c => c.id === id);
    },

    getClienteNome(id) {
        const c = this.getClienteById(id);
        return c ? c.nome : 'Cliente não encontrado';
    },

    clienteOptions(selecionadoId) {
        return this.getClientesOrdenados().map(c =>
            `<option value="${c.id}" ${c.id === selecionadoId ? 'selected' : ''}>${c.nome}</option>`
        ).join('');
    },

    setClientes(v) { this._set('clientes', v); },

    saveCliente(cliente) {
        const lista = this.getClientes();
        const idx = lista.findIndex(c => c.id === cliente.id);
        if (idx >= 0) {
            lista[idx] = cliente;
        } else {
            if (!cliente.id) cliente.id = this.generateId();
            lista.push(cliente);
        }
        this.setClientes(lista);
        this.addAtividade('cliente', `Cliente ${cliente.nome} salvo`);
        return cliente;
    },
    salvarCliente(c) { return this.saveCliente(c); },

    deleteCliente(id) {
        this.setClientes(this.getClientes().filter(c => c.id !== id));
        this.addAtividade('cliente', 'Cliente excluído');
    },
    removerCliente(id) { this.deleteCliente(id); },

    /* ============================================================
       NEGÓCIOS (PIPELINE)
       ============================================================ */
    getNegocios() { return this._get('negocios'); },

    getNegocioById(id) {
        return this.getNegocios().find(n => n.id === id);
    },

    setNegocios(v) { this._set('negocios', v); },

    saveNegocio(negocio) {
        const lista = this.getNegocios();
        const idx = lista.findIndex(n => n.id === negocio.id);
        if (idx >= 0) {
            lista[idx] = negocio;
        } else {
            if (!negocio.id) negocio.id = this.generateId();
            if (!negocio.criadoEm) negocio.criadoEm = new Date().toISOString();
            lista.push(negocio);
        }
        this.setNegocios(lista);
        this.addAtividade('pipeline', `Negócio ${negocio.titulo} salvo`);
        return negocio;
    },
    salvarNegocio(n) { return this.saveNegocio(n); },

    deleteNegocio(id) {
        this.setNegocios(this.getNegocios().filter(n => n.id !== id));
        this.addAtividade('pipeline', 'Negócio excluído');
    },
    removerNegocio(id) { this.deleteNegocio(id); },

    moverNegocio(id, novaEtapa) {
        const n = this.getNegocioById(id);
        if (n) {
            n.etapa = novaEtapa;
            if (novaEtapa === 'Fechamento' || novaEtapa === 'Fechado') {
                n.dataFechamento = new Date().toISOString();
            }
            return this.saveNegocio(n);
        }
        return n;
    },

    /* ============================================================
       VENDAS
       ============================================================ */
    getVendas() { return this._get('vendas'); },

    getVendaById(id) {
        return this.getVendas().find(v => v.id === id);
    },

    setVendas(v) { this._set('vendas', v); },

    saveVenda(venda) {
        const lista = this.getVendas();
        const idx = lista.findIndex(v => v.id === venda.id);
        if (idx >= 0) {
            lista[idx] = venda;
        } else {
            if (!venda.id) venda.id = this.generateId();
            if (!venda.data) venda.data = new Date().toISOString();
            lista.push(venda);
        }
        this.setVendas(lista);
        this.addAtividade('venda', `Venda ${venda.descricao || venda.id} salva`);
        return venda;
    },
    salvarVenda(v) { return this.saveVenda(v); },

    deleteVenda(id) {
        this.setVendas(this.getVendas().filter(v => v.id !== id));
        this.addAtividade('venda', 'Venda excluída');
    },
    removerVenda(id) { this.deleteVenda(id); },

    /* ============================================================
       VIAGENS
       ============================================================ */
    getViagens() { return this._get('viagens'); },

    getViagemById(id) {
        return this.getViagens().find(v => v.id === id);
    },

    setViagens(v) { this._set('viagens', v); },

    saveViagem(viagem) {
        const lista = this.getViagens();
        const idx = lista.findIndex(v => v.id === viagem.id);
        if (idx >= 0) {
            lista[idx] = viagem;
        } else {
            if (!viagem.id) viagem.id = this.generateId();
            lista.push(viagem);
        }
        this.setViagens(lista);
        this.addAtividade('viagem', `Viagem ${viagem.destino || viagem.id} salva`);
        return viagem;
    },
    salvarViagem(v) { return this.saveViagem(v); },

    deleteViagem(id) {
        this.setViagens(this.getViagens().filter(v => v.id !== id));
        this.addAtividade('viagem', 'Viagem excluída');
    },
    removerViagem(id) { this.deleteViagem(id); },

    /* ============================================================
       TRANSAÇÕES FINANCEIRAS
       ============================================================ */
    getTransacoes() { return this._get('transacoes'); },

    getTransacaoById(id) {
        return this.getTransacoes().find(t => t.id === id);
    },

    setTransacoes(v) { this._set('transacoes', v); },

    saveTransacao(transacao) {
        const lista = this.getTransacoes();
        const idx = lista.findIndex(t => t.id === transacao.id);
        if (idx >= 0) {
            lista[idx] = transacao;
        } else {
            if (!transacao.id) transacao.id = this.generateId();
            lista.push(transacao);
        }
        this.setTransacoes(lista);
        this.addAtividade('financeiro', `Transação ${transacao.descricao || transacao.id} salva`);
        return transacao;
    },
    salvarTransacao(t) { return this.saveTransacao(t); },

    deleteTransacao(id) {
        this.setTransacoes(this.getTransacoes().filter(t => t.id !== id));
        this.addAtividade('financeiro', 'Transação excluída');
    },
    removerTransacao(id) { this.deleteTransacao(id); },

    /* ============================================================
       CONFIGURAÇÕES
       ============================================================ */
    getAgencia() { return this._get('agencia'); },
    setAgencia(v) { this._set('agencia', v); },

    getServicos() { return this._get('servicos'); },
    setServicos(v) { this._set('servicos', v); },

    getPipelineStages() { return this._get('pipelineStages'); },
    setPipelineStages(v) { this._set('pipelineStages', v); },

    getCompanhias() { return this._get('companhias'); },
    setCompanhias(v) { this._set('companhias', v); },

    getProgramas() { return this._get('programas'); },
    setProgramas(v) { this._set('programas', v); },

    getCartoes() { return this._get('cartoes'); },
    setCartoes(v) { this._set('cartoes', v); },

    /* ============================================================
       MILHAS
       ============================================================ */
    getMilhas() { return this._get('milhas'); },

    getMilhaById(id) {
        return this.getMilhas().find(m => m.id === id);
    },

    setMilhas(v) { this._set('milhas', v); },

    saveMilha(milha) {
        const lista = this.getMilhas();
        const idx = lista.findIndex(m => m.id === milha.id);
        if (idx >= 0) {
            lista[idx] = milha;
        } else {
            if (!milha.id) milha.id = this.generateId();
            lista.push(milha);
        }
        this.setMilhas(lista);
        this.addAtividade('milhas', 'Registro de milhas salvo');
        return milha;
    },
    salvarMilha(m) { return this.saveMilha(m); },

    deleteMilha(id) {
        this.setMilhas(this.getMilhas().filter(m => m.id !== id));
        this.addAtividade('milhas', 'Registro de milhas excluído');
    },
    removerMilha(id) { this.deleteMilha(id); },

    /* ============================================================
       ATIVIDADES
       ============================================================ */
    getAtividades() { return this._get('atividades'); },
    setAtividades(v) { this._set('atividades', v); },

    addAtividade(tipo, descricao) {
        const atv = this._get('atividades');
        atv.unshift({
            id: this.generateId(),
            tipo: tipo || 'sistema',
            descricao: descricao || '',
            data: new Date().toISOString()
        });
        if (atv.length > 200) atv.length = 200;
        this._set('atividades', atv);
    },

    /* ============================================================
       IMPORTAÇÃO / EXPORTAÇÃO EM MASSA
       ============================================================ */
    importarDados(dados) {
        Object.keys(this.KEYS).forEach(campo => {
            if (dados[campo] !== undefined) {
                this._set(campo, dados[campo]);
            }
        });
    },

    exportarDados() {
        const dados = {};
        Object.keys(this.KEYS).forEach(campo => {
            dados[campo] = this._get(campo);
        });
        return dados;
    },

    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */
    init() {
        Object.keys(this._defaults).forEach(campo => {
            if (localStorage.getItem(this.KEYS[campo]) === null) {
                this._set(campo, this._defaults[campo]);
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => DB.init());
