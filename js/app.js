// App principal
console.log('🚀 App.js carregado!');

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM carregado');
    
    // Aguardar db ficar pronto
    if (typeof db === 'undefined') {
        console.error('❌ db não encontrado!');
        alert('Erro de inicialização. Recarregue a página.');
        return;
    }
    
    await db.init();
    console.log('✅ DB inicializado');
    
    // Configurar data atual
    const hoje = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) input.value = hoje;
    });
    
    // Configurar navegação
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pagina = btn.getAttribute('data-pagina');
            mudarPagina(pagina);
        });
    });
    
    // Configurar botões de + e -
    document.querySelectorAll('.btn-plus, .btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const step = parseInt(btn.getAttribute('data-step')) || 1;
            const input = document.getElementById(targetId);
            if (input) {
                let value = parseFloat(input.value) || 0;
                value += btn.classList.contains('btn-plus') ? step : -step;
                if (value < 0) value = 0;
                input.value = value;
            }
        });
    });
    
    // Configurar botões de salvar
    const btnAtendimento = document.getElementById('btn-salvar-atendimento');
    if (btnAtendimento) {
        btnAtendimento.addEventListener('click', salvarAtendimento);
        console.log('✅ Botão atendimento configurado');
    }
    
    const btnReposicao = document.getElementById('btn-salvar-reposicao');
    if (btnReposicao) {
        btnReposicao.addEventListener('click', salvarReposicao);
        console.log('✅ Botão reposição configurado');
    }
    
    const btnDespesa = document.getElementById('btn-salvar-despesa');
    if (btnDespesa) {
        btnDespesa.addEventListener('click', salvarDespesa);
        console.log('✅ Botão despesa configurado');
    }
    
    const btnExportar = document.getElementById('btn-exportar-csv');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarCSV);
        console.log('✅ Botão exportar configurado');
    }
    
    // Carregar dados
    await carregarDashboard();
    await carregarAtendimentos();
    await carregarReposicoes();
    await carregarDespesas();
    await carregarRelatorios();
    
    console.log('✅ App inicializado com sucesso!');
});

function mudarPagina(pagina) {
    // Atualizar menu
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('ativo');
        if (btn.getAttribute('data-pagina') === pagina) {
            btn.classList.add('ativo');
        }
    });
    
    // Atualizar conteúdo
    document.querySelectorAll('.pagina').forEach(page => {
        page.classList.remove('ativa');
    });
    document.getElementById(pagina).classList.add('ativa');
    
    // Recarregar dados
    if (pagina === 'dashboard') carregarDashboard();
    else if (pagina === 'atendimentos') carregarAtendimentos();
    else if (pagina === 'reposicoes') carregarReposicoes();
    else if (pagina === 'despesas') carregarDespesas();
    else if (pagina === 'relatorios') carregarRelatorios();
}

// Dashboard
async function carregarDashboard() {
    console.log('📊 Carregando dashboard...');
    try {
        const summary = await db.getSummary();
        document.getElementById('total-entradas').innerHTML = `R$ ${summary.entradas.toFixed(2)}`;
        document.getElementById('total-saidas').innerHTML = `R$ ${summary.saidas.toFixed(2)}`;
        document.getElementById('total-saldo').innerHTML = `R$ ${summary.saldo.toFixed(2)}`;
        console.log('✅ Dashboard atualizado');
    } catch (error) {
        console.error('❌ Erro no dashboard:', error);
    }
}

// Atendimentos
async function carregarAtendimentos() {
    console.log('💝 Carregando atendimentos...');
    try {
        const atendimentos = await db.getAllOrdered('atendimentos');
        const tbody = document.querySelector('#tabela-atendimentos tbody');
        
        if (!atendimentos || atendimentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center">Nenhum atendimento registrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = atendimentos.map(item => `
            <tr>
                <td>${item.data}</td>
                <td>${item.nome_cliente}</td>
                <td>R$ ${(item.valor || 0).toFixed(2)}</td>
            </tr>
        `).join('');
        console.log(`✅ ${atendimentos.length} atendimentos carregados`);
    } catch (error) {
        console.error('❌ Erro ao carregar atendimentos:', error);
    }
}

async function salvarAtendimento() {
    console.log('💾 Salvando atendimento...');
    try {
        const data = document.getElementById('att-data').value;
        const cliente = document.getElementById('att-cliente').value.trim();
        const valor = parseFloat(document.getElementById('att-valor').value);
        
        if (!cliente) {
            alert('Digite o nome da cliente!');
            return;
        }
        
        if (valor <= 0) {
            alert('Digite um valor válido!');
            return;
        }
        
        await db.add('atendimentos', {
            data: data,
            nome_cliente: cliente,
            valor: valor
        });
        
        alert('✅ Atendimento salvo com sucesso!');
        
        document.getElementById('att-cliente').value = '';
        document.getElementById('att-valor').value = 0;
        
        await carregarAtendimentos();
        await carregarDashboard();
        await carregarRelatorios();
        
    } catch (error) {
        console.error('❌ Erro ao salvar atendimento:', error);
        alert('Erro ao salvar: ' + error.message);
    }
}

// Reposições
async function carregarReposicoes() {
    console.log('📦 Carregando reposições...');
    try {
        const reposicoes = await db.getAllOrdered('reposicoes');
        const tbody = document.querySelector('#tabela-reposicoes tbody');
        
        if (!reposicoes || reposicoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center">Nenhuma reposição registrada</td></tr>';
            return;
        }
        
        tbody.innerHTML = reposicoes.map(item => `
            <tr>
                <td>${item.data}</td>
                <td>${item.produto}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${(item.valor || 0).toFixed(2)}</td>
            </tr>
        `).join('');
        console.log(`✅ ${reposicoes.length} reposições carregadas`);
    } catch (error) {
        console.error('❌ Erro ao carregar reposições:', error);
    }
}

async function salvarReposicao() {
    console.log('💾 Salvando reposição...');
    try {
        const data = document.getElementById('rep-data').value;
        const produto = document.getElementById('rep-produto').value.trim();
        const quantidade = parseInt(document.getElementById('rep-qtd').value);
        const valor = parseFloat(document.getElementById('rep-valor').value);
        
        if (!produto) {
            alert('Digite o nome do produto!');
            return;
        }
        
        if (quantidade <= 0) {
            alert('Digite uma quantidade válida!');
            return;
        }
        
        if (valor <= 0) {
            alert('Digite um valor válido!');
            return;
        }
        
        await db.add('reposicoes', {
            data: data,
            produto: produto,
            quantidade: quantidade,
            valor: valor
        });
        
        alert('✅ Reposição salva com sucesso!');
        
        document.getElementById('rep-produto').value = '';
        document.getElementById('rep-qtd').value = 0;
        document.getElementById('rep-valor').value = 0;
        
        await carregarReposicoes();
        await carregarDashboard();
        await carregarRelatorios();
        
    } catch (error) {
        console.error('❌ Erro ao salvar reposição:', error);
        alert('Erro ao salvar: ' + error.message);
    }
}

// Despesas
async function carregarDespesas() {
    console.log('💰 Carregando despesas...');
    try {
        const despesas = await db.getAllOrdered('despesas');
        const tbody = document.querySelector('#tabela-despesas tbody');
        
        if (!despesas || despesas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center">Nenhuma despesa registrada</td></tr>';
            return;
        }
        
        tbody.innerHTML = despesas.map(item => `
            <tr>
                <td>${item.data}</td>
                <td>${item.tipo}</td>
                <td>R$ ${(item.valor || 0).toFixed(2)}</td>
            </tr>
        `).join('');
        console.log(`✅ ${despesas.length} despesas carregadas`);
    } catch (error) {
        console.error('❌ Erro ao carregar despesas:', error);
    }
}

async function salvarDespesa() {
    console.log('💾 Salvando despesa...');
    try {
        const data = document.getElementById('desp-data').value;
        const tipo = document.getElementById('desp-tipo').value;
        const valor = parseFloat(document.getElementById('desp-valor').value);
        
        if (valor <= 0) {
            alert('Digite um valor válido!');
            return;
        }
        
        await db.add('despesas', {
            data: data,
            tipo: tipo,
            valor: valor
        });
        
        alert('✅ Despesa salva com sucesso!');
        
        document.getElementById('desp-valor').value = 0;
        
        await carregarDespesas();
        await carregarDashboard();
        await carregarRelatorios();
        
    } catch (error) {
        console.error('❌ Erro ao salvar despesa:', error);
        alert('Erro ao salvar: ' + error.message);
    }
}

// Relatórios
async function carregarRelatorios() {
    console.log('📈 Carregando relatórios...');
    try {
        const atendimentos = await db.getAll('atendimentos');
        const reposicoes = await db.getAll('reposicoes');
        const despesas = await db.getAll('despesas');
        
        const todos = [
            ...atendimentos.map(a => ({ data: a.data, tipo: '💰 Entrada', descricao: a.nome_cliente, valor: a.valor })),
            ...reposicoes.map(r => ({ data: r.data, tipo: '📦 Saída', descricao: `${r.produto} (${r.quantidade} un)`, valor: -r.valor })),
            ...despesas.map(d => ({ data: d.data, tipo: '💸 Saída', descricao: d.tipo, valor: -d.valor }))
        ];
        
        todos.sort((a, b) => b.data.localeCompare(a.data));
        
        const tbody = document.querySelector('#tabela-relatorios tbody');
        
        if (todos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center">Nenhum registro encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = todos.map(item => `
            <tr>
                <td>${item.data}</td>
                <td>${item.tipo}</td>
                <td>${item.descricao}</td>
                <td style="color: ${item.valor >= 0 ? '#03DAC6' : '#CF6679'}">
                    R$ ${Math.abs(item.valor).toFixed(2)}
                </td>
            </tr>
        `).join('');
        
        console.log(`✅ ${todos.length} registros no relatório`);
    } catch (error) {
        console.error('❌ Erro ao carregar relatórios:', error);
    }
}

function exportarCSV() {
    console.log('📎 Exportando CSV...');
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
    console.log('✅ CSV exportado!');
}