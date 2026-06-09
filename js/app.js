// App principal
console.log('🚀 App.js carregado!');

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM carregado');
    
    if (typeof db === 'undefined') {
        console.error('❌ db não encontrado!');
        alert('Erro de inicialização. Recarregue a página.');
        return;
    }
    
    await db.init();
    console.log('✅ DB inicializado');
    
    const hoje = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) input.value = hoje;
    });
    
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pagina = btn.getAttribute('data-pagina');
            mudarPagina(pagina);
        });
    });
    
    // Botões + e - para todos os campos
    document.querySelectorAll('.btn-plus, .btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const step = parseFloat(btn.getAttribute('data-step')) || 1;
            const input = document.getElementById(targetId);
            if (input) {
                let value = parseFloat(input.value) || 0;
                value += btn.classList.contains('btn-plus') ? step : -step;
                if (value < 0) value = 0;
                input.value = value;
                
                // Recalcular totais se for reposição
                if (targetId === 'rep-valor-unitario' || targetId === 'rep-qtd') {
                    calcularTotalReposicao();
                }
            }
        });
    });
    
    // Calcular total da reposição ao digitar
    const repValorUnitario = document.getElementById('rep-valor-unitario');
    const repQtd = document.getElementById('rep-qtd');
    if (repValorUnitario) repValorUnitario.addEventListener('input', calcularTotalReposicao);
    if (repQtd) repQtd.addEventListener('input', calcularTotalReposicao);
    
    // Edição - calcular total
    const editRepValorUnitario = document.getElementById('edit-rep-valor-unitario');
    const editRepQtd = document.getElementById('edit-rep-qtd');
    if (editRepValorUnitario) editRepValorUnitario.addEventListener('input', calcularTotalEdicaoReposicao);
    if (editRepQtd) editRepQtd.addEventListener('input', calcularTotalEdicaoReposicao);
    
    document.getElementById('btn-salvar-atendimento')?.addEventListener('click', salvarAtendimento);
    document.getElementById('btn-salvar-reposicao')?.addEventListener('click', salvarReposicao);
    document.getElementById('btn-salvar-despesa')?.addEventListener('click', salvarDespesa);
    document.getElementById('btn-exportar-csv')?.addEventListener('click', exportarCSV);
    
    configurarModais();
    
    await carregarDashboard();
    await carregarAtendimentos();
    await carregarReposicoes();
    await carregarDespesas();
    await carregarRelatorios();
    
    console.log('✅ App inicializado com sucesso!');
});

function calcularTotalReposicao() {
    const valorUnitario = parseFloat(document.getElementById('rep-valor-unitario')?.value) || 0;
    const quantidade = parseFloat(document.getElementById('rep-qtd')?.value) || 0;
    const total = valorUnitario * quantidade;
    
    const totalElement = document.getElementById('rep-total-valor');
    if (totalElement) {
        totalElement.innerHTML = `R$ ${total.toFixed(2)}`;
    }
}

function calcularTotalEdicaoReposicao() {
    const valorUnitario = parseFloat(document.getElementById('edit-rep-valor-unitario')?.value) || 0;
    const quantidade = parseFloat(document.getElementById('edit-rep-qtd')?.value) || 0;
    const total = valorUnitario * quantidade;
    
    const totalElement = document.getElementById('edit-rep-total-valor');
    if (totalElement) {
        totalElement.innerHTML = `R$ ${total.toFixed(2)}`;
    }
}

function configurarModais() {
    document.getElementById('btn-fechar-modal-atendimento')?.addEventListener('click', () => {
        document.getElementById('modal-editar-atendimento').style.display = 'none';
    });
    document.getElementById('btn-salvar-edicao-atendimento')?.addEventListener('click', salvarEdicaoAtendimento);
    document.getElementById('btn-excluir-atendimento')?.addEventListener('click', excluirAtendimento);
    
    document.getElementById('btn-fechar-modal-reposicao')?.addEventListener('click', () => {
        document.getElementById('modal-editar-reposicao').style.display = 'none';
    });
    document.getElementById('btn-salvar-edicao-reposicao')?.addEventListener('click', salvarEdicaoReposicao);
    document.getElementById('btn-excluir-reposicao')?.addEventListener('click', excluirReposicao);
    
    document.getElementById('btn-fechar-modal-despesa')?.addEventListener('click', () => {
        document.getElementById('modal-editar-despesa').style.display = 'none';
    });
    document.getElementById('btn-salvar-edicao-despesa')?.addEventListener('click', salvarEdicaoDespesa);
    document.getElementById('btn-excluir-despesa')?.addEventListener('click', excluirDespesa);
}

function mudarPagina(pagina) {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('ativo');
        if (btn.getAttribute('data-pagina') === pagina) {
            btn.classList.add('ativo');
        }
    });
    document.querySelectorAll('.pagina').forEach(page => {
        page.classList.remove('ativa');
    });
    document.getElementById(pagina).classList.add('ativa');
    
    if (pagina === 'dashboard') carregarDashboard();
    else if (pagina === 'atendimentos') carregarAtendimentos();
    else if (pagina === 'reposicoes') carregarReposicoes();
    else if (pagina === 'despesas') carregarDespesas();
    else if (pagina === 'relatorios') carregarRelatorios();
}

async function carregarDashboard() {
    try {
        const summary = await db.getSummary();
        document.getElementById('total-entradas').innerHTML = `R$ ${summary.entradas.toFixed(2)}`;
        document.getElementById('total-saidas').innerHTML = `R$ ${summary.saidas.toFixed(2)}`;
        document.getElementById('total-saldo').innerHTML = `R$ ${summary.saldo.toFixed(2)}`;
    } catch (error) {
        console.error('❌ Erro no dashboard:', error);
    }
}

// ============ ATENDIMENTOS ============
async function carregarAtendimentos() {
    try {
        const atendimentos = await db.getAllOrdered('atendimentos');
        const tbody = document.querySelector('#tabela-atendimentos tbody');
        if (!atendimentos || atendimentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center">Nenhum atendimento registrado</td></tr>';
            return;
        }
        tbody.innerHTML = atendimentos.map(item => `
            <tr style="cursor: pointer;" onclick="abrirModalAtendimento(${item.id})">
                <td>${item.data}</td><td>${item.nome_cliente}</td><td>${item.servico || '-'}</td><td>R$ ${(item.valor || 0).toFixed(2)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('❌ Erro ao carregar atendimentos:', error);
    }
}

async function salvarAtendimento() {
    try {
        const data = document.getElementById('att-data').value;
        const cliente = document.getElementById('att-cliente').value.trim();
        const servico = document.getElementById('att-servico').value.trim();
        const valor = parseFloat(document.getElementById('att-valor').value);
        if (!cliente) { alert('Digite o nome da cliente!'); return; }
        if (!servico) { alert('Digite o tipo de serviço!'); return; }
        if (valor <= 0) { alert('Digite um valor válido!'); return; }
        await db.add('atendimentos', { data, nome_cliente: cliente, servico, valor });
        alert('✅ Atendimento salvo!');
        document.getElementById('att-cliente').value = '';
        document.getElementById('att-servico').value = '';
        document.getElementById('att-valor').value = 0;
        await carregarAtendimentos();
        await carregarDashboard();
        await carregarRelatorios();
    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro ao salvar: ' + error.message);
    }
}

// ============ REPOSIÇÕES ============
async function carregarReposicoes() {
    try {
        const reposicoes = await db.getAllOrdered('reposicoes');
        const tbody = document.querySelector('#tabela-reposicoes tbody');
        if (!reposicoes || reposicoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center">Nenhuma reposição registrada</td></tr>';
            return;
        }
        tbody.innerHTML = reposicoes.map(item => `
            <tr style="cursor: pointer;" onclick="abrirModalReposicao(${item.id})">
                <td>${item.data}</td>
                <td>${item.produto}</td>
                <td>R$ ${(item.valor_unitario || 0).toFixed(2)}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${(item.valor_total || 0).toFixed(2)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('❌ Erro ao carregar reposições:', error);
    }
}

async function salvarReposicao() {
    try {
        const data = document.getElementById('rep-data').value;
        const produto = document.getElementById('rep-produto').value.trim();
        const valorUnitario = parseFloat(document.getElementById('rep-valor-unitario').value);
        const quantidade = parseFloat(document.getElementById('rep-qtd').value);
        const valorTotal = valorUnitario * quantidade;
        
        if (!produto) { alert('Digite o nome do produto!'); return; }
        if (valorUnitario <= 0) { alert('Digite um valor unitário válido!'); return; }
        if (quantidade <= 0) { alert('Digite uma quantidade válida!'); return; }
        
        await db.add('reposicoes', { 
            data, 
            produto, 
            valor_unitario: valorUnitario,
            quantidade: quantidade,
            valor_total: valorTotal,
            valor: valorTotal // Para compatibilidade com summary
        });
        
        alert('✅ Reposição salva! (Total: R$ ' + valorTotal.toFixed(2) + ')');
        
        document.getElementById('rep-produto').value = '';
        document.getElementById('rep-valor-unitario').value = 0;
        document.getElementById('rep-qtd').value = 0;
        document.getElementById('rep-total-valor').innerHTML = 'R$ 0,00';
        
        await carregarReposicoes();
        await carregarDashboard();
        await carregarRelatorios();
    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro ao salvar: ' + error.message);
    }
}

// ============ DESPESAS ============
async function carregarDespesas() {
    try {
        const despesas = await db.getAllOrdered('despesas');
        const tbody = document.querySelector('#tabela-despesas tbody');
        if (!despesas || despesas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center">Nenhuma despesa registrada</td></tr>';
            return;
        }
        tbody.innerHTML = despesas.map(item => `
            <tr style="cursor: pointer;" onclick="abrirModalDespesa(${item.id})">
                <td>${item.data}</td><td>${item.descricao || '-'}</td><td>${item.tipo || '-'}</td><td>R$ ${(item.valor || 0).toFixed(2)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('❌ Erro ao carregar despesas:', error);
    }
}

async function salvarDespesa() {
    try {
        const data = document.getElementById('desp-data').value;
        const descricao = document.getElementById('desp-descricao').value.trim();
        const tipo = document.getElementById('desp-tipo').value;
        const valor = parseFloat(document.getElementById('desp-valor').value);
        if (!descricao) { alert('Digite a descrição da despesa!'); return; }
        if (!tipo) { alert('Selecione uma categoria!'); return; }
        if (valor <= 0) { alert('Digite um valor válido!'); return; }
        await db.add('despesas', { data, descricao, tipo, valor });
        alert('✅ Despesa salva!');
        document.getElementById('desp-descricao').value = '';
        document.getElementById('desp-tipo').value = '';
        document.getElementById('desp-valor').value = 0;
        await carregarDespesas();
        await carregarDashboard();
        await carregarRelatorios();
    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro ao salvar: ' + error.message);
    }
}

// ============ RELATÓRIOS ============
async function carregarRelatorios() {
    try {
        const atendimentos = await db.getAll('atendimentos');
        const reposicoes = await db.getAll('reposicoes');
        const despesas = await db.getAll('despesas');
        
        const todos = [
            ...atendimentos.map(a => ({ data: a.data, tipo: '💰 Entrada', descricao: `${a.nome_cliente} - ${a.servico || 'Serviço'}`, valor: a.valor })),
            ...reposicoes.map(r => ({ data: r.data, tipo: '📦 Saída (Reposição)', descricao: `${r.produto} - ${r.quantidade} un x R$ ${(r.valor_unitario || 0).toFixed(2)} = R$ ${(r.valor_total || r.valor || 0).toFixed(2)}`, valor: -(r.valor_total || r.valor || 0) })),
            ...despesas.map(d => ({ data: d.data, tipo: '💸 Saída (Despesa)', descricao: `${d.descricao} - ${d.tipo}`, valor: -d.valor }))
        ];
        
        todos.sort((a, b) => b.data.localeCompare(a.data));
        
        const tbody = document.querySelector('#tabela-relatorios tbody');
        if (todos.length === 0) {
            tbody.innerHTML = '</table><td colspan="4" style="text-align: center">Nenhum registro encontrado</td></tr>';
            return;
        }
        tbody.innerHTML = todos.map(item => `
            <tr>
                <td>${item.data}</td><td>${item.tipo}</td><td style="font-size: 12px;">${item.descricao}</td>
                <td style="color: ${item.valor >= 0 ? '#03DAC6' : '#CF6679'}">R$ ${Math.abs(item.valor).toFixed(2)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('❌ Erro ao carregar relatórios:', error);
    }
}

function exportarCSV() {
    const rows = document.querySelectorAll('#tabela-relatorios tr');
    const csv = [];
    for (const row of rows) {
        const cols = row.querySelectorAll('th, td');
        csv.push(Array.from(cols).map(col => col.innerText).join(','));
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `relatorio_hisa_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// ============ EDIÇÃO ATENDIMENTOS ============
async function abrirModalAtendimento(id) {
    const atendimentos = await db.getAll('atendimentos');
    const item = atendimentos.find(a => a.id === id);
    if (item) {
        document.getElementById('edit-att-id').value = item.id;
        document.getElementById('edit-att-data').value = item.data;
        document.getElementById('edit-att-cliente').value = item.nome_cliente;
        document.getElementById('edit-att-servico').value = item.servico || '';
        document.getElementById('edit-att-valor').value = item.valor;
        document.getElementById('modal-editar-atendimento').style.display = 'block';
    }
}

async function salvarEdicaoAtendimento() {
    const id = parseInt(document.getElementById('edit-att-id').value);
    const data = document.getElementById('edit-att-data').value;
    const cliente = document.getElementById('edit-att-cliente').value;
    const servico = document.getElementById('edit-att-servico').value;
    const valor = parseFloat(document.getElementById('edit-att-valor').value);
    await db.update('atendimentos', id, { data, nome_cliente: cliente, servico, valor });
    alert('✅ Atendimento atualizado!');
    document.getElementById('modal-editar-atendimento').style.display = 'none';
    await carregarAtendimentos();
    await carregarDashboard();
    await carregarRelatorios();
}

async function excluirAtendimento() {
    if (confirm('Tem certeza que deseja excluir este atendimento?')) {
        const id = parseInt(document.getElementById('edit-att-id').value);
        await db.delete('atendimentos', id);
        alert('✅ Atendimento excluído!');
        document.getElementById('modal-editar-atendimento').style.display = 'none';
        await carregarAtendimentos();
        await carregarDashboard();
        await carregarRelatorios();
    }
}

// ============ EDIÇÃO REPOSIÇÕES ============
async function abrirModalReposicao(id) {
    const reposicoes = await db.getAll('reposicoes');
    const item = reposicoes.find(r => r.id === id);
    if (item) {
        document.getElementById('edit-rep-id').value = item.id;
        document.getElementById('edit-rep-data').value = item.data;
        document.getElementById('edit-rep-produto').value = item.produto;
        document.getElementById('edit-rep-valor-unitario').value = item.valor_unitario || 0;
        document.getElementById('edit-rep-qtd').value = item.quantidade || 0;
        calcularTotalEdicaoReposicao();
        document.getElementById('modal-editar-reposicao').style.display = 'block';
    }
}

async function salvarEdicaoReposicao() {
    const id = parseInt(document.getElementById('edit-rep-id').value);
    const data = document.getElementById('edit-rep-data').value;
    const produto = document.getElementById('edit-rep-produto').value;
    const valorUnitario = parseFloat(document.getElementById('edit-rep-valor-unitario').value);
    const quantidade = parseFloat(document.getElementById('edit-rep-qtd').value);
    const valorTotal = valorUnitario * quantidade;
    
    await db.update('reposicoes', id, { 
        data, 
        produto, 
        valor_unitario: valorUnitario,
        quantidade: quantidade,
        valor_total: valorTotal,
        valor: valorTotal
    });
    alert('✅ Reposição atualizada! (Total: R$ ' + valorTotal.toFixed(2) + ')');
    document.getElementById('modal-editar-reposicao').style.display = 'none';
    await carregarReposicoes();
    await carregarDashboard();
    await carregarRelatorios();
}

async function excluirReposicao() {
    if (confirm('Tem certeza que deseja excluir esta reposição?')) {
        const id = parseInt(document.getElementById('edit-rep-id').value);
        await db.delete('reposicoes', id);
        alert('✅ Reposição excluída!');
        document.getElementById('modal-editar-reposicao').style.display = 'none';
        await carregarReposicoes();
        await carregarDashboard();
        await carregarRelatorios();
    }
}

// ============ EDIÇÃO DESPESAS ============
async function abrirModalDespesa(id) {
    const despesas = await db.getAll('despesas');
    const item = despesas.find(d => d.id === id);
    if (item) {
        document.getElementById('edit-desp-id').value = item.id;
        document.getElementById('edit-desp-data').value = item.data;
        document.getElementById('edit-desp-descricao').value = item.descricao || '';
        document.getElementById('edit-desp-tipo').value = item.tipo || '';
        document.getElementById('edit-desp-valor').value = item.valor;
        document.getElementById('modal-editar-despesa').style.display = 'block';
    }
}

async function salvarEdicaoDespesa() {
    const id = parseInt(document.getElementById('edit-desp-id').value);
    const data = document.getElementById('edit-desp-data').value;
    const descricao = document.getElementById('edit-desp-descricao').value;
    const tipo = document.getElementById('edit-desp-tipo').value;
    const valor = parseFloat(document.getElementById('edit-desp-valor').value);
    await db.update('despesas', id, { data, descricao, tipo, valor });
    alert('✅ Despesa atualizada!');
    document.getElementById('modal-editar-despesa').style.display = 'none';
    await carregarDespesas();
    await carregarDashboard();
    await carregarRelatorios();
}

async function excluirDespesa() {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
        const id = parseInt(document.getElementById('edit-desp-id').value);
        await db.delete('despesas', id);
        alert('✅ Despesa excluída!');
        document.getElementById('modal-editar-despesa').style.display = 'none';
        await carregarDespesas();
        await carregarDashboard();
        await carregarRelatorios();
    }
}

window.abrirModalAtendimento = abrirModalAtendimento;
window.abrirModalReposicao = abrirModalReposicao;
window.abrirModalDespesa = abrirModalDespesa;