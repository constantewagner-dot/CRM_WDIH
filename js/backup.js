var BackupModule = {
    notificar(msg, tipo = 'success') {
        if (typeof AppModule !== 'undefined') {
            if (typeof AppModule.toast === 'function') AppModule.toast(msg, tipo);
            else if (typeof AppModule.showToast === 'function') AppModule.showToast(msg, tipo);
        }
    },

    exportar() {
        const config = DB.get('config', {});
        const data = {
            agencia: config.agencia || {},
            clientes: DB.get('clientes', []),
            negocios: DB.get('negocios', []),
            vendas: DB.get('vendas', []),
            viagens: DB.get('viagens', []),
            transacoes: DB.get('transacoes', []),
            tarefas: DB.get('tarefas', []),
            milhas: DB.get('milhas', {}),
            atividades: DB.get('atividades', []),
            servicos: config.servicos || [],
            pipelineStages: config.pipeline || [],
            companhias: config.companhias || [],
            programas: config.programas || [],
            cartoes: config.cartoes || [],
            receitas: config.receitas || [],
            despesas: config.despesas || [],
            exportadoEm: new Date().toISOString()
        };

        if (typeof AppModule !== 'undefined' && typeof AppModule.addAtividade === 'function') {
            AppModule.addAtividade('Backup JSON exportado', 'backup');
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crm-wdih-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.notificar('Backup exportado com sucesso!');
    },

    importar(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const json = JSON.parse(e.target.result);
                const formato = MigracaoModule.detectarFormato(json);

                if (formato === 'desconhecido') {
                    BackupModule.notificar('Arquivo inválido ou formato não reconhecido.', 'error');
                    return;
                }

                const log = MigracaoModule.migrar(json);
                input.value = '';

                BackupModule.notificar(
                    `Backup importado! ${log.clientes} clientes, ${log.negocios} negócios, ${log.vendas} vendas, ${log.viagens} viagens.`,
                    'success'
                );

                setTimeout(() => location.reload(), 900);
            } catch (err) {
                console.error('Erro ao importar backup:', err);
                BackupModule.notificar('Erro ao importar backup: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    },

    limpar() {
        const prefix = DB.prefix || 'crm_wdih_';
        if (!confirm('Tem certeza que deseja limpar TODOS os dados? Faça um backup antes. Esta ação não pode ser desfeita.')) return;

        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) localStorage.removeItem(key);
        });
        DB.init();
        location.reload();
    }
};
