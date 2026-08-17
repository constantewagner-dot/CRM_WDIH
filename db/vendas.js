/* ============================================================
   vendas.js — Gestão de Vendas Fechadas
   (Check-in removido — agora em Viagens)
   ============================================================ */

const VendasModule = {
    init() { this.refresh(); },
    refresh() { this.renderLista(); },

    renderLista() {
        const vendas = DB.getVendas().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
        const clientes = DB.getClientes();
        const tbody = document.getElementById('vendas-tbody');
        const empty = document.getElementById('vendas-empty');
        if (!tbody) return;

        if (!vendas.length) {
            tbody.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        tbody.innerHTML = vendas.map(v => {
            const cliente = clientes.find(c => c.id === v.clienteId);
            const isNovo = v.novo;
            const tipoLabel = this.getTipoLabel(v.tipoVenda);
            const valorOriginal = Number(v.valorOriginal || 0);
            const valorVenda = Number(v.valorVenda || 0);
            const diferenca = valorVenda - valorOriginal;

            const fmt = (x) => 'R$ ' + x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const diffClass = diferenca >= 0 ? 'diff-positiva' : 'diff-negativa';
            const diffSinal = diferenca >= 0 ? '+' : '';

            return `
                <tr class="${isNovo ? 'venda-nova' : ''}">
                    <td>
                        ${isNovo ? '<span class="badge badge-novo">🆕 NOVO</span> ' : ''}
                        <strong>${v.titulo}</strong>
                        ${v.servico ? `<br><small style="color:var(--gray-500);">${v.servico}</small>` : ''}
                    </td>
                    <td>${cliente ? cliente.nome : '—'}</td>
                    <td>${tipoLabel}</td>
                    <td>${fmt(valorOriginal)}</td>
                    <td><strong>${fmt(valorVenda)}</strong></td>
                    <td class="${diffClass}">${diffSinal}${fmt(diferenca)}</td>
                    <td>${this.formatDate(v.dataFechamento || v.criadoEm)}</td>
                    <td class="venda-actions">
                        <button class="btn-sm btn-sm-primary" onclick="VendasModule.abrirModalVenda('${v.id}')" title="Editar Venda">✏️</button>
                        <button class="btn-sm btn-sm-danger" onclick="VendasModule.excluirVenda('${v.id}')" title="Excluir">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    getTipoLabel(tipo) {
        const map = {
            'dinheiro': '💵 Dinheiro',
            'milhas_proprias': '✈️ Milhas Próprias',
            'milhas_terceiros': '🔄 Milhas de Terceiros'
        };
        return map[tipo] || '💵 Dinheiro';
    },

    abrirModalVenda(vendaId) {
        const venda = vendaId ? DB.getVendaById(vendaId) : null;
        if (!venda) return;

        const html = `
            <form id="form-venda" onsubmit="VendasModule.salvarVenda(event, '${venda.id}')">
                <div class="form-group"><label>Título da Venda</label><input type="text" id="venda-titulo" value="${venda.titulo || ''}" required></div>
                <div class="form-row">
                    <div class="form-group"><label>💲 Valor Original (R$)</label><input type="number" id="venda-valor-original" step="0.01" value="${venda.valorOriginal || 0}"></div>
                    <div class="form-group"><label>💰 Valor da Venda (R$)</label><input type="number" id="venda-valor-venda" step="0.01" value="${venda.valorVenda || 0}"></div>
                </div>
                <div class="form-group">
                    <label>💳 Tipo de Venda</label>
                    <select id="venda-tipo">
                        <option value="dinheiro" ${venda.tipoVenda === 'dinheiro' ? 'selected' : ''}>💵 Dinheiro</option>
                        <option value="milhas_proprias" ${venda.tipoVenda === 'milhas_proprias' ? 'selected' : ''}>✈️ Milhas do Próprio Cliente</option>
                        <option value="milhas_terceiros" ${venda.tipoVenda === 'milhas_terceiros' ? 'selected' : ''}>🔄 Milhas de Terceiros</option>
                    </select>
                </div>
                <div class="form-group" id="grupo-terceiro" style="display:${venda.tipoVenda === 'milhas_terceiros' ? 'block' : 'none'};">
                    <label>👤 Nome do Terceiro</label>
                    <input type="text" id="venda-terceiro" value="${venda.nomeTerceiro || ''}" placeholder="Nome do fornecedor de milhas">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="AppModule.fecharModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">💾 Salvar</button>
                </div>
            </form>
        `;

        AppModule.abrirModal('Editar Venda', html);

        setTimeout(() => {
            const tipoSelect = document.getElementById('venda-tipo');
            const grupoTerceiro = document.getElementById('grupo-terceiro');
            if (tipoSelect && grupoTerceiro) {
                tipoSelect.addEventListener('change', () => {
                    grupoTerceiro.style.display = tipoSelect.value === 'milhas_terceiros' ? 'block' : 'none';
                });
            }
        }, 100);
    },

    salvarVenda(event, vendaId) {
        event.preventDefault();
        const venda = DB.getVendaById(vendaId);
        if (!venda) return;
        venda.titulo = document.getElementById('venda-titulo').value;
        venda.valorOriginal = parseFloat(document.getElementById('venda-valor-original').value) || 0;
        venda.valorVenda = parseFloat(document.getElementById('venda-valor-venda').value) || 0;
        venda.tipoVenda = document.getElementById('venda-tipo').value;
        venda.nomeTerceiro = document.getElementById('venda-terceiro').value;
        venda.novo = false;
        DB.saveVenda(venda);
        AppModule.fecharModal();
        this.renderLista();
        AppModule.showToast('Venda atualizada com sucesso! ✅', 'success');
    },

    excluirVenda(id) {
        if (!confirm('Tem certeza que deseja excluir esta venda?')) return;
        const venda = DB.getVendaById(id);
        if (venda && venda.negocioId) {
            const negocio = DB.getNegocios().find(n => n.id === venda.negocioId);
            if (negocio) { negocio.vendaId = null; DB.saveNegocio(negocio); }
        }
        DB.deleteVenda(id);
        this.renderLista();
        AppModule.showToast('Venda excluída 🗑️', 'info');
    },

    formatDate(iso) {
        if (!iso) return '—';
        return new Date(iso.includes('T') ? iso : iso + 'T00:00:00').toLocaleDateString('pt-BR');
    }
};
