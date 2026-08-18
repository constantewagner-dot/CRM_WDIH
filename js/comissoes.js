/* ============================================================
   comissoes.js — Módulo de Comissões
   ============================================================ */

if (typeof window.formatCurrency !== 'function') {
    window.formatCurrency = function (value) {
        return 'R$ ' + (Number(value) || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
}

const ComissoesModule = {
    init() {
        this.render();
    },

    render() {
        const list = document.getElementById('comissoes-list');
        if (!list) return;

        const vendas = DB.getVendas();
        const agencia = DB.getAgencia();
        const percentual = agencia.comissaoPercentual || 10;

        const comissoes = vendas.map(v => ({
            ...v,
            comissao: (v.valor || 0) * (percentual / 100)
        }));

        const totalComissoes = comissoes.reduce((sum, c) => sum + c.comissao, 0);

        list.innerHTML = comissoes.length
            ? `
            <div style="margin-bottom:16px;padding:12px;background:var(--gray-50);border-radius:8px;">
                <strong>Total de Comissões (${percentual}%):</strong> ${formatCurrency(totalComissoes)}
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Serviço</th>
                        <th>Valor da Venda</th>
                        <th>Comissão (${percentual}%)</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    ${comissoes.map(c => `
                        <tr>
                            <td>${c.cliente || '—'}</td>
                            <td>${c.servico || '—'}</td>
                            <td>${formatCurrency(c.valor)}</td>
                            <td><strong>${formatCurrency(c.comissao)}</strong></td>
                            <td>${c.data || '—'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`
            : '<p style="color:var(--gray-500);">Nenhuma venda registrada para calcular comissões</p>';
    }
};
