/**
 * PortalDownload v3
 * ------------------------------------------------------------------
 * Gera um HTML standalone do Portal do Cliente com visual moderno,
 * limpo e profissional, fiel ao layout do CRM WDIH.
 */
var PortalDownload = {
    /* ============================================================
       CONFIGURAÇÃO
       ============================================================ */
    SELETOR_PORTAL: '#portal-cliente',

    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */
    init() {
        console.log('[PortalDownload] Inicializando...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.iniciarObservacao());
        } else {
            this.iniciarObservacao();
        }
    },

    iniciarObservacao() {
        console.log('[PortalDownload] Iniciando observação do DOM...');
        
        if (this.tentarInjetar()) {
            console.log('[PortalDownload] ✅ Botão injetado com sucesso!');
            return;
        }

        this.observarDOM();
    },

    observarDOM() {
        let tentativas = 0;
        const maxTentativas = 100;

        const observer = new MutationObserver((mutations) => {
            tentativas++;
            
            if (this.tentarInjetar()) {
                console.log('[PortalDownload] ✅ Botão injetado após observar DOM!');
                observer.disconnect();
                return;
            }

            if (tentativas >= maxTentativas) {
                console.warn('[PortalDownload] ⚠️ Timeout após ' + maxTentativas + ' tentativas');
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });

        const intervalId = setInterval(() => {
            if (this.tentarInjetar()) {
                console.log('[PortalDownload] ✅ Botão injetado via intervalo!');
                clearInterval(intervalId);
            }
        }, 500);

        setTimeout(() => clearInterval(intervalId), 15000);
    },

    /* ============================================================
       BUSCA DO PORTAL
       ============================================================ */
    encontrarPortal() {
        const el = document.querySelector(this.SELETOR_PORTAL);
        if (el) {
            console.log('[PortalDownload] Portal encontrado:', this.SELETOR_PORTAL);
            return el;
        }
        return null;
    },

    /* ============================================================
       INJEÇÃO DO BOTÃO
       ============================================================ */
    tentarInjetar() {
        if (document.getElementById('btn-baixar-portal')) {
            return true;
        }

        const portal = this.encontrarPortal();
        if (!portal) {
            return false;
        }

        this.injetarBotao(portal);
        return true;
    },

    injetarBotao(portal) {
        const botao = document.createElement('button');
        botao.id = 'btn-baixar-portal';
        botao.type = 'button';
        botao.className = 'btn btn-sm btn-secondary';
        botao.style.cssText = 'margin-left:8px;';
        botao.innerHTML = '⬇️ Baixar HTML';
        botao.title = 'Baixar o HTML do Portal do Cliente';
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.baixarHTML();
        });

        const footer = document.querySelector('.modal-footer');
        if (footer) {
            footer.insertBefore(botao, footer.firstChild);
        } else {
            portal.appendChild(botao);
        }

        console.log('[PortalDownload] Botão injetado no footer do modal');
    },

    /* ============================================================
       DOWNLOAD
       ============================================================ */
    baixarHTML() {
        console.log('[PortalDownload] Iniciando download...');

        const conteudo = this.encontrarPortal();

        if (!conteudo) {
            this.mostrarErro('Portal do Cliente não encontrado para download.');
            return;
        }

        try {
            const htmlCompleto = this.montarHTMLCompleto(conteudo);
            const nomeArquivo = this.obterNomeArquivo();

            this.downloadArquivo(nomeArquivo, htmlCompleto, 'text/html;charset=utf-8');

            this.mostrarSucesso('HTML do portal baixado com sucesso!');
            console.log('[PortalDownload] ✅ Download concluído:', nomeArquivo);
        } catch (erro) {
            console.error('[PortalDownload] Erro ao baixar:', erro);
            this.mostrarErro('Erro ao gerar o HTML: ' + erro.message);
        }
    },

    /* ============================================================
       MONTAGEM DO HTML MODERNO
       ============================================================ */
    montarHTMLCompleto(conteudo) {
        const clienteNome = this.obterNomeCliente(conteudo);
        const clienteInfo = this.obterInfoCliente(conteudo);
        const kpis = this.extrairKPIs(conteudo);
        const secoes = this.extrairSecoes(conteudo);

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal do Cliente - ${this.escapeHtml(clienteNome)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            line-height: 1.6;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Header do Cliente */
        .cliente-header {
            background: white;
            border: 1px solid #e2e8f0;
            border-bottom: 3px solid #3b82f6;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
        }

        .cliente-nome {
            font-size: 28px;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 8px;
        }

        .cliente-info {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 14px;
            color: #64748b;
        }

        .cliente-info span {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* KPIs */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }

        .kpi-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }

        .kpi-label {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .kpi-valor {
            font-size: 26px;
            font-weight: 700;
            color: #3b82f6;
        }

        .kpi-valor.verde {
            color: #10b981;
        }

        /* Seções */
        .secao {
            margin-bottom: 32px;
        }

        .secao-titulo {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #3b82f6;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .secao-titulo .count {
            color: #64748b;
            font-weight: 500;
        }

        /* Cards de Itens */
        .item-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        .item-info {
            flex: 1;
            min-width: 200px;
        }

        .item-titulo {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 4px;
        }

        .item-detalhe {
            font-size: 13px;
            color: #64748b;
        }

        .item-valor {
            text-align: right;
        }

        .item-valor-principal {
            font-size: 16px;
            font-weight: 600;
            color: #3b82f6;
            margin-bottom: 4px;
        }

        .item-valor-secundario {
            font-size: 13px;
            color: #10b981;
        }

        .item-valor-secundario.vermelho {
            color: #ef4444;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding: 24px;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            margin-top: 40px;
        }

        .footer strong {
            color: #3b82f6;
        }

        /* Responsivo */
        @media (max-width: 768px) {
            body {
                padding: 12px;
            }

            .cliente-nome {
                font-size: 22px;
            }

            .kpi-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .item-card {
                flex-direction: column;
                align-items: flex-start;
            }

            .item-valor {
                text-align: left;
                width: 100%;
            }
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header do Cliente -->
        <div class="cliente-header">
            <div class="cliente-nome">${this.escapeHtml(clienteNome)}</div>
            <div class="cliente-info">
                ${clienteInfo}
            </div>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid">
            ${kpis}
        </div>

        <!-- Seções -->
        ${secoes}

        <!-- Footer -->
        <div class="footer">
            Portal do Cliente gerado em <strong>${this.formatarDataHora()}</strong><br>
            CRM WDIH - Gestão de Milhas e Viagens
        </div>
    </div>
</body>
</html>`;
    },

    /* ============================================================
       EXTRAÇÃO DE DADOS
       ============================================================ */
    obterNomeCliente(conteudo) {
        const nomeEl = conteudo.querySelector('h2');
        return nomeEl ? nomeEl.textContent.trim() : 'Cliente';
    },

    obterInfoCliente(conteudo) {
        const infoEl = conteudo.querySelector('.cliente-info, [style*="display:flex"]');
        if (!infoEl) return '';
        
        return Array.from(infoEl.querySelectorAll('span'))
            .map(span => span.outerHTML)
            .join('');
    },

    extrairKPIs(conteudo) {
        const kpiCards = conteudo.querySelectorAll('[style*="grid-template-columns"] > div');
        
        if (!kpiCards.length) {
            return `
                <div class="kpi-card">
                    <div class="kpi-label">✈️ Vôos</div>
                    <div class="kpi-valor">0</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">💎 Valor de Mercado</div>
                    <div class="kpi-valor">R$ 0,00</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">💰 Economia</div>
                    <div class="kpi-valor verde">R$ 0,00</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">📊 % Economia</div>
                    <div class="kpi-valor">0.0%</div>
                </div>
            `;
        }

        return Array.from(kpiCards).map(card => {
            const label = card.querySelector('label')?.textContent || '';
            const valor = card.querySelector('span')?.textContent || '0';
            const isVerde = card.querySelector('span[style*="success"]') !== null;
            
            return `
                <div class="kpi-card">
                    <div class="kpi-label">${label}</div>
                    <div class="kpi-valor ${isVerde ? 'verde' : ''}">${valor}</div>
                </div>
            `;
        }).join('');
    },

    extrairSecoes(conteudo) {
        const h3Elements = conteudo.querySelectorAll('h3');
        let html = '';

        h3Elements.forEach(h3 => {
            const titulo = h3.textContent;
            const secao = this.extrairConteudoSecao(h3);
            
            html += `
                <div class="secao">
                    <div class="secao-titulo">${titulo}</div>
                    ${secao}
                </div>
            `;
        });

        return html;
    },

    extrairConteudoSecao(h3) {
        let irmao = h3.nextElementSibling;
        let html = '';

        while (irmao && irmao.tagName !== 'H3') {
            if (irmao.tagName === 'DIV' && irmao.querySelector('[style*="background"]')) {
                const cards = irmao.querySelectorAll('[style*="background"]');
                cards.forEach(card => {
                    html += this.processarCard(card);
                });
            } else if (irmao.tagName === 'P' && irmao.textContent.includes('Nenhum')) {
                html += `<div class="item-card"><div class="item-info"><div class="item-titulo">${irmao.textContent}</div></div></div>`;
            }
            irmao = irmao.nextElementSibling;
        }

        return html;
    },

    processarCard(card) {
        const texto = card.textContent;
        const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
        
        let titulo = linhas[0] || '';
        let detalhes = linhas.slice(1).join(' | ');
        
        // Tenta extrair valores à direita
        const valores = card.querySelectorAll('[style*="text-align:right"] div');
        let valorHtml = '';
        
        if (valores.length) {
            valorHtml = '<div class="item-valor">';
            valores.forEach((v, i) => {
                const classe = v.style.color?.includes('success') ? 'verde' : 
                              v.style.color?.includes('danger') ? 'vermelho' : '';
                valorHtml += `<div class="item-valor-principal ${classe}">${v.textContent}</div>`;
            });
            valorHtml += '</div>';
        }

        return `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-titulo">${this.escapeHtml(titulo)}</div>
                    ${detalhes ? `<div class="item-detalhe">${this.escapeHtml(detalhes)}</div>` : ''}
                </div>
                ${valorHtml}
            </div>
        `;
    },

    /* ============================================================
       UTILITÁRIOS
       ============================================================ */
    obterNomeArquivo() {
        const portal = this.encontrarPortal();
        if (!portal) return 'portal-do-cliente.html';

        const nomeEl = portal.querySelector('h2');
        const nome = nomeEl ? nomeEl.textContent.trim() : '';
        const sanitizado = this.sanitizarNome(nome);
        
        return `${sanitizado || 'portal-do-cliente'}.html`;
    },

    sanitizarNome(texto) {
        return (texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_\- ]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .toLowerCase()
            .substring(0, 50);
    },

    escapeHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto || '';
        return div.innerHTML;
    },

    formatarDataHora() {
        const agora = new Date();
        return agora.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    downloadArquivo(nome, conteudo, tipo) {
        const blob = new Blob([conteudo], { type: tipo });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = nome;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    mostrarSucesso(msg) {
        if (typeof AppModule !== 'undefined' && typeof AppModule.toast === 'function') {
            AppModule.toast(msg);
        } else {
            alert(msg);
        }
    },

    mostrarErro(msg) {
        console.error('[PortalDownload]', msg);
        if (typeof AppModule !== 'undefined' && typeof AppModule.toast === 'function') {
            AppModule.toast(msg);
        } else {
            alert(msg);
        }
    }
};

// Inicializa
PortalDownload.init();