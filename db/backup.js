/* ============================================================
   backup.js — Backup, Exportação e Importação
   ============================================================ */

const BackupModule = {
    init() {},

    exportJSON() {
        const data = {
            versao: '3.0',
            exportadoEm: new Date().toISOString(),
            agencia: DB.getAgencia(),
            clientes: DB.getClientes(),
            negocios: DB.getNegocios(),
            vendas: DB.getVendas(),
            viagens: DB.getViagens(),
            milhas: DB.getMilhas(),
            transacoes: DB.getTransacoes(),
            servicos: DB.getServicos(),
            pipelineStages: DB.getPipelineStages(),
            companhias: DB.getCompanhias(),
            programas: DB.getProgramas(),
            cartoes: DB.getCartoes(),
            atividades: DB.getAtividades()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wdih-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        AppModule.showToast('Backup exportado com sucesso!', 'success');
        DB.logAtividade('backup', 'Backup JSON exportado');
    },

    exportCSV() {
        const clientes = DB.getClientes();
        const negocios = DB.getNegocios();
        const transacoes = DB.getTransacoes();

        const toCSV = (data, headers) => {
            if (!data.length) return '';
            const rows = data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(';'));
            return [headers.join(';'), ...rows].join('\n');
        };

        const download = (content, filename) => {
            const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
        };

        download(toCSV(clientes, ['id', 'nome', 'email', 'telefone', 'cpf', 'status', 'criadoEm']), 'clientes.csv');
        setTimeout(() => download(toCSV(negocios, ['id', 'titulo', 'clienteId', 'valor', 'stage', 'origemLead', 'campanha', 'dataFechamento', 'criadoEm']), 'negocios.csv'), 500);
        setTimeout(() => download(toCSV(transacoes, ['id', 'descricao', 'tipo', 'categoria', 'valor', 'data']), 'transacoes.csv'), 1000);

        AppModule.showToast('CSVs exportados!', 'success');
        DB.logAtividade('backup', 'CSVs exportados');
    },

    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!confirm('Isso irá substituir TODOS os dados atuais. Deseja continuar?')) return;

                if (data.clientes) DB.setClientes(data.clientes);
                if (data.negocios) DB.setNegocios(data.negocios);
                if (data.vendas) DB._set('vendas', data.vendas);
                if (data.viagens) DB.setViagens(data.viagens);
                if (data.milhas) DB.setMilhas(data.milhas);
                if (data.transacoes) DB.setTransacoes(data.transacoes);
                if (data.servicos) DB.setServicos(data.servicos);
                if (data.pipelineStages) DB.setPipelineStages(data.pipelineStages);
                if (data.companhias) DB.setCompanhias(data.companhias);
                if (data.programas) DB.setProgramas(data.programas);
                if (data.cartoes) DB.setCartoes(data.cartoes);
                if (data.agencia) DB.setAgencia(data.agencia);
                if (data.atividades) DB._set('atividades', data.atividades);

                DB.logAtividade('backup', 'Backup importado');
                AppModule.showToast('Backup restaurado! Recarregando...', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                AppModule.showToast('Arquivo inválido!', 'error');
                console.error(err);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    resetData() {
        if (!confirm('⚠️ ATENÇÃO: Isso apagará TODOS os dados permanentemente! Deseja continuar?')) return;
        if (!confirm('Tem CERTEZA ABSOLUTA? Esta ação é irreversível!')) return;
        DB.clearAll();
        AppModule.showToast('Dados resetados. Recarregando...', 'info');
        setTimeout(() => window.location.reload(), 1500);
    }
};
