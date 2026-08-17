/* ============================================================
   whatsapp.js — Integração WhatsApp (links wa.me)
   ============================================================ */

const WhatsApp = {
    link(telefone, mensagem) {
        if (!telefone) return '';
        const numeroLimpo = telefone.replace(/\D/g, '');
        if (!numeroLimpo) return '';
        const numero = numeroLimpo.startsWith('55') ? numeroLimpo : '55' + numeroLimpo;
        const url = mensagem
            ? `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
            : `https://wa.me/${numero}`;
        return `<a href="${url}" target="_blank" class="whatsapp-btn" title="Abrir WhatsApp">💬</a>`;
    },

    abrir(telefone, mensagem) {
        if (!telefone) { AppModule.showToast('Telefone não informado', 'error'); return; }
        const numeroLimpo = telefone.replace(/\D/g, '');
        const numero = numeroLimpo.startsWith('55') ? numeroLimpo : '55' + numeroLimpo;
        const url = mensagem
            ? `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
            : `https://wa.me/${numero}`;
        window.open(url, '_blank');
    },

    mensagens: {
        saudacao: (nome) => `Olá ${nome}, tudo bem? Aqui é da WDIH Milhas & Viagens. Como posso te ajudar hoje?`,
        proposta: (nome) => `Olá ${nome}! Preparei uma proposta especial para você. Podemos conversar?`,
        followUp: (nome) => `Olá ${nome}, tudo bem? Passando para saber se teve a chance de avaliar nossa proposta.`,
        confirmacao: (nome) => `Olá ${nome}! Sua viagem foi confirmada. Em breve enviaremos todos os detalhes.`,
        agradecimento: (nome) => `Olá ${nome}! Obrigado por escolher a WDIH Milhas & Viagens. Boas viagens! ✈️`
    }
};
