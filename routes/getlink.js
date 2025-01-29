const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Função para buscar o avatar do Gravatar
function getGravatarUrl(email) {
  const gravatarHash = require('crypto').createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${gravatarHash}?d=identicon&s=200`;
}

router.get('/', (req, res) => {
  try {
    const { code, state } = req.query;

    // Verifica se o código e o estado estão presentes
    if (!code || !state) {
      return res.status(400).send(renderErrorPage('Código e state são obrigatórios.'));
    }

    // Caminho para o arquivo de códigos
    const codesPath = path.join(__dirname, '../data/codes.json');
    const codes = fs.existsSync(codesPath) ? JSON.parse(fs.readFileSync(codesPath, 'utf8')) : [];
    const userData = codes.find(c => c.code === code && c.state === state);

    // Se não encontrar o código ou estado, retorna erro
    if (!userData) {
      return res.status(404).send(renderErrorPage('Código ou state não encontrado ou inválido.'));
    }

    // Verifica se o código já foi verificado
    if (userData.verified) {
      return res.status(400).send(renderErrorPage('Este código já foi verificado.'));
    }

    // Lê o arquivo CSS
    const css = fs.readFileSync(path.join(__dirname, '../public/getlink.css'), 'utf-8');

    // URL do avatar desconhecido
    const unknownAvatar = 'https://i.pinimg.com/280x280_RS/66/a1/a4/66a1a4a22e271ec3ee3ef35ba0883ca4.jpg';
    const defaultAvatar = 'https://i.pinimg.com/474x/54/f4/b5/54f4b55a59ff9ddf2a2655c7f35e4356.jpg';

    // Verifica se o avatar do usuário é válido
    let avatarUrl = userData.avatarUrl || unknownAvatar; // Se o avatar não for encontrado, usa a imagem desconhecida

    // Se o usuário não tem avatar, tenta buscar do Gravatar
    if (!userData.avatarUrl && userData.email) {
      avatarUrl = getGravatarUrl(userData.email) || defaultAvatar;
    }

    const username = userData.username || 'Desconhecido';

    // Alterando o título da página para "Link - <nick do minecraft>"
    const pageTitle = `Link - ${username}`;

    // Envia o HTML renderizado com as variáveis necessárias
    res.render('getlink', {
      pageTitle,
      avatarUrl,
      username,
      userData,
      state,
      css
    });
  } catch (error) {
    console.error('Erro ao processar o /getlink:', error);
    return res.status(500).send(renderErrorPage('Erro interno no servidor. Por favor, tente novamente mais tarde.'));
  }
});

// Função para renderizar a página de erro
function renderErrorPage(message) {
  return `
    <html>
      <head>
        <link rel="stylesheet" href="/getlink.css">
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

module.exports = router;
