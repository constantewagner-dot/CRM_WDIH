/* ============================================================
   db.js — Camada de dados (localStorage)
   ============================================================ */

const DB = {
    _get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Erro ao ler ${key}:`, e);
            return null;
        }
    },

    _set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Erro ao salvar ${key}:`, e);
            return false;
        }
    },

    // Agência
    getAgencia() {
        return this._get('wdih_agencia') || {};
    },
    setAgencia(data) {
        return this._set('wdih_agencia', data);
    },

    // Pipeline
    getPipelineStages() {
        return this._get('wdih_pipeline_stages') || [
            'Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'
        ];
    },
    setPipelineStages(stages) {
        return this._set('wdih_pipeline_stages', stages);
    },

    // Negócios
    getNegocios() {
        return this._get('wdih_negocios') || [];
    },
    saveNegocio(negocio) {
        const negocios = this.getNegocios();
        const idx = negocios.findIndex(n => n.id === negocio.id);
        if (idx >= 0) {
            negocios[idx] = negocio;
        } else {
            negocios.push(negocio);
        }
        return this._set('wdih_negocios', negocios);
    },
    deleteNegocio(id) {
        const negocios = this.getNegocios().filter(n => n.id !== id);
        return this._set('wdih_negocios', negocios);
    },

    // Serviços
    getServicos() {
        return this._get('wdih_servicos') || ['Pacote Nacional', 'Pacote Internacional', 'Passagens', 'Cruzeiro'];
    },
    setServicos(s) {
        return this._set('wdih_servicos', s);
    },

    // Companhias
    getCompanhias() {
        return this._get('wdih_companhias') || ['LATAM', 'GOL', 'AZUL'];
    },
    setCompanhias(s) {
        return this._set('wdih_companhias', s);
    },

    // Programas
    getProgramas() {
        return this._get('wdih_programas') || ['Latam Pass', 'Smiles', 'TudoAzul'];
    },
    setProgramas(s) {
        return this._set('wdih_programas', s);
    },

    // Cartões
    getCartoes() {
        return this._get('wdih_cartoes') || ['Itaú', 'Bradesco', 'Santander'];
    },
    setCartoes(s) {
        return this._set('wdih_cartoes', s);
    },

    // Vendas
    getVendas() {
        return this._get('wdih_vendas') || [];
    },
    saveVenda(venda) {
        const vendas = this.getVendas();
        const idx = vendas.findIndex(v => v.id === venda.id);
        if (idx >= 0) {
            vendas[idx] = venda;
        } else {
            vendas.push(venda);
        }
        return this._set('wdih_vendas', vendas);
    },
    deleteVenda(id) {
        const vendas = this.getVendas().filter(v => v.id !== id);
        return this._set('wdih_vendas', vendas);
    },

    // Check-ins
    getCheckins() {
        return this._get('wdih_checkins') || [];
    },
    saveCheckin(checkin) {
        const checkins = this.getCheckins();
        const idx = checkins.findIndex(c => c.id === checkin.id);
        if (idx >= 0) {
            checkins[idx] = checkin;
        } else {
            checkins.push(checkin);
        }
        return this._set('wdih_checkins', checkins);
    },
    deleteCheckin(id) {
        const checkins = this.getCheckins().filter(c => c.id !== id);
        return this._set('wdih_checkins', checkins);
    },

    // Milhas
    getMilhas() {
        return this._get('wdih_milhas') || [];
    },
    saveMilha(milha) {
        const milhas = this.getMilhas();
        const idx = milhas.findIndex(m => m.id === milha.id);
        if (idx >= 0) {
            milhas[idx] = milha;
        } else {
            milhas.push(milha);
        }
        return this._set('wdih_milhas', milhas);
    },
    deleteMilha(id) {
        const milhas = this.getMilhas().filter(m => m.id !== id);
        return this._set('wdih_milhas', milhas);
    },

    // Clientes
    getClientes() {
        return this._get('wdih_clientes') || [];
    },
    saveCliente(cliente) {
        const clientes = this.getClientes();
        const idx = clientes.findIndex(c => c.id === cliente.id);
        if (idx >= 0) {
            clientes[idx] = cliente;
        } else {
            clientes.push(cliente);
        }
        return this._set('wdih_clientes', clientes);
    },
    deleteCliente(id) {
        const clientes = this.getClientes().filter(c => c.id !== id);
        return this._set('wdih_clientes', clientes);
    },

    // Reset
    resetAll() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('wdih_')) {
                localStorage.removeItem(key);
            }
        });
    }
};
