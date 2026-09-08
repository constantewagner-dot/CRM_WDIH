/* ============================================================
   db.js — Camada de dados do CRM WDIH (localStorage)
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

    // -------- Clientes --------
    getClientes() { return this._get('clientes'); },
    
    getClientesOrdenados() {
        const lista = this._get('clientes');
        return lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    },
    
    setClientes(v) { this._set('clientes', v); },

    // -------- Negócios --------
    getNegocios() { return this._get('negocios'); },
    setNegocios(v) { this._set('negocios', v); },

    // -------- Vendas --------
    getVendas() { return this._get('vendas'); },
    setVendas(v) { this._set('vendas', v); },

    // -------- Viagens --------
    getViagens() { return this._get('viagens'); },
    setViagens(v) { this._set('viagens', v); },

    // -------- Transações Financeiras --------
    getTransacoes() { return this._get('transacoes'); },
    setTransacoes(v) { this._set('transacoes', v); },

    // -------- Configurações --------
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

    // -------- Milhas --------
    getMilhas() { return this._get('milhas'); },
    setMilhas(v) { this._set('milhas', v); },

    // -------- Atividades --------
    getAtividades() { return this._get('atividades'); },
    setAtividades(v) { this._set('atividades', v); },

    addAtividade(tipo, descricao) {
        const atv = this._get('atividades');
        atv.unshift({
            id: Date.now(),
            tipo: tipo || 'sistema',
            descricao: descricao || '',
            data: new Date().toISOString()
        });
        if (atv.length > 200) atv.length = 200;
        this._set('atividades', atv);
    },

    init() {
        Object.keys(this._defaults).forEach(campo => {
            if (localStorage.getItem(this.KEYS[campo]) === null) {
                this._set(campo, this._defaults[campo]);
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => DB.init());
