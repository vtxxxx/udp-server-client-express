import dgram from "dgram";

// export function createNewClient() {
//   const client = dgram.createSocket("udp4");

//   client.on("message", (msg, rinfo) => {
//     console.log(`Resposta do servidor: ${msg.toString()}`);
//   });

//   return client;
// }

const client = dgram.createSocket("udp4");

client.on("message", (msg, rinfo) => {
  console.log(`Resposta do servidor: ${msg.toString()}`);
});

export default client;
