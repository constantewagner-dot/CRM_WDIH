var ConfigModule = {
    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */
    init() {
        this.render();
    },

    getConfig() {
        const cfg = DB.get('config', {});
        return cfg && typeof cfg === 'object' ? cfg : {};
    },

    saveConfig(config) {
        DB.set('config', config);
    },

    ensureArray(config, key) {
        if (!Array.isArray(config[key])) config[key] = [];
        return config[key];
    },

    /* ============================================================
       RENDER GERAL
       ============================================================ */
    render() {
        this.renderAgencia();
        this.renderStringList('config-pipeline', 'pipeline', 'Etapa');
        this.renderStringList('config-servicos', 'servicos', 'Serviço');
        this.renderCompanhias();
        this.renderStringList('config-programas', 'programas', 'Programa', 'dl-programas');
        this.renderStringList('config-cartoes', 'cartoes', 'Cartão', 'dl-bancos');
        this.renderCategorias();
        this.renderBackup();
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
       LISTA GENÉRICA COM ORDENAÇÃO À ESQUERDA
       ============================================================ */
    renderStringList(containerId, arrayKey, labelSingular, datalistId) {
        const config = this.getConfig();
        const container = document.getElementById(containerId);
        if (!container) return;

        const lista = this.ensureArray(config, arrayKey);

        let html = '';
        if (lista.length === 0) {
            html += `<p class="config-empty">Nenhum ${labelSingular.toLowerCase()} cadastrado.</p>`;
        } else {
            html += `<div class="config-list">`;
            lista.forEach((item, index) => {
                html += `
                    <div class="config-item">
                        <div class="config-order">
                            <button onclick="ConfigModule.mover('${arrayKey}', ${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Mover para cima">▲</button>
                            <button onclick="ConfigModule.mover('${arrayKey}', ${index}, 1)" ${index === lista.length - 1 ? 'disabled' : ''} title="Mover para baixo">▼</button>
                        </div>
                        <span class="config-item-text">${AppModule.escapeHtml(item)}</span>
                        <div class="config-item-actions">
                            <button onclick="ConfigModule.editar('${arrayKey}', ${index}, '${labelSingular}')" title="Editar">✏️</button>
                            <button class="btn-danger" onclick="ConfigModule.excluir('${arrayKey}', ${index})" title="Excluir">🗑️</button>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `
            <div class="config-add">
                <div class="form-inline">
                    <input type="text" id="cfg-${arrayKey}-novo" class="form-control" placeholder="Novo ${labelSingular.toLowerCase()}" ${datalistId ? `list="${datalistId}"` : ''}>
                    <button class="btn btn-primary btn-sm" onclick="ConfigModule.adicionar('${arrayKey}', '${labelSingular}')">Adicionar</button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    adicionar(arrayKey, labelSingular) {
        const input = document.getElementById(`cfg-${arrayKey}-novo`);
        const valor = input.value.trim();
        if (!valor) return;

        const config = this.getConfig();
        const lista = this.ensureArray(config, arrayKey);

        if (lista.includes(valor)) {
            AppModule.toast(`${labelSingular} já existe.`);
            return;
        }

        lista.push(valor);
        this.saveConfig(config);
        this.render();
        AppModule.toast(`${labelSingular} adicionado!`);
    },

    editar(arrayKey, index, labelSingular) {
        const config = this.getConfig();
        const lista = this.ensureArray(config, arrayKey);
        const valorAtual = lista[index];

        const novoValor = prompt(`Editar ${labelSingular.toLowerCase()}:`, valorAtual);
        if (novoValor === null) return;

        const limpo = novoValor.trim();
        if (!limpo) {
            AppModule.toast('Nome não pode ficar vazio.');
            return;
        }

        if (limpo !== valorAtual && lista.includes(limpo)) {
            AppModule.toast(`${labelSingular} já existe.`);
            return;
        }

        // Se for pipeline, atualiza negócios com o nome antigo
        if (arrayKey === 'pipeline' && limpo !== valorAtual) {
            this.renomearEtapaNegocios(valorAtual, limpo);
        }

        lista[index] = limpo;
        this.saveConfig(config);
        this.render();
        AppModule.toast(`${labelSingular} atualizado!`);
    },

    excluir(arrayKey, index) {
        const config = this.getConfig();
        const lista = this.ensureArray(config, arrayKey);
        const valor = lista[index];

        // Protege etapas de fechamento padrão
        if (arrayKey === 'pipeline' && (valor === 'Fechado (Ganho)' || valor === 'Fechado (Perdido)' || valor === 'Perdido')) {
            AppModule.toast('Não é possível excluir etapas de fechamento padrão.');
            return;
        }

        if (!confirm(`Deseja excluir "${valor}"?`)) return;

        lista.splice(index, 1);
        this.saveConfig(config);
        this.render();
        AppModule.toast('Item excluído!');
    },

    mover(arrayKey, index, direcao) {
        const config = this.getConfig();
        const lista = this.ensureArray(config, arrayKey);
        const novoIndex = index + direcao;

        if (novoIndex < 0 || novoIndex >= lista.length) return;

        const temp = lista[index];
        lista[index] = lista[novoIndex];
        lista[novoIndex] = temp;

        this.saveConfig(config);
        this.render();
        if (typeof PipelineModule !== 'undefined' && PipelineModule.render) {
            PipelineModule.render();
        }
        AppModule.toast('Ordem atualizada!');
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
       COMPANHIAS AÉREAS COM CPM
       ============================================================ */
    renderCompanhias() {
        const config = this.getConfig();
        const container = document.getElementById('config-companhias');
        if (!container) return;

        const companhias = Array.isArray(config.companhias) ? config.companhias : [];

        let html = '';
        if (companhias.length === 0) {
            html += `<p class="config-empty">Nenhuma companhia aérea cadastrada.</p>`;
        } else {
            html += `<div class="config-list">`;
            companhias.forEach((c, index) => {
                html += `
                    <div class="config-item">
                        <div class="config-order">
                            <button onclick="ConfigModule.moverCompanhia(${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
                            <button onclick="ConfigModule.moverCompanhia(${index}, 1)" ${index === companhias.length - 1 ? 'disabled' : ''}>▼</button>
                        </div>
                        <span class="config-item-text">${AppModule.escapeHtml(c.nome || '')} — CPM: ${AppModule.formatCurrency(c.cpm || 0)}</span>
                        <div class="config-item-actions">
                            <button onclick="ConfigModule.editarCompanhia(${index})" title="Editar">✏️</button>
                            <button class="btn-danger" onclick="ConfigModule.excluirCompanhia(${index})" title="Excluir">🗑️</button>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `
            <div class="config-add">
                <div class="form-inline">
                    <input type="text" id="cfg-companhia-nome" class="form-control" placeholder="Ex: LATAM">
                    <input type="number" id="cfg-companhia-cpm" class="form-control" step="0.01" placeholder="CPM">
                    <button class="btn btn-primary btn-sm" onclick="ConfigModule.adicionarCompanhia()">Adicionar</button>
                </div>
            </div>
            <p style="font-size:11px;color:var(--text-muted);margin-top:8px;">
                CPM = centavos por milha. Ex: 2,50 significa R$ 0,025 por milha.
            </p>
        `;

        container.innerHTML = html;
    },

    adicionarCompanhia() {
        const nomeInput = document.getElementById('cfg-companhia-nome');
        const cpmInput = document.getElementById('cfg-companhia-cpm');
        const nome = nomeInput.value.trim();
        const cpm = parseFloat(cpmInput.value);

        if (!nome || isNaN(cpm)) {
            AppModule.toast('Informe o nome e o CPM.');
            return;
        }

        const config = this.getConfig();
        if (!Array.isArray(config.companhias)) config.companhias = [];

        const idx = config.companhias.findIndex(c => c.nome === nome);
        if (idx >= 0) {
            config.companhias[idx].cpm = cpm;
            AppModule.toast('Companhia atualizada!');
        } else {
            config.companhias.push({ nome, cpm });
            AppModule.toast('Companhia adicionada!');
        }

        this.saveConfig(config);
        nomeInput.value = '';
        cpmInput.value = '';
        this.render();
    },

    editarCompanhia(index) {
        const config = this.getConfig();
        const cia = config.companhias[index];
        if (!cia) return;

        const nome = prompt('Nome da companhia:', cia.nome);
        if (nome === null) return;
        const limpo = nome.trim();
        if (!limpo) {
            AppModule.toast('Nome não pode ficar vazio.');
            return;
        }

        const cpmStr = prompt('CPM (R$):', cia.cpm);
        if (cpmStr === null) return;
        const cpm = parseFloat(cpmStr);
        if (isNaN(cpm)) {
            AppModule.toast('CPM inválido.');
            return;
        }

        cia.nome = limpo;
        cia.cpm = cpm;
        this.saveConfig(config);
        this.render();
        AppModule.toast('Companhia atualizada!');
    },

    excluirCompanhia(index) {
        const config = this.getConfig();
        const cia = config.companhias[index];
        if (!cia) return;

        if (!confirm(`Excluir companhia "${cia.nome}"?`)) return;

        config.companhias.splice(index, 1);
        this.saveConfig(config);
        this.render();
        AppModule.toast('Companhia excluída!');
    },

    moverCompanhia(index, direcao) {
        const config = this.getConfig();
        const lista = config.companhias;
        if (!Array.isArray(lista)) return;

        const novoIndex = index + direcao;
        if (novoIndex < 0 || novoIndex >= lista.length) return;

        const temp = lista[index];
        lista[index] = lista[novoIndex];
        lista[novoIndex] = temp;

        this.saveConfig(config);
        this.render();
        AppModule.toast('Ordem atualizada!');
    },

    /* ============================================================
       CATEGORIAS FINANCEIRAS
       ============================================================ */
    renderCategorias() {
        const container = document.getElementById('config-categorias');
        if (!container) return;

        container.innerHTML = `
            <div class="config-categoria-grupo">
                <h4>Receitas</h4>
                ${this.htmlCategoriaLista('receitas', 'Receita')}
            </div>
            <div class="config-categoria-grupo">
                <h4>Despesas</h4>
                ${this.htmlCategoriaLista('despesas', 'Despesa')}
            </div>
        `;
    },

    htmlCategoriaLista(arrayKey, labelSingular) {
        const config = this.getConfig();
        const lista = this.ensureArray(config, arrayKey);

        let html = '';
        if (lista.length === 0) {
            html += `<p class="config-empty">Nenhuma ${labelSingular.toLowerCase()} cadastrada.</p>`;
        } else {
            html += `<div class="config-list">`;
            lista.forEach((item, index) => {
                html += `
                    <div class="config-item">
                        <div class="config-order">
                            <button onclick="ConfigModule.moverCategoria('${arrayKey}', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
                            <button onclick="ConfigModule.moverCategoria('${arrayKey}', ${index}, 1)" ${index === lista.length - 1 ? 'disabled' : ''}>▼</button>
                        </div>
                        <span class="config-item-text">${AppModule.escapeHtml(item)}</span>
                        <div class="config-item-actions">
                            <button onclick="ConfigModule.editarCategoria('${arrayKey}', ${index}, '${labelSingular}')" title="Editar">✏️</button>
                            <button class="btn-danger" onclick="ConfigModule.excluirCategoria('${arrayKey}', ${index})" title="Excluir">🗑️</button>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `
            <div class="config-add">
                <div class="form-inline">
                    <input type="text" id="cfg-${arrayKey}-novo" class="form-control" placeholder="Nova ${labelSingular.toLowerCase()}">
                    <button class="btn btn-primary btn-sm" onclick="ConfigModule.adicionarCategoria('${arrayKey}', '${labelSingular}')">Adicionar</button>
                </div>
            </div>
        `;

        return html;
    },

    adicionarCategoria(arrayKey, labelSingular) {
        const input = document.getElementById(`cfg-${arrayKey}-novo`);
        const valor = input.value.trim();
        if (!valor) return;

        const config = this.getConfig();
        const lista = this.ensureArray(config, arrayKey);

        if (lista.includes(valor)) {
            AppModule.toast(`${labelSingular} já existe.`);
            return;
        }

        lista.push(valor);
        this.saveConfig(config);
        this.renderCategorias();
        AppModule.toast(`${labelSingular} adicionada!`);
    },

    editarCategoria(arrayKey, index, labelSingular) {
        const config = this.getConfig();
        const lista = this.ensureArray(config, arrayKey);
        const valorAtual = lista[index];

        const novoValor = prompt(`Editar ${labelSingular.toLowerCase()}:`, valorAtual);
        if (novoValor === null) return;

        const limpo = novoValor.trim();
        if (!limpo) {
            AppModule.toast('Nome não pode ficar vazio.');
            return;
        }
        if (limpo !== valorAtual && lista.includes(limpo)) {
            AppModule.toast(`${labelSingular} já existe.`);
            return;
        }

        lista[index] = limpo;
        this.saveConfig(config);
        this.renderCategorias();
        AppModule.toast(`${labelSingular} atualizada!`);
    },

    excluirCategoria(arrayKey, index) {
        const config = this.getConfig();
        const lista = this.ensureArray(config, arrayKey);
        const valor = lista[index];

        if (!confirm(`Deseja excluir "${valor}"?`)) return;

        lista.splice(index, 1);
        this.saveConfig(config);
        this.renderCategorias();
        AppModule.toast('Categoria excluída!');
    },

    moverCategoria(arrayKey, index, direcao) {
        const config = this.getConfig();
        const lista = this.ensureArray(config, arrayKey);
        const novoIndex = index + direcao;

        if (novoIndex < 0 || novoIndex >= lista.length) return;

        const temp = lista[index];
        lista[index] = lista[novoIndex];
        lista[novoIndex] = temp;

        this.saveConfig(config);
        this.renderCategorias();
        AppModule.toast('Ordem atualizada!');
    },

    /* ============================================================
       BACKUP E RESTAURAÇÃO
       ============================================================ */
    renderBackup() {
        const container = document.getElementById('config-backup');
        if (!container) return;

        container.innerHTML = `
            <div class="config-backup-grid">
                <div class="config-backup-card">
                    <h4>Exportar Backup</h4>
                    <p>Gere um arquivo JSON com todos os dados do CRM.</p>
                    <button class="btn btn-primary" onclick="ConfigModule.exportarBackup()">📥 Exportar Backup</button>
                </div>
                <div class="config-backup-card">
                    <h4>Importar Backup</h4>
                    <p>Restaure os dados a partir de um arquivo JSON previamente exportado.</p>
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

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ConfigModule.init());
} else {
    ConfigModule.init();
}
