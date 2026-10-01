const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const CLIENT_ID = '7741c5wirqjgtp';
const CLIENT_SECRET = 'WPL_AP1.1vfLcfHppMmtEqPT.1L4Y1w==';
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'openid profile email w_member_social';

const CONFIG_PATH = path.join(__dirname, 'config.json');

const authUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=autopost_${Date.now()}&scope=${encodeURIComponent(SCOPES)}`;

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (reqUrl.pathname === '/' || reqUrl.pathname === '/login') {
    res.writeHead(302, { 'Location': authUrl });
    res.end();
    return;
  }

  if (reqUrl.pathname === '/callback') {
    const code = reqUrl.searchParams.get('code');
    const error = reqUrl.searchParams.get('error');
    const errorDescription = reqUrl.searchParams.get('error_description');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>❌ Erro na autenticação do LinkedIn:</h2><p>${errorDescription || error}</p>`);
      console.error('Erro na autenticação:', error, errorDescription);
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>❌ Código de autorização não encontrado.</h2>`);
      return;
    }

    try {
      console.log('Trocando código por Access Token...');
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        throw new Error(JSON.stringify(tokenData));
      }

      console.log('Obtendo dados do perfil...');
      const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      const userData = await userResponse.json();

      const config = {
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        obtainedAt: new Date().toISOString(),
        personUrn: `urn:li:person:${userData.sub}`,
        userName: userData.name || userData.given_name || 'Usuário LinkedIn',
        userEmail: userData.email || ''
      };

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #0a66c2;">✅ Conexão realizada com sucesso!</h1>
          <p style="font-size: 18px;">Conectado como: <strong>${config.userName}</strong> (${config.userEmail})</p>
          <p style="color: #555;">O robô já está autorizado a publicar no seu perfil. Você já pode fechar esta aba.</p>
        </div>
      `);

      console.log(`\n🎉 SUCESSO! Conectado como ${config.userName} (${config.personUrn})`);
      console.log(`Configuração salva em: ${CONFIG_PATH}`);

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 2000);

    } catch (err) {
      console.error('Falha ao processar token:', err);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>❌ Falha ao obter dados:</h2><p>${err.message}</p>`);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3000, () => {
  console.log('Servidor local de autenticação ouvindo em http://localhost:3000');
  console.log('\nAbrindo navegador para autorização via http://localhost:3000/login ...');
  exec('start http://localhost:3000/login');
});
