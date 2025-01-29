const express = require('express');
const path = require('path');
const app = express();
const config = require('./config.json');
require('dotenv').config();

// Configurando o EJS como motor de templates (não será usado para a home)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Pasta onde ficam os templates

// Middleware para interpretar JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servindo arquivos estáticos da pasta 'public'

// Rota da home (localhost:8080)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html')); // Enviando o arquivo home.html
});

// Importando as rotas
const generateRoute = require('./routes/generate');
const getlinkRoute = require('./routes/getlink');
const discordAuthRoute = require('./DiscordAuth'); // Rota do DiscordAuth

// Configurando rotas específicas
app.use('/generate', generateRoute); // Rota para geração de códigos
app.use('/getlink', getlinkRoute); // Rota para exibir informações do código
app.use('/auth', discordAuthRoute); // Rota de autenticação Discord e callback

// Iniciar o servidor
const PORT = config.PORTA || 3000;
app.listen(PORT, () => {
  console.log(`🌟 | Servidor rodando em http://localhost:${PORT}`);
});
