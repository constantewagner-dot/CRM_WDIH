/* ============================================================
   config.js — Módulo de Configurações
   ============================================================ */

const ConfigModule = {
    init() {
        this.carregarAgencia();
        this.renderPipeline();
        this.renderServicos();
        this.renderCompanhias();
        this.renderProgramas();
        this.renderCartoes();
    },

    /* ---------- Agência ---------- */
    carregarAgencia() {
        const agencia = DB.getAgencia();
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };
        set('cfg-agencia-nome', agencia.nome);
        set('cfg-agencia-cnpj', agencia.cnpj);
        set('cfg-agencia-telefone', agencia.telefone);
        set('cfg-agencia-email', agencia.email);
    },

    salvarAgencia() {
        const agencia = {
            nome: document.getElementById('cfg-agencia-nome').value,
            cnpj: document.getElementById('cfg-agencia-cnpj').value,
            telefone: document.getElementById('cfg-agencia-telefone').value,
            email: document.getElementById('cfg-agencia-email').value
        };
        DB.setAgencia(agencia);
        AppModule.showToast('Dados da agência salvos!', 'success');
    },

    /* ---------- Pipeline (com reordenação) ---------- */
    renderPipeline() {
        const list = document.getElementById('cfg-pipeline-list');
        if (!list) return;

        const stages = DB.getPipelineStages();
        list.innerHTML = stages.map((stage, index) => `
            <div class="stage-item" draggable="true" data-index="${index}">
                <span class="drag-handle" title="Arrastar">⠿</span>
                <input type="text" class="form-control stage-input" value="${stage}" data-index="${index}">
                <button class="btn-icon" onclick="ConfigModule.moverEtapa(${index}, -1)" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="btn-icon" onclick="ConfigModule.moverEtapa(${index}, 1)" title="Mover para baixo" ${index === stages.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="btn-icon btn-danger" onclick="ConfigModule.removerEtapa(${index})" title="Remover">🗑️</button>
            </div>
        `).join('');

        this.setupDragDrop();
    },

    setupDragDrop() {
        const items = document.querySelectorAll('.stage-item');
        let dragged = null;

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                dragged = item;
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                dragged = null;
                this.salvarOrdemPipeline();
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!dragged || dragged === item) return;
                const rect = item.getBoundingClientRect();
                const after = e.clientY > rect.top + rect.height / 2;
                const parent = item.parentNode;
                if (after) {
                    parent.insertBefore(dragged, item.nextSibling);
                } else {
                    parent.insertBefore(dragged, item);
                }
            });
        });
    },

    salvarOrdemPipeline() {
        const inputs = document.querySelectorAll('#cfg-pipeline-list .stage-input');
        const stages = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
        if (stages.length) {
            DB.setPipelineStages(stages);
            AppModule.showToast('Ordem do pipeline atualizada!', 'success');
            PipelineModule.render();
        }
    },

    moverEtapa(index, direction) {
        const stages = DB.getPipelineStages();
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= stages.length) return;

        [stages[index], stages[newIndex]] = [stages[newIndex], stages[index]];
        DB.setPipelineStages(stages);
        this.renderPipeline();
        PipelineModule.render();
    },

    renomearEtapa(index, novoNome) {
        const stages = DB.getPipelineStages();
        stages[index] = novoNome.trim();
        DB.setPipelineStages(stages);
        PipelineModule.render();
    },

    adicionarEtapa() {
        const input = document.getElementById('cfg-nova-etapa');
        const nome = input.value.trim();
        if (!nome) {
            AppModule.showToast('Informe o nome da etapa.', 'danger');
            return;
        }
        const stages = DB.getPipelineStages();
        stages.push(nome);
        DB.setPipelineStages(stages);
        input.value = '';
        this.renderPipeline();
        PipelineModule.render();
        AppModule.showToast('Etapa adicionada!', 'success');
    },

    removerEtapa(index) {
        if (!confirm('Remover esta etapa?')) return;
        const stages = DB.getPipelineStages();
        stages.splice(index, 1);
        DB.setPipelineStages(stages);
        this.renderPipeline();
        PipelineModule.render();
        AppModule.showToast('Etapa removida.', 'danger');
    },

    /* ---------- Listas genéricas ---------- */
    renderLista(containerId, items, removerFn) {
        const list = document.getElementById(containerId);
        if (!list) return;
        list.innerHTML = items.map((item, index) => `
            <div class="list-item">
                <span>${item}</span>
                <button class="btn-icon btn-danger" onclick="${removerFn}(${index})">🗑️</button>
            </div>
        `).join('');
    },

    renderServicos() {
        this.renderLista('cfg-servicos-list', DB.getServicos(), 'ConfigModule.removerServico');
    },

    renderCompanhias() {
        this.renderLista('cfg-companhias-list', DB.getCompanhias(), 'ConfigModule.removerCompanhia');
    },

    renderProgramas() {
        this.renderLista('cfg-programas-list', DB.getProgramas(), 'ConfigModule.removerPrograma');
    },

    renderCartoes() {
        this.renderLista('cfg-cartoes-list', DB.getCartoes(), 'ConfigModule.removerCartao');
    },

    adicionarServico() {
        this.adicionarItem('cfg-novo-servico', DB.getServicos, DB.setServicos, this.renderServicos, 'Serviço');
    },

    adicionarCompanhia() {
        this.adicionarItem('cfg-nova-companhia', DB.getCompanhias, DB.setCompanhias, this.renderCompanhias, 'Companhia');
    },

    adicionarPrograma() {
        this.adicionarItem('cfg-novo-programa', DB.getProgramas, DB.setProgramas, this.renderProgramas, 'Programa');
    },

    adicionarCartao() {
        this.adicionarItem('cfg-novo-cartao', DB.getCartoes, DB.setCartoes, this.renderCartoes, 'Cartão');
    },

    adicionarItem(inputId, getter, setter, renderFn, label) {
        const input = document.getElementById(inputId);
        const valor = input.value.trim();
        if (!valor) {
            AppModule.showToast(`Informe o nome do ${label.toLowerCase()}.`, 'danger');
            return;
        }
        const items = getter.call(DB);
        items.push(valor);
        setter.call(DB, items);
        input.value = '';
        renderFn.call(this);
        AppModule.showToast(`${label} adicionado!`, 'success');
    },

    removerServico(index) {
        this.removerItem(DB.getServicos, DB.setServicos, this.renderServicos, index, 'Serviço');
    },

    removerCompanhia(index) {
        this.removerItem(DB.getCompanhias, DB.setCompanhias, this.renderCompanhias, index, 'Companhia');
    },

    removerPrograma(index) {
        this.removerItem(DB.getProgramas, DB.setProgramas, this.renderProgramas, index, 'Programa');
    },

    removerCartao(index) {
        this.removerItem(DB.getCartoes, DB.setCartoes, this.renderCartoes, index, 'Cartão');
    },

    removerItem(getter, setter, renderFn, index, label) {
        if (!confirm(`Remover este ${label.toLowerCase()}?`)) return;
        const items = getter.call(DB);
        items.splice(index, 1);
        setter.call(DB, items);
        renderFn.call(this);
        AppModule.showToast(`${label} removido.`, 'danger');
    }
};
