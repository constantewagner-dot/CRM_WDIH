/* ============================================================
   checkin.js — Check-in das vendas com necessidade de check-in
   ============================================================ */

const CheckinModule = {
    init() { this.render(); },

    render() {
        const el = document.getElementById('checkin-list');
        if (!el) return;
        const vendas = DB.getVendas().filter(v => v.necessidadeCheckin === 'sim');

        el.innerHTML = vendas.length ? `
            <table class="table">
                <thead><tr>
                    <th>Cliente</th><th>Venda</th><th>Terceiro</th><th>Status</th><th>Ações</th>
                </tr></thead>
                <tbody>${vendas.map(v => {
                    const feito = !!v.checkinRealizadoEm;
                    return `
                    <tr>
                        <td>${DB.getClienteNome(v.clienteId)}</td>
                        <td>${v.titulo || '—'}</td>
                        <td>${v.nomeTerceiro || '—'}</td>
                        <td>${feito
                            ? `<span class="badge badge-realizado">Realizado em ${AppModule.formatDate(v.checkinRealizadoEm)}</span>`
                            : `<span class="badge badge-pendente">Pendente</span>`}
                        </td>
                        <td>${feito
                            ? `<button class="btn btn-sm btn-secondary" onclick="CheckinModule.desfazer('${v.id}')">Desfazer</button>`
                            : `<button class="btn btn-sm btn-primary" onclick="CheckinModule.marcar('${v.id}')">Marcar feito</button>`}
                        </td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>` : '<p style="color:var(--gray-500);">Nenhuma venda pendente de check-in 🎉</p>';
    },

    marcar(id) {
        const v = DB.getVendas().find(x => x.id === id);
        if (!v) return;
        v.checkinRealizadoEm = new Date().toISOString();
        v.atualizadoEm = new Date().toISOString();
        DB.saveVenda(v);
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Check-in realizado!', 'success');
    },

    desfazer(id) {
        const v = DB.getVendas().find(x => x.id === id);
        if (!v) return;
        v.checkinRealizadoEm = null;
        DB.saveVenda(v);
        this.render();
        AppModule.updateDashboard();
        AppModule.showToast('Check-in desfeito.', 'info');
    }
};
