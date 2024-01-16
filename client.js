const io = require('socket.io-client')
const fs = require('fs')

const serverURL = 'http://localhost:2000' // Substitua pela URL do servidor local.
const clientPassword = 'mypassword' // A mesma senha definida no servidor.

const socket = io(serverURL)

socket.on('connect', () => {
  console.log(`Conectado ao servidor: ${socket.id}`)

  // Solicita a lista de arquivos ao se conectar.
  socket.emit('getFilesList')

  // Lógica para lidar com a lista de arquivos recebida do servidor.
  socket.on('fileList', ({ files }) => {
    console.log('Lista de Arquivos:', files)
    // Aqui você pode exibir os arquivos disponíveis na interface do usuário.
  })

  // Exemplo de upload de arquivo para o servidor.
  const filePath = './files/exemplo.txt'
  const fileName = 'exemplo.txt'
  const fileData = fs.readFileSync(filePath, 'base64')  

  // Evento de upload para o servidor.
  socket.emit('uploadFile', { fileName, fileData, clientPassword })

  // Lógica para lidar com a resposta do servidor após o upload.
  socket.on('uploadSuccess', ({ message }) => {
    console.log(`Upload bem-sucedido: ${message}`)
  })

  socket.on('uploadError', ({ message }) => {
    console.error(`Erro no upload: ${message}`)
  })
})

socket.on('disconnect', () => {
  console.log('Desconectado do servidor.')
})
