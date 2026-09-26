var ConfigModule = {
    render() {
        this.renderAgencia();
        this.renderPipeline();
        this.renderServicos();
        this.renderCompanhias();
        this.renderProgramas();
        this.renderCartoes();
        this.renderCategorias();
        this.renderBackup();
    },

    getConfig() {
        return DB.get('config', {});
    },

    saveConfig(config) {
        DB.set('config', config);
    },

    /* ============================================================
       AGÊNCIA
       ============================================================ */
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

    /* ============================================================
       LISTAS GENÉRICAS (strings) - adicionar / editar / excluir / ordenar
       ============================================================ */
    renderStringList(containerId, arrayKey, labelSingular, inputPlaceholder, datalistId) {
        const config = this.getConfig();
        const container = document.getElementById(containerId);
        if (!container) return;

        const lista = config[arrayKey] || [];
        const listHtml = lista.map((item, idx) => `
            <div class="tag-item" style="gap:4px;">
                <span>${AppModule.escapeHtml(item)}</span>
                <button onclick="ConfigModule.editarStringList('${arrayKey}', '${AppModule.escapeHtml(item)}', '${labelSingular}')" title="Editar">✎</button>
                <button onclick="ConfigModule.moverStringList('${arrayKey}', '${AppModule.escapeHtml(item)}', -1)" title="Mover para cima">▲</button>
                <button onclick="ConfigModule.moverStringList('${arrayKey}', '${AppModule.escapeHtml(item)}', 1)" title="Mover para baixo">▼</button>
                <button onclick="ConfigModule.excluirStringList('${arrayKey}', '${AppModule.escapeHtml(item)}')" title="Excluir">×</button>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="tags-list">${listHtml}</div>
            <div class="form-inline" style="margin-top:10px;">
                <input type="text" id="cfg-${arrayKey}-novo" class="form-control" placeholder="${inputPlaceholder}" ${datalistId ? `list="${datalistId}"` : ''}>
                <button class="btn btn-secondary" onclick="ConfigModule.adicionarStringList('${arrayKey}', '${labelSingular}')">Adicionar</button>
            </div>
        `;
    },

    adicionarStringList(arrayKey, labelSingular) {
        const input = document.getElementById(`cfg-${arrayKey}-novo`);
        const valor = input.value.trim();
        if (!valor) return;

        const config = this.getConfig();
        if (!config[arrayKey]) config[arrayKey] = [];
        if (config[arrayKey].includes(valor)) {
            AppModule.toast(`${labelSingular} já existe.`);
            return;
        }

        config[arrayKey].push(valor);
        this.saveConfig(config);
        input.value = '';
        this.render();
        AppModule.toast(`${labelSingular} adicionado!`);
    },

    editarStringList(arrayKey, valorAntigo, labelSingular) {
        const config = this.getConfig();
        const lista = config[arrayKey] || [];
        const idx = lista.findIndex(v => v === valorAntigo);
        if (idx < 0) return;

        const novoValor = prompt(`Editar ${labelSingular.toLowerCase()}:`, valorAntigo);
        if (novoValor === null) return;
        const limpo = novoValor.trim();
        if (!limpo) { AppModule.toast('Nome não pode ficar vazio.'); return; }
        if (limpo !== valorAntigo && lista.includes(limpo)) {
            AppModule.toast(`${labelSingular} já existe.`);
            return;
        }

        // Se for pipeline, atualiza os negócios que usavam o nome antigo
        if (arrayKey === 'pipeline') {
            this.renomearEtapaNegocios(valorAntigo, limpo);
        }

        lista[idx] = limpo;
        this.saveConfig(config);
        this.render();
        AppModule.toast(`${labelSingular} atualizado!`);
    },

    excluirStringList(arrayKey, valor) {
        const config = this.getConfig();

        // Protege etapas de fechamento padrão no pipeline
        if (arrayKey === 'pipeline' && (valor === 'Fechado (Ganho)' || valor === 'Fechado (Perdido)' || valor === 'Perdido')) {
            AppModule.toast('Não é possível excluir etapas de fechamento padrão.');
            return;
        }

        if (!confirm(`Deseja excluir "${valor}"?`)) return;

        config[arrayKey] = (config[arrayKey] || []).filter(v => v !== valor);
        this.saveConfig(config);
        this.render();
        AppModule.toast('Item excluído!');
    },

    moverStringList(arrayKey, valor, direcao) {
        const config = this.getConfig();
        const lista = config[arrayKey] || [];
        const idx = lista.findIndex(v => v === valor);
        if (idx < 0) return;

        const novoIdx = idx + direcao;
        if (novoIdx < 0 || novoIdx >= lista.length) return;

        // Troca as posições
        const temp = lista[idx];
        lista[idx] = lista[novoIdx];
        lista[novoIdx] = temp;

        this.saveConfig(config);
        this.render();
    },

    renomearEtapaNegocios(antigo, novo) {
        const negocios = DB.get('negocios', []);
        let alterou = false;
        negocios.forEach(n => {
            if (n.stage === antigo) {
                n.stage = novo;
                n.atualizadoEm = new Date().toISOString();
                alterou = true;
            }
        });
        if (alterou) DB.set('negocios', negocios);
    },

    /* ============================================================
       PIPELINE
       ============================================================ */
    renderPipeline() {
        this.renderStringList('config-pipeline', 'pipeline', 'Etapa', 'Nova etapa');
    },

    /* ============================================================
       SERVIÇOS
       ============================================================ */
    renderServicos() {
        this.renderStringList('config-servicos', 'servicos', 'Serviço', 'Novo serviço');
    },

    /* ============================================================
       PROGRAMAS DE FIDELIDADE
       ============================================================ */
    renderProgramas() {
        this.renderStringList('config-programas', 'programas', 'Programa', 'Novo programa', 'dl-programas');
    },

    /* ============================================================
       CARTÕES (BANCOS)
       ============================================================ */
    renderCartoes() {
        this.renderStringList('config-cartoes', 'cartoes', 'Cartão', 'Novo banco', 'dl-bancos');
    },

    /* ============================================================
       COMPANHIAS AÉREAS COM CPM
       ============================================================ */
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
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="ConfigModule.editarCompanhia('${AppModule.escapeHtml(c.nome)}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="ConfigModule.removerCompanhia('${AppModule.escapeHtml(c.nome)}')">Excluir</button>
                                </td>
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

    editarCompanhia(nomeAtual) {
        const config = this.getConfig();
        const cia = config.companhias.find(c => c.nome === nomeAtual);
        if (!cia) return;

        const nome = prompt('Nome da companhia:', cia.nome);
        if (nome === null) return;
        const limpo = nome.trim();
        if (!limpo) { AppModule.toast('Nome não pode ficar vazio.'); return; }

        const cpm = parseFloat(prompt('CPM (R$):', cia.cpm));
        if (isNaN(cpm)) { AppModule.toast('CPM inválido.'); return; }

        cia.nome = limpo;
        cia.cpm = cpm;
        this.saveConfig(config);
        this.render();
        AppModule.toast('Companhia atualizada!');
    },

    removerCompanhia(nome) {
        if (!confirm(`Excluir companhia "${nome}"?`)) return;
        const config = this.getConfig();
        config.companhias = (config.companhias || []).filter(c => c.nome !== nome);
        this.saveConfig(config);
        this.render();
    },

    /* ============================================================
       CATEGORIAS FINANCEIRAS
       ============================================================ */
    renderCategorias() {
        const config = this.getConfig();
        const container = document.getElementById('config-categorias');
        if (!container) return;

        container.innerHTML = `
            <div style="margin-bottom:20px;">
                <h4>Receitas</h4>
                ${this.htmlCategoriaLista('receitas', 'Receita')}
            </div>
            <div>
                <h4>Despesas</h4>
                ${this.htmlCategoriaLista('despesas', 'Despesa')}
            </div>
        `;
    },

    htmlCategoriaLista(arrayKey, labelSingular) {
        const config = this.getConfig();
        const lista = config[arrayKey] || [];

        const itens = lista.map(item => `
            <div class="tag-item" style="gap:4px;">
                <span>${AppModule.escapeHtml(item)}</span>
                <button onclick="ConfigModule.editarCategoria('${arrayKey}', '${AppModule.escapeHtml(item)}', '${labelSingular}')" title="Editar">✎</button>
                <button onclick="ConfigModule.moverCategoria('${arrayKey}', '${AppModule.escapeHtml(item)}', -1)" title="Mover para cima">▲</button>
                <button onclick="ConfigModule.moverCategoria('${arrayKey}', '${AppModule.escapeHtml(item)}', 1)" title="Mover para baixo">▼</button>
                <button onclick="ConfigModule.excluirCategoria('${arrayKey}', '${AppModule.escapeHtml(item)}')" title="Excluir">×</button>
            </div>
        `).join('');

        return `
            <div class="tags-list">${itens}</div>
            <div class="form-inline" style="margin-top:10px;">
                <input type="text" id="cfg-${arrayKey}-novo" class="form-control" placeholder="Nova ${labelSingular.toLowerCase()}">
                <button class="btn btn-secondary" onclick="ConfigModule.adicionarCategoria('${arrayKey}', '${labelSingular}')">Adicionar</button>
            </div>
        `;
    },

    adicionarCategoria(arrayKey, labelSingular) {
        const input = document.getElementById(`cfg-${arrayKey}-novo`);
        const valor = input.value.trim();
        if (!valor) return;

        const config = this.getConfig();
        if (!config[arrayKey]) config[arrayKey] = [];
        if (config[arrayKey].includes(valor)) {
            AppModule.toast(`${labelSingular} já existe.`);
            return;
        }

        config[arrayKey].push(valor);
        this.saveConfig(config);
        this.renderCategorias();
        AppModule.toast(`${labelSingular} adicionada!`);
    },

    editarCategoria(arrayKey, valorAntigo, labelSingular) {
        const config = this.getConfig();
        const lista = config[arrayKey] || [];
        const idx = lista.findIndex(v => v === valorAntigo);
        if (idx < 0) return;

        const novoValor = prompt(`Editar ${labelSingular.toLowerCase()}:`, valorAntigo);
        if (novoValor === null) return;
        const limpo = novoValor.trim();
        if (!limpo) { AppModule.toast('Nome não pode ficar vazio.'); return; }
        if (limpo !== valorAntigo && lista.includes(limpo)) {
            AppModule.toast(`${labelSingular} já existe.`);
            return;
        }

        lista[idx] = limpo;
        this.saveConfig(config);
        this.renderCategorias();
        AppModule.toast(`${labelSingular} atualizada!`);
    },

    excluirCategoria(arrayKey, valor) {
        if (!confirm(`Deseja excluir "${valor}"?`)) return;
        const config = this.getConfig();
        config[arrayKey] = (config[arrayKey] || []).filter(v => v !== valor);
        this.saveConfig(config);
        this.renderCategorias();
        AppModule.toast('Categoria excluída!');
    },

    moverCategoria(arrayKey, valor, direcao) {
        const config = this.getConfig();
        const lista = config[arrayKey] || [];
        const idx = lista.findIndex(v => v === valor);
        if (idx < 0) return;

        const novoIdx = idx + direcao;
        if (novoIdx < 0 || novoIdx >= lista.length) return;

        const temp = lista[idx];
        lista[idx] = lista[novoIdx];
        lista[novoIdx] = temp;

        this.saveConfig(config);
        this.renderCategorias();
    },

    /* ============================================================
       BACKUP E RESTAURAÇÃO
       ============================================================ */
    renderBackup() {
        const container = document.getElementById('config-backup');
        if (!container) return;

        container.innerHTML = `
            <div class="grid-2">
                <div class="card" style="background:var(--bg-light);">
                    <h3>Exportar Backup</h3>
                    <p style="font-size:13px;color:var(--text-muted);">Gere um arquivo JSON com todos os dados do CRM.</p>
                    <button class="btn btn-primary" onclick="ConfigModule.exportarBackup()">📥 Exportar Backup</button>
                </div>
                <div class="card" style="background:var(--bg-light);">
                    <h3>Importar Backup</h3>
                    <p style="font-size:13px;color:var(--text-muted);">Restaure os dados a partir de um arquivo JSON previamente exportado.</p>
                    <input type="file" id="backup-file" class="form-control" accept=".json,application/json" onchange="ConfigModule.importarBackup(this)">
                </div>
            </div>
        `;
    },

    exportarBackup() {
        const dados = {};
        const chaves = [
            'config', 'agencia', 'clientes', 'negocios', 'vendas', 'viagens',
            'transacoes', 'milhas', 'tarefas', 'eventos'
        ];

        chaves.forEach(k => {
            try {
                dados[k] = DB.get(k);
            } catch (e) {
                dados[k] = null;
            }
        });

        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-crm-wdih-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        AppModule.toast('Backup exportado!');
    },

    importarBackup(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                if (!dados || typeof dados !== 'object') throw new Error('Arquivo inválido');

                if (!confirm('ATENÇÃO: isso substituirá todos os dados atuais. Deseja continuar?')) {
                    input.value = '';
                    return;
                }

                Object.keys(dados).forEach(k => {
                    if (dados[k] !== undefined) DB.set(k, dados[k]);
                });

                AppModule.toast('Backup importado com sucesso!');
                input.value = '';
                this.render();

                document.dispatchEvent(new CustomEvent('backup-importado'));
            } catch (err) {
                AppModule.toast('Erro ao importar backup: ' + err.message);
                input.value = '';
            }
        };
        reader.readAsText(file);
    }
};
