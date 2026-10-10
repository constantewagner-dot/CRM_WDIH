/**
 * PortalDownload
 * ------------------------------------------------------------------
 * Adiciona uma opção "⬇️ Baixar HTML" dentro do Portal do Cliente
 * (área de Milhas) para baixar o HTML renderizado do portal.
 *
 * COMO USAR:
 * 1. Inclua este arquivo no index.html APÓS js/milhas.js:
 *      <script src="js/portal-download.js"></script>
 * 2. Ajuste as constantes abaixo conforme os IDs/seletores reais
 *    usados no HTML que o milhas.js gera para o portal.
 * 3. Se preferir, dispense a injeção automática e chame
 *    PortalDownload.baixarHTML() no evento do seu próprio botão.
 *
 * OBSERVAÇÃO:
 * O arquivo baixado é a visualização renderizada atual com estilos
 * inline e valores de campos. Scripts interativos do portal não são
 * embutidos automaticamente.
 */
var PortalDownload = {
    /* ============================================================
       CONFIGURAÇÃO — ajuste conforme o HTML real do portal
       ============================================================ */
    SELETOR_PORTAL: '#portal-cliente',              // container geral do portal
    SELETOR_CONTEUDO: '',                            // opcional: elemento interno a baixar (vazio = portal inteiro)
    SELETOR_BOTAO_HOST: '.portal-acoes, .portal-header, .milhas-panel', // onde o botão será inserido primeiro

    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.observarPortal());
        } else {
            this.observarPortal();
        }
    },

    /**
     * Tenta injetar o botão assim que o portal aparecer no DOM.
     * Usa MutationObserver para cobrir portais renderizados dinamicamente.
     */
    observarPortal() {
        let jaInjetado = false;

        const tentar = () => {
            if (jaInjetado) return true;

            const portal = document.querySelector(this.SELETOR_PORTAL);
            if (portal) {
                this.injetarBotao(portal);
                jaInjetado = true;
                return true;
            }
            return false;
        };

        if (tentar()) return;

        const observer = new MutationObserver(() => {
            if (tentar()) observer.disconnect();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => observer.disconnect(), 15000); // timeout de segurança
    },

    /* ============================================================
       INJEÇÃO DO BOTÃO
       ============================================================ */
    injetarBotao(portal) {
        if (document.getElementById('btn-baixar-portal')) return;

        const host = portal.querySelector(this.SELETOR_BOTAO_HOST) || portal;

        const botao = document.createElement('button');
        botao.id = 'btn-baixar-portal';
        botao.type = 'button';
        botao.className = 'btn btn-sm btn-secondary';
        botao.style.cssText = 'margin-left:8px;';
        botao.innerHTML = '⬇️ Baixar HTML';
        botao.title = 'Baixar o HTML do Portal do Cliente';
        botao.addEventListener('click', () => this.baixarHTML());

        host.prepend(botao);
    },

    /* ============================================================
       DOWNLOAD
       ============================================================ */
    baixarHTML() {
        const conteudo = this.obterConteudo();

        if (!conteudo) {
            // Se AppModule/toast estiver disponível, usa; senão alert simples
            if (typeof AppModule !== 'undefined' && typeof AppModule.toast === 'function') {
                AppModule.toast('Portal do Cliente não encontrado para download.');
            } else {
                alert('Portal do Cliente não encontrado para download.');
            }
            return;
        }

        const htmlCompleto = this.montarHTMLCompleto(conteudo);
        const nomeArquivo = this.obterNomeArquivo();

        this.downloadArquivo(nomeArquivo, htmlCompleto, 'text/html;charset=utf-8');

        if (typeof AppModule !== 'undefined' && typeof AppModule.toast === 'function') {
            AppModule.toast('HTML do portal baixado!');
        }
    },

    obterConteudo() {
        let el = null;

        if (this.SELETOR_CONTEUDO) {
            el = document.querySelector(this.SELETOR_CONTEUDO);
        }

        if (!el) {
            el = document.querySelector(this.SELETOR_PORTAL);
        }

        return el;
    },

    /* ============================================================
       MONTAGEM DO HTML COMPLETO (self-contained)
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
    /* Reset mínimo para manter a apresentação caso algum estilo não seja propagado */
    * { box-sizing: border-box; }
    body { margin: 0; }
</style>
</head>
<body>
${corpo}
</body>
</html>`;
    },

    /**
     * Clona o elemento e aplica os estilos computados inline em cada nó,
     * garantindo que o HTML baixado seja visualmente fiel sem depender
     * de arquivos CSS externos. Também preserva valores de formulários.
     */
    serializarComEstilosInline(original) {
        const clone = original.cloneNode(true);

        const aplicar = (orig, copia) => {
            if (!orig || !copia || copia.nodeType !== 1) return;

            const styleCalculado = window.getComputedStyle(orig);
            copia.style.cssText = styleCalculado.cssText;

            const filhosOrig = orig.children;
            const filhosCopia = copia.children;

            for (let i = 0; i < filhosCopia.length; i++) {
                aplicar(filhosOrig[i], filhosCopia[i]);
            }
        };

        aplicar(original, clone);
        this.sincronizarCampos(original, clone);

        return clone.outerHTML;
    },

    /**
     * Copia valores atuais de inputs, selects e textareas para o clone.
     */
    sincronizarCampos(original, copia) {
        const origs = original.querySelectorAll('input, textarea, select');
        const copias = copia.querySelectorAll('input, textarea, select');

        copias.forEach((el, i) => {
            const orig = origs[i];
            if (!orig) return;

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
        });
    },

    /* ============================================================
       UTILITÁRIOS
       ============================================================ */
    obterNomeArquivo() {
        const possiveis = [
            '.cliente-nome',
            '.cliente-card .nome',
            '#portal-cliente-nome',
            '[data-cliente-nome]'
        ];

        let nome = '';

        for (const seletor of possiveis) {
            const el = document.querySelector(seletor);
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
            .toLowerCase();
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
    }
};

PortalDownload.init();