const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const HISTORICO_PATH = path.join(__dirname, 'historico.json');
const LOG_PATH = path.join(__dirname, 'execucao.log');
const AGY_PATH = 'C:\\Users\\03573608183\\AppData\\Local\\agy\\bin\\agy.exe';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(LOG_PATH, line, 'utf-8');
  } catch {}
  console.log(msg);
}

function sanitizarParaLinkedIn(texto) {
  return texto.replace(/([\\|{}()\[\]*~_@])/g, '\\$1');
}

function notifyWindows(title, message) {
  if (process.platform !== 'win32') return;
  const psScript = `
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
    $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
    $textNodes = $template.GetElementsByTagName('text')
    $textNodes.Item(0).AppendChild($template.CreateTextNode('${title.replace(/'/g, "''")}')) > $null
    $textNodes.Item(1).AppendChild($template.CreateTextNode('${message.replace(/'/g, "''")}')) > $null
    $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('LinkedIn AutoPost').Show($toast)
  `;
  exec(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, () => {});
}

async function gerarConteudoComLLM() {
  log('🧠 Chamando a LLM local (agy) para pesquisar e redigir o post inédito do dia...');

  const prompt = `Você é um engenheiro de software sênior e consultor de IA.
Escreva um post técnico inédito e aprofundado para o LinkedIn em português brasileiro.
Diretrizes:
- Escolha uma novidade real, paper recente do arXiv (ex: DeepSeek, Llama, Anthropic, OpenAI, Qwen, Transformers, RAG, MCP, MoE, inferência, context caching) ou mudança relevante em IA.
- Comece com um gancho forte nas primeiras duas linhas.
- Explique a arquitetura e a lição prática de engenharia (como isso resolve problemas reais de software/infraestrutura).
- Inclua links oficiais reais (arXiv, GitHub ou documentação).
- Finalize com uma pergunta para gerar debate técnico nos comentários.
- Adicione uma chamada sutil (CTA) no final indicando que você tem disponibilidade para projetos freelance e consultoria sob demanda em IA e backend.
- Retorne APENAS o texto pronto do post, sem aspas e sem explicações antes ou depois.`;

  return new Promise((resolve, reject) => {
    const proc = spawn(AGY_PATH, ['--print', prompt], {
      windowsHide: true
    });

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', data => {
      output += data.toString();
    });

    proc.stderr.on('data', data => {
      errorOutput += data.toString();
    });

    proc.on('close', code => {
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else {
        reject(new Error(`Falha no agy (exit code ${code}): ${errorOutput}`));
      }
    });

    proc.on('error', err => reject(err));
  });
}

async function executar() {
  if (!fs.existsSync(CONFIG_PATH)) {
    log('❌ Arquivo config.json não encontrado.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

  try {
    const postTexto = await gerarConteudoComLLM();
    log(`✅ Post gerado com sucesso pela LLM!\nPrévia:\n${postTexto.slice(0, 150)}...\n`);

    log(`Publicando no LinkedIn de ${config.userName}...`);
    const commentaryTratado = sanitizarParaLinkedIn(postTexto);

    const payload = {
      author: config.personUrn,
      commentary: commentaryTratado,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false
    };

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'LinkedIn-Version': '202609',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 201) {
      const postUrn = response.headers.get('x-restli-id') || 'publicado';
      const postLink = postUrn.startsWith('urn:li:')
        ? `https://www.linkedin.com/feed/update/${postUrn}`
        : 'https://www.linkedin.com/feed/';

      let historico = [];
      if (fs.existsSync(HISTORICO_PATH)) {
        try {
          historico = JSON.parse(fs.readFileSync(HISTORICO_PATH, 'utf-8'));
        } catch {}
      }

      historico.push({
        postUrn,
        link: postLink,
        tipo: 'Gerado dinamicamente via LLM local (agy)',
        publicadoEm: new Date().toISOString()
      });

      fs.writeFileSync(HISTORICO_PATH, JSON.stringify(historico, null, 2), 'utf-8');

      log(`🚀 Post publicado com sucesso no LinkedIn!`);
      log(`🔗 Link: ${postLink}`);

      notifyWindows('🚀 Post de IA publicado no LinkedIn!', 'Novo post gerado pela LLM e publicado com sucesso. Acesse para conferir.');
    } else {
      const errText = await response.text();
      log(`❌ Erro da API do LinkedIn (${response.status}): ${errText}`);
      notifyWindows('⚠️ Falha no LinkedIn AutoPost', `Erro ${response.status}: verifique os logs.`);
      process.exit(1);
    }
  } catch (err) {
    log(`❌ Erro no processo: ${err.message}`);
    process.exit(1);
  }
}

executar();
