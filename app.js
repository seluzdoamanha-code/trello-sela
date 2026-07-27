// IMPORTANTE: Preencha com as suas credenciais do Supabase
const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

let supabase;

// Função para extrair parâmetros da URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa o cliente do Supabase apenas se as credenciais foram preenchidas
    if (SUPABASE_URL.includes('SUA-URL-AQUI')) {
        showStatus('Configure a URL e Chave do Supabase no app.js', 'error');
        return;
    }
    
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const cardId = getQueryParam('card_id');
    const cardTitleEl = document.getElementById('trello-card-title');
    
    if (!cardId) {
        cardTitleEl.textContent = 'Erro: Nenhum ID de cartão fornecido na URL.';
        return;
    }
    
    cardTitleEl.textContent = `Cartão ID: ${cardId}`;
    
    // 2. Busca os dados existentes no Supabase
    await carregarDados(cardId);
});

async function carregarDados(cardId) {
    try {
        const { data, error } = await supabase
            .from('assistidos') // Nome da tabela que criaremos no Supabase
            .select('*')
            .eq('trello_card_id', cardId)
            .single();
            
        if (error && error.code !== 'PGRST116') { // PGRST116 = Not found, o que é normal se for novo
            console.error('Erro ao buscar dados:', error);
            showStatus('Erro ao carregar dados.', 'error');
            return;
        }
        
        if (data) {
            document.getElementById('nomeCompleto').value = data.nome_completo || '';
            document.getElementById('nomeCurto').value = data.nome_curto || '';
            document.getElementById('cpf').value = data.cpf || '';
            document.getElementById('telefone').value = data.telefone || '';
        }
    } catch (err) {
        console.error(err);
    }
}

// 3. Salvar os dados
document.getElementById('custom-fields-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cardId = getQueryParam('card_id');
    if (!cardId) {
        showStatus('Não é possível salvar: ID do cartão ausente.', 'error');
        return;
    }
    
    const btn = document.getElementById('save-btn');
    btn.textContent = 'Salvando...';
    btn.disabled = true;
    
    const dados = {
        trello_card_id: cardId,
        nome_completo: document.getElementById('nomeCompleto').value,
        nome_curto: document.getElementById('nomeCurto').value,
        cpf: document.getElementById('cpf').value,
        telefone: document.getElementById('telefone').value,
        atualizado_em: new Date().toISOString()
    };
    
    try {
        const { error } = await supabase
            .from('assistidos')
            .upsert(dados, { onConflict: 'trello_card_id' }); // Insere ou atualiza
            
        if (error) throw error;
        
        showStatus('Alterações salvas com sucesso!', 'success');
    } catch (err) {
        console.error('Erro ao salvar:', err);
        showStatus('Erro ao salvar no banco.', 'error');
    } finally {
        btn.textContent = 'Salvar Alterações';
        btn.disabled = false;
        
        // Limpa a mensagem após 3 segundos
        setTimeout(() => showStatus(''), 3000);
    }
});

function showStatus(msg, type = '') {
    const el = document.getElementById('status-message');
    el.textContent = msg;
    el.className = type;
}
