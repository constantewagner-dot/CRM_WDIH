var ConfigModule = {
    init() {
        this.render();

        // Re-renderiza quando a página de configurações for aberta
        document.addEventListener('pagechange', (e) => {
            if (e.detail && e.detail.page === 'config') this.render();
        });
    },

    /* ============================================================
       UTILITÁRIOS
       ============================================================ */
    getLista(chave, padrao = []) {
        const lista = DB.get(chave, padrao);
        return Array.isArray(lista) ? lista : [];
    },

    salvarLista(chave, lista) {
        DB.set(chave, lista);
    },

    gerarId(prefixo = 'item') {
        return prefixo + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    },

    escapeHtml(str) {
        return AppModule && AppModule.escapeHtml
            ? AppModule.escapeHtml(str)
            : String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
    },

    toast(msg) {
        if (AppModule && AppModule.toast) AppModule.toast(msg);
        else alert(msg);
    },

    /* ============================================================
       RENDER GERAL
       ============================================================ */
    render() {
        this.renderAgencia();
        this.renderConfigLista('config-pipeline', 'pipelineEtapas', 'Etapa', 'etapa');
        this.renderConfigLista('config-servicos', 'servicos', 'Serviço', 'servico');
        this.renderCompanhias();
        this.renderConfigLista('config-programas', 'programasFidelidade', 'Programa', 'programa');
        this.renderCartoes();
        this.renderConfigLista('config-categorias', 'categoriasFinanceiras', 'Categoria', 'categoria');
        this.renderBackup();
    },

    /* ============================================================
       DADOS DA AGÊNCIA
       ============================================================ */
    renderAgencia() {
        const container = document.getElementById('config-agencia');
        if (!container) return;

        const agencia = DB.get('agencia', {
            nome: '',
            cnpj: '',
            email: '',
            telefone: '',
            endereco: '',
            cidade: '',
            estado: '',
            logo: ''
        });

        container.innerHTML = `
            <div class="form-grid">
                <div class="form-group"><label>Nome da Agência</label><input type="text" id="cfg-ag-nome" class="form-control" value="${this.escapeHtml(agencia.nome)}"></div>
                <div class="form-group"><label>CNPJ</label><input type="text" id="cfg-ag-cnpj" class="form-control" value="${this.escapeHtml(agencia.cnpj)}"></div>
                <div class="form-group"><label>E-mail</label><input type="email" id="cfg-ag-email" class="form-control" value="${this.escapeHtml(agencia.email)}"></div>
                <div class="form-group"><label>Telefone</label><input type="text" id="cfg-ag-telefone" class="form-control" value="${this.escapeHtml(agencia.telefone)}"></div>
                <div class="form-group"><label>Endereço</label><input type="text" id="cfg-ag-endereco" class="form-control" value="${this.escapeHtml(agencia.endereco)}"></div>
                <div class="form-group"><label>Cidade</label><input type="text" id="cfg-ag-cidade" class="form-control" value="${this.escapeHtml(agencia.cidade)}"></div>
                <div class="form-group"><label>Estado</label><input type="text" id="cfg-ag-estado" class="form-control" value="${this.escapeHtml(agencia.estado)}"></div>
                <div class="form-group"><label>Logo (URL)</label><input type="text" id="cfg-ag-logo" class="form-control" value="${this.escapeHtml(agencia.logo)}"></div>
            </div>
            <button class="btn btn-primary" style="margin-top:10px;" onclick="ConfigModule.salvarAgencia()">Salvar Dados da Agência</button>
        `;
    },

    salvarAgencia() {
        const agencia = {
            nome: document.getElementById('cfg-ag-nome').value.trim(),
            cnpj: document.getElementById('cfg-ag-cnpj').value.trim(),
            email: document.getElementById('cfg-ag-email').value.trim(),
            telefone: document.getElementById('cfg-ag-telefone').value.trim(),
            endereco: document.getElementById('cfg-ag-endereco').value.trim(),
            cidade: document.getElementById('cfg-ag-cidade').value.trim(),
            estado: document.getElementById('cfg-ag-estado').value.trim(),
            logo: document.getElementById('cfg-ag-logo').value.trim()
        };
        DB.set('agencia', agencia);
        this.toast('Dados da agência salvos!');
    },

    /* ============================================================
       LISTA GENÉRICA EDITÁVEL / EXCLUÍVEL / ORDENÁVEL
       ============================================================ */
    renderConfigLista(containerId, chave, labelSingular, prefixoId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const lista = this.getLista(chave).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        container.innerHTML = `
            <div class="config-lista">
                ${lista.map((item, idx) => `
                    <div class="config-item">
                        <span class="config-nome">${this.escapeHtml(item.nome)}</span>
                        <div class="config-acoes">
                            <button class="btn btn-xs btn-secondary" onclick="ConfigModule.moverItem('${chave}', '${item.id}', -1)" title="Mover para cima">▲</button>
                            <button class="btn btn-xs btn-secondary" onclick="ConfigModule.moverItem('${chave}', '${item.id}', 1)" title="Mover para baixo">▼</button>
                            <button class="btn btn-xs btn-primary" onclick="ConfigModule.editarItem('${chave}', '${item.id}', '${prefixoId}')">Editar</button>
                            <button class="btn btn-xs btn-danger" onclick="ConfigModule.excluirItem('${chave}', '${item.id}')">Excluir</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:12px;">
                <button class="btn btn-success btn-sm" onclick="ConfigModule.adicionarItem('${chave}', '${labelSingular}', '${prefixoId}')">+ Adicionar ${labelSingular}</button>
            </div>
        `;
    },

    adicionarItem(chave, label, prefixoId) {
        const nome = prompt(`Nome do novo ${label.toLowerCase()}:`);
        if (!nome || !nome.trim()) return;

        const lista = this.getLista(chave);
        const novo = {
            id: this.gerarId(prefixoId),
            nome: nome.trim(),
            ordem: lista.length + 1
        };
        lista.push(novo);
        this.renumerar(lista);
        this.salvarLista(chave, lista);
        this.render();
        this.toast(`${label} adicionado!`);
    },

    editarItem(chave, id, prefixoId) {
        const lista = this.getLista(chave);
        const item = lista.find(x => x.id === id);
        if (!item) return;

        const novoNome = prompt('Editar nome:', item.nome);
        if (novoNome === null) return;
        if (!novoNome.trim()) { this.toast('Nome não pode ficar vazio.'); return; }

        item.nome = novoNome.trim();
        this.salvarLista(chave, lista);

        // Se for etapa do pipeline, atualiza negócios com o nome antigo
        if (chave === 'pipelineEtapas') {
            this.atualizarStatusNegocios(id, item.nome);
        }

        this.render();
        this.toast('Item atualizado!');
    },

    excluirItem(chave, id) {
        if (!confirm('Deseja realmente excluir este item?')) return;

        let lista = this.getLista(chave);
        const item = lista.find(x => x.id === id);

        // Bloqueios de segurança
        if (chave === 'pipelineEtapas' && item && (item.nome === 'Fechado (ganho)' || item.nome === 'Fechado (perdido)')) {
            this.toast('Não é possível excluir etapas de fechamento padrão.');
            return;
        }

        lista = lista.filter(x => x.id !== id);
        this.renumerar(lista);
        this.salvarLista(chave, lista);
        this.render();
        this.toast('Item excluído!');
    },

    moverItem(chave, id, direcao) {
        const lista = this.getLista(chave).sort((a, b) => a.ordem - b.ordem);
        const idx = lista.findIndex(x => x.id === id);
        if (idx < 0) return;

        const novoIdx = idx + direcao;
        if (novoIdx < 0 || novoIdx >= lista.length) return;

        // Troca as ordens
        const temp = lista[idx].ordem;
        lista[idx].ordem = lista[novoIdx].ordem;
        lista[novoIdx].ordem = temp;

        this.salvarLista(chave, lista);
        this.render();
    },

    renumerar(lista) {
        lista.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        lista.forEach((item, i) => item.ordem = i + 1);
    },

    atualizarStatusNegocios(etapaId, novoNome) {
        const etapas = this.getLista('pipelineEtapas');
        const etapa = etapas.find(e => e.id === etapaId);
        if (!etapa || !etapa._nomeAnterior) return;

        const negocios = DB.get('negocios', []);
        negocios.forEach(n => {
            if (n.status === etapa._nomeAnterior) n.status = novoNome;
        });
        DB.set('negocios', negocios);
    },

    /* ============================================================
       COMPANHIAS AÉREAS E CPM
       ============================================================ */
    renderCompanhias() {
        const container = document.getElementById('config-companhias');
        if (!container) return;

        const companhias = this.getLista('companhiasAereas');

        container.innerHTML = `
            <div class="config-lista">
                ${companhias.map(c => `
                    <div class="config-item">
                        <span class="config-nome">${this.escapeHtml(c.nome)} <small style="color:var(--text-muted);">(CPM: R$ ${this.formatNumber(c.cpm)})</small></span>
                        <div class="config-acoes">
                            <button class="btn btn-xs btn-primary" onclick="ConfigModule.editarCompanhia('${c.id}')">Editar</button>
                            <button class="btn btn-xs btn-danger" onclick="ConfigModule.excluirCompanhia('${c.id}')">Excluir</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:12px;">
                <button class="btn btn-success btn-sm" onclick="ConfigModule.adicionarCompanhia()">+ Adicionar Companhia</button>
            </div>
        `;
    },

    adicionarCompanhia() {
        const nome = prompt('Nome da companhia aérea:');
        if (!nome || !nome.trim()) return;

        const cpm = parseFloat(prompt('CPM - Custo por milha (R$):', '0')) || 0;

        const lista = this.getLista('companhiasAereas');
        lista.push({
            id: this.gerarId('cia'),
            nome: nome.trim(),
            cpm: cpm
        });
        this.salvarLista('companhiasAereas', lista);
        this.render();
        this.toast('Companhia aérea adicionada!');
    },

    editarCompanhia(id) {
        const lista = this.getLista('companhiasAereas');
        const cia = lista.find(x => x.id === id);
        if (!cia) return;

        const nome = prompt('Nome da companhia:', cia.nome);
        if (nome === null) return;
        if (!nome.trim()) { this.toast('Nome não pode ficar vazio.'); return; }

        const cpm = parseFloat(prompt('CPM (R$):', cia.cpm)) || 0;

        cia.nome = nome.trim();
        cia.cpm = cpm;
        this.salvarLista('companhiasAereas', lista);
        this.render();
        this.toast('Companhia atualizada!');
    },

    excluirCompanhia(id) {
        if (!confirm('Excluir esta companhia aérea?')) return;
        const lista = this.getLista('companhiasAereas').filter(x => x.id !== id);
        this.salvarLista('companhiasAereas', lista);
        this.render();
        this.toast('Companhia excluída!');
    },

    /* ============================================================
       CARTÕES (BANDEIRAS/BANCOS)
       ============================================================ */
    renderCartoes() {
        const container = document.getElementById('config-cartoes');
        if (!container) return;

        const cartoes = this.getLista('cartoes').sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        container.innerHTML = `
            <div class="config-lista">
                ${cartoes.map(c => `
                    <div class="config-item">
                        <span class="config-nome">${this.escapeHtml(c.bandeira)} / ${this.escapeHtml(c.banco)}</span>
                        <div class="config-acoes">
                            <button class="btn btn-xs btn-secondary" onclick="ConfigModule.moverCartao('${c.id}', -1)">▲</button>
                            <button class="btn btn-xs btn-secondary" onclick="ConfigModule.moverCartao('${c.id}', 1)">▼</button>
                            <button class="btn btn-xs btn-primary" onclick="ConfigModule.editarCartao('${c.id}')">Editar</button>
                            <button class="btn btn-xs btn-danger" onclick="ConfigModule.excluirCartao('${c.id}')">Excluir</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:12px;">
                <button class="btn btn-success btn-sm" onclick="ConfigModule.adicionarCartao()">+ Adicionar Cartão</button>
            </div>
        `;
    },

    adicionarCartao() {
        const bandeira = prompt('Bandeira do cartão:');
        if (!bandeira || !bandeira.trim()) return;

        const banco = prompt('Banco/emissor:');
        if (!banco || !banco.trim()) return;

        const lista = this.getLista('cartoes');
        lista.push({
            id: this.gerarId('cartao'),
            bandeira: bandeira.trim(),
            banco: banco.trim(),
            ordem: lista.length + 1
        });
        this.renumerar(lista);
        this.salvarLista('cartoes', lista);
        this.render();
        this.toast('Cartão adicionado!');
    },

    editarCartao(id) {
        const lista = this.getLista('cartoes');
        const c = lista.find(x => x.id === id);
        if (!c) return;

        const bandeira = prompt('Bandeira:', c.bandeira);
        if (bandeira === null) return;
        if (!bandeira.trim()) { this.toast('Bandeira não pode ficar vazia.'); return; }

        const banco = prompt('Banco:', c.banco);
        if (banco === null) return;
        if (!banco.trim()) { this.toast('Banco não pode ficar vazio.'); return; }

        c.bandeira = bandeira.trim();
        c.banco = banco.trim();
        this.salvarLista('cartoes', lista);
        this.render();
        this.toast('Cartão atualizado!');
    },

    excluirCartao(id) {
        if (!confirm('Excluir este cartão?')) return;
        const lista = this.getLista('cartoes').filter(x => x.id !== id);
        this.renumerar(lista);
        this.salvarLista('cartoes', lista);
        this.render();
        this.toast('Cartão excluído!');
    },

    moverCartao(id, direcao) {
        const lista = this.getLista('cartoes').sort((a, b) => a.ordem - b.ordem);
        const idx = lista.findIndex(x => x.id === id);
        if (idx < 0) return;

        const novoIdx = idx + direcao;
        if (novoIdx < 0 || novoIdx >= lista.length) return;

        const temp = lista[idx].ordem;
        lista[idx].ordem = lista[novoIdx].ordem;
        lista[novoIdx].ordem = temp;

        this.salvarLista('cartoes', lista);
        this.render();
    },

    /* ============================================================
       BACKUP E RESTAURAÇÃO
       ============================================================ */
    renderBackup() {
        const container = document.getElementById('config-backup');
        if (!container) return;

        container.innerHTML = `
            <div class="form-grid">
                <div class="card" style="background:var(--bg-light);">
                    <h4>Exportar Backup</h4>
                    <p style="font-size:13px;color:var(--text-muted);">Gere um arquivo JSON com todos os dados do CRM.</p>
                    <button class="btn btn-primary" onclick="ConfigModule.exportarBackup()">📥 Exportar Backup</button>
                </div>
                <div class="card" style="background:var(--bg-light);">
                    <h4>Importar Backup</h4>
                    <p style="font-size:13px;color:var(--text-muted);">Restaure os dados a partir de um arquivo JSON previamente exportado.</p>
                    <input type="file" id="backup-file" class="form-control" accept=".json" onchange="ConfigModule.importarBackup(this)">
                </div>
            </div>
        `;
    },

    exportarBackup() {
        const dados = {};
        const chaves = [
            'agencia', 'clientes', 'negocios', 'vendas', 'viagens',
            'transacoes', 'milhas', 'tarefas', 'eventos',
            'pipelineEtapas', 'servicos', 'companhiasAereas',
            'programasFidelidade', 'cartoes', 'categoriasFinanceiras'
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
        this.toast('Backup exportado!');
    },

    importarBackup(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                if (!dados || typeof dados !== 'object') throw new Error('Arquivo inválido');

                if (!confirm('ATENÇÃO: Isso substituirá todos os dados atuais. Deseja continuar?')) {
                    input.value = '';
                    return;
                }

                Object.keys(dados).forEach(k => {
                    if (dados[k] !== undefined) DB.set(k, dados[k]);
                });

                this.toast('Backup importado com sucesso!');
                input.value = '';
                this.render();

                // Dispara evento para outros módulos recarregarem
                document.dispatchEvent(new CustomEvent('backup-importado'));
            } catch (err) {
                this.toast('Erro ao importar backup: ' + err.message);
                input.value = '';
            }
        };
        reader.readAsText(file);
    },

    /* ============================================================
       HELPERS
       ============================================================ */
    formatNumber(val) {
        const num = parseFloat(val);
        return isNaN(num) ? '0,00' : num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
};

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ConfigModule.init());
} else {
    ConfigModule.init();
}
