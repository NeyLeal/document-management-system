// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const documentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const errorResponses = {
    FILE_REQUIRED: { status: 400, code: 'BAD_REQUEST', message: 'Envie um arquivo no campo file.' },
    DOCUMENT_NOT_FOUND: { status: 404, code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
    STORAGE_ERROR: { status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível processar o documento.' },
  };
  const response = errorResponses[error.code];

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'O arquivo excede o limite permitido.' },
    });
  }

  if (error.code && error.code.startsWith('LIMIT_')) {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'A requisição de upload é inválida.' },
    });
  }

  if (response) {
    return res.status(response.status).json({
      error: { code: response.code, message: response.message },
    });
  }

  console.error(error);
  return res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Ocorreu um erro interno.' },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
