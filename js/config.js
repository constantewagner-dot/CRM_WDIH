/* ============================================================
   config.js — Configurações (com reordenação de etapas)
   ============================================================ */

const ConfigModule = {
    init() {
        this.carregarAgencia();
        this.renderPipeline();
        this.renderServicos();
        this.renderCompanhias();
        this.renderProgramas();
        this.renderCartoes();

        document.getElementById('btn-export-json').addEventListener('click', () => BackupModule && BackupModule.exportJSON());
        document.getElementById('btn-export-csv').addEventListener('click', () => BackupModule && BackupModule.exportCSV());
        document.getElementById('btn-import-backup').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => BackupModule && BackupModule.importJSON(e));
        document.getElementById('btn-reset-data').addEventListener('click', () => BackupModule && BackupModule.resetData());
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
        AppModule.showToast('Dados salvos!', 'success');
    },

    /* ===========================
       PIPELINE — Reordenação
       =========================== */
    renderPipeline() {
        const stages = DB.getPipelineStages();
        const el = document.getElementById('cfg-pipeline-list');
        if (!el) return;

        if (!stages.length) {
            el.innerHTML = '<p style="color:var(--gray-500);font-size:12px;padding:8px 0;">Nenhuma etapa cadastrada.</p>';
            return;
        }

        el.innerHTML = stages.map((s, i) => {
            const podeSubir = i > 0;
            const podeDescer = i < stages.length - 1;
            return `
                <div class="config-list-item draggable"
                     draggable="true"
                     data-index="${i}"
                     ondragstart="ConfigModule.dragStart(event, ${i})"
                     ondragover="ConfigModule.dragOver(event, ${i})"
                     ondragleave="ConfigModule.dragLeave(event)"
                     ondrop="ConfigModule.drop(event, ${i})"
                     ondragend="ConfigModule.dragEnd(event)">
                    <span class="drag-handle" title="Arraste para reordenar">⠿</span>
                    <span class="etapa-numero">${i + 1}</span>
                    <span class="etapa-nome">${s}</span>
                    <span class="etapa-acoes">
                        <button class="btn-move-up" onclick="ConfigModule.moverEtapa(${i}, -1)" ${!podeSubir ? 'disabled style="opacity:.3;cursor:not-allowed;"' : ''} title="Mover para cima">↑</button>
                        <button class="btn-move-down" onclick="ConfigModule.moverEtapa(${i}, 1)" ${!podeDescer ? 'disabled style="opacity:.3;cursor:not-allowed;"' : ''} title="Mover para baixo">↓</button>
                        <button class="btn-edit" onclick="ConfigModule.editarEtapa(${i})" title="Renomear">✏️</button>
                        <button class="btn-delete" onclick="ConfigModule.removerEtapa(${i})" title="Remover">🗑️</button>
                    </span>
                </div>
            `;
        }).join('');
    },

    /* Drag & Drop */
    _dragIndex: null,

    dragStart(e, index) {
        this._dragIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        setTimeout(() => e.target.classList.add('dragging'), 0);
    },

    dragOver(e, index) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const item = e.target.closest('.config-list-item.draggable');
        if (item && this._dragIndex !== index) {
            item.classList.add('drag-over');
        }
    },

    dragLeave(e) {
        const item = e.target.closest('.config-list-item.draggable');
        if (item) item.classList.remove('drag-over');
    },

    drop(e, targetIndex) {
        e.preventDefault();
        const item = e.target.closest('.config-list-item.draggable');
        if (item) item.classList.remove('drag-over');

        if (this._dragIndex === null || this._dragIndex === targetIndex) return;

        const stages = DB.getPipelineStages();
        const [movido] = stages.splice(this._dragIndex, 1);
        stages.splice(targetIndex, 0, movido);
        DB.setPipelineStages(stages);

        this._dragIndex = null;
        this.renderPipeline();
        AppModule.showToast('Etapas reordenadas! ✅', 'success');
    },

    dragEnd(e) {
        const item = e.target.closest('.config-list-item.draggable');
        if (item) item.classList.remove('dragging');
        document.querySelectorAll('.config-list-item.draggable').forEach(el => el.classList.remove('drag-over'));
        this._dragIndex = null;
    },

    /* Botões ↑ ↓ */
    moverEtapa(index, direcao) {
        const stages = DB.getPipelineStages();
        const novoIndex = index + direcao;
        if (novoIndex < 0 || novoIndex >= stages.length) return;

        const temp = stages[index];
        stages[index] = stages[novoIndex];
        stages[novoIndex] = temp;

        DB.setPipelineStages(stages);
        this.renderPipeline();
        AppModule.showToast('Etapas reordenadas! ✅', 'success');
    },

    /* Editar nome da etapa */
    editarEtapa(index) {
        const stages = DB.getPipelineStages();
        const nomeAtual = stages[index];
        const novoNome = prompt('Renomear etapa:', nomeAtual);
        if (!novoNome || !novoNome.trim()) return;
        if (novoNome.trim() === nomeAtual) return;

        stages[index] = novoNome.trim();
        DB.setPipelineStages(stages);

        // Atualiza negócios que estavam na etapa antiga
        const negocios = DB.getNegocios();
        let atualizados = 0;
        negocios.forEach(n => {
            if (n.stage === nomeAtual) {
                n.stage = novoNome.trim();
                DB.saveNegocio(n);
                atualizados++;
            }
        });

        this.renderPipeline();
        AppModule.showToast(`Etapa renomeada! ${atualizados > 0 ? `(${atualizados} negócios atualizados)` : ''}`, 'success');
    },

    adicionarEtapa() {
        const input = document.getElementById('cfg-nova-etapa');
        const nome = input.value.trim();
        if (!nome) { AppModule.showToast('Digite um nome!', 'error'); return; }

        const stages = DB.getPipelineStages();
        if (stages.some(s => s.toLowerCase() === nome.toLowerCase())) {
            AppModule.showToast('Etapa já existe!', 'error');
            return;
        }

        // Pergunta se deve inserir antes de "Fechado" ou no final
        const fechadosIdx = stages.findIndex(s => s.toLowerCase().includes('fechado'));
        if (fechadosIdx > -1 && confirm('Deseja inserir ANTES das etapas "Fechado"? (Cancele para adicionar ao final)')) {
            stages.splice(fechadosIdx, 0, nome);
        } else {
            stages.push(nome);
        }

        DB.setPipelineStages(stages);
        input.value = '';
        this.renderPipeline();
        AppModule.showToast('Etapa adicionada! ✅', 'success');
    },

    removerEtapa(i) {
        const stages = DB.getPipelineStages();
        const nome = stages[i];

        // Verifica se há negócios nesta etapa
        const negociosNaEtapa = DB.getNegocios().filter(n => n.stage === nome).length;
        if (negociosNaEtapa > 0) {
            if (!confirm(`⚠️ Existem ${negociosNaEtapa} negócio(s) nesta etapa. Eles serão movidos para a etapa anterior. Continuar?`)) return;

            const negocios = DB.getNegocios();
            negocios.forEach(n => {
                if (n.stage === nome) {
                    n.stage = i > 0 ? stages[i - 1] : (stages.length > 1 ? stages[i + 1] : '');
                    DB.saveNegocio(n);
                }
            });
        } else {
            if (!confirm(`Remover a etapa "${nome}"?`)) return;
        }

        stages.splice(i, 1);
        DB.setPipelineStages(stages);
        this.renderPipeline();
        AppModule.showToast('Etapa removida', 'info');
    },

    /* ===========================
       SERVIÇOS
       =========================== */
    renderServicos() {
        const s = DB.getServicos();
        const el = document.getElementById('cfg-servicos-list');
        if (!el) return;
        el.innerHTML = s.map((x, i) => `<div class="config-list-item"><span>${x}</span><button onclick="ConfigModule.removerServico(${i})">🗑️</button></div>`).join('');
    },
    adicionarServico() {
        const input = document.getElementById('cfg-novo-servico');
        const nome = input.value.trim();
        if (!nome) return;
        const s = DB.getServicos(); s.push(nome); DB.setServicos(s); input.value = ''; this.renderServicos();
        AppModule.showToast('Serviço adicionado!', 'success');
    },
    removerServico(i) { const s = DB.getServicos(); s.splice(i, 1); DB.setServicos(s); this.renderServicos(); },

    /* ===========================
       COMPANHIAS
       =========================== */
    renderCompanhias() {
        const s = DB.getCompanhias();
        const el = document.getElementById('cfg-companhias-list');
        if (!el) return;
        el.innerHTML = s.map((x, i) => `<div class="config-list-item"><span>${x}</span><button onclick="ConfigModule.removerCompanhia(${i})">🗑️</button></div>`).join('');
    },
    adicionarCompanhia() {
        const input = document.getElementById('cfg-nova-companhia');
        const nome = input.value.trim();
        if (!nome) return;
        const s = DB.getCompanhias(); s.push(nome); DB.setCompanhias(s); input.value = ''; this.renderCompanhias();
        AppModule.showToast('Companhia adicionada!', 'success');
    },
    removerCompanhia(i) { const s = DB.getCompanhias(); s.splice(i, 1); DB.setCompanhias(s); this.renderCompanhias(); },

    /* ===========================
       PROGRAMAS
       =========================== */
    renderProgramas() {
        const s = DB.getProgramas();
        const el = document.getElementById('cfg-programas-list');
        if (!el) return;
        el.innerHTML = s.map((x, i) => `<div class="config-list-item"><span>${x}</span><button onclick="ConfigModule.removerPrograma(${i})">🗑️</button></div>`).join('');
    },
    adicionarPrograma() {
        const input = document.getElementById('cfg-novo-programa');
        const nome = input.value.trim();
        if (!nome) return;
        const s = DB.getProgramas(); s.push(nome); DB.setProgramas(s); input.value = ''; this.renderProgramas();
        AppModule.showToast('Programa adicionado!', 'success');
    },
    removerPrograma(i) { const s = DB.getProgramas(); s.splice(i, 1); DB.setProgramas(s); this.renderProgramas(); },

    /* ===========================
       CARTÕES
       =========================== */
    renderCartoes() {
        const s = DB.getCartoes();
        const el = document.getElementById('cfg-cartoes-list');
        if (!el) return;
        el.innerHTML = s.map((x, i) => `<div class="config-list-item"><span>${x}</span><button onclick="ConfigModule.removerCartao(${i})">🗑️</button></div>`).join('');
    },
    adicionarCartao() {
        const input = document.getElementById('cfg-novo-cartao');
        const nome = input.value.trim();
        if (!nome) return;
        const s = DB.getCartoes(); s.push(nome); DB.setCartoes(s); input.value = ''; this.renderCartoes();
        AppModule.showToast('Cartão adicionado!', 'success');
    },
    removerCartao(i) { const s = DB.getCartoes(); s.splice(i, 1); DB.setCartoes(s); this.renderCartoes(); }
};
