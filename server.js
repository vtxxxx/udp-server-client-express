const dgram = require('dgram')
const fs = require('fs')

const server = dgram.createSocket('udp4')
const PORT = 1999

const filesDirectory = './files' // Diretório onde os arquivos serão armazenados
const password = 'mypassword' // Senha para upload de arquivos

// Definindo a taxa de perda de pacotes
const LOSS_RATE = 0.05 // Taxa de perda de pacotes (5%)

// Função para enviar mensagem ao cliente
function sendMessage(message, clientPort, clientAddress) {
  server.send(message, clientPort, clientAddress)
}

// Função para enviar mensagem de confirmação ao cliente
function sendConfirmation(sequenceNumber, clientPort, clientAddress) {
  const ackMessage = JSON.stringify({ type: 'ack', sequenceNumber })
  sendMessage(ackMessage, clientPort, clientAddress)
}

// Função para processar as mensagens recebidas do cliente
function processMessage(msg, rinfo) {
  const data = JSON.parse(msg.toString())

  switch (data.type) {
    case 'getFilesList':
      // Envia a lista de arquivos disponíveis para o cliente
      sendFilesList(rinfo.port, rinfo.address)
      break
    case 'uploadFile':
      // Simular perda de pacotes
      if (simulatePacketLoss()) {
        handleFileUpload(data, rinfo)
        // Enviar confirmação de recebimento do pacote
        sendConfirmation(data.sequenceNumber, rinfo.port, rinfo.address)
      } else {
        console.log(`Pacote ${data.sequenceNumber} perdido.`)
      }
      break
  }
}

// Função para enviar a lista de arquivos disponíveis para o cliente
function sendFilesList(clientPort, clientAddress) {
  const fileList = fs.readdirSync(filesDirectory)
  const response = JSON.stringify({ type: 'fileList', files: fileList })
  sendMessage(response, clientPort, clientAddress)
}

// Função para lidar com o upload de arquivos pelo cliente
function handleFileUpload(data, rinfo) {
  if (data.password === password) {
    const filePath = `${filesDirectory}/${data.fileName}`
    fs.writeFileSync(filePath, Buffer.from(data.fileData, 'base64'))
    console.log(`Arquivo recebido: ${data.fileName}`)
    const successResponse = JSON.stringify({ type: 'uploadSuccess', message: 'Arquivo recebido com sucesso!' })
    sendMessage(successResponse, rinfo.port, rinfo.address)
  } else {
    const errorResponse = JSON.stringify({ type: 'uploadError', message: 'Senha incorreta. Upload não autorizado.' })
    sendMessage(errorResponse, rinfo.port, rinfo.address)
  }
}

// Função para simular perdas de pacotes
function simulatePacketLoss() {
  return Math.random() >= LOSS_RATE
}

// Evento de recebimento de mensagem
server.on('message', (msg, rinfo) => {
  processMessage(msg, rinfo)
})

// Evento de inicialização do servidor
server.on('listening', () => {
  const address = server.address()
  console.log(`Servidor rodando em ${address.address}:${address.port}`)
})

// Evento de erro
server.on('error', (err) => {
  console.error(`Erro no servidor: ${err}`)
})

// Vincula o servidor à porta especificada
server.bind(PORT)
