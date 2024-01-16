const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const fs = require('fs')

const app = express();
const server = http.createServer(app)
const io = socketIO(server)

const PORT = 2000

const filesDirectory = './files'  // Diretório onde os arquivos estão armazenados.
const password = 'mypassword' // Defina uma senha segura para o envio de arquivos.

app.use(express.static('public'))

app.get('/files', (req, res) => {
  // Endpoint para obter a lista de arquivos disponíveis.
  const fileList = fs.readdirSync(filesDirectory)
  res.json({ files: fileList })
});

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`)

  // Envia a lista de arquivos para o cliente quando ele se conecta.
  socket.emit('fileList', { files: fs.readdirSync(filesDirectory) })

  socket.on('uploadFile', ({ fileName, fileData, clientPassword }) => {
    // Verifica se a senha fornecida pelo cliente está correta.
    if (clientPassword === password) {
      const filePath = `${filesDirectory}/${fileName}`
      
      // Salva o arquivo no servidor.
      fs.writeFileSync(filePath, fileData, 'base64')

      console.log(`Arquivo recebido: ${fileName}`)
      socket.emit('uploadSuccess', { message: 'Arquivo recebido com sucesso!' })
    } else {
      // Senha incorreta.
      socket.emit('uploadError', { message: 'Senha incorreta. Upload não autorizado.' })
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
});
