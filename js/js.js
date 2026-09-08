/* ============================================================
   backup.js — Exportar / Importar (sem resetar dados)
   Popup de confirmação + resumo do que foi atualizado
   Autossuficiente: não usa confirm() nem AppModule
   ============================================================ */

const BackupModule = {

    ROTULOS: {
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

    _pendente: null,

    init() {
        const expJSON = document.getElementById('btn-export-json');
        const expCSV = document.getElementById('btn-export-csv');
        const file = document.getElementById('import-file');
        const imp = document.getElementById('btn-import-backup');

        if (expJSON) expJSON.addEventListener('click', () => this.exportJSON());
        if (expCSV) expCSV.addEventListener('click', () => this.exportCSV());
        if (imp) imp.addEventListener('click', () => { if (file) file.click(); });
        if (file) file.addEventListener('change', (e) => this.importJSON(e));
    },

    /* ============================================================
       POPUP AUTOSSUFICIENTE
       ============================================================ */
    _abrirPopup(titulo, corpoHTML, botoes) {
        this._fecharPopup();

        const overlay = document.createElement('div');
        overlay.id = 'backup-popup';
        overlay.style.cssText =
            'position:fixed;top:0;left:0;width:100%;height:100%;' +
            'background:rgba(15,23,42,.55);display:flex;align-items:center;' +
            'justify-content:center;z-index:2147483000;';

        const caixa = document.createElement('div');
        caixa.style.cssText =
            'background:#ffffff;border-radius:14px;width:92%;max-width:480px;' +
            'max-height:88vh;overflow:auto;box-shadow:0 25px 60px rgba(0,0,0,.35);' +
            'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

        caixa.innerHTML =
            '<div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;' +
            'font-size:16px;font-weight:700;color:#0f172a;">' + titulo + '</div>' +
            '<div style="padding:20px;font-size:13px;color:#334155;line-height:1.7;">' + corpoHTML + '</div>' +
            '<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;' +
            'border-top:1px solid #e2e8f0;"></div>';

        const rodape = caixa.querySelector('div:last-child');

        botoes.forEach(b => {
            const btn = document.createElement('button');
            btn.textContent = b.label;
            btn.style.cssText = b.primario
                ? 'background:#4338ca;color:#fff;border:none;padding:9px 18px;border-radius:8px;' +
                  'font-size:13px;font-weight:600;cursor:pointer;'
                : 'background:#fff;color:#334155;border:1px solid #e2e8f0;padding:9px 18px;' +
                  'border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;';
            btn.onclick = b.acao;
            rodape.appendChild(btn);
        });

        overlay.appendChild(caixa);
        document.body.appendChild(overlay);
    },

    _fecharPopup() {
        const p = document.getElementById('backup-popup');
        if (p) p.remove();
    },

    _toast(msg, tipo) {
        // Tenta o toast da aplicação; senão, cria um próprio
        if (typeof AppModule !== 'undefined' && AppModule.showToast) {
            AppModule.showToast(msg, tipo);
            return;
        }
        const el = document.createElement('div');
        el.textContent = msg;
        el.style.cssText =
            'position:fixed;top:16px;right:16px;z-index:2147483001;padding:12px 18px;' +
            'border-radius:10px;font-family:system-ui,sans-serif;font-size:13px;font-weight:500;color:#fff;' +
            (tipo === 'danger' ? 'background:#ef4444;' : 'background:#10b981;');
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    },

    /* ============================================================
       EXPORTAR
       ============================================================ */
    collectData() {
        const data = {};
        Object.keys(DB.KEYS).forEach(campo => {
            const raw = localStorage.getItem(DB.KEYS[campo]);
            if (raw !== null && raw !== undefined) {
                try { data[campo] = JSON.parse(raw); }
                catch (e) { data[campo] = raw; }
            } else {
                const arrays = ['clientes','negocios','vendas','viagens','transacoes',
                                'servicos','pipelineStages','companhias','programas',
                                'cartoes','atividades','milhas'];
                data[campo] = arrays.includes(campo) ? [] : {};
            }
        });
        data.versao = '2.1';
        data.exportadoEm = new Date().toISOString();
        return data;
    },

    exportJSON() {
        const data = this.collectData();
        this._download(
            'crm-wdih-backup-' + new Date().toISOString().split('T')[0] + '.json',
            JSON.stringify(data, null, 2),
            'application/json'
        );
        if (typeof DB !== 'undefined' && DB.addAtividade) DB.addAtividade('backup', 'Backup JSON exportado');
        this._toast('Backup JSON exportado!', 'success');
    },

    exportCSV() {
        const clientes = (typeof DB !== 'undefined' && DB.getClientes) ? DB.getClientes() : [];
        const cab = 'Nome;Email;Telefone;CPF;Status;Notas\n';
        const linhas = clientes.map(c =>
            '"' + (c.nome || '') + '";"' + (c.email || '') + '";"' + (c.telefone || '') +
            '";"' + (c.cpf || '') + '";"' + (c.status || '') + '";"' + (c.notas || '') + '"'
        ).join('\n');
        this._download(
            'crm-wdih-clientes-' + new Date().toISOString().split('T')[0] + '.csv',
            '\ufeff' + cab + linhas,
            'text/csv;charset=utf-8'
        );
        this._toast('Backup CSV exportado!', 'success');
    },

    _download(filename, content, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /* ============================================================
       IMPORTAR
       ============================================================ */
    _resumo(valores) {
        const linhas = [];
        Object.keys(this.ROTULOS).forEach(campo => {
            const v = valores[campo];
            if (v === undefined) return;
            const rotulo = this.ROTULOS[campo];
            if (Array.isArray(v)) {
                linhas.push('<strong>' + rotulo + '</strong>: ' + v.length + ' registro(s)');
            } else if (typeof v === 'object' && v !== null) {
                linhas.push('<strong>' + rotulo + '</strong>: atualizado(s)');
            } else {
                linhas.push('<strong>' + rotulo + '</strong>: ' + v);
            }
        });
        return linhas.length ? linhas.join('<br>') : 'Nenhuma informação reconhecida.';
    },

    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let data = JSON.parse(e.target.result);

                // Aceita formato com wrapper { dados: {...} }
                if (data && data.dados && typeof data.dados === 'object' && !Array.isArray(data.dados)) {
                    data = data.dados;
                }

                if (!data || typeof data !== 'object' || Array.isArray(data)) {
                    throw new Error('O arquivo não parece ser um backup válido do WDIH.');
                }

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

                const resumo = this._resumo(valores);
                this._pendente = valores;

                this._abrirPopup(
                    '📥 Confirmar Importação',
                    '<p style="margin:0 0 12px;color:#64748b;">O arquivo contém as seguintes informações:</p>' +
                    '<div>' + resumo + '</div>' +
                    '<p style="margin:14px 0 0;color:#dc2626;font-weight:600;">⚠️ Os dados atuais serão substituídos.</p>',
                    [
                        { label: 'Cancelar', primario: false, acao: () => { this._pendente = null; this._fecharPopup(); } },
                        { label: 'Importar', primario: true, acao: () => this._confirmar() }
                    ]
                );

            } catch (err) {
                this._abrirPopup(
                    '❌ Erro na Importação',
                    '<p style="margin:0;">' + err.message + '</p>',
                    [{ label: 'Fechar', primario: true, acao: () => this._fecharPopup() }]
                );
            }
        };
        reader.onerror = () => {
            this._abrirPopup('❌ Erro', '<p style="margin:0;">Não foi possível ler o arquivo.</p>',
                [{ label: 'Fechar', primario: true, acao: () => this._fecharPopup() }]);
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    _confirmar() {
        const valores = this._pendente;
        if (!valores) return;

        try {
            Object.keys(valores).forEach(campo => {
                localStorage.setItem(DB.KEYS[campo], JSON.stringify(valores[campo]));
            });
        } catch (err) {
            this._abrirPopup('❌ Erro', '<p style="margin:0;">Falha ao gravar os dados: ' + err.message + '</p>',
                [{ label: 'Fechar', primario: true, acao: () => this._fecharPopup() }]);
            return;
        }

        const resumo = this._resumo(valores);
        this._pendente = null;

        if (typeof DB !== 'undefined' && DB.addAtividade) DB.addAtividade('backup', 'Backup importado');

        this._abrirPopup(
            '✅ Backup Importado com Sucesso',
            '<p style="margin:0 0 12px;color:#64748b;">As seguintes informações foram atualizadas:</p>' +
            '<div>' + resumo + '</div>',
            [
                { label: 'OK', primario: true, acao: () => { this._fecharPopup(); setTimeout(() => location.reload(), 400); } }
            ]
        );
    }
};
