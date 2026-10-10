/**
 * PortalDownload v3
 * ------------------------------------------------------------------
 * Adiciona a opção "⬇️ Baixar HTML" dentro do Portal do Cliente
 * (área de Milhas) para baixar o HTML renderizado do portal.
 *
 * Nesta versão:
 * - O botão é injetado no footer do modal automaticamente pelo milhas.js.
 * - A exportação captura o conteúdo de #portal-cliente e aplica estilos
 *   inline computados, preservando 100% o visual exibido no portal.
 * - O HTML exportado é standalone, com um container que simula o modal.
 */
var PortalDownload = {
    /* ============================================================
       CONFIGURAÇÃO — seletores para encontrar o portal
       ============================================================ */
    SELETORES_PORTAL: [
        '#portal-cliente',
        '.portal-cliente',
        '[data-portal="cliente"]',
        '.portal-detalhe',
        '#portal-detalhe',
        '.cliente-portal',
        '#cliente-portal',
        '.portal-view',
        '#portal-view'
    ],

    SELETORES_HOST: [
        '.portal-acoes',
        '.portal-header',
        '.portal-actions',
        '.portal-toolbar',
        '.portal-buttons',
        '.cliente-header',
        '.portal-container',
        '#portal-cliente',
        '.portal-cliente',
        '.milhas-panel.active'
    ],

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

        // Tenta imediatamente (caso o portal já esteja aberto)
        if (this.tentarInjetar()) {
            console.log('[PortalDownload] ✅ Botão já presente ou injetado.');
            return;
        }

        // Observa mudanças no DOM de forma persistente
        this.observarDOM();
    },

    observarDOM() {
        let tentativas = 0;
        const maxTentativas = 100; // 10 segundos com intervalo de 100ms

        const observer = new MutationObserver((mutations) => {
            tentativas++;

            if (this.tentarInjetar()) {
                console.log('[PortalDownload] ✅ Botão injetado após observar DOM!');
                observer.disconnect();
                return;
            }

            if (tentativas >= maxTentativas) {
                console.warn('[PortalDownload] ⚠️ Timeout: não foi possível encontrar o Portal do Cliente após ' + maxTentativas + ' tentativas');
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });

        // Fallback: tenta periodicamente
        const intervalId = setInterval(() => {
            if (this.tentarInjetar()) {
                console.log('[PortalDownload] ✅ Botão injetado via intervalo!');
                clearInterval(intervalId);
            }
        }, 500);

        // Para o intervalo após 15 segundos
        setTimeout(() => clearInterval(intervalId), 15000);
    },

    /* ============================================================
       BUSCA DO PORTAL
       ============================================================ */
    encontrarPortal() {
        for (const seletor of this.SELETORES_PORTAL) {
            const el = document.querySelector(seletor);
            if (el) {
                console.log('[PortalDownload] Portal encontrado com seletor:', seletor);
                return el;
            }
        }

        // Busca por elementos com texto "Portal" no título
        const possiveis = document.querySelectorAll('.card, .panel, .container, section, div');
        for (const el of possiveis) {
            const titulo = el.querySelector('h1, h2, h3, h4');
            if (titulo && titulo.textContent.toLowerCase().includes('portal')) {
                console.log('[PortalDownload] Portal encontrado por título:', titulo.textContent);
                return el;
            }
        }

        return null;
    },

    /* ============================================================
       INJEÇÃO DO BOTÃO
       ============================================================ */
    tentarInjetar() {
        // Se o botão já existe (injetado manualmente pelo milhas.js), nada a fazer
        if (document.getElementById('btn-baixar-portal')) {
            return true;
        }

        const portal = this.encontrarPortal();
        if (!portal) {
            return false;
        }

        // Encontra o host para o botão
        let host = null;
        for (const seletor of this.SELETORES_HOST) {
            host = portal.querySelector(seletor);
            if (host) {
                console.log('[PortalDownload] Host encontrado com seletor:', seletor);
                break;
            }
        }

        // Fallback: usa o próprio portal como host
        if (!host) {
            host = portal;
            console.log('[PortalDownload] Usando portal como host (fallback)');
        }

        this.injetarBotao(host);
        return true;
    },

    injetarBotao(host) {
        const botao = document.createElement('button');
        botao.id = 'btn-baixar-portal';
        botao.type = 'button';
        botao.className = 'btn btn-sm btn-secondary';
        botao.style.cssText = 'margin-left:8px; margin-bottom:8px;';
        botao.innerHTML = '⬇️ Baixar HTML';
        botao.title = 'Baixar o HTML do Portal do Cliente';
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.baixarHTML();
        });

        if (host.firstChild) {
            host.insertBefore(botao, host.firstChild);
        } else {
            host.appendChild(botao);
        }

        console.log('[PortalDownload] Botão injetado no host:', host);
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
       MONTAGEM DO HTML
       ============================================================ */
    montarHTMLCompleto(conteudo) {
        const corpo = this.serializarComEstilosInline(conteudo);

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portal do Cliente</title>
<style>
    * { box-sizing: border-box; }
    body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #f1f5f9;
        color: #1e293b;
        padding: 20px;
    }
    .container {
        max-width: 1100px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        padding: 20px;
    }
</style>
</head>
<body>
<div class="container">
${corpo}
</div>
</body>
</html>`;
    },

    serializarComEstilosInline(original) {
        const clone = original.cloneNode(true);
        this.aplicarEstilosComputados(original, clone);
        this.sincronizarCampos(original, clone);
        return clone.outerHTML;
    },

    aplicarEstilosComputados(original, copia) {
        if (!original || !copia || copia.nodeType !== 1) return;

        try {
            const styleCalculado = window.getComputedStyle(original);
            copia.style.cssText = styleCalculado.cssText;
        } catch (e) {
            console.warn('[PortalDownload] Erro ao aplicar estilos:', e);
        }

        const filhosOrig = original.children;
        const filhosCopia = copia.children;

        for (let i = 0; i < filhosCopia.length && i < filhosOrig.length; i++) {
            this.aplicarEstilosComputados(filhosOrig[i], filhosCopia[i]);
        }
    },

    sincronizarCampos(original, copia) {
        const origs = original.querySelectorAll('input, textarea, select');
        const copias = copia.querySelectorAll('input, textarea, select');

        copias.forEach((el, i) => {
            const orig = origs[i];
            if (!orig) return;

            try {
                if (el.tagName === 'INPUT') {
                    if (orig.type === 'checkbox' || orig.type === 'radio') {
                        if (orig.checked) {
                            el.setAttribute('checked', 'checked');
                        } else {
                            el.removeAttribute('checked');
                        }
                    } else {
                        el.setAttribute('value', orig.value || '');
                    }
                } else if (el.tagName === 'TEXTAREA') {
                    el.textContent = orig.value || '';
                } else if (el.tagName === 'SELECT') {
                    Array.from(el.options).forEach(opt => {
                        opt.toggleAttribute('selected', opt.value === orig.value);
                    });
                }
            } catch (e) {
                console.warn('[PortalDownload] Erro ao sincronizar campo:', e);
            }
        });
    },

    /* ============================================================
       UTILITÁRIOS
       ============================================================ */
    obterNomeArquivo() {
        const portal = this.encontrarPortal();
        if (!portal) return 'portal-do-cliente.html';

        const possiveis = [
            '.cliente-nome',
            '.cliente-card .nome',
            '#portal-cliente-nome',
            '[data-cliente-nome]',
            'h1', 'h2', 'h3'
        ];

        let nome = '';

        for (const seletor of possiveis) {
            const el = portal.querySelector(seletor);
            if (el && el.textContent.trim()) {
                nome = el.textContent.trim();
                break;
            }
        }

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
            .substring(0, 50); // Limita o tamanho
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