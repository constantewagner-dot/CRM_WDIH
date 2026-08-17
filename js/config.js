/* ============================================================
   config.js — Configurações
   ============================================================ */

const ConfigModule = {
    init() {
        this.carregarAgencia();
        this.renderPipeline();
        this.renderServicos();
        this.renderCompanhias();
        this.renderProgramas();
        this.renderCartoes();

        document.getElementById('btn-export-json').addEventListener('click', () => { if (typeof BackupModule !== 'undefined') BackupModule.exportJSON(); });
        document.getElementById('btn-export-csv').addEventListener('click', () => { if (typeof BackupModule !== 'undefined') BackupModule.exportCSV(); });
        document.getElementById('btn-import-backup').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => { if (typeof BackupModule !== 'undefined') BackupModule.importJSON(e); });
        document.getElementById('btn-reset-data').addEventListener('click', () => { if (typeof BackupModule !== 'undefined') BackupModule.resetData(); });
    },

    carregarAgencia() {
        const a = DB.getAgencia();
        document.getElementById('cfg-agencia-nome').value = a.nome || '';
        document.getElementById('cfg-agencia-cnpj').value = a.cnpj || '';
        document.getElementById('cfg-agencia-telefone').value = a.telefone || '';
        document.getElementById('cfg-agencia-email').value = a.email || '';
    },

    salvarAgencia() {
        DB.setAgencia({
            nome: document.getElementById('cfg-agencia-nome').value,
            cnpj: document.getElementById('cfg-agencia-cnpj').value,
            telefone: document.getElementById('cfg-agencia-telefone').value,
            email: document.getElementById('cfg-agencia-email').value
        });
        AppModule.showToast('Dados da agência salvos!', 'success');
    },

    renderPipeline() {
        const stages = DB.getPipelineStages();
        const el = document.getElementById('cfg-pipeline-list');
        if (!el) return;
        el.innerHTML = stages.map((s, i) => `
            <div class="config-list-item"><span>${i + 1}. ${s}</span><button onclick="ConfigModule.removerEtapa(${i})">🗑️</button></div>
        `).join('');
    },

    adicionarEtapa() {
        const input = document.getElementById('cfg-nova-etapa');
        const nome = input.value.trim();
        if (!nome) return;
        const stages = DB.getPipelineStages();
        stages.push(nome);
        DB.setPipelineStages(stages);
        input.value = '';
        this.renderPipeline();
        AppModule.showToast('Etapa adicionada!', 'success');
    },

    removerEtapa(index) {
        const stages = DB.getPipelineStages();
        stages.splice(index, 1);
        DB.setPipelineStages(stages);
        this.renderPipeline();
        AppModule.showToast('Etapa removida', 'info');
    },

    renderServicos() {
        const servicos = DB.getServicos();
        const el = document.getElementById('cfg-servicos-list');
        if (!el) return;
        el.innerHTML = servicos.map((s, i) => `
            <div class="config-list-item"><span>${s}</span><button onclick="ConfigModule.removerServico(${i})">🗑️</button></div>
        `).join('');
    },

    adicionarServico() {
        const input = document.getElementById('cfg-novo-servico');
        const nome = input.value.trim();
        if (!nome) return;
        const servicos = DB.getServicos();
        servicos.push(nome);
        DB.setServicos(servicos);
        input.value = '';
        this.renderServicos();
        AppModule.showToast('Serviço adicionado!', 'success');
    },

    removerServico(index) {
        const servicos = DB.getServicos();
        servicos.splice(index, 1);
        DB.setServicos(servicos);
        this.renderServicos();
    },

    renderCompanhias() {
        const list = DB.getCompanhias();
        const el = document.getElementById('cfg-companhias-list');
        if (!el) return;
        el.innerHTML = list.map((c, i) => `
            <div class="config-list-item"><span>${c}</span><button onclick="ConfigModule.removerCompanhia(${i})">🗑️</button></div>
        `).join('');
    },

    adicionarCompanhia() {
        const input = document.getElementById('cfg-nova-companhia');
        const nome = input.value.trim();
        if (!nome) return;
        const list = DB.getCompanhias();
        list.push(nome);
        DB.setCompanhias(list);
        input.value = '';
        this.renderCompanhias();
        AppModule.showToast('Companhia adicionada!', 'success');
    },

    removerCompanhia(index) {
        const list = DB.getCompanhias();
        list.splice(index, 1);
        DB.setCompanhias(list);
        this.renderCompanhias();
    },

    renderProgramas() {
        const list = DB.getProgramas();
        const el = document.getElementById('cfg-programas-list');
        if (!el) return;
        el.innerHTML = list.map((p, i) => `
            <div class="config-list-item"><span>${p}</span><button onclick="ConfigModule.removerPrograma(${i})">🗑️</button></div>
        `).join('');
    },

    adicionarPrograma() {
        const input = document.getElementById('cfg-novo-programa');
        const nome = input.value.trim();
        if (!nome) return;
        const list = DB.getProgramas();
        list.push(nome);
        DB.setProgramas(list);
        input.value = '';
        this.renderProgramas();
        AppModule.showToast('Programa adicionado!', 'success');
    },

    removerPrograma(index) {
        const list = DB.getProgramas();
        list.splice(index, 1);
        DB.setProgramas(list);
        this.renderProgramas();
    },

    renderCartoes() {
        const list = DB.getCartoes();
        const el = document.getElementById('cfg-cartoes-list');
        if (!el) return;
        el.innerHTML = list.map((c, i) => `
            <div class="config-list-item"><span>${c}</span><button onclick="ConfigModule.removerCartao(${i})">🗑️</button></div>
        `).join('');
    },

    adicionarCartao() {
        const input = document.getElementById('cfg-novo-cartao');
        const nome = input.value.trim();
        if (!nome) return;
        const list = DB.getCartoes();
        list.push(nome);
        DB.setCartoes(list);
        input.value = '';
        this.renderCartoes();
        AppModule.showToast('Cartão adicionado!', 'success');
    },

    removerCartao(index) {
        const list = DB.getCartoes();
        list.splice(index, 1);
        DB.setCartoes(list);
        this.renderCartoes();
    }
};
