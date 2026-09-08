/* ============================================================
   backup.js — Exportar / Importar (sem resetar dados)
   Formato compatível com o backup JSON da versão 2.x
   ============================================================ */

const BackupModule = {
    init() {
        const expJSON = document.getElementById('btn-export-json');
        const expCSV = document.getElementById('btn-export-csv');
        const file = document.getElementById('import-file');

        if (expJSON) expJSON.addEventListener('click', () => this.exportJSON());
        if (expCSV) expCSV.addEventListener('click', () => this.exportCSV());
        if (file) file.addEventListener('change', (e) => this.importJSON(e));
    },

    // Campos que são arrays (para gerar valores padrão corretos)
    camposArray: [
        'clientes', 'negocios', 'vendas', 'viagens', 'transacoes',
        'servicos', 'pipelineStages', 'companhias', 'programas',
        'cartoes', 'atividades', 'milhas'
    ],

    // Monta objeto no MESMO formato do backup (campos no nível raiz)
    collectData() {
        const data = {};
        Object.keys(DB.KEYS).forEach(campo => {
            const raw = localStorage.getItem(DB.KEYS[campo]);
            if (raw !== null && raw !== undefined) {
                try { data[campo] = JSON.parse(raw); }
                catch (e) { data[campo] = raw; }
            } else {
                // Garante que todos os campos existam no arquivo exportado
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

                // Detecta se o backup usa chaves com prefixo (wdih_...) ou nomes de campo (agencia, clientes...)
                const temPrefixo = Object.keys(data).some(k => k.startsWith('wdih_'));

                // Constrói o mapa campo -> valor, aceitando os dois formatos
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

                // Resumo do que será importado
                const resumo = [
                    ['Clientes', this.contar(valores, 'clientes')],
                    ['Negócios', this.contar(valores, 'negocios')],
                    ['Vendas', this.contar(valores, 'vendas')],
                    ['Viagens', this.contar(valores, 'viagens')],
                    ['Transações', this.contar(valores, 'transacoes')],
                    ['Milhas', this.contar(valores, 'milhas')]
                ].filter(r => r[1] !== null)
                 .map(r => `• ${r[0]}: ${r[1]}`)
                 .join('\n');

                if (!confirm('Backup detectado:\n\n' + resumo + '\n\n⚠️ Os dados atuais serão SUBSTITUÍDOS.\nDeseja continuar?')) {
                    return;
                }

                // Grava cada campo no localStorage usando as chaves corretas do DB (com prefixo wdih_)
                Object.keys(valores).forEach(campo => {
                    localStorage.setItem(DB.KEYS[campo], JSON.stringify(valores[campo]));
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

    // Retorna a quantidade de itens de um campo (ou null se o campo não existe)
    contar(valores, campo) {
        const v = valores[campo];
        if (Array.isArray(v)) return v.length;
        if (v !== undefined) return 0;
        return null;
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
