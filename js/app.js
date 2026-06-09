// App principal
console.log('🚀 App.js carregado!');

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM carregado - Iniciando app...');
    
    // Verificar se db existe
    if (typeof db === 'undefined') {
        console.error('❌ db não definido!');
        alert('Erro: Banco de dados não carregado. Recarregue a página.');
        return;
    }
    
    try {
        // Inicializar banco de dados
        console.log('⏳ Inicializando banco de dados...');
        await db.init();
        console.log('✅ DB inicializado com sucesso!');
        
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
        
        // Configurar botões + e -
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
                    
                    if (targetId === 'rep-valor-unitario' || targetId === 'rep-qtd') {
                        calcularTotalReposicao();
                    }
                    if (targetId === 'edit-rep-valor-unitario' || targetId === 'edit-rep-qtd') {
                        calcularTotalEdicaoReposicao();
                    }
                }
            });
        });
        
        // Calcular total da reposição
        const repValorUnitario = document.getElementById('rep-valor-unitario');
        const repQtd = document.getElementById('rep-qtd');
        if (repValorUnitario) repValorUnitario.addEventListener('input', calcularTotalReposicao);
        if (repQtd) repQtd.addEventListener('input', calcularTotalReposicao);
        
        // Calcular total da edição de reposição
        const editRepValorUnitario = document.getElementById('edit-rep-valor-unitario');
        const editRepQtd = document.getElementById('edit-rep-qtd');
        if (editRepValorUnitario) editRepValorUnitario.addEventListener('input', calcularTotalEdicaoReposicao);
        if (editRepQtd) editRepQtd.addEventListener('input', calcularTotalEdicaoReposicao);
        
        // Configurar botões de salvar
        const btnAtendimento = document.getElementById('btn-salvar-atendimento');
        if (btnAtendimento) btnAtendimento.addEventListener('click', salvarAtendimento);
        
        const btnReposicao = document.getElementById('btn-salvar-reposicao');
        if (btnReposicao) btnReposicao.addEventListener('click', salvarReposicao);
        
        const btnDespesa = document.getElementById('btn-salvar-despesa');
        if (btnDespesa) btnDespesa.addEventListener('click', salvarDespesa);
        
        const btnExportar = document.getElementById('btn-exportar-csv');
        if (btnExportar) btnExportar.addEventListener('click', exportarCSV);
        
        // Botão para salvar como imagem
        const btnPrint = document.getElementById('btn-print-relatorio');
        if (btnPrint) {
            btnPrint.addEventListener('click', salvarRelatorioComoImagem);
            console.log('✅ Botão print configurado');
        }
        
        configurarModais();
        
        // Carregar dados
        console.log('⏳ Carregando dados...');
        await carregarDashboard();
        await carregarAtendimentos();
        await carregarReposicoes();
        await carregarDespesas();
        await carregarRelatorios();
        
        console.log('✅ App inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro fatal na inicialização:', error);
        alert('Erro ao inicializar o aplicativo: ' + error.message);
    }
});

// ============ FUNÇÕES DE CÁLCULO ============
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

// ============ CONFIGURAÇÃO DOS MODAIS ============
function configurarModais() {
    // Modal Atendimento
    const btnFecharAtendimento = document.getElementById('btn-fechar-modal-atendimento');
    if (btnFecharAtendimento) {
        btnFecharAtendimento.addEventListener('click', () => {
            document.getElementById('modal-editar-atendimento').style.display = 'none';
        });
    }
    
    const btnSalvarAtendimento = document.getElementById('btn-salvar-edicao-atendimento');
    if (btnSalvarAtendimento) btnSalvarAtendimento.addEventListener('click', salvarEdicaoAtendimento);
    
    const btnExcluirAtendimento = document.getElementById('btn-excluir-atendimento');
    if (btnExcluirAtendimento) btnExcluirAtendimento.addEventListener('click', excluirAtendimento);
    
    // Modal Reposição
    const btnFecharReposicao = document.getElementById('btn-fechar-modal-reposicao');
    if (btnFecharReposicao) {
        btnFecharReposicao.addEventListener('click', () => {
            document.getElementById('modal-editar-reposicao').style.display = 'none';
        });
    }
    
    const btnSalvarReposicao = document.getElementById('btn-salvar-edicao-reposicao');
    if (btnSalvarReposicao) btnSalvarReposicao.addEventListener('click', salvarEdicaoReposicao);
    
    const btnExcluirReposicao = document.getElementById('btn-excluir-reposicao');
    if (btnExcluirReposicao) btnExcluirReposicao.addEventListener('click', excluirReposicao);
    
    // Modal Despesa
    const btnFecharDespesa = document.getElementById('btn-fechar-modal-despesa');
    if (btnFecharDespesa) {
        btnFecharDespesa.addEventListener('click', () => {
            document.getElementById('modal-editar-despesa').style.display = 'none';
        });
    }
    
    const btnSalvarDespesa = document.getElementById('btn-salvar-edicao-despesa');
    if (btnSalvarDespesa) btnSalvarDespesa.addEventListener('click', salvarEdicaoDespesa);
    
    const btnExcluirDespesa = document.getElementById('btn-excluir-despesa');
    if (btnExcluirDespesa) btnExcluirDespesa.addEventListener('click', excluirDespesa);
}

// ============ NAVEGAÇÃO ============
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

// ============ DASHBOARD ============
async function carregarDashboard() {
    try {
        const summary = await db.getSummary();
        console.log('📊 Dashboard - Entradas:', summary.entradas, 'Saídas:', summary.saidas, 'Saldo:', summary.saldo);
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
                <td>${item.data}</td>
                <td>${item.nome_cliente}</td>
                <td>${item.servico || '-'}</td>
                <td>R$ ${(item.valor || 0).toFixed(2)}</td>
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
                <td>${item.quantidade || 0}</td>
                <td>R$ ${(item.valor_total || item.valor || 0).toFixed(2)}</td>
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
            valor: valorTotal
        });
        
        alert(`✅ Reposição salva! (${quantidade} un x R$ ${valorUnitario.toFixed(2)} = R$ ${valorTotal.toFixed(2)})`);
        
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
                <td>${item.data}</td>
                <td>${item.descricao || '-'}</td>
                <td>${item.tipo || '-'}</td>
                <td>R$ ${(item.valor || 0).toFixed(2)}</td>
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
    console.log('📈 Carregando relatórios...');
    try {
        const atendimentos = await db.getAll('atendimentos');
        const reposicoes = await db.getAll('reposicoes');
        const despesas = await db.getAll('despesas');
        
        // Calcular totais
        const totalEntradasCalc = atendimentos.reduce((sum, a) => sum + (a.valor || 0), 0);
        const totalReposicoesCalc = reposicoes.reduce((sum, r) => sum + (r.valor_total || r.valor || 0), 0);
        const totalDespesasCalc = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);
        const totalSaidasCalc = totalReposicoesCalc + totalDespesasCalc;
        const saldoCalc = totalEntradasCalc - totalSaidasCalc;
        
        // Salvar os totais em atributos data para a captura de imagem
        document.body.setAttribute('data-total-entradas', totalEntradasCalc.toFixed(2));
        document.body.setAttribute('data-total-saidas', totalSaidasCalc.toFixed(2));
        document.body.setAttribute('data-total-saldo', saldoCalc.toFixed(2));
        document.body.setAttribute('data-cor-saldo', saldoCalc >= 0 ? '#03DAC6' : '#CF6679');
        
        // Atualizar cards de resumo
        const cardsContainer = document.querySelector('.cards-resumo');
        if (cardsContainer) {
            cardsContainer.innerHTML = `
                <div class="card-resumo" id="card-total-entradas">
                    <h3>💰 TOTAL ENTRADAS</h3>
                    <div class="valor" style="color: #03DAC6;">R$ ${totalEntradasCalc.toFixed(2)}</div>
                </div>
                <div class="card-resumo" id="card-total-saidas">
                    <h3>📤 TOTAL SAÍDAS</h3>
                    <div class="valor" style="color: #CF6679;">R$ ${totalSaidasCalc.toFixed(2)}</div>
                </div>
                <div class="card-resumo" id="card-total-saldo">
                    <h3>💎 SALDO TOTAL</h3>
                    <div class="valor" style="color: ${saldoCalc >= 0 ? '#03DAC6' : '#CF6679'};">R$ ${Math.abs(saldoCalc).toFixed(2)}</div>
                </div>
            `;
        }
        
        // Criar array para a tabela
        const todos = [];
        
        for (const a of atendimentos) {
            todos.push({ 
                data: a.data, 
                tipo: '💰 ENTRADA', 
                descricao: `${a.nome_cliente} - ${a.servico || 'Atendimento'}`, 
                valor: a.valor 
            });
        }
        
        for (const r of reposicoes) {
            const valorTotal = r.valor_total || r.valor || 0;
            const valorUnit = r.valor_unitario || (r.quantidade > 0 ? valorTotal / r.quantidade : 0);
            todos.push({ 
                data: r.data, 
                tipo: '📦 SAÍDA - REPOSIÇÃO', 
                descricao: `${r.produto} | ${r.quantidade || 0} un x R$ ${valorUnit.toFixed(2)} = R$ ${valorTotal.toFixed(2)}`, 
                valor: -valorTotal 
            });
        }
        
        for (const d of despesas) {
            todos.push({ 
                data: d.data, 
                tipo: '💸 SAÍDA - DESPESA', 
                descricao: `${d.descricao || d.tipo} (${d.tipo})`, 
                valor: -d.valor 
            });
        }
        
        // Ordenar por data (mais recente primeiro)
        todos.sort((a, b) => b.data.localeCompare(a.data));
        
        const tbody = document.querySelector('#tabela-relatorios tbody');
        if (todos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center">Nenhum registro encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = todos.map(item => {
            const cor = item.valor >= 0 ? '#03DAC6' : '#CF6679';
            const sinal = item.valor >= 0 ? '+' : '-';
            return `
                <tr>
                    <td>${item.data}</td>
                    <td>${item.tipo}</td>
                    <td style="font-size: 12px;">${item.descricao}</td>
                    <td style="color: ${cor}; font-weight: bold;">${sinal} R$ ${Math.abs(item.valor).toFixed(2)}</td>
                </tr>
            `;
        }).join('');
        
        console.log(`✅ ${todos.length} registros no relatório`);
        console.log(`📊 Totais - Entradas: R$ ${totalEntradasCalc.toFixed(2)}, Saídas: R$ ${totalSaidasCalc.toFixed(2)}, Saldo: R$ ${saldoCalc.toFixed(2)}`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar relatórios:', error);
    }
}

function exportarCSV() {
    console.log('📎 Exportando CSV...');
    const rows = document.querySelectorAll('#tabela-relatorios tr');
    const csv = [];
    
    csv.push('"Data","Tipo","Descrição","Valor (R$)"');
    
    for (const row of rows) {
        const cols = row.querySelectorAll('td');
        if (cols.length === 4) {
            const data = cols[0].innerText.replace(/"/g, '""');
            const tipo = cols[1].innerText.replace(/"/g, '""');
            const descricao = cols[2].innerText.replace(/"/g, '""');
            let valor = cols[3].innerText.replace(/"/g, '""');
            valor = valor.replace('R$', '').replace('+', '').replace('-', '').trim();
            csv.push(`"${data}","${tipo}","${descricao}","${valor}"`);
        }
    }
    
    const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `relatorio_hisa_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    console.log('✅ CSV exportado!');
}

// ============ FUNÇÃO PARA SALVAR COMO IMAGEM ============
async function salvarRelatorioComoImagem() {
    console.log('📸 Capturando relatório completo como imagem...');
    
    const btnPrint = document.getElementById('btn-print-relatorio');
    const textoOriginal = btnPrint.innerHTML;
    btnPrint.innerHTML = '⏳ Capturando...';
    btnPrint.disabled = true;
    
    try {
        // Criar um clone do relatório para capturar
        const originalElement = document.getElementById('relatorio-para-imagem');
        const cloneContainer = document.createElement('div');
        
        // Clonar o conteúdo
        const clone = originalElement.cloneNode(true);
        clone.style.padding = '20px';
        clone.style.background = '#1E1E1E';
        clone.style.borderRadius = '12px';
        
        // Adicionar cabeçalho com os totais
        const header = document.createElement('div');
        header.style.marginBottom = '20px';
        header.style.padding = '20px';
        header.style.background = '#2C2C2C';
        header.style.borderRadius = '12px';
        header.style.display = 'flex';
        header.style.gap = '15px';
        header.style.flexWrap = 'wrap';
        
        // Pegar os valores atuais dos cards
        const totalEntradas = document.querySelector('.card-resumo:first-child .valor')?.innerText || 'R$ 0,00';
        const totalSaidas = document.querySelector('.card-resumo:nth-child(2) .valor')?.innerText || 'R$ 0,00';
        const totalSaldo = document.querySelector('.card-resumo:nth-child(3) .valor')?.innerText || 'R$ 0,00';
        const corSaldo = document.querySelector('.card-resumo:nth-child(3) .valor')?.style.color || '#03DAC6';
        
        header.innerHTML = `
            <div style="flex: 1; background: #1E1E1E; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #333;">
                <h3 style="color: #9E9E9E; font-size: 12px; margin-bottom: 8px;">💰 TOTAL ENTRADAS</h3>
                <div style="color: #03DAC6; font-size: 22px; font-weight: bold;">${totalEntradas}</div>
            </div>
            <div style="flex: 1; background: #1E1E1E; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #333;">
                <h3 style="color: #9E9E9E; font-size: 12px; margin-bottom: 8px;">📤 TOTAL SAÍDAS</h3>
                <div style="color: #CF6679; font-size: 22px; font-weight: bold;">${totalSaidas}</div>
            </div>
            <div style="flex: 1; background: #1E1E1E; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #333;">
                <h3 style="color: #9E9E9E; font-size: 12px; margin-bottom: 8px;">💎 SALDO TOTAL</h3>
                <div style="color: ${corSaldo}; font-size: 22px; font-weight: bold;">${totalSaldo}</div>
            </div>
        `;
        
        // Adicionar data e hora da captura
        const dataHora = document.createElement('div');
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR');
        dataHora.style.textAlign = 'center';
        dataHora.style.marginBottom = '15px';
        dataHora.style.padding = '10px';
        dataHora.style.background = '#2C2C2C';
        dataHora.style.borderRadius = '8px';
        dataHora.style.color = '#9E9E9E';
        dataHora.style.fontSize = '12px';
        dataHora.innerHTML = `📅 Relatório gerado em ${dataFormatada} às ${horaFormatada}`;
        
        // Adicionar título com logo
        const titulo = document.createElement('div');
        titulo.style.textAlign = 'center';
        titulo.style.marginBottom = '20px';
        titulo.style.padding = '20px';
        titulo.style.background = 'linear-gradient(135deg, #1E1E1E 0%, #2C2C2C 100%)';
        titulo.style.borderRadius = '16px';
        titulo.style.border = '1px solid #333';
        
        // Tentar carregar o logo para o print
        const logoTitulo = document.createElement('div');
        logoTitulo.style.marginBottom = '15px';
        logoTitulo.innerHTML = `<img src="icons/LogoHisa01.png" style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #FF69B4;">`;
        
        titulo.appendChild(logoTitulo);
        titulo.innerHTML += `
            <h2 style="margin: 0; color: #FF69B4;">💅 HISA - Relatório Geral</h2>
            <small style="opacity: 0.8; color: #9E9E9E;">Sistema de Gestão para Estética</small>
        `;
        
        // Montar o elemento completo para capturar
        const elementoParaCapturar = document.createElement('div');
        elementoParaCapturar.style.background = '#1E1E1E';
        elementoParaCapturar.style.padding = '20px';
        elementoParaCapturar.style.borderRadius = '16px';
        elementoParaCapturar.style.maxWidth = '1200px';
        elementoParaCapturar.style.margin = '0 auto';
        
        elementoParaCapturar.appendChild(titulo);
        elementoParaCapturar.appendChild(dataHora);
        elementoParaCapturar.appendChild(header);
        elementoParaCapturar.appendChild(clone);
        
        // Adicionar rodapé
        const footer = document.createElement('div');
        footer.style.textAlign = 'center';
        footer.style.marginTop = '20px';
        footer.style.padding = '10px';
        footer.style.fontSize = '10px';
        footer.style.color = '#666';
        footer.innerHTML = 'HISA - Sistema de Gestão | www.hisa.com';
        elementoParaCapturar.appendChild(footer);
        
        // Adicionar temporariamente ao corpo para capturar
        document.body.appendChild(elementoParaCapturar);
        
        // Capturar a imagem
        const canvas = await html2canvas(elementoParaCapturar, {
            scale: 2.5,
            backgroundColor: '#1E1E1E',
            logging: false,
            useCORS: true,
            allowTaint: false,
            windowWidth: elementoParaCapturar.scrollWidth,
            windowHeight: elementoParaCapturar.scrollHeight
        });
        
        // Remover o elemento temporário
        document.body.removeChild(elementoParaCapturar);
        
        // Salvar a imagem
        const link = document.createElement('a');
        const dataAtual = new Date().toISOString().split('T')[0];
        link.download = `relatorio_hisa_${dataAtual}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        console.log('✅ Imagem salva com sucesso!');
        alert('✅ Relatório salvo como imagem com todos os dados!');
        
    } catch (error) {
        console.error('❌ Erro ao capturar imagem:', error);
        alert('Erro ao salvar imagem: ' + error.message);
    } finally {
        btnPrint.innerHTML = textoOriginal;
        btnPrint.disabled = false;
    }
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
    alert(`✅ Reposição atualizada! (${quantidade} un x R$ ${valorUnitario.toFixed(2)} = R$ ${valorTotal.toFixed(2)})`);
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

// ============ FUNÇÕES GLOBAIS (para onclick) ============
window.abrirModalAtendimento = abrirModalAtendimento;
window.abrirModalReposicao = abrirModalReposicao;
window.abrirModalDespesa = abrirModalDespesa;