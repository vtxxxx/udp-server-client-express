const dgram = require('dgram')
const fs = require('fs')

const server = dgram.createSocket('udp4')
const PORT = 1997

const filesDirectory = './files' // Diretório onde os arquivos estão armazenados.
const password = 'mypassword' // Defina uma senha segura para o envio de arquivos.

server.on('message', (msg, rinfo) => {
  const data = JSON.parse(msg.toString())

  switch (data.type) {
    case 'getFilesList':
      // Endpoint para obter a lista de arquivos disponíveis.
      const fileList = fs.readdirSync(filesDirectory)
      const response = JSON.stringify({ type: 'fileList', files: fileList })
      server.send(response, rinfo.port, rinfo.address)
      break

    case 'uploadFile':
      // Verifica se a senha fornecida pelo cliente está correta.
      if (data.password === password) {
        const filePath = `${filesDirectory}/${data.fileName}`

        // Salva o arquivo no servidor.
        fs.writeFileSync(filePath, Buffer.from(data.fileData, 'base64'))

        console.log(`Arquivo recebido: ${data.fileName}`)
        const successResponse = JSON.stringify({ type: 'uploadSuccess', message: 'Arquivo recebido com sucesso!' })
        server.send(successResponse, rinfo.port, rinfo.address)
      } else {
        // Senha incorreta.
        const errorResponse = JSON.stringify({ type: 'uploadError', message: 'Senha incorreta. Upload não autorizado.' })
        server.send(errorResponse, rinfo.port, rinfo.address)
      }
      break
  }
})

server.bind(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
