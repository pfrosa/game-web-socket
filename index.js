const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;

// Criar servidor HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Servidor WebSocket rodando");
});

// Criar servidor WebSocket usando o servidor HTTP
const wss = new WebSocket.Server({ server });

// Lidar com conexões
wss.on('connection', (ws) => {
  console.log('Cliente conectado');

  ws.on('message', (message) => {
    console.log(`Mensagem recebida: ${message}`);
    ws.send(`Você disse: ${message}`);
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });

  ws.send('Bem-vindo ao WebSocket!');
});

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});