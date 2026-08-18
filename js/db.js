/* ============================================================
   db.js — Camada de dados (localStorage)
   Chaves alinhadas ao formato do backup JSON (versão 2.x)
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

    read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.error('Erro ao ler ' + key, e);
            return fallback;
        }
    },

    write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Erro ao gravar ' + key, e);
            return false;
        }
    },

    // ---- Agência ----
    getAgencia() { return this.read(this.KEYS.agencia, {}); },
    setAgencia(d) { return this.write(this.KEYS.agencia, d); },

    // ---- Clientes ----
    getClientes() { return this.read(this.KEYS.clientes, []); },
    setClientes(lista) { return this.write(this.KEYS.clientes, lista); },
    getClienteById(id) { return this.getClientes().find(c => c.id === id); },
    getClienteNome(id) {
        const c = this.getClienteById(id);
        return c ? c.nome : (id || '—');
    },
    saveCliente(cliente) {
        const lista = this.getClientes();
        const i = lista.findIndex(c => c.id === cliente.id);
        if (i >= 0) lista[i] = cliente; else lista.push(cliente);
        return this.setClientes(lista);
    },
    deleteCliente(id) { return this.setClientes(this.getClientes().filter(c => c.id !== id)); },

    // ---- Negócios ----
    getNegocios() { return this.read(this.KEYS.negocios, []); },
    setNegocios(lista) { return this.write(this.KEYS.negocios, lista); },
    saveNegocio(n) {
        const lista = this.getNegocios();
        const i = lista.findIndex(x => x.id === n.id);
        if (i >= 0) lista[i] = n; else lista.push(n);
        return this.setNegocios(lista);
    },
    deleteNegocio(id) { return this.setNegocios(this.getNegocios().filter(x => x.id !== id)); },

    // ---- Vendas ----
    getVendas() { return this.read(this.KEYS.vendas, []); },
    setVendas(lista) { return this.write(this.KEYS.vendas, lista); },
    saveVenda(v) {
        const lista = this.getVendas();
        const i = lista.findIndex(x => x.id === v.id);
        if (i >= 0) lista[i] = v; else lista.push(v);
        return this.setVendas(lista);
    },
    deleteVenda(id) { return this.setVendas(this.getVendas().filter(x => x.id !== id)); },

    // ---- Viagens ----
    getViagens() { return this.read(this.KEYS.viagens, []); },
    setViagens(lista) { return this.write(this.KEYS.viagens, lista); },
    saveViagem(v) {
        const lista = this.getViagens();
        const i = lista.findIndex(x => x.id === v.id);
        if (i >= 0) lista[i] = v; else lista.push(v);
        return this.setViagens(lista);
    },
    deleteViagem(id) { return this.setViagens(this.getViagens().filter(x => x.id !== id)); },

    // ---- Milhas ----
    getMilhas() { return this.read(this.KEYS.milhas, []); },
    setMilhas(lista) { return this.write(this.KEYS.milhas, lista); },
    saveMilha(m) {
        const lista = this.getMilhas();
        const i = lista.findIndex(x => x.id === m.id);
        if (i >= 0) lista[i] = m; else lista.push(m);
        return this.setMilhas(lista);
    },
    deleteMilha(id) { return this.setMilhas(this.getMilhas().filter(x => x.id !== id)); },

    // ---- Listas de configuração ----
    getPipelineStages() {
        return this.read(this.KEYS.pipelineStages, [
            'Lead / Contato Inicial', 'Qualificação / Reunião',
            'Pendente Envio Proposta', 'Proposta Enviada',
            'Fechado (Ganho)', 'Perdido', 'Negócios Futuros'
        ]);
    },
    setPipelineStages(l) { return this.write(this.KEYS.pipelineStages, l); },

    getServicos() {
        return this.read(this.KEYS.servicos, [
            'Emissão de Passagens', 'Seguro Viagem', 'Hospedagem',
            'Pacotes de Viagem', 'Aluguel de Carro', 'Consultoria de Milhas',
            'Transfer / Transporte', 'Cruzeiros'
        ]);
    },
    setServicos(l) { return this.write(this.KEYS.servicos, l); },

    getCompanhias() {
        return this.read(this.KEYS.companhias, ['LATAM', 'Gol', 'Azul', 'American Airlines', 'Delta', 'United', 'Air France', 'Emirates']);
    },
    setCompanhias(l) { return this.write(this.KEYS.companhias, l); },

    getProgramas() {
        return this.read(this.KEYS.programas, ['Smiles', 'LATAM Pass', 'TudoAzul', 'Livelo', 'Esfera', 'Miles&More', 'Flying Blue']);
    },
    setProgramas(l) { return this.write(this.KEYS.programas, l); },

    getCartoes() {
        return this.read(this.KEYS.cartoes, ['C6 Bank', 'XP', 'Santander', 'Bradesco', 'Itaú', 'Banco do Brasil', 'Nubank', 'Inter']);
    },
    setCartoes(l) { return this.write(this.KEYS.cartoes, l); },

    getAtividades() { return this.read(this.KEYS.atividades, []); },
    addAtividade(tipo, descricao) {
        const lista = this.getAtividades();
        lista.unshift({ tipo, descricao, data: new Date().toISOString() });
        return this.write(this.KEYS.atividades, lista);
    },

    // ---- Reset ----
    resetAll() {
        Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
    }
};
