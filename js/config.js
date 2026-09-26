var ConfigModule = {
    render() {
        this.renderAgencia();
        this.renderPipeline();
        this.renderServicos();
        this.renderCompanhias();
        this.renderProgramas();
        this.renderCartoes();
        this.renderCategorias();
    },

    getConfig() {
        return DB.get('config', {});
    },

    saveConfig(config) {
        DB.set('config', config);
    },

    // ===== AGÊNCIA =====
    renderAgencia() {
        const config = this.getConfig();
        const a = config.agencia || {};
        const container = document.getElementById('config-agencia');
        if (!container) return;

        container.innerHTML = `
            <div class="form-grid">
                <div class="form-group"><label>Nome da Agência</label><input type="text" id="cfg-ag-nome" class="form-control" value="${AppModule.escapeHtml(a.nome || '')}"></div>
                <div class="form-group"><label>CNPJ</label><input type="text" id="cfg-ag-cnpj" class="form-control" value="${AppModule.escapeHtml(a.cnpj || '')}"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Telefone</label><input type="text" id="cfg-ag-tel" class="form-control" value="${AppModule.escapeHtml(a.telefone || '')}"></div>
                <div class="form-group"><label>E-mail</label><input type="email" id="cfg-ag-email" class="form-control" value="${AppModule.escapeHtml(a.email || '')}"></div>
            </div>
            <div class="form-group"><label>Comissão Padrão (%)</label><input type="number" id="cfg-ag-com" class="form-control" value="${a.comissao || 10}"></div>
            <button class="btn btn-primary" onclick="ConfigModule.salvarAgencia()">Salvar Dados da Agência</button>
        `;
    },

    salvarAgencia() {
        const config = this.getConfig();
        config.agencia = {
            nome: document.getElementById('cfg-ag-nome').value.trim(),
            cnpj: document.getElementById('cfg-ag-cnpj').value.trim(),
            telefone: document.getElementById('cfg-ag-tel').value.trim(),
            email: document.getElementById('cfg-ag-email').value.trim(),
            comissao: parseFloat(document.getElementById('cfg-ag-com').value) || 10
        };
        this.saveConfig(config);
        AppModule.toast('Dados da agência salvos!');
    },

    // ===== PIPELINE =====
    renderPipeline() {
        const config = this.getConfig();
        const container = document.getElementById('config-pipeline');
        if (!container) return;

        const etapas = config.pipeline || [];
        container.innerHTML = `
            <div class="tags-list">
                ${etapas.map((e, i) => `
                    <div class="tag-item">
                        <span>${AppModule.escapeHtml(e)}</span>
                        <button onclick="ConfigModule.removerPipeline('${e}')">×</button>
                    </div>
                `).join('')}
            </div>
            <div class="form-inline" style="margin-top:10px;">
                <input type="text" id="cfg-pipeline-novo" class="form-control" placeholder="Nova etapa">
                <button class="btn btn-secondary" onclick="ConfigModule.adicionarPipeline()">Adicionar</button>
            </div>
        `;
    },

    adicionarPipeline() {
        const input = document.getElementById('cfg-pipeline-novo');
        const valor = input.value.trim();
        if (!valor) return;
        const config = this.getConfig();
        if (!config.pipeline) config.pipeline = [];
        if (!config.pipeline.includes(valor)) config.pipeline.push(valor);
        this.saveConfig(config);
        input.value = '';
        this.renderPipeline();
    },

    removerPipeline(valor) {
        const config = this.getConfig();
        config.pipeline = (config.pipeline || []).filter(e => e !== valor);
        this.saveConfig(config);
        this.renderPipeline();
    },

    // ===== SERVIÇOS =====
    renderServicos() {
        const config = this.getConfig();
        const container = document.getElementById('config-servicos');
        if (!container) return;

        const servicos = config.servicos || [];
        container.innerHTML = `
            <div class="tags-list">
                ${servicos.map(s => `
                    <div class="tag-item">
                        <span>${AppModule.escapeHtml(s)}</span>
                        <button onclick="ConfigModule.removerServico('${AppModule.escapeHtml(s)}')">×</button>
                    </div>
                `).join('')}
            </div>
            <div class="form-inline" style="margin-top:10px;">
                <input type="text" id="cfg-servico-novo" class="form-control" placeholder="Novo serviço">
                <button class="btn btn-secondary" onclick="ConfigModule.adicionarServico()">Adicionar</button>
            </div>
        `;
    },

    adicionarServico() {
        const input = document.getElementById('cfg-servico-novo');
        const valor = input.value.trim();
        if (!valor) return;
        const config = this.getConfig();
        if (!config.servicos) config.servicos = [];
        if (!config.servicos.includes(valor)) config.servicos.push(valor);
        this.saveConfig(config);
        input.value = '';
        this.renderServicos();
    },

    removerServico(valor) {
        const config = this.getConfig();
        config.servicos = (config.servicos || []).filter(s => s !== valor);
        this.saveConfig(config);
        this.renderServicos();
    },

    // ===== COMPANHIAS AÉREAS COM CPM =====
    renderCompanhias() {
        const config = this.getConfig();
        const container = document.getElementById('config-companhias');
        if (!container) return;

        const companhias = config.companhias || [];
        container.innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Companhia Aérea</th><th>CPM (R$ centavos/milha)</th><th>Ações</th></tr></thead>
                    <tbody>
                        ${companhias.map(c => `
                            <tr>
                                <td>${AppModule.escapeHtml(c.nome)}</td>
                                <td>${parseFloat(c.cpm || 0).toFixed(2).replace('.', ',')}</td>
                                <td><button class="btn btn-sm btn-danger" onclick="ConfigModule.removerCompanhia('${AppModule.escapeHtml(c.nome)}')">Excluir</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="form-inline" style="margin-top:10px;">
                <input type="text" id="cfg-companhia-nome" class="form-control" placeholder="Ex: LATAM">
                <input type="number" id="cfg-companhia-cpm" class="form-control" step="0.01" placeholder="CPM">
                <button class="btn btn-secondary" onclick="ConfigModule.adicionarCompanhia()">Adicionar</button>
            </div>
            <p style="font-size:11px;color:var(--text-muted);margin-top:8px;">
                CPM = centavos por milha. Ex: 2,50 significa R$ 0,025 por milha.
            </p>
        `;
    },

    adicionarCompanhia() {
        const nomeInput = document.getElementById('cfg-companhia-nome');
        const cpmInput = document.getElementById('cfg-companhia-cpm');
        const nome = nomeInput.value.trim();
        const cpm = parseFloat(cpmInput.value);

        if (!nome || isNaN(cpm)) { AppModule.toast('Informe o nome e o CPM.'); return; }

        const config = this.getConfig();
        if (!config.companhias) config.companhias = [];

        const idx = config.companhias.findIndex(c => c.nome === nome);
        if (idx >= 0) {
            config.companhias[idx].cpm = cpm;
        } else {
            config.companhias.push({ nome, cpm });
        }

        this.saveConfig(config);
        nomeInput.value = '';
        cpmInput.value = '';
        this.renderCompanhias();
        AppModule.toast('Companhia salva!');
    },

    removerCompanhia(nome) {
        const config = this.getConfig();
        config.companhias = (config.companhias || []).filter(c => c.nome !== nome);
        this.saveConfig(config);
        this.renderCompanhias();
    },

    // ===== PROGRAMAS DE FIDELIDADE =====
    renderProgramas() {
        const config = this.getConfig();
        const container = document.getElementById('config-programas');
        if (!container) return;

        const programas = config.programas || [];
        container.innerHTML = `
            <div class="tags-list">
                ${programas.map(p => `
                    <div class="tag-item">
                        <span>${AppModule.escapeHtml(p)}</span>
                        <button onclick="ConfigModule.removerPrograma('${AppModule.escapeHtml(p)}')">×</button>
                    </div>
                `).join('')}
            </div>
            <div class="form-inline" style="margin-top:10px;">
                <input type="text" id="cfg-programa-novo" class="form-control" placeholder="Novo programa" list="dl-programas">
                <button class="btn btn-secondary" onclick="ConfigModule.adicionarPrograma()">Adicionar</button>
            </div>
        `;
    },

    adicionarPrograma() {
        const input = document.getElementById('cfg-programa-novo');
        const valor = input.value.trim();
        if (!valor) return;
        const config = this.getConfig();
        if (!config.programas) config.programas = [];
        if (!config.programas.includes(valor)) config.programas.push(valor);
        this.saveConfig(config);
        input.value = '';
        this.renderProgramas();
    },

    removerPrograma(valor) {
        const config = this.getConfig();
        config.programas = (config.programas || []).filter(p => p !== valor);
        this.saveConfig(config);
        this.renderProgramas();
    },

    // ===== CARTÕES (BANCOS) =====
    renderCartoes() {
        const config = this.getConfig();
        const container = document.getElementById('config-cartoes');
        if (!container) return;

        const cartoes = config.cartoes || [];
        container.innerHTML = `
            <div class="tags-list">
                ${cartoes.map(c => `
                    <div class="tag-item">
                        <span>${AppModule.escapeHtml(c)}</span>
                        <button onclick="ConfigModule.removerCartao('${AppModule.escapeHtml(c)}')">×</button>
                    </div>
                `).join('')}
            </div>
            <div class="form-inline" style="margin-top:10px;">
                <input type="text" id="cfg-cartao-novo" class="form-control" placeholder="Novo banco" list="dl-bancos">
                <button class="btn btn-secondary" onclick="ConfigModule.adicionarCartao()">Adicionar</button>
            </div>
        `;
    },

    adicionarCartao() {
        const input = document.getElementById('cfg-cartao-novo');
        const valor = input.value.trim();
        if (!valor) return;
        const config = this.getConfig();
        if (!config.cartoes) config.cartoes = [];
        if (!config.cartoes.includes(valor)) config.cartoes.push(valor);
        this.saveConfig(config);
        input.value = '';
        this.renderCartoes();
    },

    removerCartao(valor) {
        const config = this.getConfig();
        config.cartoes = (config.cartoes || []).filter(c => c !== valor);
        this.saveConfig(config);
        this.renderCartoes();
    },

    // ===== CATEGORIAS FINANCEIRAS =====
    renderCategorias() {
        const config = this.getConfig();
        const container = document.getElementById('config-categorias');
        if (!container) return;

        container.innerHTML = `
            <h4>Receitas</h4>
            <div class="tags-list">
                ${(config.receitas || []).map(r => `
                    <div class="tag-item"><span>${AppModule.escapeHtml(r)}</span></div>
                `).join('')}
            </div>
            <h4 style="margin-top:16px;">Despesas</h4>
            <div class="tags-list">
                ${(config.despesas || []).map(d => `
                    <div class="tag-item"><span>${AppModule.escapeHtml(d)}</span></div>
                `).join('')}
            </div>
            <p style="font-size:11px;color:var(--text-muted);margin-top:8px;">
                Para alterar categorias, edite diretamente nas transações financeiras.
            </p>
        `;
    }
};
