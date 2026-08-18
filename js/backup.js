/* ============================================================
   backup.js — Exportar / Importar / Resetar
   Formato compatível com o backup JSON da versão 2.x
   ============================================================ */

const BackupModule = {
    init() {
        const expJSON = document.getElementById('btn-export-json');
        const expCSV = document.getElementById('btn-export-csv');
        const imp = document.getElementById('btn-import-backup');
        const file = document.getElementById('import-file');
        const reset = document.getElementById('btn-reset-data');

        if (expJSON) expJSON.addEventListener('click', () => this.exportJSON());
        if (expCSV) expCSV.addEventListener('click', () => this.exportCSV());
        if (imp) imp.addEventListener('click', () => file && file.click());
        if (file) file.addEventListener('change', (e) => this.importJSON(e));
        if (reset) reset.addEventListener('click', () => this.resetData());
    },

    // Monta objeto no MESMO formato do backup (top-level fields)
    collectData() {
        const data = {};
        Object.keys(DB.KEYS).forEach(campo => {
            const raw = localStorage.getItem(DB.KEYS[campo]);
            if (raw) {
                try { data[campo] = JSON.parse(raw); }
                catch (e) { data[campo] = raw; }
            }
        });
        data.versao = '2.1';
        data.exportadoEm = new Date().toISOString();
        return data;
    },

    exportJSON() {
        const data = this.collectData();
        this.download(
            'crm-wdih-backup-' + new Date().toISOString().split('T')[0] + '.json',
            JSON.stringify(data, null, 2),
            'application/json'
        );
        DB.addAtividade('backup', 'Backup JSON exportado');
        AppModule.showToast('Backup JSON exportado!', 'success');
    },

    exportCSV() {
        const clientes = DB.getClientes();
        const cab = 'Nome;Email;Telefone;CPF;Status;Notas\n';
        const linhas = clientes.map(c =>
            `"${c.nome || ''}";"${c.email || ''}";"${c.telefone || ''}";"${c.cpf || ''}";"${c.status || ''}";"${c.notas || ''}"`
        ).join('\n');
        this.download(
            'crm-wdih-clientes-' + new Date().toISOString().split('T')[0] + '.csv',
            '\ufeff' + cab + linhas,
            'text/csv;charset=utf-8'
        );
        AppModule.showToast('Backup CSV exportado!', 'success');
    },

    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!data || !data.agencia || !Array.isArray(data.clientes)) {
                    throw new Error('O arquivo não parece ser um backup válido do WDIH.');
                }

                const resumo = [
                    ['Clientes', (data.clientes || []).length],
                    ['Negócios', (data.negocios || []).length],
                    ['Vendas', (data.vendas || []).length],
                    ['Viagens', (data.viagens || []).length]
                ].map(([k, v]) => `• ${k}: ${v}`).join('\n');

                if (!confirm('Backup detectado:\n\n' + resumo + '\n\n⚠️ Os dados atuais serão SUBSTITUÍDOS.\nDeseja continuar?')) {
                    return;
                }

                // Grava cada campo no localStorage usando as chaves do DB
                Object.keys(DB.KEYS).forEach(campo => {
                    if (data[campo] !== undefined) {
                        localStorage.setItem(DB.KEYS[campo], JSON.stringify(data[campo]));
                    }
                });

                DB.addAtividade('backup', 'Backup importado');
                AppModule.showToast('Backup importado com sucesso!', 'success');
                setTimeout(() => location.reload(), 800);

            } catch (err) {
                AppModule.showToast('Erro ao importar: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    resetData() {
        if (!confirm('Apagar TODOS os dados do CRM? Esta ação não pode ser desfeita.')) return;
        DB.resetAll();
        AppModule.showToast('Dados resetados.', 'danger');
        setTimeout(() => location.reload(), 800);
    },

    download(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};
