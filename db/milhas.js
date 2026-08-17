/* ============================================================
   milhas.js — Gestão de Milhas
   (Planos: Gestão Mensal, Consultoria Premium, Plano de Indicação)
   ============================================================ */

const MilhasModule = {
    init() {
        this.render();
        document.getElementById('btn-nova-milha').addEventListener('click', () => this.abrirModal());
    },
    refresh() { this.render(); },

    render() {
        const milhas = DB.getMilhas();
        const clientes = DB.getClientes();
        const tbody = document.getElementById('milhas-tbody');
        const empty = document.getElementById('milhas-empty');
        if (!tbody) return;

        if (!milhas.length) {
            tbody.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        tbody.innerHTML = milhas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).map(m => {
            const cliente = clientes.find(c => c.id === m.clienteId);
            return `
                <tr>
                    <td><strong>${cliente ? cliente.nome : '—'}</strong></td>
                    <td><span class="badge badge-plano">${m.tipoPlano || '—'}</span></td>
                    <td>${m.objetivo || '—'}</td>
                    <td>${this.fmtData(m.dataFechamento)}</td>
                    <td>${this.fmtData(m.dataApresentacaoDiagnostico)}</td>
                    <td>${this.fmtData(m.dataApresentacaoPlano)}</td>
                    <td>${this.fmtData(m.dataApresentacaoRelatorio)}</td>
                    <td>${this.statusBadge(m.status)}</td>
                    <td class="venda-actions">
                        <button class="btn-sm btn-sm-primary" onclick="MilhasModule.abrirModal('${m.id}')" title="Editar">✏️</button>
                        <button class="btn-sm btn-sm-danger" onclick="MilhasModule.excluir('${m.id}')" title="Excluir">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    statusBadge(status) {
        const map = {
            'Em andamento': 'badge-info',
            'Concluído': 'badge-success',
            'Cancelado': 'badge-danger'
        };
        return `<span class="badge ${map[status] || 'badge-info'}">${status || 'Em andamento'}</span>`;
    },

    fmtData(d) {
        if (!d) return '—';
        return new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('pt-BR');
    },

    abrirModal(milhaId) {
        const milha = milhaId ? DB.getMilhas().find(m => m.id === milhaId) : null;
        const clientes = DB.getClientes();
        const planos = DB.getPlanosMilhas();

        const optionsClientes = clientes.map(c => `<option value="${c.id}" ${milha && milha.clienteId === c.id ? 'selected' : ''}>${c.nome}</option>`).join('');
        const optionsPlanos = planos.map(p => `<option value="${p}" ${milha && milha.tipoPlano === p ? 'selected' : ''}>${p}</option>`).join('');

        const status = milha ? milha.status : 'Em andamento';

        const html = `
            <form id="form-milha" onsubmit="MilhasModule.salvar(event, '${milhaId || ''}')">
                <div class="form-row">
                    <div class="form-group"><label>Cliente</label><select id="m-cliente"><option value="">Selecione...</option>${optionsClientes}</select></div>
                    <div class="form-group"><label>💎 Tipo de Plano</label><select id="m-plano">${optionsPlanos}</select></div>
                </div>
                <div class="form-group"><label>🎯 Objetivo Definido</label><textarea id="m-objetivo" rows="2">${milha ? milha.objetivo || '' : ''}</textarea></div>
                <div class="form-group"><label>🔍 Diagnóstico do Cliente</label><textarea id="m-diagnostico" rows="3">${milha ? milha.diagnostico || '' : ''}</textarea></div>
                <div class="form-row">
                    <div class="form-group"><label>📅 Data de Fechamento</label><input type="date" id="m-data-fechamento" value="${milha ? milha.dataFechamento || '' : ''}"></div>
                    <div class="form-group"><label>📊 Apresentação do Diagnóstico</label><input type="date" id="m-data-diagnostico" value="${milha ? milha.dataApresentacaoDiagnostico || '' : ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>📋 Apresentação dos Planos</label><input type="date" id="m-data-plano" value="${milha ? milha.dataApresentacaoPlano || '' : ''}"></div>
                    <div class="form-group"><label>📑 Relatório para o Cliente</label><input type="date" id="m-data-relatorio" value="${milha ? milha.dataApresentacaoRelatorio || '' : ''}"></div>
                </div>
                <div class="form-group"><label>Status</label><select id="m-status"><option ${status === 'Em andamento' ? 'selected' : ''}>Em andamento</option><option ${status === 'Concluído' ? 'selected' : ''}>Concluído</option><option ${status === 'Cancelado' ? 'selected' : ''}>Cancelado</option></select></div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="AppModule.fecharModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">💾 Salvar</button>
                </div>
            </form>
        `;
        AppModule.abrirModal(milha ? 'Editar Card de Milhas' : 'Novo Card de Milhas', html);
    },

    salvar(event, milhaId) {
        event.preventDefault();

        const dados = {
            id: milhaId || DB.gerarId('milha'),
            clienteId: document.getElementById('m-cliente').value || null,
            tipoPlano: document.getElementById('m-plano').value,
            objetivo: document.getElementById('m-objetivo').value.trim(),
            diagnostico: document.getElementById('m-diagnostico').value.trim(),
            dataFechamento: document.getElementById('m-data-fechamento').value,
            dataApresentacaoDiagnostico: document.getElementById('m-data-diagnostico').value,
            dataApresentacaoPlano: document.getElementById('m-data-plano').value,
            dataApresentacaoRelatorio: document.getElementById('m-data-relatorio').value,
            status: document.getElementById('m-status').value
        };

        if (milhaId) {
            const existente = DB.getMilhas().find(m => m.id === milhaId);
            if (existente) {
                Object.assign(existente, dados);
                DB.saveMilha(existente);
            }
        } else {
            dados.titulo = 'Gestão de Milhas';
            dados.criadoEm = new Date().toISOString();
            DB.saveMilha(dados);
            DB.logAtividade('milhas', `Card de Gestão de Milhas criado manualmente`);
        }

        AppModule.fecharModal();
        this.render();
        AppModule.showToast('Card de Milhas salvo!', 'success');
    },

    excluir(id) {
        if (!confirm('Excluir este card de gestão de milhas?')) return;
        DB.deleteMilha(id);
        this.render();
        AppModule.showToast('Card excluído', 'info');
    }
};
