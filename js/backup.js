const BackupModule = {
    exportar() {
        const dados = {};
        Object.keys(localStorage)
            .filter(k => k.startsWith(DB.prefix))
            .forEach(k => {
                const chave = k.replace(DB.prefix, '');
                try {
                    dados[chave] = JSON.parse(localStorage.getItem(k));
                } catch (e) {
                    dados[chave] = localStorage.getItem(k);
                }
            });

        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-crm-wdih-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        AppModule.addAtividade('Backup JSON exportado');
        AppModule.toast('Backup exportado.');
    },

    importar(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                const formato = MigracaoModule.detectarFormato(dados);

                if (formato === 'legacy') {
                    if (!confirm('Arquivo do formato antigo detectado. Os dados serão convertidos para a nova estrutura do CRM WDIH. Continuar?')) return;
                    const resumo = MigracaoModule.migrar(dados);
                    AppModule.addAtividade('Backup importado (formato antigo convertido)');
                    AppModule.toast(
                        `Importação concluída: ${resumo.clientes} clientes, ${resumo.negocios} negócios, ${resumo.vendas} vendas e ${resumo.viagens} viagens.`
                    );
                } else if (formato === 'novo') {
                    if (!confirm('Isso substituirá todos os dados atuais. Continuar?')) return;
                    DB.clear();
                    Object.keys(dados).forEach(k => {
                        localStorage.setItem(DB.prefix + k, JSON.stringify(dados[k]));
                    });
                    DB.set('inicializado', true);
                    AppModule.addAtividade('Backup JSON importado');
                    AppModule.toast('Backup restaurado com sucesso!');
                } else {
                    alert('Formato de arquivo não reconhecido.');
                }

                AppModule.init();
                AppModule.openPage(AppModule.currentPage);
            } catch (err) {
                alert('Arquivo inválido.');
                console.error(err);
            }
        };
        reader.readAsText(file);
        input.value = '';
    },

    limpar() {
        if (!confirm('Tem certeza que deseja apagar todos os dados?')) return;
        DB.clear();
        DB.init();
        AppModule.addAtividade('Dados do CRM limpos');
        AppModule.toast('Dados limpos.');
        AppModule.openPage('dashboard');
    }
};
