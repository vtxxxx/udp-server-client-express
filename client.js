const dgram = require('dgram')
const fs = require('fs')

const serverAddress = 'localhost'
const serverPort = 1997
const clientPassword = 'mypassword' // A mesma senha definida no servidor.

const client = dgram.createSocket('udp4')

// Solicita a lista de arquivos ao se conectar.
client.send(JSON.stringify({ type: 'getFilesList' }), serverPort, serverAddress)

client.on('message', (msg) => {
  const data = JSON.parse(msg.toString())

  switch (data.type) {
    case 'fileList':
      console.log('Lista de Arquivos:', data.files)
      // Aqui você pode exibir os arquivos disponíveis na interface do usuário.
      break

    case 'uploadSuccess':
      console.log(`Upload bem-sucedido: ${data.message}`)
      break

    case 'uploadError':
      console.error(`Erro no upload: ${data.message}`)
      break
  }
})

// Exemplo de upload de arquivo para o servidor.
const filePath = './files/exemplo.txt'
const fileName = 'exemplo.txt'
const fileData = fs.readFileSync(filePath).toString('base64')

// Evento de upload para o servidor.
client.send(JSON.stringify({ type: 'uploadFile', fileName, fileData, password: clientPassword }), serverPort, serverAddress)

// Lógica para lidar com a resposta do servidor após o upload.
client.on('close', () => {
  console.log('Desconectado do servidor.')
})
