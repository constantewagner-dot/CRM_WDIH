// backup.js — Exportação e importação de dados do CRM WDIH
const BackupModule = {

  init() {
    const btnJson = document.getElementById('btn-export-json');
    const btnCsv = document.getElementById('btn-export-csv');
    const fileInput = document.getElementById('import-file');

    if (btnJson) btnJson.addEventListener('click', () => this.exportJSON());
    if (btnCsv) btnCsv.addEventListener('click', () => this.exportCSV());
    if (fileInput) fileInput.addEventListener('change', (e) => this.importJSON(e));
  },

  // Coleta todas as chaves do sistema (prefixo wdih_)
  coletarDados() {
    const dados = {};
    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);
      if (!chave || !chave.startsWith('wdih_')) continue;
      try {
        dados[chave] = JSON.parse(localStorage.getItem(chave));
      } catch (e) {
        dados[chave] = localStorage.getItem(chave);
      }
    }
    return dados;
  },

  // Gera e baixa um arquivo
  downloadBlob(conteudo, nomeArquivo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // ---------- EXPORTAR JSON ----------
  exportJSON() {
    const payload = {
      app: 'CRM WDIH',
      versao: 1,
      exportadoEm: new Date().toISOString(),
      dados: this.coletarDados()
    };
    this.downloadBlob(
      JSON.stringify(payload, null, 2),
      'crm-wdih-backup.json',
      'application/json'
    );
    AppModule.showToast('Backup JSON exportado!', 'success');
  },

  // ---------- EXPORTAR CSV ----------
  exportCSV() {
    const dados = this.coletarDados();
    const linhas = ['tipo;registro'];

    Object.entries(dados).forEach(([chave, valor]) => {
      if (Array.isArray(valor)) {
        valor.forEach(item => linhas.push(chave + ';' + JSON.stringify(item)));
      } else {
        linhas.push(chave + ';' + JSON.stringify(valor));
      }
    });

    this.downloadBlob(
      linhas.join('\n'),
      'crm-wdih-dados.csv',
      'text/csv;charset=utf-8;'
    );
    AppModule.showToast('Exportação CSV concluída!', 'success');
  },

  // ---------- IMPORTAR JSON ----------
  importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        const dados = payload.dados || payload;

        if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
          throw new Error('Estrutura de backup inválida');
        }

        if (!confirm('Importar backup? Os dados atuais serão substituídos.')) return;

        // Remove apenas as chaves do sistema
        Object.keys(localStorage)
          .filter(k => k.startsWith('wdih_'))
          .forEach(k => localStorage.removeItem(k));

        // Restaura os dados
        Object.entries(dados).forEach(([chave, valor]) => {
          localStorage.setItem(
            chave,
            typeof valor === 'string' ? valor : JSON.stringify(valor)
          );
        });

        AppModule.showToast('Backup importado! Recarregando...', 'success');
        setTimeout(() => location.reload(), 1000);

      } catch (err) {
        AppModule.showToast('Arquivo inválido: ' + err.message, 'danger');
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // permite reimportar o mesmo arquivo
  }
};
