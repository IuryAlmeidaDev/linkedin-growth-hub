const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const HTML_APP_PATH = path.join(__dirname, 'conexoes_do_dia.html');
const DESKTOP_PATH = path.join(process.env.USERPROFILE, 'Desktop', 'LinkedIn - Conexoes do Dia.html');

const radarPostsFreela = [
  {
    titulo: '🔥 Posts Recentes: "Procuro Dev" / "Freela Dev"',
    descricao: 'Publicações de gestores e recrutadores buscando devs freelancers ou projetos pontuais nas últimas 24h/semana.',
    url: 'https://www.linkedin.com/search/results/content/?keywords=%22procuro%20dev%22%20OR%20%22freela%20dev%22%20OR%20%22freelancer%20desenvolvedor%22&origin=GLOBAL_SEARCH_HEADER&sortBy=%22date_posted%22'
  },
  {
    titulo: '🔥 Posts Recentes: "Vaga PJ" / "Contrato PJ Dev"',
    descricao: 'Recrutadores anunciando posições de contrato PJ sem vínculo CLT para início rápido.',
    url: 'https://www.linkedin.com/search/results/content/?keywords=%22vaga%20PJ%20dev%22%20OR%20%22contrato%20PJ%22%20OR%20%22projeto%20PJ%20desenvolvedor%22&origin=GLOBAL_SEARCH_HEADER&sortBy=%22date_posted%22'
  },
  {
    titulo: '🔥 Posts Recentes: Demandas de IA, LLMs e Automações',
    descricao: 'Startups e consultorias precisando de desenvolvedores para projetos de IA, APIs e automações.',
    url: 'https://www.linkedin.com/search/results/content/?keywords=%22integrar%20IA%22%20OR%20%22desenvolvedor%20IA%22%20OR%20%22projeto%20LLM%22&origin=GLOBAL_SEARCH_HEADER&sortBy=%22date_posted%22'
  }
];

const perfisRecrutadores = [
  {
    titulo: '🎯 Tech Recruiters & Talent Acquisition focados em PJ / Contratos',
    descricao: 'Recrutadores especializados em fechar contratos de prestação de serviços (PJ) e projetos ágeis sem burocracia.',
    url: 'https://www.linkedin.com/search/results/people/?keywords=%22Tech%20Recruiter%22%20AND%20(%22PJ%22%20OR%20%22Freelance%22%20OR%20%22Contrato%22)&origin=GLOBAL_SEARCH_HEADER'
  },
  {
    titulo: '💼 Headhunters de Tecnologia (Startups & Scaleups)',
    descricao: 'Profissionais que buscam desenvolvedores seniores e especialistas para demandas rápidas de clientes.',
    url: 'https://www.linkedin.com/search/results/people/?keywords=%22Headhunter%22%20AND%20(%22Tecnologia%22%20OR%20%22TI%22%20OR%20%22Tech%22)%20Brasil&origin=GLOBAL_SEARCH_HEADER'
  },
  {
    titulo: '🏢 Recrutadores de Consultorias de TI e Alocação de Squads',
    descricao: 'Empresas de alocação que constantemente precisam de devs com CNPJ para cobrir demandas extras de clientes corporativos.',
    url: 'https://www.linkedin.com/search/results/people/?keywords=%22Recrutamento%22%20AND%20%22Consultoria%20de%20TI%22%20Brasil&origin=GLOBAL_SEARCH_HEADER'
  }
];

const perfisDecisores = [
  {
    titulo: '🏢 Donos e Sócios de Software Houses & Agências Tech',
    descricao: 'Vendem projetos para clientes finais e sempre terceirizam sprints quando a equipe interna lota.',
    url: 'https://www.linkedin.com/search/results/people/?keywords=%22Software%20House%22%20AND%20(Founder%20OR%20CEO%20OR%20Socio%20OR%20Diretor)&origin=GLOBAL_SEARCH_HEADER'
  },
  {
    titulo: '🚀 Founders de Startups em Estágio Inicial (Early-stage / SaaS)',
    descricao: 'Precisam de MVPs e automações rápidas pagando por projeto ou pacote de horas.',
    url: 'https://www.linkedin.com/search/results/people/?keywords=Founder%20Startup%20Brasil%20SaaS&origin=GLOBAL_SEARCH_HEADER'
  },
  {
    titulo: '⚡ CTOs e Heads de Tecnologia (Startups & PMEs)',
    descricao: 'Líderes técnicos com autonomia de orçamento para contratar desenvolvedores sob demanda.',
    url: 'https://www.linkedin.com/search/results/people/?keywords=CTO%20Brasil%20Startup&origin=GLOBAL_SEARCH_HEADER'
  }
];

// Todas as notas de convite com MENOS de 200 caracteres (garantido)
const scriptsAbordagem = [
  {
    tipo: '1. Nota de Convite para Tech Recruiters (Foco PJ)',
    instrucao: 'Limite rigoroso de 200 caracteres:',
    texto: 'Olá [Nome]! Sou dev sênior focado em IA, LLMs e backend no modelo PJ/Freela. Se tiver projetos fechados ou demandas pontuais no radar, vamos conectar!'
  },
  {
    tipo: '2. Nota de Convite para Donos de Software Houses',
    instrucao: 'Limite rigoroso de 200 caracteres:',
    texto: 'Olá [Nome]! Sou dev sênior e atuo sob demanda (PJ) apoiando software houses com demandas de IA e backend quando o time está cheio. Vamos conectar?'
  },
  {
    tipo: '3. Nota de Convite para Founders de Startups / SaaS',
    instrucao: 'Limite rigoroso de 200 caracteres:',
    texto: 'Oi [Nome], vi seu trabalho na startup! Sou dev sênior e desenvolvo MVPs e automações com IA sob demanda (PJ). Gostaria de conectar e acompanhar!'
  },
  {
    tipo: '4. Resposta em Posts de quem procura Dev / DM Direta',
    instrucao: 'Para comentário em post do feed ou DM direta (sem limite de 200 caracteres):',
    texto: 'Olá [Nome], vi sua demanda! Sou dev sênior com foco em integrações de IA, LLMs e backend com entregas rápidas. Tenho disponibilidade para projetos sob demanda (PJ). Te mandei uma DM para conversarmos!'
  }
];

function gerarHtml() {
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Radar de Freelas & Conexões - Iury Dev</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: #f3f2ef; color: #191919; margin: 0; padding: 24px; }
    .container { max-width: 950px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #0a66c2, #004182); color: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(10,102,194,0.2); margin-bottom: 24px; }
    h1 { margin: 0 0 6px 0; font-size: 26px; }
    .subtitle { opacity: 0.9; font-size: 14px; margin-bottom: 12px; }
    .badge-radar { background: #00dfa2; color: #004d38; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; display: inline-block; }
    
    .card { background: white; padding: 22px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 22px; }
    h2 { font-size: 19px; margin-top: 0; color: #111; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    
    .item-radar { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #f2f2f2; }
    .item-radar:last-child { border-bottom: none; }
    .item-info { flex: 1; padding-right: 20px; }
    .item-info h3 { margin: 0 0 4px 0; font-size: 16px; color: #0a66c2; }
    .item-info p { margin: 0; font-size: 13px; color: #555; line-height: 1.4; }
    
    .btn-action { background: #0a66c2; color: white; text-decoration: none; padding: 10px 18px; border-radius: 20px; font-weight: bold; font-size: 13px; transition: 0.2s; white-space: nowrap; display: inline-block; }
    .btn-action:hover { background: #004182; transform: translateY(-1px); }
    .btn-fire { background: #d9381e; }
    .btn-fire:hover { background: #b02a14; }
    .btn-recruiter { background: #6b21a8; }
    .btn-recruiter:hover { background: #581c87; }

    .msg-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0a66c2; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
    .msg-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .msg-tag { font-weight: bold; font-size: 13px; color: #0a66c2; }
    .msg-instrucao { font-size: 12px; color: #666; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .char-badge { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 11px; }
    .msg-text { font-size: 14px; line-height: 1.5; color: #222; margin: 0; background: white; padding: 12px; border-radius: 6px; border: 1px solid #eee; }
    
    .btn-copy { background: #eef3f8; border: 1px solid #0a66c2; color: #0a66c2; padding: 6px 14px; border-radius: 16px; cursor: pointer; font-size: 12px; font-weight: bold; }
    .btn-copy:hover { background: #0a66c2; color: white; }

    .tips { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 10px; color: #065f46; font-size: 13px; line-height: 1.5; }
    .tips strong { color: #047857; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎯 Radar de Freelas, Recrutadores PJ & Conexões</h1>
      <div class="subtitle">${dataHoje} · Mensagens calibradas para o limite de 200 caracteres</div>
      <div class="badge-radar">MODO ATRAÇÃO DE FREELANCE / PJ ATIVADO</div>
    </header>

    <div class="card">
      <h2>
        <span>1. 👔 Tech Recruiters & Headhunters (Focados em PJ / Contratos)</span>
        <span style="font-size: 12px; font-weight: normal; color: #6b21a8; font-weight: bold;">Recrutadores com Vagas Rápidas</span>
      </h2>
      <p style="font-size: 13px; color: #666; margin-top: 4px;">
        Recrutadores que têm clientes corporativos precisando de desenvolvedores PJ para começar imediatamente:
      </p>

      ${perfisRecrutadores.map(r => `
        <div class="item-radar">
          <div class="item-info">
            <h3 style="color: #6b21a8;">${r.titulo}</h3>
            <p>${r.descricao}</p>
          </div>
          <a href="${r.url}" target="_blank" class="btn-action btn-recruiter">Buscar Recrutadores ↗</a>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <h2>
        <span>2. 🚨 Radar em Tempo Real: Posts Pedindo Dev / Freela no Feed</span>
        <span style="font-size: 12px; font-weight: normal; color: #d9381e; font-weight: bold;">Demandas Abertas Hoje</span>
      </h2>
      <p style="font-size: 13px; color: #666; margin-top: 4px;">
        Publicações feitas no LinkedIn por quem está ativamente procurando indicações de desenvolvedores:
      </p>

      ${radarPostsFreela.map(r => `
        <div class="item-radar">
          <div class="item-info">
            <h3 style="color: #d9381e;">${r.titulo}</h3>
            <p>${r.descricao}</p>
          </div>
          <a href="${r.url}" target="_blank" class="btn-action btn-fire">Ver Posts de Freela ↗</a>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <h2>
        <span>3. 🏢 Donos de Software Houses & Founders (Compradores Diretos)</span>
        <span style="font-size: 12px; font-weight: normal; color: #666;">Decisores sem RH</span>
      </h2>
      <p style="font-size: 13px; color: #666; margin-top: 4px;">
        Líderes que terceirizam sprints inteiras ou contratam para tirar MVPs do papel:
      </p>

      ${perfisDecisores.map(p => `
        <div class="item-radar">
          <div class="item-info">
            <h3>${p.titulo}</h3>
            <p>${p.descricao}</p>
          </div>
          <a href="${p.url}" target="_blank" class="btn-action">Buscar Perfis ↗</a>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <h2>4. 💬 Mensagens de Abordagem (Calibradas ≤ 200 caracteres)</h2>

      ${scriptsAbordagem.map(s => `
        <div class="msg-box">
          <div class="msg-top">
            <span class="msg-tag">${s.tipo}</span>
            <button class="btn-copy" onclick="copiar('${s.texto.replace(/'/g, "\\'")}')">📋 Copiar Mensagem</button>
          </div>
          <div class="msg-instrucao">
            <span>${s.instrucao}</span>
            <span class="char-badge">${s.texto.length} caracteres (Cabe com folga nos 200)</span>
          </div>
          <p class="msg-text">"${s.texto}"</p>
        </div>
      `).join('')}
    </div>

    <div class="tips">
      <strong>💡 Dica de Ouro para a Nota de Convite:</strong><br>
      • Todas as notas 1, 2 e 3 acima têm entre <strong>140 e 155 caracteres</strong>. Mesmo com um nome longo, nunca vão estourar o limite de 200 caracteres do LinkedIn!<br>
      • Troque apenas o <code>[Nome]</code> ao colar.
    </div>
  </div>

  <script>
    function copiar(texto) {
      navigator.clipboard.writeText(texto).then(() => {
        alert('Copiado! Já está na área de transferência com menos de 200 caracteres.');
      });
    }
  </script>
</body>
</html>`;
}

function atualizar() {
  const html = gerarHtml();
  fs.writeFileSync(HTML_APP_PATH, html, 'utf-8');
  fs.writeFileSync(DESKTOP_PATH, html, 'utf-8');
  console.log(`Painel atualizado com mensagens <= 200 caracteres!`);
  console.log(`Atualizado em: ${DESKTOP_PATH}`);
  exec(`start "" "${DESKTOP_PATH}"`);
}

atualizar();
