/* ============================================================
   db.js — Camada de Dados (localStorage)
   ============================================================ */

const DB_PREFIX = 'crm_wdih_';

const DB = {
    _key(k) { return DB_PREFIX + k; },
    _get(k) { return JSON.parse(localStorage.getItem(this._key(k)) || 'null'); },
    _set(k, v) { localStorage.setItem(this._key(k), JSON.stringify(v)); },

    gerarId(prefix) {
        return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    // ========== AGÊNCIA ==========
    getAgencia() { return this._get('agencia') || { nome: 'WDIH Milhas & Viagens', cnpj: '', telefone: '', email: '' }; },
    setAgencia(d) { this._set('agencia', d); },

    // ========== CLIENTES ==========
    getClientes() { return this._get('clientes') || []; },
    setClientes(d) { this._set('clientes', d); },

    // ========== NEGÓCIOS (Pipeline) ==========
    getNegocios() { return this._get('negocios') || []; },
    setNegocios(d) { this._set('negocios', d); },
    saveNegocio(negocio) {
        const negocios = this.getNegocios();
        const idx = negocios.findIndex(n => n.id === negocio.id);
        if (idx >= 0) { negocios[idx] = negocio; }
        else { negocios.push(negocio); }
        this._set('negocios', negocios);
        return negocio;
    },
    deleteNegocio(id) {
        this._set('negocios', this.getNegocios().filter(n => n.id !== id));
    },

    // ========== VENDAS ==========
    getVendas() { return this._get('vendas') || []; },
    saveVenda(venda) {
        const vendas = this.getVendas();
        const idx = vendas.findIndex(v => v.id === venda.id);
        venda.atualizadoEm = new Date().toISOString();
        if (idx >= 0) { vendas[idx] = venda; }
        else { venda.criadoEm = venda.criadoEm || new Date().toISOString(); vendas.push(venda); }
        this._set('vendas', vendas);
        this.logAtividade('venda', `Venda "${venda.titulo}" ${idx >= 0 ? 'atualizada' : 'criada'}`);
        return venda;
    },
    deleteVenda(id) {
        this._set('vendas', this.getVendas().filter(v => v.id !== id));
        this.logAtividade('venda', 'Venda removida');
    },
    getVendaById(id) { return this.getVendas().find(v => v.id === id); },

    // ========== VIAGENS ==========
    getViagens() { return this._get('viagens') || []; },
    setViagens(d) { this._set('viagens', d); },
    saveViagem(viagem) {
        const viagens = this.getViagens();
        const idx = viagens.findIndex(v => v.id === viagem.id);
        viagem.atualizadoEm = new Date().toISOString();
        if (idx >= 0) { viagens[idx] = viagem; }
        else { viagem.criadoEm = viagem.criadoEm || new Date().toISOString(); viagens.push(viagem); }
        this._set('viagens', viagens);
        return viagem;
    },
    deleteViagem(id) { this._set('viagens', this.getViagens().filter(v => v.id !== id)); },

    // ========== GESTÃO DE MILHAS ==========
    getMilhas() { return this._get('milhas') || []; },
    setMilhas(d) { this._set('milhas', d); },
    saveMilha(milha) {
        const milhas = this.getMilhas();
        const idx = milhas.findIndex(m => m.id === milha.id);
        milha.atualizadoEm = new Date().toISOString();
        if (idx >= 0) { milhas[idx] = milha; }
        else { milha.criadoEm = milha.criadoEm || new Date().toISOString(); milhas.push(milha); }
        this._set('milhas', milhas);
        return milha;
    },
    deleteMilha(id) { this._set('milhas', this.getMilhas().filter(m => m.id !== id)); },
    getPlanosMilhas() { return ['Gestão Mensal', 'Consultoria Premium', 'Plano de Indicação']; },

    // ========== TRANSAÇÕES ==========
    getTransacoes() { return this._get('transacoes') || []; },
    setTransacoes(d) { this._set('transacoes', d); },

    // ========== SERVIÇOS ==========
    getServicos() {
        return this._get('servicos') || [
            'Emissão de Passagens', 'Pacote de Viagem', 'Grupo WPP', 'Cruzeiro',
            'Hotel', 'Intercâmbio', 'Seguro Viagem', 'Aluguel de Carro',
            'Consultoria de Milhas', 'Hospedagem'
        ];
    },
    setServicos(d) { this._set('servicos', d); },

    // ========== PIPELINE STAGES ==========
    getPipelineStages() {
        return this._get('pipelineStages') || [
            'Negociações Futuras', 'Em Negociação', 'Proposta Enviada',
            'Acompanhamento', 'Fechado (Ganho)', 'Fechado (Perdido)'
        ];
    },
    setPipelineStages(d) { this._set('pipelineStages', d); },

    // ========== COMPANHIAS ==========
    getCompanhias() { return this._get('companhias') || ['LATAM', 'Gol', 'Azul', 'American Airlines', 'Delta', 'United', 'Emirates', 'Qatar Airways']; },
    setCompanhias(d) { this._set('companhias', d); },

    // ========== PROGRAMAS ==========
    getProgramas() { return this._get('programas') || ['LATAM Pass', 'Smiles', 'TudoAzul', 'Livelo', 'Esfera']; },
    setProgramas(d) { this._set('programas', d); },

    // ========== CARTÕES ==========
    getCartoes() { return this._get('cartoes') || []; },
    setCartoes(d) { this._set('cartoes', d); },

    // ========== ORIGENS DE LEAD ==========
    getOrigensLead() {
        return ['Instagram', 'Facebook', 'Google Ads', 'Indicação', 'WhatsApp', 'Email Marketing', 'Site', 'Feira/Evento', 'Parceria', 'Prospecção Ativa', 'Outros'];
    },

    // ========== ATIVIDADES ==========
    getAtividades() { return this._get('atividades') || []; },
    logAtividade(tipo, descricao) {
        const atividades = this.getAtividades();
        atividades.unshift({ tipo, descricao, data: new Date().toISOString() });
        if (atividades.length > 100) atividades.length = 100;
        this._set('atividades', atividades);
    },

    // ========== CLEAR ALL ==========
    clearAll() {
        const keys = ['agencia', 'clientes', 'negocios', 'vendas', 'viagens', 'milhas', 'transacoes', 'servicos', 'pipelineStages', 'companhias', 'programas', 'cartoes', 'atividades'];
        keys.forEach(k => localStorage.removeItem(this._key(k)));
    },

    // ========== MIGRAÇÃO DE SERVIÇOS ==========
    ensureServicos() {
        const servicos = this.getServicos();
        const necessarios = ['Emissão de Passagens', 'Pacote de Viagem', 'Grupo WPP'];
        let changed = false;
        necessarios.forEach(n => {
            if (!servicos.includes(n)) { servicos.push(n); changed = true; }
        });
        if (changed) this.setServicos(servicos);
    },

    // ========== SEED ==========
    seed() {
        this.ensureServicos();
        if (!this.getClientes().length && !this.getNegocios().length) {
            this.setClientes([
                { id: 'cli-001', nome: 'Maria Silva', email: 'maria@email.com', telefone: '(11) 99999-0001', cpf: '', status: 'Ativo', notas: 'Cliente desde 2024', criadoEm: '2025-01-10T00:00:00Z' },
                { id: 'cli-002', nome: 'João Oliveira', email: 'joao@email.com', telefone: '(11) 99999-0002', cpf: '', status: 'Ativo', notas: '', criadoEm: '2025-03-15T00:00:00Z' }
            ]);
            this.setNegocios([
                { id: 'neg-001', titulo: 'Pacote Orlando - Família Silva', clienteId: 'cli-001', servico: 'Pacote de Viagem', valor: 15000, stage: 'Em Negociação', probabilidade: 60, descricao: 'Família de 4 pessoas, interesse em parques', origemLead: 'Instagram', campanha: 'Férias de Verão 2026', criadoEm: '2026-06-15T10:00:00Z', atualizadoEm: '2026-07-10T10:00:00Z' },
                { id: 'neg-002', titulo: 'Cruzeiro Caribe - Casal Oliveira', clienteId: 'cli-002', servico: 'Cruzeiro', valor: 22000, stage: 'Proposta Enviada', probabilidade: 80, descricao: 'Casal interessado em suíte com varanda', origemLead: 'Indicação', campanha: 'Cruzeiros 2026', criadoEm: '2026-06-20T10:00:00Z', atualizadoEm: '2026-07-15T10:00:00Z' },
                { id: 'neg-003', titulo: 'Intercâmbio Londres - João', clienteId: null, servico: 'Intercâmbio', valor: 35000, stage: 'Negociações Futuras', probabilidade: 20, descricao: 'Lead novo, interesse para 2027', origemLead: 'Google Ads', campanha: 'Intercâmbio 2027', criadoEm: '2026-07-18T10:00:00Z', atualizadoEm: '2026-07-18T10:00:00Z' }
            ]);
            this.setViagens([]);
            this.setMilhas([]);
            this.setTransacoes([
                { id: 'tr-001', descricao: 'Comissão - Pacote Orlando', tipo: 'Receita', categoria: 'Comissões', valor: 1500, data: '2026-07-01' },
                { id: 'tr-002', descricao: 'Anúncios Instagram', tipo: 'Despesa', categoria: 'Marketing', valor: 350, data: '2026-07-05' }
            ]);
            this.logAtividade('sistema', 'Sistema inicializado com dados de exemplo');
        }
    }
};

// Inicializa seed
DB.seed();
