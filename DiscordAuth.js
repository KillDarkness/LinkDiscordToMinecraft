const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Rota de callback após a autenticação do Discord
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    console.error('❌ Código de autorização ou state ausente.');
    return res.status(400).send(renderErrorPage('Código de autorização ou state ausente.'));
  }

  try {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;

    // Requisição para obter o token de acesso
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const token = tokenResponse.data.access_token;

    // Requisição para obter os dados do usuário do Discord
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { id, username, discriminator, avatar } = userResponse.data;
    const fullUsername = `${username}#${discriminator}`;
    const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;  // URL do avatar do Discord
    console.log(`✅ Usuário autenticado: ${fullUsername} (${id})`);

    // Carrega o arquivo codes.json
    const codesPath = path.join(__dirname, './data/codes.json');
    const codes = fs.existsSync(codesPath) ? JSON.parse(fs.readFileSync(codesPath, 'utf8')) : [];

    // Busca os dados do usuário pelo state
    const userData = codes.find(c => c.state === state) || {};

    // Se não encontrar, exibe valores padrão
    const mcUsername = userData.username || 'null';
    const storedCode = userData.code || 'null';

    // Atualiza o arquivo codes.json se encontrar o usuário
    if (userData) {
      userData.discordid = id;
      userData.verified = true;
      fs.writeFileSync(codesPath, JSON.stringify(codes, null, 2));
    }

    // Renderiza a página EJS com os dados do usuário
    return res.render('discordauth', {
      pageTitle: 'DracHard - Conta Vinculada!', // Novo título da página
      discordUsername: fullUsername,        // Nome de usuário completo do Discord
      discordAvatar: avatarUrl,             // URL do avatar do Discord
      userData: {
        username: mcUsername,               // Nome de usuário do Minecraft
      },
      state                                    // Passa o state para a página
    });
  } catch (error) {
    console.error('❌ Erro ao processar o callback:', error.message);
    if (error.response) console.error('🔍 Detalhes do erro:', error.response.data);

    return res.status(500).send(renderErrorPage(`
      <h2>Erro Interno no Servidor</h2>
      <p><strong>Mensagem:</strong> ${error.message}</p>
      ${error.response ? `<p><strong>Detalhes:</strong> ${JSON.stringify(error.response.data)}</p>` : ''}
      <a href="/" class="btn">Voltar</a>
    `));
  }
});

// Página de erro
function renderErrorPage(message) {
  return `
    <html>
      <head>
        <style>${getGlobalCSS()}</style>
      </head>
      <body>
        <div class="container">
          <h1>Erro!</h1>
          <p class="error">${message}</p>
          <a href="/" class="btn">Voltar</a>
        </div>
      </body>
    </html>
  `;
}

// Carrega o CSS global
function getGlobalCSS() {
  try {
    const cssPath = path.join(__dirname, './public/globalCss.css');
    return fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : '';
  } catch (err) {
    console.error('⚠ Erro ao carregar o CSS global:', err.message);
    return '';
  }
}

module.exports = router;
