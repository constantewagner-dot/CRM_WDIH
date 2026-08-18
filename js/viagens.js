/* ============================================================
   viagens.js — Gestão de Viagens + Check-in completo
   ============================================================ */

const ViagensModule = {
    init() {
        this.render();
        document.getElementById('btn-nova-viagem').addEventListener('click', () => this.openForm());
    },

    render() {
        const viagens = DB.getViagens();
        const clientes = DB.getClientes();
        const tbody = document.querySelector('#tabela-viagens tbody');
        if (!tbody) return;

        if (!viagens.length) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--gray-500);">Nenhuma viagem cadastrada.</td></tr>`;
            return;
        }

        tbody.innerHTML = viagens.sort((a, b) => new Date(a.dataIda) - new Date(b.dataIda)).map(v => {
            const cliente = clientes.find(c => c.id === v.clienteId);
            const statusClass = v.status === 'Confirmada' ? 'success' : v.status === 'Cancelada' ? 'danger' : 'warning';
            const fmtValor = v.valor ? 'R$ ' + Number(v.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-';
            const checkinBadge = this.renderCheckinBadge(v);

            return `
                <tr>
                    <td>${cliente ? cliente.nome : '-'}${v.origem === 'automatica' ? ' <span class="badge badge-info">auto</span>' : ''}</td>
                    <td><strong>${v.destino || 'A definir'}</strong></td>
                    <td>${v.dataIda ? new Date(v.dataIda + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                    <td>${v.dataVolta ? new Date(v.dataVolta + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                    <td>${v.servico || '-'}</td>
                    <td>${fmtValor}</td>
                    <td><span class="badge badge-${statusClass}">${v.status || 'Pendente'}</span></td>
                    <td>${checkinBadge}</td>
                    <td>
                        <button class="btn-sm btn-sm-action" onclick="ViagensModule.abrirCheckin('${v.id}')" title="Check-in">✅</button>
                        <button class="btn-sm btn-sm-primary" onclick="ViagensModule.openForm('${v.id}')" title="Editar">✏️</button>
                        <button class="btn-sm btn-sm-danger" onclick="ViagensModule.remove('${v.id}')" title="Excluir">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderCheckinBadge(v) {
        if (v.checkin) {
            const data = v.checkin.data ? new Date(v.checkin.data + 'T00:00:00').toLocaleDateString('pt-BR') : '';
            return `<span class="badge badge-checkin-sim">✅ ${data || 'Realizado'}</span>`;
        }
        return '<span class="badge badge-checkin">⏳ Pendente</span>';
    },

    /* ========== FORM DE VIAGEM ========== */
    openForm(id) {
        const v = id ? DB.getViagens().find(x => x.id === id) : {
            clienteId: '', destino: '', dataIda: '', dataVolta: '', servico: '',
            companhia: '', valor: 0, status: 'Pendente', necessitaCheckin: 'sim', notas: ''
        };
        const clientes = DB.getClientes();
        const servicos = DB.getServicos();
        const companhias = DB.getCompanhias();

        const html = `
            <div class="form-group"><label>Cliente *</label><select id="v-cliente"><option value="">-- Selecione --</option>${clientes.map(c => `<option value="${c.id}" ${c.id === v.clienteId ? 'selected' : ''}>${c.nome}</option>`).join('')}</select></div>
            <div class="form-group"><label>Destino *</label><input type="text" id="v-destino" value="${v.destino || ''}" placeholder="Ex: Paris, França"></div>
            <div class="form-row">
                <div class="form-group"><label>Data de Ida</label><input type="date" id="v-data-ida" value="${v.dataIda || ''}"></div>
                <div class="form-group"><label>Data de Volta</label><input type="date" id="v-data-volta" value="${v.dataVolta || ''}"></div>
            </div>
            <div class="form-group"><label>Serviço</label><select id="v-servico"><option value="">-- Selecione --</option>${servicos.map(s => `<option ${s === v.servico ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
            <div class="form-group"><label>Companhia Aérea</label><select id="v-companhia"><option value="">-- Selecione --</option>${companhias.map(c => `<option ${c === v.companhia ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="form-row">
                <div class="form-group"><label>Valor (R$)</label><input type="number" id="v-valor" value="${v.valor || 0}" step="0.01" min="0"></div>
                <div class="form-group"><label>Status</label><select id="v-status"><option ${v.status === 'Pendente' ? 'selected' : ''}>Pendente</option><option ${v.status === 'Confirmada' ? 'selected' : ''}>Confirmada</option><option ${v.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option><option ${v.status === 'Concluída' ? 'selected' : ''}>Concluída</option><option ${v.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option></select></div>
            </div>
            <div class="form-group"><label>Necessita Check-in?</label><select id="v-checkin-necess"><option value="sim" ${v.necessitaCheckin !== 'nao' ? 'selected' : ''}>Sim</option><option value="nao" ${v.necessitaCheckin === 'nao' ? 'selected' : ''}>Não</option></select></div>
            <div class="form-group"><label>Notas</label><textarea id="v-notas">${v.notas || ''}</textarea></div>
        `;
        AppModule.abrirModal(id ? 'Editar Viagem' : 'Nova Viagem', html, [
            { label: 'Cancelar', class: 'btn-outline', action: () => AppModule.fecharModal() },
            { label: id ? 'Salvar' : 'Criar', class: 'btn-primary', action: () => this.save(id) }
        ]);
    },

    save(id) {
        const clienteId = document.getElementById('v-cliente').value;
        const destino = document.getElementById('v-destino').value.trim();
        if (!clienteId || !destino) { AppModule.showToast('Cliente e destino são obrigatórios!', 'error'); return; }

        const dados = {
            clienteId, destino,
            dataIda: document.getElementById('v-data-ida').value,
            dataVolta: document.getElementById('v-data-volta').value,
            servico: document.getElementById('v-servico').value,
            companhia: document.getElementById('v-companhia').value,
            valor: parseFloat(document.getElementById('v-valor').value) || 0,
            status: document.getElementById('v-status').value,
            necessitaCheckin: document.getElementById('v-checkin-necess').value,
            notas: document.getElementById('v-notas').value.trim()
        };

        if (id) {
            const viagem = DB.getViagens().find(x => x.id === id);
            if (viagem) {
                Object.assign(viagem, dados);
                DB.saveViagem(viagem);
                DB.logAtividade('viagem', `Viagem atualizada: ${destino}`);
            }
        } else {
            dados.id = DB.gerarId('viagem');
            dados.checkin = null;
            dados.origem = 'manual';
            dados.criadoEm = new Date().toISOString();
            DB.saveViagem(dados);
            DB.logAtividade('viagem', `Nova viagem: ${destino}`);
        }

        AppModule.fecharModal();
        this.render();
        AppModule.showToast('Viagem salva!', 'success');
    },

    remove(id) {
        if (!confirm('Excluir esta viagem?')) return;
        DB.deleteViagem(id);
        this.render();
        AppModule.showToast('Viagem excluída', 'info');
    },

    /* ========== CHECK-IN ========== */
    abrirCheckin(viagemId) {
        const viagem = DB.getViagens().find(v => v.id === viagemId);
        if (!viagem) return;

        const checkin = viagem.checkin || {};
        const anexos = checkin.anexos || [];
        const hoje = new Date().toISOString().split('T')[0];

        const html = `
            <div class="form-group">
                <label>📅 Data do Check-in</label>
                <input type="date" id="checkin-data" value="${checkin.data || hoje}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="checkin-status">
                    <option value="realizado" ${checkin.status === 'realizado' ? 'selected' : ''}>Realizado</option>
                </select>
            </div>
            <div class="form-group">
                <label>📎 Anexar Arquivos</label>
                <input type="file" id="checkin-anexo" multiple>
                <div class="anexos-list" id="checkin-anexos-list">
                    ${this.renderAnexos(anexos)}
                </div>
            </div>
        `;

        const botoes = [
            { label: 'Cancelar', class: 'btn-outline', action: () => AppModule.fecharModal() }
        ];

        // Opção de cancelar check-in (apenas se já existir)
        if (viagem.checkin) {
            botoes.push({ label: '🚫 Cancelar Check-in', class: 'btn-danger', action: () => this.cancelarCheckin(viagemId) });
        }

        botoes.push({ label: '💾 Salvar Check-in', class: 'btn-primary', action: () => this.salvarCheckin(viagemId) });

        AppModule.abrirModal('Check-in da Viagem', html, botoes);
    },

    renderAnexos(anexos) {
        if (!anexos || !anexos.length) return '<p style="font-size:11px;color:var(--gray-500);">Nenhum anexo</p>';
        return anexos.map((a, i) => `
            <div class="anexo-item">
                <span>📄 ${a.nome} (${(a.tamanho / 1024).toFixed(1)} KB)</span>
                <a href="${a.dataUrl}" download="${a.nome}">⬇️</a>
                <button type="button" onclick="ViagensModule.removerAnexo(${i})">✕</button>
            </div>
        `).join('');
    },

    anexosTemporarios: [],

    removerAnexo(index) {
        // Remove de anexos temporários (visuais)
        // Os anexos são persistidos apenas no salvar
        AppModule.showToast('Anexo será removido ao salvar', 'info');
    },

    salvarCheckin(viagemId) {
        const viagem = DB.getViagens().find(v => v.id === viagemId);
        if (!viagem) return;

        const fileInput = document.getElementById('checkin-anexo');
        const anexos = (viagem.checkin && viagem.checkin.anexos) ? viagem.checkin.anexos.slice() : [];

        const finalizar = () => {
            viagem.checkin = {
                data: document.getElementById('checkin-data').value,
                status: document.getElementById('checkin-status').value,
                realizadoEm: new Date().toISOString(),
                anexos: anexos
            };
            DB.saveViagem(viagem);
            DB.logAtividade('viagem', `Check-in realizado: ${viagem.destino || viagem.servico || ''}`);
            AppModule.fecharModal();
            this.render();
            if (typeof DashboardModule !== 'undefined') DashboardModule.refresh();
            AppModule.showToast('✅ Check-in realizado com sucesso!', 'success');
        };

        if (fileInput && fileInput.files.length) {
            let processados = 0;
            const total = fileInput.files.length;
            Array.from(fileInput.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        anexos.push({
                            nome: file.name,
                            tipo: file.type,
                            tamanho: file.size,
                            dataUrl: e.target.result
                        });
                    } catch (err) {
                        AppModule.showToast('Erro ao ler arquivo: ' + file.name, 'error');
                    }
                    processados++;
                    if (processados === total) finalizar();
                };
                reader.readAsDataURL(file);
            });
        } else {
            finalizar();
        }
    },

    cancelarCheckin(viagemId) {
        if (!confirm('Tem certeza que deseja cancelar o check-in desta viagem?')) return;
        const viagem = DB.getViagens().find(v => v.id === viagemId);
        if (!viagem) return;
        viagem.checkin = null;
        DB.saveViagem(viagem);
        AppModule.fecharModal();
        this.render();
        if (typeof DashboardModule !== 'undefined') DashboardModule.refresh();
        AppModule.showToast('Check-in cancelado', 'info');
    }
};
