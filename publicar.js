const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const BANCO_PATH = path.join(__dirname, 'banco_posts.json');
const HISTORICO_PATH = path.join(__dirname, 'historico.json');
const LOG_PATH = path.join(__dirname, 'execucao.log');

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

async function publicar() {
  let accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  let personUrn = process.env.LINKEDIN_PERSON_URN;
  let userName = process.env.LINKEDIN_USER_NAME || 'Iury Almeida';

  if (!accessToken || !personUrn) {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      accessToken = config.accessToken;
      personUrn = config.personUrn;
      userName = config.userName || userName;
    } else {
      log('❌ Credenciais não encontradas (nem no config.json nem nas variáveis de ambiente).');
      process.exit(1);
    }
  }

  const banco = JSON.parse(fs.readFileSync(BANCO_PATH, 'utf-8'));

  let historico = [];
  if (fs.existsSync(HISTORICO_PATH)) {
    try {
      historico = JSON.parse(fs.readFileSync(HISTORICO_PATH, 'utf-8'));
    } catch {
      historico = [];
    }
  }

  const publicadosIds = new Set(historico.map(h => h.postId));
  let proximoPost = banco.find(p => !publicadosIds.has(p.id));

  if (!proximoPost) {
    log('⚠️ Todos os posts do banco já foram publicados! Reiniciando ciclo pelo mais antigo...');
    proximoPost = banco[0];
  }

  log(`\n========================================`);
  log(`Iniciando publicação automática no LinkedIn...`);
  log(`Autor: ${userName} (${personUrn})`);
  log(`Tema do dia: "${proximoPost.tema}" (ID #${proximoPost.id})`);

  const commentaryTratado = sanitizarParaLinkedIn(proximoPost.conteudo);

  const payload = {
    author: personUrn,
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

  try {
    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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

      const registro = {
        postId: proximoPost.id,
        tema: proximoPost.tema,
        postUrn,
        link: postLink,
        publicadoEm: new Date().toISOString()
      };

      historico.push(registro);
      fs.writeFileSync(HISTORICO_PATH, JSON.stringify(historico, null, 2), 'utf-8');

      log(`✅ Publicado com sucesso no LinkedIn!`);
      log(`🔗 Link da publicação: ${postLink}`);

      notifyWindows('🚀 Post publicado no LinkedIn!', `Tema: ${proximoPost.tema}. Acesse seu LinkedIn para conferir.`);
    } else {
      const errText = await response.text();
      log(`❌ Erro da API do LinkedIn (${response.status}): ${errText}`);
      notifyWindows('⚠️ Falha no LinkedIn AutoPost', `Erro ${response.status}: verifique os logs.`);
      process.exit(1);
    }
  } catch (err) {
    log(`❌ Erro inesperado: ${err.message}`);
    process.exit(1);
  }
}

publicar();
