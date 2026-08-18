/* ============================================================
   backup.js — Módulo de Backup e Restauração
   ============================================================ */

const BackupModule = {
    init() {
        this.setupButtons();
    },

    setupButtons() {
        const btnExportJSON = document.getElementById('btn-export-json');
        const btnExportCSV = document.getElementById('btn-export-csv');
        const btnImport = document.getElementById('btn-import-backup');
        const btnReset = document.getElementById('btn-reset-data');
        const fileInput = document.getElementById('import-file');

        if (btnExportJSON) btnExportJSON.addEventListener('click', () => this.exportJSON());
        if (btnExportCSV) btnExportCSV.addEventListener('click', () => this.exportCSV());
        if (btnImport) btnImport.addEventListener('click', () => fileInput?.click());
        if (btnReset) btnReset.addEventListener('click', () => this.resetData());
        if (fileInput) fileInput.addEventListener('change', (e) => this.importJSON(e));
    },

    getAllData() {
        const data = {};
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('wdih_')) {
                data[key] = localStorage.getItem(key);
            }
        });
        return data;
    },

    exportJSON() {
        const data = this.getAllData();
        this.downloadFile(
            `crm-wdih-backup-${new Date().toISOString().split('T')[0]}.json`,
            JSON.stringify(data, null, 2),
            'application/json'
        );
        AppModule.showToast('Backup JSON exportado!', 'success');
    },

    exportCSV() {
        const negocios = DB.getNegocios();
        const header = 'Cliente;Serviço;Valor;Etapa;Data\n';
        const rows = negocios.map(n =>
            `"${n.cliente || ''}";"${n.servico || ''}";${n.valor || 0};"${n.stage || ''}";${n.dataCriacao || ''}`
        ).join('\n');
        this.downloadFile(
            `crm-wdih-negocios-${new Date().toISOString().split('T')[0]}.csv`,
            '\ufeff' + header + rows,
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
                Object.entries(data).forEach(([key, value]) => {
                    localStorage.setItem(key, value);
                });
                AppModule.showToast('Backup importado com sucesso!', 'success');
                location.reload();
            } catch (err) {
                console.error('Erro ao importar:', err);
                AppModule.showToast('Arquivo inválido.', 'danger');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    resetData() {
        if (!confirm('Tem certeza? Isso apagará TODOS os dados do CRM.')) return;
        if (!confirm('Esta ação não pode ser desfeita. Confirmar reset?')) return;
        DB.resetAll();
        AppModule.showToast('Dados resetados.', 'danger');
        location.reload();
    },

    downloadFile(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};
