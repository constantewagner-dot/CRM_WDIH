/* ============================================================
   vendas.js — Módulo de Vendas do CRM WDIH
   Compatível com o index.html existente
   ============================================================ */

const VendasModule = {

    estado: {
        filtroCliente: '',
        filtroServico: '',
        periodo: 'todos',
        dataInicio: '',
        dataFim: '',
        ordenarPor: 'data',
        ordem: 'desc'
    },

    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */
    init() {
        this.render();
    },

    novaVenda() {
        this.abrirModal();
    },

    /* ============================================================
       RENDERIZAÇÃO PRINCIPAL
       ============================================================ */
    render() {
        this.renderResumo();
        this.renderList();
    },

    /* ============================================================
       RESUMO (cards no topo)
       ============================================================ */
    renderResumo() {
        const resumo = document.getElementById('vendas-resumo');
        if (!resumo) return;

        const vendas = this.getVendasFiltradas();
        const total = vendas.length;
        const valorTotal = vendas.reduce((s, v) => s + (parseFloat(v.valor) || 0), 0);
        const valorMedio = total > 0 ? valorTotal / total : 0;

        resumo.innerHTML = `
            <div class="vendas-periodo-filtro">
                <label for="filtro-periodo">Período:</label>
                <select id="filtro-periodo" name="filtro-periodo">
                    <option value="todos" ${this.estado.periodo === 'todos' ? 'selected' : ''}>Todos</option>
                    <option value="hoje" ${this.estado.periodo === 'hoje' ? 'selected' : ''}>Hoje</option>
                    <option value="semana" ${this.estado.periodo === 'semana' ? 'selected' : ''}>Última semana</option>
                    <option value="mes" ${this.estado.periodo === 'mes' ? 'selected' : ''}>Último mês</option>
                    <option value="ano" ${this.estado.periodo === 'ano' ? 'selected' : ''}>Último ano</option>
                    <option value="personalizado" ${this.estado.periodo === 'personalizado' ? 'selected' : ''}>Personalizado</option>
                </select>
                <div id="periodo-personalizado" style="display:${this.estado.periodo === 'personalizado' ? 'inline-flex' : 'none'};gap:4px;align-items:center;">
                    <input type="date" id="data-inicio" name="data-inicio" value="${this.estado.dataInicio}" />
                    <span>até</span>
                    <input type="date" id="data-fim" name="data-fim" value="${this.estado.dataFim}" />
                </div>
            </div>
            <div class="mini-stat">
                <span>Total de Vendas</span>
                <strong>${total}</strong>
            </div>
            <div class="mini-stat">
                <span>Valor Total</span>
                <strong>${DB.formatCurrency(valorTotal)}</strong>
            </div>
            <div class="mini-stat">
                <span>Ticket Médio</span>
                <strong>${DB.formatCurrency(valorMedio)}</strong>
            </div>
        `;

        // Eventos do período
        const selectPeriodo = document.getElementById('filtro-periodo');
        if (selectPeriodo) {
            selectPeriodo.addEventListener('change', (e) => {
                this.estado.periodo = e.target.value;
                this.estado.dataInicio = '';
                this.estado.dataFim = '';
                this.render();
            });
        }

        const dataInicio = document.getElementById('data-inicio');
        const dataFim = document.getElementById('data-fim');

        if (dataInicio) {
            dataInicio.addEventListener('change', (e) => {
                this.estado.dataInicio = e.target.value;
                this.render();
            });
        }

        if (dataFim) {
            dataFim.addEventListener('change', (e) => {
                this.estado.dataFim = e.target.value;
                this.render();
            });
        }
    },

    /* ============================================================
       LISTA DE VENDAS (tabela principal)
       ============================================================ */
    renderList() {
        const listaContainer = document.getElementById('vendas-list');
        if (!listaContainer) return;

        const clientes = DB.getClientesOrdenados();
        const servicos = DB.getServicos() || [];

        const clienteOptions = clientes.map(c =>
            `<option value="${c.id}" ${this.estado.filtroCliente === c.id ? 'selected' : ''}>${c.nome}</option>`
        ).join('');

        const servicoOptions = servicos.map(s =>
            `<option value="${s}" ${this.estado.filtroServico === s ? 'selected' : ''}>${s}</option>`
        ).join('');

        const vendas = this.getVendasFiltradas();
        this.ordenarVendas(vendas);

        let linhas = '';
        if (vendas.length === 0) {
            linhas = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhuma venda encontrada</td></tr>';
        } else {
            linhas = vendas.map(v => {
                const cliente = DB.getClienteNome(v.clienteId);
                const data = DB.formatDate(v.data);
                const valor = DB.formatCurrency(v.valor);
                const status = v.status || 'Pendente';
                const statusCls = (status || '').toLowerCase();

                return `
                    <tr>
                        <td><span class="sortable-col" data-campo="data">${data}</span></td>
                        <td><span class="sortable-col" data-campo="clienteId">${cliente}</span></td>
                        <td><span class="sortable-col" data-campo="servico">${v.servico || '-'}</span></td>
                        <td><span class="sortable-col" data-campo="valor">${valor}</span></td>
                        <td><span class="badge status-${statusCls}">${status}</span></td>
                        <td>
                            <button class="btn-icon btn-editar-venda" data-id="${v.id}" title="Editar">✏️</button>
                            <button class="btn-icon btn-excluir-venda" data-id="${v.id}" title="Excluir">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        listaContainer.innerHTML = `
            <div class="vendas-filtros-toolbar">
                <div class="filtro-item">
                    <label for="filtro-cliente">Cliente:</label>
                    <select id="filtro-cliente" name="filtro-cliente">
                        <option value="">Todos</option>
                        ${clienteOptions}
                    </select>
                </div>
                <div class="filtro-item">
                    <label for="filtro-servico">Serviço:</label>
                    <select id="filtro-servico" name="filtro-servico">
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

        // Eventos dos filtros
        document.getElementById('filtro-cliente').addEventListener('change', (e) => {
            this.estado.filtroCliente = e.target.value;
            this.renderList();
        });

        document.getElementById('filtro-servico').addEventListener('change', (e) => {
            this.estado.filtroServico = e.target.value;
            this.renderList();
        });

        document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
            this.estado.filtroCliente = '';
            this.estado.filtroServico = '';
            this.render();
        });

        // Eventos de ordenação
        document.querySelectorAll('#tabela-vendas th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const campo = th.dataset.campo;
                if (this.estado.ordenarPor === campo) {
                    this.estado.ordem = this.estado.ordem === 'asc' ? 'desc' : 'asc';
                } else {
                    this.estado.ordenarPor = campo;
                    this.estado.ordem = 'asc';
                }
                this.renderList();
            });
        });

        // Eventos de editar/excluir
        document.querySelectorAll('.btn-editar-venda').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.abrirModal(btn.dataset.id);
            });
        });

        document.querySelectorAll('.btn-excluir-venda').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.excluirVenda(btn.dataset.id);
            });
        });
    },

    getIcone(campo) {
        if (this.estado.ordenarPor !== campo) return '⇅';
        return this.estado.ordem === 'asc' ? '▲' : '▼';
    },

    /* ============================================================
       FILTRAGEM E ORDENAÇÃO
       ============================================================ */
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

            if (campo === 'clienteId') {
                valA = DB.getClienteNome(a.clienteId);
                valB = DB.getClienteNome(b.clienteId);
            }

            if (campo === 'data') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }

            if (campo === 'valor') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            }

            if (valA < valB) return ordem === 'asc' ? -1 : 1;
            if (valA > valB) return ordem === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /* ============================================================
       MODAL — usa o modal genérico do AppModule
       ============================================================ */
    abrirModal(id) {
        const venda = id ? DB.getVendaById(id) || {} : {};
        const clientes = DB.getClientesOrdenados();
        const servicos = DB.getServicos() || [];

        const clienteOptions = clientes.map(c =>
            `<option value="${c.id}" ${venda.clienteId === c.id ? 'selected' : ''}>${c.nome}</option>`
        ).join('');

        const servicoOptions = servicos.map(s =>
            `<option value="${s}" ${venda.servico === s ? 'selected' : ''}>${s}</option>`
        ).join('');

        const dataVenda = venda.data ? new Date(venda.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        if (typeof AppModule !== 'undefined' && AppModule.openModal) {
            // Usa o modal genérico do sistema
            AppModule.openModal(id ? 'Editar Venda' : 'Nova Venda', `
                <div class="form-group">
                    <label for="venda-cliente">Cliente *</label>
                    <select id="venda-cliente" name="clienteId" required>
                        <option value="">Selecione...</option>
                        ${clienteOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="venda-servico">Serviço *</label>
                    <select id="venda-servico" name="servico" required>
                        <option value="">Selecione...</option>
                        ${servicoOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="venda-valor">Valor *</label>
                    <input type="number" id="venda-valor" name="valor" step="0.01" value="${venda.valor || ''}" required />
                </div>
                <div class="form-group">
                    <label for="venda-data">Data</label>
                    <input type="date" id="venda-data" name="data" value="${dataVenda}" />
                </div>
                <div class="form-group">
                    <label for="venda-status">Status</label>
                    <select id="venda-status" name="status">
                        <option value="Pendente" ${venda.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="Confirmada" ${venda.status === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                        <option value="Cancelada" ${venda.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="venda-obs">Observações</label>
                    <textarea id="venda-obs" name="observacoes" rows="3">${venda.observacoes || ''}</textarea>
                </div>
            `, `
                <button class="btn btn-secondary" onclick="VendasModule.fecharModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="VendasModule.salvarVenda('${id || ''}')">Salvar</button>
            `);
        } else {
            // Fallback caso AppModule não exista
            alert('Erro: AppModule não encontrado');
        }
    },

    fecharModal() {
        if (typeof AppModule !== 'undefined' && AppModule.closeModal) {
            AppModule.closeModal();
        }
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
    }
};

// Registrar no AppModule se disponível
if (typeof AppModule !== 'undefined' && AppModule.registerModule) {
    AppModule.registerModule('vendas', VendasModule);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    VendasModule.init();
});
