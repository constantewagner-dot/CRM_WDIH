/* ============================================================
   backup.js — Exportar / Importar (sem resetar dados)
   Importação com popup de confirmação e resumo do que foi atualizado
   ============================================================ */

const BackupModule = {
    _pendente: null,

    init() {
        const expJSON = document.getElementById('btn-export-json');
        const expCSV = document.getElementById('btn-export-csv');
        const file = document.getElementById('import-file');

        if (expJSON) expJSON.addEventListener('click', () => this.exportJSON());
        if (expCSV) expCSV.addEventListener('click', () => this.exportCSV());
        if (file) file.addEventListener('change', (e) => this.importJSON(e));
    },

    camposArray: [
        'clientes', 'negocios', 'vendas', 'viagens', 'transacoes',
        'servicos', 'pipelineStages', 'companhias', 'programas',
        'cartoes', 'atividades', 'milhas'
    ],

    rotulos: {
        agencia: 'Dados da Agência',
        clientes: 'Clientes',
        negocios: 'Negócios',
        vendas: 'Vendas',
        viagens: 'Viagens',
        transacoes: 'Transações Financeiras',
        servicos: 'Serviços',
        pipelineStages: 'Etapas do Pipeline',
        companhias: 'Companhias Aéreas',
        programas: 'Programas de Milhas',
        cartoes: 'Cartões',
        atividades: 'Atividades',
        milhas: 'Milhas'
    },

    // Monta objeto no MESMO formato do backup (campos no nível raiz)
    collectData() {
        const data = {};
        Object.keys(DB.KEYS).forEach(campo => {
            const raw = localStorage.getItem(DB.KEYS[campo]);
            if (raw !== null && raw !== undefined) {
                try { data[campo] = JSON.parse(raw); }
                catch (e) { data[campo] = raw; }
            } else {
                data[campo] = this.camposArray.includes(campo) ? [] : {};
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

    // Gera o resumo legível dos dados do backup
    resumoValores(valores) {
        const linhas = [];
        Object.keys(this.rotulos).forEach(campo => {
            const v = valores[campo];
            if (v === undefined) return;
            const rotulo = this.rotulos[campo];
            if (Array.isArray(v)) {
                linhas.push(`• <strong>${rotulo}</strong>: ${v.length} registro(s)`);
            } else if (typeof v === 'object' && v !== null) {
                linhas.push(`• <strong>${rotulo}</strong>: ${Object.keys(v).length} campo(s)`);
            } else {
                linhas.push(`• <strong>${rotulo}</strong>: ${v}`);
            }
        });
        return linhas.join('<br>') || '—';
    },

    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let data = JSON.parse(e.target.result);

                // Aceita o formato com wrapper { dados: {...} }
                if (data && data.dados && typeof data.dados === 'object' && !Array.isArray(data.dados)) {
                    data = data.dados;
                }

                if (!data || typeof data !== 'object' || Array.isArray(data)) {
                    throw new Error('O arquivo não parece ser um backup válido do WDIH.');
                }

                // Detecta se o backup usa chaves com prefixo (wdih_...) ou nomes de campo
                const temPrefixo = Object.keys(data).some(k => k.startsWith('wdih_'));

                const valores = {};
                Object.keys(DB.KEYS).forEach(campo => {
                    const chave = DB.KEYS[campo];
                    if (data[campo] !== undefined) {
                        valores[campo] = data[campo];
                    } else if (temPrefixo && data[chave] !== undefined) {
                        valores[campo] = data[chave];
                    }
                });

                if (!Object.keys(valores).length) {
                    throw new Error('Nenhum dado reconhecível encontrado no arquivo.');
                }

                const resumo = this.resumoValores(valores);

                // Armazena os dados pendentes e abre popup de confirmação
                this._pendente = valores;

                AppModule.openModal(
                    '📥 Confirmar Importação',
                    `<p style="font-size:13px;color:var(--gray-500);margin-bottom:12px;">O arquivo de backup contém as seguintes informações:</p>
                     <div style="font-size:13px;line-height:1.8;">${resumo}</div>
                     <p style="font-size:13px;color:var(--danger);margin-top:14px;">⚠️ Os dados atuais serão substituídos pelos dados do backup.</p>`,
                    `<button class="btn btn-secondary" onclick="BackupModule.cancelarImportacao()">Cancelar</button>
                     <button class="btn btn-primary" onclick="BackupModule.confirmarImportacao()">Importar</button>`
                );

            } catch (err) {
                AppModule.showToast('Erro ao importar: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    cancelarImportacao() {
        this._pendente = null;
        AppModule.closeModal();
    },

    confirmarImportacao() {
        const valores = this._pendente;
        if (!valores) return;

        // Grava cada campo usando as chaves corretas do DB (prefixo wdih_)
        Object.keys(valores).forEach(campo => {
            localStorage.setItem(DB.KEYS[campo], JSON.stringify(valores[campo]));
        });

        const resumo = this.resumoValores(valores);
        DB.addAtividade('backup', 'Backup importado');
        this._pendente = null;

        // Popup com o resumo do que foi atualizado
        AppModule.openModal(
            '✅ Backup Importado com Sucesso',
            `<p style="font-size:13px;color:var(--gray-500);margin-bottom:12px;">As seguintes informações foram atualizadas:</p>
             <div style="font-size:13px;line-height:1.8;">${resumo}</div>`,
            `<button class="btn btn-primary" onclick="BackupModule.finalizarImportacao()">OK</button>`
        );
    },

    finalizarImportacao() {
        AppModule.closeModal();
        AppModule.showToast('Backup importado com sucesso!', 'success');
        setTimeout(() => location.reload(), 800);
    },

    download(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
