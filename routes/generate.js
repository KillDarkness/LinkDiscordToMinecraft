const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const config = require('../config.json');
const PORT = config.PORTA;

router.post('/', (req, res) => {
  try {
    const { data, username, discordid = null } = req.body;

    if (!data || !username) {
      return res.status(400).json({
        status: 'erro',
        message: 'Data e username são obrigatórios.',
      });
    }

    // Gerar um código único
    const code = crypto.randomBytes(35).toString('hex'); // Código único com 70 caracteres
    const state = crypto.randomBytes(16).toString('hex'); // Gerar um state único para cada solicitação

    const codesPath = path.join(__dirname, '../data/codes.json');
    const codes = fs.existsSync(codesPath) ? JSON.parse(fs.readFileSync(codesPath, 'utf8')) : [];

    // Armazenar o estado juntamente com o código
    codes.push({
      code,
      state,
      data,
      username,
      discordid,
      verified: false,
    });

    fs.writeFileSync(codesPath, JSON.stringify(codes, null, 2));

    res.json({
      status: 'sucesso',
      message: 'Código gerado com sucesso!',
      code,
      link: `https://linkdiscordtominecraft.onrender.com/getlink?code=${code}&state=${state}`,
    });
  } catch (error) {
    console.error('Erro ao processar o /generate:', error);
    res.status(500).json({
      status: 'erro',
      message: 'Erro interno no servidor. Por favor, tente novamente mais tarde.',
    });
  }
});

module.exports = router;
