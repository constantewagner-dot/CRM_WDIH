const BackupModule = {
    exportar() {
        const dados = {};
        Object.keys(localStorage)
            .filter(k => k.startsWith(DB.prefix))
            .forEach(k => {
                dados[k] = localStorage.getItem(k);
            });

        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-crm-wdih-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        AppModule.toast('Backup exportado.');
    },

    importar(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                if (!confirm('Isso substituirá todos os dados atuais. Continuar?')) return;

                DB.clear();
                Object.keys(dados).forEach(k => {
                    localStorage.setItem(k, dados[k]);
                });

                AppModule.toast('Backup restaurado com sucesso!');
                AppModule.init();
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
        AppModule.toast('Dados limpos.');
        AppModule.init();
    }
};
