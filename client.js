const dgram = require('dgram')
const fs = require('fs')
const readline = require('readline')

const serverAddress = 'localhost'
const serverPort = 1999
const clientPassword = 'mypassword' // A mesma senha definida no servidor.

const client = dgram.createSocket('udp4')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Função para solicitar senha ao usuário
function requestPassword(callback) {
  rl.question('Por favor, insira a senha: ', (password) => {
    callback(password)
  })
}

// Função para enviar solicitação de lista de arquivos ao servidor
function requestFilesList() {
  client.send(JSON.stringify({ type: 'getFilesList' }), serverPort, serverAddress)
}

// Função para lidar com mensagens recebidas do servidor
client.on('message', (msg) => {
  const data = JSON.parse(msg.toString())

  switch (data.type) {
    case 'fileList':
      console.log('Lista de Arquivos:', data.files)
      break
    case 'uploadSuccess':
      console.log(`Upload bem-sucedido: ${data.message}`)
      break
    case 'uploadError':
      console.error(`Erro no upload: ${data.message}`)
      break
    case 'ack':
      console.log(`Pacote ${data.sequenceNumber} confirmado pelo servidor.`)
      break
  }
})

// Evento de desconexão do cliente.
client.on('close', () => {
  console.log('Desconectado do servidor.')
})

// Evento de upload para o servidor.
function uploadFile(fileName, filePath) {
  const fileData = fs.readFileSync(filePath).toString('base64')
  requestPassword((password) => {
    const packetData = {
      type: 'uploadFile',
      fileName,
      fileData,
      password,
      sequenceNumber: Math.floor(Math.random() * 1000) // Número aleatório para identificar pacotes
    }
    sendPacketWithConfirmation(packetData)
  })
}

const TIMEOUT_DURATION = 5000 // Tempo limite para recebimento de confirmação (em milissegundos)
const MAX_RETRIES = 3 // Número máximo de tentativas de retransmissão

let retryCount = 0 // Contador de tentativas de retransmissão

// Objeto para armazenar informações sobre os pacotes enviados
const sentPackets = {}

// Função para lidar com timeout
function handleTimeout() {
  if (retryCount < MAX_RETRIES) {
    console.log(`Tempo limite excedido. Tentativa de retransmissão (${retryCount + 1}/${MAX_RETRIES})...`)
    // Retransmitir pacotes não confirmados
    Object.keys(sentPackets).forEach((sequenceNumber) => {
      const packet = sentPackets[sequenceNumber]
      client.send(packet.data, serverPort, serverAddress)
    })
    retryCount++
  } else {
    handleUploadError('Número máximo de tentativas de retransmissão excedido.')
  }
}

// Função para enviar pacotes com confirmação de recebimento
function sendPacketWithConfirmation(packetData) {
  const sequenceNumber = packetData.sequenceNumber
  sentPackets[sequenceNumber] = { data: packetData, timestamp: Date.now() }
  client.send(JSON.stringify(packetData), serverPort, serverAddress)
  setTimeout(handleTimeout, TIMEOUT_DURATION) // Configurar timeout para esperar pela confirmação
}

// Função para lidar com erros de timeout
function handleTimeout() {
  console.error('Tempo limite excedido. Nenhuma confirmação recebida do servidor.')
  // Implementar lógica adicional, como retransmissão de pacotes
}

// Lidar com erros de conexão
client.on('error', (err) => {
  console.error(`Erro no cliente: ${err}`)
  client.close() // Encerra o cliente em caso de erro
})

// Lidar com erros durante a solicitação de senha
rl.on('close', () => {
  console.error('Entrada de senha fechada inesperadamente.')
  process.exit(1) // Encerra o processo em caso de erro na entrada de senha
})

// Lidar com erros durante o upload de arquivos
function handleUploadError(errorMessage) {
  console.error(`Erro durante o upload: ${errorMessage}`)
  rl.close()
}

// Lidar com erros de arquivo não encontrado
function handleFileNotFoundError(fileName) {
  console.error(`Arquivo '${fileName}' não encontrado.`)
  rl.close() 
}

// Solicitar lista de arquivos ao se conectar.
client.on('listening', () => {
  requestFilesList()
})

// Lidar com entrada do usuário para upload de arquivo
rl.question('Insira o nome do arquivo a ser enviado: ', (fileName) => {
  const filePath = `./files/${fileName}`
  if (fs.existsSync(filePath)) {
    uploadFile(fileName, filePath)
  } else {
    handleFileNotFoundError(fileName)
  }
})
