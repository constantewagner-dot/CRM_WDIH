/* ============================================================
   comissoes.js — Comissões calculadas sobre as vendas
   ============================================================ */

const ComissoesModule = {
    init() { this.render(); },

    render() {
        const el = document.getElementById('comissoes-list');
        if (!el) return;

        const vendas = DB.getVendas();
        const agencia = DB.getAgencia();
        const percentual = agencia.comissaoPercentual || 10;

        const total = vendas.reduce((s, v) => s + (Number(v.valorVenda) || 0), 0);
        const comissaoTotal = total * (percentual / 100);

        el.innerHTML = vendas.length ? `
            <div style="margin-bottom:16px;padding:14px;background:var(--gray-50);border-radius:8px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                <div><strong>Total de Vendas:</strong> ${AppModule.formatCurrency(total)}</div>
                <div><strong>Comissões (${percentual}%):</strong> ${AppModule.formatCurrency(comissaoTotal)}</div>
            </div>
            <table class="table">
                <thead><tr>
                    <th>Cliente</th><th>Venda</th><th>Valor</th><th>Comissão</th>
                </tr></thead>
                <tbody>${vendas.map(v => `
                    <tr>
                        <td>${DB.getClienteNome(v.clienteId)}</td>
                        <td>${v.titulo || '—'}</td>
                        <td>${AppModule.formatCurrency(v.valorVenda)}</td>
                        <td><strong>${AppModule.formatCurrency((v.valorVenda || 0) * (percentual / 100))}</strong></td>
                    </tr>`).join('')}
                </tbody>
            </table>` : '<p style="color:var(--gray-500);">Nenhuma venda para calcular comissões</p>';
    }
};
