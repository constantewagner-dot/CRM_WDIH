/* ============================================================
   financeiro.js — Gestão Financeira
   ============================================================ */

const FinanceiroModule = {
    init() {
        this.render();
        document.getElementById('btn-nova-transacao').addEventListener('click', () => this.openForm());
    },

    render() {
        const transacoes = DB.getTransacoes();
        const tbody = document.querySelector('#tabela-transacoes tbody');
        if (!tbody) return;

        const agora = new Date();
        const mesAtual = agora.getMonth();
        const anoAtual = agora.getFullYear();

        const transacoesMes = transacoes.filter(t => {
            const d = new Date(t.data + 'T00:00:00');
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        });

        const receitas = transacoesMes.filter(t => t.tipo === 'Receita').reduce((s, t) => s + Number(t.valor), 0);
        const despesas = transacoesMes.filter(t => t.tipo === 'Despesa').reduce((s, t) => s + Number(t.valor), 0);
        const saldo = receitas - despesas;
        const nReceitas = transacoesMes.filter(t => t.tipo === 'Receita').length;
        const ticket = nReceitas ? receitas / nReceitas : 0;

        const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const elReceitas = document.getElementById('fin-receitas');
        const elDespesas = document.getElementById('fin-despesas');
        const elSaldo = document.getElementById('fin-saldo');
        const elTicket = document.getElementById('fin-ticket');

        if (elReceitas) elReceitas.textContent = fmt(receitas);
        if (elDespesas) elDespesas.textContent = fmt(despesas);
        if (elSaldo) { elSaldo.textContent = fmt(saldo); elSaldo.style.color = saldo >= 0 ? 'var(--success)' : 'var(--danger)'; }
        if (elTicket) elTicket.textContent = fmt(ticket);

        if (!transacoes.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500);">Nenhuma transação registrada.</td></tr>`;
            return;
        }

        tbody.innerHTML = transacoes.sort((a, b) => new Date(b.data) - new Date(a.data)).map(t => `
            <tr>
                <td>${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td>${t.descricao}</td>
                <td>${t.categoria || '-'}</td>
                <td><span class="badge badge-${t.tipo === 'Receita' ? 'success' : 'danger'}">${t.tipo}</span></td>
                <td style="font-weight:600;color:${t.tipo === 'Receita' ? 'var(--success)' : 'var(--danger)'};">
                    ${t.tipo === 'Receita' ? '+' : '-'} ${fmt(t.valor)}
                </td>
                <td>
                    <button class="btn btn-xs btn-outline" onclick="FinanceiroModule.openForm('${t.id}')">✏️</button>
                    <button class="btn btn-xs btn-danger" onclick="FinanceiroModule.remove('${t.id}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    },

    openForm(id) {
        const t = id ? DB.getTransacoes().find(x => x.id === id)
            : { descricao: '', tipo: 'Receita', categoria: '', valor: 0, data: new Date().toISOString().split('T')[0] };

        const html = `
            <div class="form-group"><label>Descrição *</label><input type="text" id="t-desc" value="${t.descricao}" placeholder="Ex: Comissão venda #123"></div>
            <div class="form-row">
                <div class="form-group"><label>Tipo</label><select id="t-tipo"><option ${t.tipo === 'Receita' ? 'selected' : ''}>Receita</option><option ${t.tipo === 'Despesa' ? 'selected' : ''}>Despesa</option></select></div>
                <div class="form-group"><label>Categoria</label><input type="text" id="t-cat" value="${t.categoria || ''}" placeholder="Ex: Comissões, Marketing"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Valor (R$) *</label><input type="number" id="t-valor" value="${t.valor}" step="0.01" min="0"></div>
                <div class="form-group"><label>Data</label><input type="date" id="t-data" value="${t.data ? t.data.split('T')[0] : ''}"></div>
            </div>
        `;
        AppModule.abrirModal(id ? 'Editar Transação' : 'Nova Transação', html, [
            { label: 'Cancelar', class: 'btn-outline', action: () => AppModule.fecharModal() },
            { label: id ? 'Salvar' : 'Criar', class: 'btn-primary', action: () => this.save(id) }
        ]);
    },

    save(id) {
        const descricao = document.getElementById('t-desc').value.trim();
        const valor = parseFloat(document.getElementById('t-valor').value);
        if (!descricao || !valor) { AppModule.showToast('Descrição e valor são obrigatórios!', 'error'); return; }

        const dados = {
            descricao, tipo: document.getElementById('t-tipo').value,
            categoria: document.getElementById('t-cat').value.trim(),
            valor, data: document.getElementById('t-data').value
        };

        const transacoes = DB.getTransacoes();
        if (id) {
            const idx = transacoes.findIndex(x => x.id === id);
            if (idx >= 0) transacoes[idx] = { ...transacoes[idx], ...dados };
        } else {
            dados.id = DB.gerarId('tr');
            dados.criadoEm = new Date().toISOString();
            transacoes.push(dados);
            DB.logAtividade('financeiro', `${dados.tipo}: ${descricao} - R$ ${valor.toFixed(2)}`);
        }
        DB.setTransacoes(transacoes);
        AppModule.fecharModal();
        this.render();
        AppModule.showToast('Transação salva!', 'success');
    },

    remove(id) {
        if (!confirm('Excluir esta transação?')) return;
        DB.setTransacoes(DB.getTransacoes().filter(t => t.id !== id));
        this.render();
        AppModule.showToast('Transação excluída', 'info');
    }
};
