// IMPORTANTE: Preencha com as suas credenciais do Supabase
const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

let db; // <--- Nome alterado para não dar conflito!

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function showStatus(msg, type = '') {
    const el = document.getElementById('status-message');
    if (el) {
        el.textContent = msg;
        el.className = type;
    }
}

(async function iniciarSistema() {
    const cardTitleEl = document.getElementById('trello-card-title');
    try {
        if (!window.supabase) {
            throw new Error('Supabase bloqueado (Adblock).');
        }

        db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const cardId = getQueryParam('card_id');
        
        if (!cardId) {
            cardTitleEl.textContent = 'Erro: Nenhum ID de cartão na URL.';
            return;
        }
        
        cardTitleEl.textContent = `Cartão ID: ${cardId}`;
        await carregarDados(cardId);
    } catch (err) {
        cardTitleEl.textContent = 'ERRO: ' + err.message;
    }
})();

async function carregarDados(cardId) {
    try {
        const { data, error } = await db.from('assistidos').select('*').eq('trello_card_id', cardId).single();
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            document.getElementById('nomeCompleto').value = data.nome_completo || '';
            document.getElementById('nomeCurto').value = data.nome_curto || '';
            document.getElementById('cpf').value = data.cpf || '';
            document.getElementById('telefone').value = data.telefone || '';
        }
    } catch (err) {
        showStatus('Erro ao carregar dados do banco.', 'error');
    }
}

document.getElementById('custom-fields-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cardId = getQueryParam('card_id');
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
        const { error } = await db.from('assistidos').upsert(dados, { onConflict: 'trello_card_id' });
        if (error) throw error;
        showStatus('Alterações salvas com sucesso!', 'success');
    } catch (err) {
        showStatus('Erro ao salvar no banco.', 'error');
    } finally {
        btn.textContent = 'Salvar Alterações';
        btn.disabled = false;
        setTimeout(() => showStatus(''), 3000);
    }
});
