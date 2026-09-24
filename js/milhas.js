// ============================================================
// MÓDULO DE MILHAS - CRM WDIH
// Responsável por: Programas de Fidelidade, Cartões, Emissões,
// Viagens e Portal do Cliente
// ============================================================

const MilhasModule = (function () {
    'use strict';

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    function init() {
        renderClientes();
        bindEvents();
    }

    function bindEvents() {
        // Eventos gerais do módulo podem ser vinculados aqui
    }

    // ============================================================
    // HELPERS
    // ============================================================
    function getData() {
        return {
            programas: DB.get('programasFidelidade', []),
            cartoes: DB.get('cartoes', []),
            emissoes: DB.get('emissoes', [])
        };
    }

    function fmtMilhas(valor) {
        const n = parseInt(valor) || 0;
        return n.toLocaleString('pt-BR');
    }

    function formatDateBR(data) {
        if (!data) return '—';
        const d = new Date(data + 'T00:00:00');
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('pt-BR');
    }

    function getSaldoAtual(programa) {
        if (!programa || !programa.historico) return 0;
        const historico = Array.isArray(programa.historico) ? programa.historico : [];
        if (historico.length === 0) return parseInt(programa.saldoInicial) || 0;
        const ultimo = historico[historico.length - 1];
        return parseInt(ultimo.saldo) || 0;
    }

    function getVariacao(programa) {
        if (!programa || !programa.historico || programa.historico.length < 2) return 0;
        const historico = programa.historico;
        const atual = parseInt(historico[historico.length - 1].saldo) || 0;
        const anterior = parseInt(historico[historico.length - 2].saldo) || 0;
        return atual - anterior;
    }

    function calcEmissao(valorMercado, taxas, milhasUtilizadas, custoMilha) {
        const vm = parseFloat(valorMercado) || 0;
        const tx = parseFloat(taxas) || 0;
        const mu = parseInt(milhasUtilizadas) || 0;
        const cm = parseFloat(custoMilha) || 0;

        const valorEmitido = tx + (mu * cm);
        const economia = vm - valorEmitido;

        return {
            valorEmitido: valorEmitido,
            economia: economia
        };
    }

    // ============================================================
    // FILTROS POR CLIENTE
    // ============================================================
    function getProgramasCliente(clienteId) {
        return getData().programas.filter(p => p.clienteId === clienteId);
    }

    function getCartoesCliente(clienteId) {
        return getData().cartoes.filter(c => c.clienteId === clienteId);
    }

    function getEmissoesCliente(clienteId) {
        return getData().emissoes.filter(e => e.clienteId === clienteId);
    }

    function getViagensCliente(clienteId) {
        return DB.get('viagens', []).filter(v => v.clienteId === clienteId);
    }

    function getTotalMilhasCliente(clienteId) {
        const programas = getProgramasCliente(clienteId);
        return programas.reduce((soma, p) => soma + getSaldoAtual(p), 0);
    }

    function getValorMercadoCliente(clienteId) {
        const emissoes = getEmissoesCliente(clienteId);
        return emissoes.reduce((soma, e) => soma + (parseFloat(e.valorMercado) || 0), 0);
    }

    function getEconomiaCliente(clienteId) {
        const emissoes = getEmissoesCliente(clienteId);
        return emissoes.reduce((soma, e) => {
            const calc = calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.custoMilha);
            return soma + calc.economia;
        }, 0);
    }

    // ============================================================
    // RENDERIZAÇÃO DOS CLIENTES NA ABA MILHAS
    // ============================================================
    function renderClientes() {
        const container = document.getElementById('milhas-clientes');
        if (!container) return;

        const clientes = DB.get('clientes', []);
        const { programas, cartoes, emissoes } = getData();
        const viagens = DB.get('viagens', []);

        // Oculta clientes sem movimentação
        const clientesComMov = clientes.filter(c => {
            const temProgramas = programas.some(p => p.clienteId === c.id);
            const temEmissoes = emissoes.some(e => e.clienteId === c.id);
            const temCartoes = cartoes.some(ca => ca.clienteId === c.id);
            const temViagens = viagens.some(v => v.clienteId === c.id);
            return temProgramas || temEmissoes || temCartoes || temViagens;
        });

        if (clientesComMov.length === 0) {
            container.innerHTML = '<p class="dashboard-empty">Nenhum cliente com movimentação.</p>';
            return;
        }

        container.innerHTML = clientesComMov.map(c => `
            <div class="cliente-card" style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0 0 4px 0;">${AppModule.escapeHtml(c.nome)}</h4>
                        <small style="color: var(--text-muted);">${AppModule.escapeHtml(c.email || c.telefone || '')}</small>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="MilhasModule.portalCliente('${c.id}')">
                        🔍 Portal do Cliente
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ============================================================
    // PORTAL DO CLIENTE (POPUP DETALHADO)
    // ============================================================
    function portalCliente(clienteId) {
        const c = DB.get('clientes', []).find(x => x.id === clienteId);
        if (!c) return;

        const programas = getProgramasCliente(clienteId);
        const cartoes = getCartoesCliente(clienteId);
        const emissoes = getEmissoesCliente(clienteId);
        const viagens = getViagensCliente(clienteId);

        // Totais
        const totalMilhas = getTotalMilhasCliente(clienteId);
        const totalValorMercado = getValorMercadoCliente(clienteId);
        const totalEconomia = getEconomiaCliente(clienteId);
        const percentualEconomia = totalValorMercado > 0 ? ((totalEconomia / totalValorMercado) * 100) : 0;
        const totalVoos = emissoes.length;

        // Cabeçalho clean
        let html = `
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-bottom: 3px solid var(--primary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 10px 0; font-size: 24px; color: var(--primary); font-weight: 700;">${AppModule.escapeHtml(c.nome)}</h2>
                <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; color: var(--text-muted);">
                    ${c.email ? `<span>📧 ${AppModule.escapeHtml(c.email)}</span>` : ''}
                    ${c.telefone ? `<span>📱 ${AppModule.escapeHtml(c.telefone)}</span>` : ''}
                    ${c.documento ? `<span>📄 ${AppModule.escapeHtml(c.documento)}</span>` : ''}
                </div>
            </div>
        `;

        // Cards de resumo - estilo clean, 4 por linha
        html += `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center;">
                    <label style="font-size: 12px; color: var(--text-muted); display:block; margin-bottom: 8px;">✈️ Vôos</label>
                    <span style="font-size: 26px; font-weight: 700; color: var(--primary);">${totalVoos}</span>
                </div>
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center;">
                    <label style="font-size: 12px; color: var(--text-muted); display:block; margin-bottom: 8px;">💎 Valor de Mercado</label>
                    <span style="font-size: 20px; font-weight: 700; color: var(--text);">${AppModule.formatCurrency(totalValorMercado)}</span>
                </div>
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center;">
                    <label style="font-size: 12px; color: var(--text-muted); display:block; margin-bottom: 8px;">💰 Economia</label>
                    <span style="font-size: 20px; font-weight: 700; color: var(--success);">${AppModule.formatCurrency(totalEconomia)}</span>
                </div>
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center;">
                    <label style="font-size: 12px; color: var(--text-muted); display:block; margin-bottom: 8px;">📊 % Economia</label>
                    <span style="font-size: 26px; font-weight: 700; color: var(--primary);">${percentualEconomia.toFixed(1)}%</span>
                </div>
            </div>
        `;

        // Programas de Fidelidade
        html += `<h3 style="margin: 24px 0 12px 0; color: var(--text); border-bottom: 2px solid var(--primary); padding-bottom: 8px;">🎯 Programas de Fidelidade (${programas.length})</h3>`;
        if (!programas.length) {
            html += '<p style="color: var(--text-muted); font-style: italic;">Nenhum programa cadastrado.</p>';
        } else {
            html += '<div style="display: grid; gap: 10px;">';
            html += programas.map(p => {
                const saldo = getSaldoAtual(p);
                const variacao = getVariacao(p);
                const ultimaAtualizacao = p.historico && p.historico.length > 0
                    ? formatDateBR(p.historico[p.historico.length - 1].data)
                    : '—';

                return `
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <strong style="font-size: 15px;">${AppModule.escapeHtml(p.programa || p.nome || '')}</strong>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Última atualização: ${ultimaAtualizacao}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 16px; font-weight: 600; color: var(--primary);">${fmtMilhas(saldo)} milhas</div>
                            ${variacao !== 0 ? `<small style="color: ${variacao >= 0 ? 'var(--success)' : 'var(--danger)'};">${variacao >= 0 ? '+' : ''}${fmtMilhas(variacao)}</small>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            html += '</div>';
        }

        // Cartões
        html += `<h3 style="margin: 24px 0 12px 0; color: var(--text); border-bottom: 2px solid var(--primary); padding-bottom: 8px;">💳 Cartões (${cartoes.length})</h3>`;
        if (!cartoes.length) {
            html += '<p style="color: var(--text-muted); font-style: italic;">Nenhum cartão cadastrado.</p>';
        } else {
            html += '<div style="display: grid; gap: 10px;">';
            html += cartoes.map(c => `
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <strong style="font-size: 15px;">${AppModule.escapeHtml(c.bandeira || '')}</strong>
                        <div style="font-size: 13px; color: var(--text-muted);">${AppModule.escapeHtml(c.banco || '')} • ${AppModule.escapeHtml(c.nome || '')}</div>
                    </div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--text);">
                        Limite: ${AppModule.formatCurrency(c.limite)}
                    </div>
                </div>
            `).join('');
            html += '</div>';
        }

        // Emissões
        html += `<h3 style="margin: 24px 0 12px 0; color: var(--text); border-bottom: 2px solid var(--primary); padding-bottom: 8px;">✈️ Emissões (${emissoes.length})</h3>`;
        if (!emissoes.length) {
            html += '<p style="color: var(--text-muted); font-style: italic;">Nenhuma emissão registrada.</p>';
        } else {
            html += '<div style="display: grid; gap: 10px;">';
            html += emissoes.map(e => {
                const calc = calcEmissao(e.valorMercado, e.taxas, e.milhasUtilizadas, e.custoMilha);
                return `
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <div style="font-size: 14px; font-weight: 600;">${formatDateBR(e.data)} • ${AppModule.escapeHtml(e.origem || '')} → ${AppModule.escapeHtml(e.destino || '')}</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Milhas: ${fmtMilhas(e.milhasUtilizadas)} | Custo milha: ${AppModule.formatCurrency(e.custoMilha)}</div>
                        </div>
                        <div style="text-align: right; font-size: 13px;">
                            <div>Mercado: <strong>${AppModule.formatCurrency(e.valorMercado)}</strong></div>
                            <div>Emitido: <strong>${AppModule.formatCurrency(calc.valorEmitido)}</strong></div>
                            <div style="color: var(--success);">Economia: <strong>${AppModule.formatCurrency(calc.economia)}</strong></div>
                        </div>
                    </div>
                `;
            }).join('');
            html += '</div>';
        }

        // Viagens
        html += `<h3 style="margin: 24px 0 12px 0; color: var(--text); border-bottom: 2px solid var(--primary); padding-bottom: 8px;">🧳 Viagens (${viagens.length})</h3>`;
        if (!viagens.length) {
            html += '<p style="color: var(--text-muted); font-style: italic;">Nenhuma viagem registrada.</p>';
        } else {
            html += '<div style="display: grid; gap: 10px;">';
            html += viagens.map(v => `
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">${formatDateBR(v.dataIda)} • ${AppModule.escapeHtml(v.destino || '')}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${v.observacao ? AppModule.escapeHtml(v.observacao) : ''}</div>
                    </div>
                    <div style="font-size: 13px;">
                        ${v.checkinFeito ? '<span style="color: var(--success);">✅ Check-in feito</span>' : '<span style="color: var(--warning);">⏳ Check-in pendente</span>'}
                    </div>
                </div>
            `).join('');
            html += '</div>';
        }

        // Ajusta largura do modal para os cards ficarem na mesma linha
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) modalContent.style.maxWidth = '1100px';

        const footer = `<button class="btn btn-primary" onclick="MilhasModule.fecharPortal()">Fechar</button>`;
        AppModule.openModal(`Portal do Cliente`, html, footer);
    }

    function fecharPortal() {
        // Restaura largura padrão do modal ao fechar
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) modalContent.style.maxWidth = '';
        AppModule.closeModal();
    }

    // ============================================================
    // API PÚBLICA
    // ============================================================
    return {
        init: init,
        renderClientes: renderClientes,
        portalCliente: portalCliente,
        fecharPortal: fecharPortal
    };
})();
