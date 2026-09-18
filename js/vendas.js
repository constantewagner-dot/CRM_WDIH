/* ============================================================
   vendas.js — Módulo de Vendas do CRM WDIH
   Versão: 7.0 — Reescrita completa com segurança e fallback
   ============================================================ */

(function (global) {
    'use strict';

    // ==========================================================
    // UTILITÁRIOS DE SEGURANÇA
    // ==========================================================

    /**
     * Escapa caracteres especiais do HTML para prevenir XSS.
     */
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    /**
     * Sanitiza valor numérico.
     */
    function parseMoney(value) {
        const num = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
        return isNaN(num) ? 0 : num;
    }

    /**
     * Formata valor como moeda brasileira.
     */
    function formatCurrency(value) {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(num);
    }

    /**
     * Formata data ISO para padrão brasileiro.
     */
    function formatDate(isoDate) {
        if (!isoDate) return '-';
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('pt-BR');
    }

    /**
     * Gera ID único.
     */
    function generateId() {
        return 'vnd_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ==========================================================
    // MOCK DO DB (fallback caso DB não exista)
    // ==========================================================

    const DB = global.DB || {
        _vendas: [],
        _clientes: [],
        _servicos: [],

        getVendas() { return this._vendas; },
        getVendaById(id) { return this._vendas.find(v => v.id === id); },
        saveVenda(venda) {
            const idx = this._vendas.findIndex(v => v.id === venda.id);
            if (idx >= 0) this._vendas[idx] = venda;
            else this._vendas.push(venda);
        },
        deleteVenda(id) {
            this._vendas = this._vendas.filter(v => v.id !== id);
        },
        getClientesOrdenados() {
            return [...this._clientes].sort((a, b) => a.nome.localeCompare(b.nome));
        },
        getClienteNome(id) {
            const c = this._clientes.find(c => c.id === id);
            return c ? c.nome : '—';
        },
        getServicos() { return this._servicos; },
        formatCurrency: formatCurrency,
        formatDate: formatDate,
        generateId: generateId
    };

    // ==========================================================
    // MÓDULO DE VENDAS
    // ==========================================================

    const VendasModule = {
        // Estado local
        estado: {
            filtroCliente: '',
            filtroServico: '',
            periodo: 'todos',
            dataInicio: '',
            dataFim: '',
            ordenarPor: 'data',
            ordem: 'desc'
        },

        // Referências DOM cacheadas
        dom: {
            resumo: null,
            lista: null
        },

        // Flag para evitar múltiplos modais
        modalAberto: false,

        /**
         * Inicializa o módulo.
         */
        init() {
            this.dom.resumo = document.getElementById('vendas-resumo');
            this.dom.lista = document.getElementById('vendas-list');

            if (!this.dom.resumo || !this.dom.lista) {
                console.error('[VendasModule] Elementos #vendas-resumo ou #vendas-list não encontrados.');
                return;
            }

            this.render();
        },

        /**
         * Abre modal para nova venda.
         */
        novaVenda() {
            this.abrirModal();
        },

        // ==========================================================
        // RENDERIZAÇÃO
        // ==========================================================

        render() {
            this.renderResumo();
            this.renderList();
        },

        renderResumo() {
            const container = this.dom.resumo;
            if (!container) return;

            const vendas = this.getVendasFiltradas();
            const total = vendas.length;
            const valorTotal = vendas.reduce((s, v) => s + (parseFloat(v.valor) || 0), 0);
            const valorMedio = total > 0 ? valorTotal / total : 0;

            container.innerHTML = `
                <div class="vendas-resumo-grid">
                    <div class="mini-stat">
                        <span>Total de Vendas</span>
                        <strong>${total}</strong>
                    </div>
                    <div class="mini-stat">
                        <span>Valor Total</span>
                        <strong>${escapeHtml(formatCurrency(valorTotal))}</strong>
                    </div>
                    <div class="mini-stat">
                        <span>Ticket Médio</span>
                        <strong>${escapeHtml(formatCurrency(valorMedio))}</strong>
                    </div>
                </div>
                <div class="vendas-periodo-filtro">
                    <label for="filtro-periodo">Período:</label>
                    <select id="filtro-periodo">
                        <option value="todos" ${this.estado.periodo === 'todos' ? 'selected' : ''}>Todos</option>
                        <option value="hoje" ${this.estado.periodo === 'hoje' ? 'selected' : ''}>Hoje</option>
                        <option value="semana" ${this.estado.periodo === 'semana' ? 'selected' : ''}>Última semana</option>
                        <option value="mes" ${this.estado.periodo === 'mes' ? 'selected' : ''}>Último mês</option>
                        <option value="ano" ${this.estado.periodo === 'ano' ? 'selected' : ''}>Último ano</option>
                        <option value="personalizado" ${this.estado.periodo === 'personalizado' ? 'selected' : ''}>Personalizado</option>
                    </select>
                    <div id="periodo-personalizado" style="display:${this.estado.periodo === 'personalizado' ? 'inline-flex' : 'none'};gap:6px;align-items:center;">
                        <input type="date" id="data-inicio" value="${escapeHtml(this.estado.dataInicio)}" />
                        <span>até</span>
                        <input type="date" id="data-fim" value="${escapeHtml(this.estado.dataFim)}" />
                    </div>
                </div>
            `;

            // Eventos
            const selPeriodo = document.getElementById('filtro-periodo');
            if (selPeriodo) {
                selPeriodo.addEventListener('change', (e) => {
                    this.estado.periodo = e.target.value;
                    if (this.estado.periodo !== 'personalizado') {
                        this.estado.dataInicio = '';
                        this.estado.dataFim = '';
                    }
                    this.render();
                });
            }

            const dataInicio = document.getElementById('data-inicio');
            const dataFim = document.getElementById('data-fim');
            if (dataInicio) dataInicio.addEventListener('change', (e) => { this.estado.dataInicio = e.target.value; this.render(); });
            if (dataFim) dataFim.addEventListener('change', (e) => { this.estado.dataFim = e.target.value; this.render(); });
        },

        renderList() {
            const container = this.dom.lista;
            if (!container) return;

            const clientes = DB.getClientesOrdenados();
            const servicos = DB.getServicos() || [];

            const clienteOptions = clientes.map(c =>
                `<option value="${escapeHtml(c.id)}" ${this.estado.filtroCliente === c.id ? 'selected' : ''}>${escapeHtml(c.nome)}</option>`
            ).join('');

            const servicoOptions = servicos.map(s =>
                `<option value="${escapeHtml(s)}" ${this.estado.filtroServico === s ? 'selected' : ''}>${escapeHtml(s)}</option>`
            ).join('');

            const vendas = this.getVendasFiltradas();
            this.ordenarVendas(vendas);

            let linhas = '';
            if (vendas.length === 0) {
                linhas = `<tr><td colspan="6" class="vendas-vazio">Nenhuma venda encontrada</td></tr>`;
            } else {
                linhas = vendas.map(v => {
                    const cliente = escapeHtml(DB.getClienteNome(v.clienteId));
                    const data = escapeHtml(formatDate(v.data));
                    const valor = escapeHtml(formatCurrency(v.valor));
                    const servico = escapeHtml(v.servico || '-');
                    const status = escapeHtml(v.status || 'Pendente');
                    const statusCls = status.toLowerCase();

                    return `
                        <tr>
                            <td>${data}</td>
                            <td>${cliente}</td>
                            <td>${servico}</td>
                            <td>${valor}</td>
                            <td><span class="badge status-${escapeHtml(statusCls)}">${status}</span></td>
                            <td>
                                <button class="btn-icon btn-editar-venda" data-id="${escapeHtml(v.id)}" title="Editar">✏️</button>
                                <button class="btn-icon btn-excluir-venda" data-id="${escapeHtml(v.id)}" title="Excluir">🗑️</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            container.innerHTML = `
                <div class="vendas-filtros-toolbar">
                    <div class="filtro-item">
                        <label for="filtro-cliente">Cliente:</label>
                        <select id="filtro-cliente">
                            <option value="">Todos</option>
                            ${clienteOptions}
                        </select>
                    </div>
                    <div class="filtro-item">
                        <label for="filtro-servico">Serviço:</label>
                        <select id="filtro-servico">
                            <option value="">Todos</option>
                            ${servicoOptions}
                        </select>
                    </div>
                    <button class="btn btn-secondary btn-sm" id="btn-limpar-filtros" type="button">Limpar Filtros</button>
                </div>
                <div class="table-wrap">
                    <table class="table" id="tabela-vendas">
                        <thead>
                            <tr>
                                <th class="sortable" data-campo="data">Data ${this.getIcone('data')}</th>
                                <th class="sortable" data-campo="clienteId">Cliente ${this.getIcone('clienteId')}</th>
                                <th class="sortable" data-campo="servico">Serviço ${this.getIcone('servico')}</th>
                                <th class="sortable" data-campo="valor">Valor ${this.getIcone('valor')}</th>
                                <th class="sortable" data-campo="status">Status ${this.getIcone('status')}</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas}
                        </tbody>
                    </table>
                </div>
            `;

            // Event delegation (otimizado)
            container.addEventListener('change', this.handleChange.bind(this));
            container.addEventListener('click', this.handleClick.bind(this));

            // Seta valores dos selects
            document.getElementById('filtro-cliente').value = this.estado.filtroCliente;
            document.getElementById('filtro-servico').value = this.estado.filtroServico;
        },

        // ==========================================================
        // EVENTOS (Event Delegation)
        // ==========================================================

        handleChange(e) {
            if (e.target.id === 'filtro-cliente') {
                this.estado.filtroCliente = e.target.value;
                this.renderList();
            }
            if (e.target.id === 'filtro-servico') {
                this.estado.filtroServico = e.target.value;
                this.renderList();
            }
        },

        handleClick(e) {
            const btn = e.target.closest('button');
            if (!btn) return;

            if (btn.id === 'btn-limpar-filtros') {
                this.estado.filtroCliente = '';
                this.estado.filtroServico = '';
                this.render();
                return;
            }

            if (btn.classList.contains('sortable') && btn.closest('thead')) {
                const campo = btn.dataset.campo;
                if (this.estado.ordenarPor === campo) {
                    this.estado.ordem = this.estado.ordem === 'asc' ? 'desc' : 'asc';
                } else {
                    this.estado.ordenarPor = campo;
                    this.estado.ordem = 'asc';
                }
                this.renderList();
                return;
            }

            if (btn.classList.contains('btn-editar-venda')) {
                e.preventDefault();
                e.stopPropagation();
                this.abrirModal(btn.dataset.id);
                return;
            }

            if (btn.classList.contains('btn-excluir-venda')) {
                e.preventDefault();
                e.stopPropagation();
                this.excluirVenda(btn.dataset.id);
            }
        },

        // ==========================================================
        // FILTRAGEM E ORDENAÇÃO
        // ==========================================================

        getVendasFiltradas() {
            let vendas = DB.getVendas();

            if (this.estado.filtroCliente) {
                vendas = vendas.filter(v => v.clienteId === this.estado.filtroCliente);
            }

            if (this.estado.filtroServico) {
                vendas = vendas.filter(v => v.servico === this.estado.filtroServico);
            }

            if (this.estado.periodo !== 'todos') {
                const agora = new Date();
                let inicio = null;
                let fim = null;

                switch (this.estado.periodo) {
                    case 'hoje':
                        inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
                        fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);
                        break;
                    case 'semana':
                        inicio = new Date(agora);
                        inicio.setDate(agora.getDate() - 7);
                        fim = new Date(agora);
                        break;
                    case 'mes':
                        inicio = new Date(agora);
                        inicio.setMonth(agora.getMonth() - 1);
                        fim = new Date(agora);
                        break;
                    case 'ano':
                        inicio = new Date(agora);
                        inicio.setFullYear(agora.getFullYear() - 1);
                        fim = new Date(agora);
                        break;
                    case 'personalizado':
                        if (this.estado.dataInicio) inicio = new Date(this.estado.dataInicio);
                        if (this.estado.dataFim) {
                            fim = new Date(this.estado.dataFim);
                            fim.setHours(23, 59, 59, 999);
                        }
                        break;
                }

                if (inicio) {
                    vendas = vendas.filter(v => new Date(v.data) >= inicio);
                }
                if (fim) {
                    vendas = vendas.filter(v => new Date(v.data) <= fim);
                }
            }

            return vendas;
        },

        ordenarVendas(vendas) {
            const campo = this.estado.ordenarPor;
            const ordem = this.estado.ordem;

            vendas.sort((a, b) => {
                let valA, valB;

                switch (campo) {
                    case 'data':
                        valA = new Date(a.data || 0).getTime();
                        valB = new Date(b.data || 0).getTime();
                        break;
                    case 'clienteId':
                        valA = DB.getClienteNome(a.clienteId).toLowerCase();
                        valB = DB.getClienteNome(b.clienteId).toLowerCase();
                        break;
                    case 'valor':
                        valA = parseFloat(a.valor) || 0;
                        valB = parseFloat(b.valor) || 0;
                        break;
                    case 'servico':
                        valA = String(a.servico || '').toLowerCase();
                        valB = String(b.servico || '').toLowerCase();
                        break;
                    case 'status':
                        valA = String(a.status || '').toLowerCase();
                        valB = String(b.status || '').toLowerCase();
                        break;
                    default:
                        valA = a[campo];
                        valB = b[campo];
                }

                if (valA < valB) return ordem === 'asc' ? -1 : 1;
                if (valA > valB) return ordem === 'asc' ? 1 : -1;
                return 0;
            });
        },

        getIcone(campo) {
            if (this.estado.ordenarPor !== campo) return '⇅';
            return this.estado.ordem === 'asc' ? '▲' : '▼';
        },

        // ==========================================================
        // MODAL
        // ==========================================================

        abrirModal(id) {
            if (this.modalAberto) return;
            this.modalAberto = true;

            const venda = id ? (DB.getVendaById(id) || {}) : {};
            const clientes = DB.getClientesOrdenados();
            const servicos = DB.getServicos() || [];

            const clienteOptions = clientes.map(c =>
                `<option value="${escapeHtml(c.id)}" ${venda.clienteId === c.id ? 'selected' : ''}>${escapeHtml(c.nome)}</option>`
            ).join('');

            const servicoOptions = servicos.map(s =>
                `<option value="${escapeHtml(s)}" ${venda.servico === s ? 'selected' : ''}>${escapeHtml(s)}</option>`
            ).join('');

            const dataVenda = venda.data
                ? new Date(venda.data).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];

            const titulo = id ? 'Editar Venda' : 'Nova Venda';
            const bodyHtml = `
                <form id="form-venda" novalidate>
                    <div class="form-group">
                        <label for="venda-cliente">Cliente *</label>
                        <select id="venda-cliente" required>
                            <option value="">Selecione...</option>
                            ${clienteOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="venda-servico">Serviço *</label>
                        <select id="venda-servico" required>
                            <option value="">Selecione...</option>
                            ${servicoOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="venda-valor">Valor *</label>
                        <input type="number" id="venda-valor" step="0.01" min="0" value="${escapeHtml(venda.valor)}" required />
                    </div>
                    <div class="form-group">
                        <label for="venda-data">Data</label>
                        <input type="date" id="venda-data" value="${escapeHtml(dataVenda)}" />
                    </div>
                    <div class="form-group">
                        <label for="venda-status">Status</label>
                        <select id="venda-status">
                            <option value="Pendente" ${venda.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="Confirmada" ${venda.status === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                            <option value="Cancelada" ${venda.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="venda-obs">Observações</label>
                        <textarea id="venda-obs" rows="3">${escapeHtml(venda.observacoes)}</textarea>
                    </div>
                </form>
            `;

            const footerHtml = `
                <button class="btn btn-secondary" id="btn-cancelar-venda" type="button">Cancelar</button>
                <button class="btn btn-primary" id="btn-salvar-venda" type="button" data-id="${escapeHtml(id || '')}">Salvar</button>
            `;

            // Tenta usar modal genérico do AppModule
            if (typeof global.AppModule === 'object' && typeof global.AppModule.openModal === 'function') {
                global.AppModule.openModal(titulo, bodyHtml, footerHtml);
                this.bindModalEvents();
            } else {
                // Fallback: cria modal próprio
                this.criarModalProprio(titulo, bodyHtml, footerHtml);
            }
        },

        /**
         * Fallback: cria modal próprio caso AppModule.openModal não exista.
         */
        criarModalProprio(titulo, bodyHtml, footerHtml) {
            // Remove modal anterior se existir
            this.fecharModal();

            const modal = document.createElement('div');
            modal.id = 'vendas-modal-overlay';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal" role="dialog" aria-modal="true">
                    <div class="modal-header">
                        <h3>${escapeHtml(titulo)}</h3>
                        <button class="btn-icon" id="vendas-modal-close" type="button">✕</button>
                    </div>
                    <div class="modal-body">${bodyHtml}</div>
                    <div class="modal-footer">${footerHtml}</div>
                </div>
            `;

            document.body.appendChild(modal);
            this.bindModalEvents();

            // Fecha ao clicar no overlay
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.fecharModal();
            });

            // Fecha com ESC
            this._escHandler = (e) => {
                if (e.key === 'Escape') this.fecharModal();
            };
            document.addEventListener('keydown', this._escHandler);
        },

        bindModalEvents() {
            const btnSalvar = document.getElementById('btn-salvar-venda');
            const btnCancelar = document.getElementById('btn-cancelar-venda');
            const btnFechar = document.getElementById('vendas-modal-close');

            if (btnSalvar) {
                btnSalvar.addEventListener('click', (e) => {
                    this.salvarVenda(e.target.dataset.id);
                });
            }

            if (btnCancelar) {
                btnCancelar.addEventListener('click', () => this.fecharModal());
            }

            if (btnFechar) {
                btnFechar.addEventListener('click', () => this.fecharModal());
            }
        },

        fecharModal() {
            this.modalAberto = false;

            // Se estiver usando modal genérico do AppModule
            if (typeof global.AppModule === 'object' && typeof global.AppModule.closeModal === 'function') {
                global.AppModule.closeModal();
            }

            // Remove modal próprio se existir
            const modal = document.getElementById('vendas-modal-overlay');
            if (modal) modal.remove();

            // Remove listener ESC
            if (this._escHandler) {
                document.removeEventListener('keydown', this._escHandler);
                this._escHandler = null;
            }
        },

        // ==========================================================
        // PERSISTÊNCIA
        // ==========================================================

        salvarVenda(id) {
            const clienteId = document.getElementById('venda-cliente').value.trim();
            const servico = document.getElementById('venda-servico').value.trim();
            const valorInput = document.getElementById('venda-valor').value;
            const data = document.getElementById('venda-data').value;
            const status = document.getElementById('venda-status').value;
            const observacoes = document.getElementById('venda-obs').value.trim();

            // Validação
            if (!clienteId) {
                alert('Selecione um cliente.');
                return;
            }
            if (!servico) {
                alert('Selecione um serviço.');
                return;
            }
            const valor = parseFloat(valorInput);
            if (isNaN(valor) || valor < 0) {
                alert('Informe um valor válido.');
                return;
            }

            const venda = {
                id: id || DB.generateId(),
                clienteId: clienteId,
                servico: servico,
                valor: valor,
                data: data ? new Date(data).toISOString() : new Date().toISOString(),
                status: status || 'Pendente',
                observacoes: observacoes
            };

            DB.saveVenda(venda);
            this.fecharModal();
            this.render();

            // Toast opcional
            if (typeof global.AppModule !== 'undefined' && typeof global.AppModule.toast === 'function') {
                global.AppModule.toast('Venda salva com sucesso!');
            }
        },

        excluirVenda(id) {
            if (!id) return;
            if (!confirm('Tem certeza que deseja excluir esta venda?')) return;

            DB.deleteVenda(id);
            this.render();

            if (typeof global.AppModule !== 'undefined' && typeof global.AppModule.toast === 'function') {
                global.AppModule.toast('Venda excluída.');
            }
        }
    };

    // ==========================================================
    // EXPOSIÇÃO GLOBAL E INICIALIZAÇÃO
    // ==========================================================

    global.VendasModule = VendasModule;

    // Registra no AppModule se disponível
    if (typeof global.AppModule === 'object' && typeof global.AppModule.registerModule === 'function') {
        global.AppModule.registerModule('vendas', VendasModule);
    }

    // Inicializa após carregamento do DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => VendasModule.init());
    } else {
        VendasModule.init();
    }

})(window);
