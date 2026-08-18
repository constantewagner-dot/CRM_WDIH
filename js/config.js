/* ============================================================
   config.js — Configurações + reordenação do pipeline
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

    carregarAgencia() {
        const a = DB.getAgencia();
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
        set('cfg-agencia-nome', a.nome);
        set('cfg-agencia-cnpj', a.cnpj);
        set('cfg-agencia-telefone', a.telefone);
        set('cfg-agencia-email', a.email);
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

    /* ---------- Pipeline (reordenação) ---------- */
    renderPipeline() {
        const list = document.getElementById('cfg-pipeline-list');
        if (!list) return;
        const stages = DB.getPipelineStages();

        list.innerHTML = stages.map((s, i) => `
            <div class="stage-item" draggable="true" data-index="${i}">
                <span class="drag-handle">⠿</span>
                <input type="text" class="form-control stage-input" value="${s}" data-index="${i}">
                <button class="btn-icon" onclick="ConfigModule.moverEtapa(${i}, -1)" ${i === 0 ? 'disabled' : ''}>↑</button>
                <button class="btn-icon" onclick="ConfigModule.moverEtapa(${i}, 1)" ${i === stages.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="btn-icon btn-danger" onclick="ConfigModule.removerEtapa(${i})">🗑️</button>
            </div>`).join('');

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
                this.salvarOrdem();
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!dragged || dragged === item) return;
                const rect = item.getBoundingClientRect();
                const after = e.clientY > rect.top + rect.height / 2;
                const parent = item.parentNode;
                if (after) parent.insertBefore(dragged, item.nextSibling);
                else parent.insertBefore(dragged, item);
            });
        });
    },

    salvarOrdem() {
        const inputs = document.querySelectorAll('#cfg-pipeline-list .stage-input');
        const stages = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
        if (stages.length) {
            DB.setPipelineStages(stages);
            PipelineModule.render();
            AppModule.showToast('Ordem do pipeline atualizada!', 'success');
        }
    },

    moverEtapa(index, dir) {
        const stages = DB.getPipelineStages();
        const novo = index + dir;
        if (novo < 0 || novo >= stages.length) return;
        [stages[index], stages[novo]] = [stages[novo], stages[index]];
        DB.setPipelineStages(stages);
        this.renderPipeline();
        PipelineModule.render();
    },

    adicionarEtapa() {
        const input = document.getElementById('cfg-nova-etapa');
        const nome = input.value.trim();
        if (!nome) { AppModule.showToast('Informe o nome da etapa.', 'danger'); return; }
        const stages = DB.getPipelineStages();
        stages.push(nome);
        DB.setPipelineStages(stages);
        input.value = '';
        this.renderPipeline();
        PipelineModule.render();
        AppModule.showToast('Etapa adicionada!', 'success');
    },

    removerEtapa(i) {
        if (!confirm('Remover esta etapa?')) return;
        const stages = DB.getPipelineStages();
        stages.splice(i, 1);
        DB.setPipelineStages(stages);
        this.renderPipeline();
        PipelineModule.render();
        AppModule.showToast('Etapa removida.', 'danger');
    },

    /* ---------- Listas genéricas ---------- */
    renderLista(containerId, items, fnRemover) {
        const list = document.getElementById(containerId);
        if (!list) return;
        list.innerHTML = items.map((item, i) => `
            <div class="list-item"><span>${item}</span>
                <button class="btn-icon btn-danger" onclick="${fnRemover}(${i})">🗑️</button>
            </div>`).join('');
    },

    renderServicos() { this.renderLista('cfg-servicos-list', DB.getServicos(), 'ConfigModule.removerServico'); },
    renderCompanhias() { this.renderLista('cfg-companhias-list', DB.getCompanhias(), 'ConfigModule.removerCompanhia'); },
    renderProgramas() { this.renderLista('cfg-programas-list', DB.getProgramas(), 'ConfigModule.removerPrograma'); },
    renderCartoes() { this.renderLista('cfg-cartoes-list', DB.getCartoes(), 'ConfigModule.removerCartao'); },

    adicionarServico() { this.addItem('cfg-novo-servico', DB.getServicos, DB.setServicos, this.renderServicos, 'Serviço'); },
    adicionarCompanhia() { this.addItem('cfg-nova-companhia', DB.getCompanhias, DB.setCompanhias, this.renderCompanhias, 'Companhia'); },
    adicionarPrograma() { this.addItem('cfg-novo-programa', DB.getProgramas, DB.setProgramas, this.renderProgramas, 'Programa'); },
    adicionarCartao() { this.addItem('cfg-novo-cartao', DB.getCartoes, DB.setCartoes, this.renderCartoes, 'Cartão'); },

    addItem(inputId, getter, setter, renderFn, label) {
        const input = document.getElementById(inputId);
        const valor = input.value.trim();
        if (!valor) { AppModule.showToast(`Informe o nome do ${label.toLowerCase()}.`, 'danger'); return; }
        const items = getter.call(DB);
        items.push(valor);
        setter.call(DB, items);
        input.value = '';
        renderFn.call(this);
        AppModule.showToast(`${label} adicionado!`, 'success');
    },

    removerServico(i) { this.remItem(DB.getServicos, DB.setServicos, this.renderServicos, i, 'Serviço'); },
    removerCompanhia(i) { this.remItem(DB.getCompanhias, DB.setCompanhias, this.renderCompanhias, i, 'Companhia'); },
    removerPrograma(i) { this.remItem(DB.getProgramas, DB.setProgramas, this.renderProgramas, i, 'Programa'); },
    removerCartao(i) { this.remItem(DB.getCartoes, DB.setCartoes, this.renderCartoes, i, 'Cartão'); },

    remItem(getter, setter, renderFn, i, label) {
        if (!confirm(`Remover este ${label.toLowerCase()}?`)) return;
        const items = getter.call(DB);
        items.splice(i, 1);
        setter.call(DB, items);
        renderFn.call(this);
        AppModule.showToast(`${label} removido.`, 'danger');
    }
};
