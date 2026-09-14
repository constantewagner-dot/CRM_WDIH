/* ============================================================
   vendas.js — Módulo de Vendas do CRM WDIH
   Filtros: cliente, serviço, período
   Ordenação: clique no título da coluna
   ============================================================ */

const VendasModule = {

    estado: {
        filtroCliente: '',
        filtroServico: '',
        periodo: 'todos', // todos, hoje, semana, mes, ano, personalizado
        dataInicio: '',
        dataFim: '',
        ordenarPor: 'data',
        ordem: 'desc' // asc ou desc
    },

    init() {
        this.render();
    },

    /* ============================================================
       RENDERIZAÇÃO PRINCIPAL
       ============================================================ */
    render() {
        const container = document.getElementById('vendas-container');
        if (!container) return;

        container.innerHTML = `
            <div class="vendas-resumo" id="vendas-resumo"></div>
            <div class="vendas-filtros" id="vendas-filtros"></div>
            <div class="vendas-tabela-wrapper">
                <table class="vendas-tabela">
                    <thead id="vendas-thead"></thead>
                    <tbody id="vendas-tbody"></tbody>
                </table>
            </div>
            <div id="vendas-modal-container"></div>
        `;

        this.renderResumo();
        this.renderFiltros();
        this.renderTabela();
        this.bindEventos();
    },

    /* ============================================================
       CARD DE RESUMO COM FILTRO DE PERÍODO
       ============================================================ */
    renderResumo() {
        const resumo = document.getElementById('vendas-resumo');
        if (!resumo) return;

        const vendas = this.getVendasFiltradas();
        const total = vendas.length;
        const valorTotal = vendas.reduce((s, v) => s + (parseFloat(v.valor) || 0), 0);
        const valorMedio = total > 0 ? valorTotal / total : 0;

        resumo.innerHTML = `
            <div class="resumo-header">
                <h3>📊 Resumo de Vendas</h3>
                <div class="resumo-periodo">
                    <label>Período:</label>
                    <select id="filtro-periodo">
                        <option value="todos" ${this.estado.periodo === 'todos' ? 'selected' : ''}>Todos</option>
                        <option value="hoje" ${this.estado.periodo === 'hoje' ? 'selected' : ''}>Hoje</option>
                        <option value="semana" ${this.estado.periodo === 'semana' ? 'selected' : ''}>Última semana</option>
                        <option value="mes" ${this.estado.periodo === 'mes' ? 'selected' : ''}>Último mês</option>
                        <option value="ano" ${this.estado.periodo === 'ano' ? 'selected' : ''}>Último ano</option>
                        <option value="personalizado" ${this.estado.periodo === 'personalizado' ? 'selected' : ''}>Personalizado</option>
                    </select>
                    <div id="periodo-personalizado" style="display:${this.estado.periodo === 'personalizado' ? 'inline-flex' : 'none'};gap:8px;align-items:center;margin-left:8px;">
                        <input type="date" id="data-inicio" value="${this.estado.dataInicio}" />
                        <span>até</span>
                        <input type="date" id="data-fim" value="${this.estado.dataFim}" />
                    </div>
                </div>
            </div>
            <div class="resumo-cards">
                <div class="card-resumo">
                    <div class="card-icon">🛒</div>
                    <div class="card-info">
                        <div class="card-label">Total de Vendas</div>
                        <div class="card-value">${total}</div>
                    </div>
                </div>
                <div class="card-resumo">
                    <div class="card-icon">💰</div>
                    <div class="card-info">
                        <div class="card-label">Valor Total</div>
                        <div class="card-value">${DB.formatCurrency(valorTotal)}</div>
                    </div>
                </div>
                <div class="card-resumo">
                    <div class="card-icon">📈</div>
                    <div class="card-info">
                        <div class="card-label">Ticket Médio</div>
                        <div class="card-value">${DB.formatCurrency(valorMedio)}</div>
                    </div>
                </div>
            </div>
        `;

        // Eventos do período
        document.getElementById('filtro-periodo').addEventListener('change', (e) => {
            this.estado.periodo = e.target.value;
            this.renderResumo();
            this.renderTabela();
        });

        document.getElementById('data-inicio')?.addEventListener('change', (e) => {
            this.estado.dataInicio = e.target.value;
            this.renderResumo();
            this.renderTabela();
        });

        document.getElementById('data-fim')?.addEventListener('change', (e) => {
            this.estado.dataFim = e.target.value;
            this.renderResumo();
            this.renderTabela();
        });
    },

    /* ============================================================
       FILTROS (CLIENTE E SERVIÇO)
       ============================================================ */
    renderFiltros() {
        const filtros = document.getElementById('vendas-filtros');
        if (!filtros) return;

        const clientes = DB.getClientesOrdenados();
        const servicos = DB.getServicos() || [];

        const clienteOptions = clientes.map(c =>
            `<option value="${c.id}" ${this.estado.filtroCliente === c.id ? 'selected' : ''}>${c.nome}</option>`
        ).join('');

        const servicoOptions = servicos.map(s =>
            `<option value="${s}" ${this.estado.filtroServico === s ? 'selected' : ''}>${s}</option>`
        ).join('');

        filtros.innerHTML = `
            <div class="filtros-bar">
                <div class="filtro-item">
                    <label>Cliente:</label>
                    <select id="filtro-cliente">
                        <option value="">Todos</option>
                        ${clienteOptions}
                    </select>
                </div>
                <div class="filtro-item">
                    <label>Serviço:</label>
                    <select id="filtro-servico">
                        <option value="">Todos</option>
                        ${servicoOptions}
                    </select>
                </div>
                <button class="btn-limpar-filtros" id="btn-limpar-filtros">Limpar Filtros</button>
                <button class="btn-nova-venda" id="btn-nova-venda">+ Nova Venda</button>
            </div>
        `;

        // Eventos dos filtros
        document.getElementById('filtro-cliente').addEventListener('change', (e) => {
            this.estado.filtroCliente = e.target.value;
            this.renderTabela();
        });

        document.getElementById('filtro-servico').addEventListener('change', (e) => {
            this.estado.filtroServico = e.target.value;
            this.renderTabela();
        });

        document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
            this.estado.filtroCliente = '';
            this.estado.filtroServico = '';
            this.estado.periodo = 'todos';
            this.estado.dataInicio = '';
            this.estado.dataFim = '';
            this.render();
        });

        document.getElementById('btn-nova-venda').addEventListener('click', () => this.abrirModal());
    },

    /* ============================================================
       TABELA COM ORDENAÇÃO
       ============================================================ */
    renderTabela() {
        const thead = document.getElementById('vendas-thead');
        const tbody = document.getElementById('vendas-tbody');
        if (!thead || !tbody) return;

        const colunas = [
            { campo: 'data', label: 'Data' },
            { campo: 'clienteId', label: 'Cliente' },
            { campo: 'servico', label: 'Serviço' },
            { campo: 'valor', label: 'Valor' },
            { campo: 'status', label: 'Status' },
            { campo: 'acoes', label: 'Ações' }
        ];

        // Cabeçalho com ícones de ordenação
        thead.innerHTML = '<tr>' + colunas.map(c => {
            if (c.campo === 'acoes') return `<th>${c.label}</th>`;
            const ativo = this.estado.ordenarPor === c.campo;
            const icone = ativo ? (this.estado.ordem === 'asc' ? '▲' : '▼') : '⇅';
            return `<th class="ordenavel ${ativo ? 'ativa' : ''}" data-campo="${c.campo}">${c.label} <span class="icone-ordem">${icone}</span></th>`;
        }).join('') + '</tr>';

        // Eventos de ordenação
        thead.querySelectorAll('.ordenavel').forEach(th => {
            th.addEventListener('click', () => {
                const campo = th.dataset.campo;
                if (this.estado.ordenarPor === campo) {
                    this.estado.ordem = this.estado.ordem === 'asc' ? 'desc' : 'asc';
                } else {
                    this.estado.ordenarPor = campo;
                    this.estado.ordem = 'asc';
                }
                this.renderTabela();
            });
        });

        // Dados filtrados e ordenados
        const vendas = this.getVendasFiltradas();
        this.ordenarVendas(vendas);

        if (vendas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Nenhuma venda encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = vendas.map(v => {
            const cliente = DB.getClienteNome(v.clienteId);
            const data = DB.formatDate(v.data);
            const valor = DB.formatCurrency(v.valor);
            const status = v.status || 'Pendente';

            return `
                <tr>
                    <td>${data}</td>
                    <td>${cliente}</td>
                    <td>${v.servico || '-'}</td>
                    <td>${valor}</td>
                    <td><span class="status-badge status-${(status || '').toLowerCase()}">${status}</span></td>
                    <td>
                        <button class="btn-editar" data-id="${v.id}" title="Editar">✏️</button>
                        <button class="btn-excluir" data-id="${v.id}" title="Excluir">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Eventos de editar/excluir
        tbody.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => this.abrirModal(btn.dataset.id));
        });

        tbody.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', () => this.excluirVenda(btn.dataset.id));
        });
    },

    /* ============================================================
       FILTRAGEM E ORDENAÇÃO
       ============================================================ */
    getVendasFiltradas() {
        let vendas = DB.getVendas();

        // Filtro por cliente
        if (this.estado.filtroCliente) {
            vendas = vendas.filter(v => v.clienteId === this.estado.filtroCliente);
        }

        // Filtro por serviço
        if (this.estado.filtroServico) {
            vendas = vendas.filter(v => v.servico === this.estado.filtroServico);
        }

        // Filtro por período
        if (this.estado.periodo !== 'todos') {
            const agora = new Date();
            let inicio;

            switch (this.estado.periodo) {
                case 'hoje':
                    inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
                    break;
                case 'semana':
                    inicio = new Date(agora);
                    inicio.setDate(agora.getDate() - 7);
                    break;
                case 'mes':
                    inicio = new Date(agora);
                    inicio.setMonth(agora.getMonth() - 1);
                    break;
                case 'ano':
                    inicio = new Date(agora);
                    inicio.setFullYear(agora.getFullYear() - 1);
                    break;
                case 'personalizado':
                    if (this.estado.dataInicio) inicio = new Date(this.estado.dataInicio);
                    if (this.estado.dataFim) {
                        const fim = new Date(this.estado.dataFim);
                        fim.setHours(23, 59, 59, 999);
                        vendas = vendas.filter(v => {
                            const d = new Date(v.data);
                            return d >= inicio && d <= fim;
                        });
                        return vendas;
                    }
                    break;
            }

            if (inicio) {
                vendas = vendas.filter(v => new Date(v.data) >= inicio);
            }
        }

        return vendas;
    },

    ordenarVendas(vendas) {
        const campo = this.estado.ordenarPor;
        const ordem = this.estado.ordem;

        vendas.sort((a, b) => {
            let valA = a[campo];
            let valB = b[campo];

            // Tratamento especial para clienteId (ordenar por nome)
            if (campo === 'clienteId') {
                valA = DB.getClienteNome(a.clienteId);
                valB = DB.getClienteNome(b.clienteId);
            }

            // Tratamento para datas
            if (campo === 'data') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }

            // Tratamento para valores numéricos
            if (campo === 'valor') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            }

            // Comparação
            if (valA < valB) return ordem === 'asc' ? -1 : 1;
            if (valA > valB) return ordem === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /* ============================================================
       MODAL DE NOVA/EDIÇÃO DE VENDA
       ============================================================ */
    abrirModal(id) {
        const venda = id ? DB.getVendaById(id) : {};
        const clientes = DB.getClientesOrdenados();
        const servicos = DB.getServicos() || [];

        const clienteOptions = clientes.map(c =>
            `<option value="${c.id}" ${venda.clienteId === c.id ? 'selected' : ''}>${c.nome}</option>`
        ).join('');

        const servicoOptions = servicos.map(s =>
            `<option value="${s}" ${venda.servico === s ? 'selected' : ''}>${s}</option>`
        ).join('');

        const modal = document.getElementById('vendas-modal-container');
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${id ? 'Editar Venda' : 'Nova Venda'}</h3>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Cliente *</label>
                            <select id="venda-cliente" required>
                                <option value="">Selecione...</option>
                                ${clienteOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Serviço *</label>
                            <select id="venda-servico" required>
                                <option value="">Selecione...</option>
                                ${servicoOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Valor *</label>
                            <input type="number" id="venda-valor" step="0.01" value="${venda.valor || ''}" required />
                        </div>
                        <div class="form-group">
                            <label>Data</label>
                            <input type="date" id="venda-data" value="${venda.data ? new Date(venda.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" />
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="venda-status">
                                <option value="Pendente" ${venda.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                <option value="Confirmada" ${venda.status === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                                <option value="Cancelada" ${venda.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Observações</label>
                            <textarea id="venda-obs" rows="3">${venda.observacoes || ''}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancelar" id="btn-cancelar">Cancelar</button>
                        <button class="btn-salvar" id="btn-salvar-venda">Salvar</button>
                    </div>
                </div>
            </div>
        `;

        // Eventos do modal
        document.getElementById('modal-close').addEventListener('click', () => this.fecharModal());
        document.getElementById('btn-cancelar').addEventListener('click', () => this.fecharModal());
        document.getElementById('btn-salvar-venda').addEventListener('click', () => this.salvarVenda(id));
    },

    fecharModal() {
        const modal = document.getElementById('vendas-modal-container');
        if (modal) modal.innerHTML = '';
    },

    salvarVenda(id) {
        const clienteId = document.getElementById('venda-cliente').value;
        const servico = document.getElementById('venda-servico').value;
        const valor = parseFloat(document.getElementById('venda-valor').value);
        const data = document.getElementById('venda-data').value;
        const status = document.getElementById('venda-status').value;
        const observacoes = document.getElementById('venda-obs').value;

        if (!clienteId || !servico || !valor) {
            alert('Preencha todos os campos obrigatórios (*)');
            return;
        }

        const venda = {
            id: id || DB.generateId(),
            clienteId,
            servico,
            valor,
            data: data ? new Date(data).toISOString() : new Date().toISOString(),
            status,
            observacoes
        };

        DB.saveVenda(venda);
        this.fecharModal();
        this.render();
    },

    excluirVenda(id) {
        if (!confirm('Tem certeza que deseja excluir esta venda?')) return;
        DB.deleteVenda(id);
        this.render();
    },

    bindEventos() {
        // Eventos adicionais se necessário
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof AppModule !== 'undefined' && AppModule.registerModule) {
        AppModule.registerModule('vendas', VendasModule);
    }
});
