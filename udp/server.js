const dgram = require("dgram");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const server = dgram.createSocket("udp4");
const PORT = 2000; // Substitute with the youngest member's birth year
const FILES_DIR = path.join(__dirname, "files");
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });
const WINDOW_SIZE = 4;
const PACKET_SIZE = 1460;
const TIMEOUT = 1000; // in milliseconds
const PASSWORD = "12345678"; // Define a password for upload authentication
const USER = "admin"; // Define a password for upload authentication

let windowStart = 0;
let windowEnd = WINDOW_SIZE - 1;
let acksReceived = new Set();
let sendQueue = [];
let timeouts = {}; // Object to track timeouts for each packet

function createHeader(sequenceNumber, isLastPacket) {
  const header = Buffer.alloc(6); // 4 bytes for sequence number, 1 for isLastPacket, 1 for packet type
  header.writeUInt32BE(sequenceNumber, 0);
  header.writeUInt8(isLastPacket ? 1 : 0, 4);
  return header;
}

function createPacket(sequenceNumber, data, isLastPacket) {
  const header = createHeader(sequenceNumber, isLastPacket);
  return Buffer.concat([header, data]);
}

function sendPacket(packet, sequenceNumber, rinfo) {
  server.send(packet, 0, packet.length, rinfo.port, rinfo.address, (err) => {
    if (err) {
      console.error("Error sending packet:", err);
      return;
    }
    console.log(`Packet ${sequenceNumber} sent`);
    // Set a timeout for this packet if not already acknowledged
    if (!acksReceived.has(sequenceNumber)) {
      if (timeouts[sequenceNumber]) clearTimeout(timeouts[sequenceNumber]);
      timeouts[sequenceNumber] = setTimeout(() => {
        console.log(`Timeout for packet ${sequenceNumber}, resending...`);
        sendPacket(packet, sequenceNumber, rinfo);
      }, TIMEOUT);
    }
  });
}

function processSendQueue(rinfo) {
  while (sendQueue.length > 0 && windowEnd - windowStart <= WINDOW_SIZE) {
    const [packet, sequenceNumber] = sendQueue.shift();
    sendPacket(packet, sequenceNumber, rinfo);
    windowEnd++;
  }
}

server.on("message", (msg, rinfo) => {
  try {
    const messageType = msg.readUInt8(5);
    if (messageType === 0) {
      // ACK
      const ackNumber = msg.readUInt32BE(0);
      console.log(`ACK received for packet ${ackNumber}`);
      acksReceived.add(ackNumber);
      clearTimeout(timeouts[ackNumber]); // Cancel the timeout for this packet
      delete timeouts[ackNumber]; // Remove from timeouts tracking
      if (ackNumber === windowStart) {
        while (acksReceived.has(windowStart)) {
          acksReceived.delete(windowStart);
          windowStart++;
        }

        processSendQueue(rinfo);
      }
    } else if (messageType === 1) {
      // Command
      const command = msg.toString("utf8", 6);
      handleCommand(command, rinfo);
    }
  } catch (error) {
    console.log(error);
  }
});

function handleCommand(command, rinfo) {
  const [cmd, payload] = command.split("|");
  windowStart = 0;
  windowEnd = WINDOW_SIZE - 1;

  switch (cmd) {
    case "LOGIN":
      const [username, password] = payload.split(":");
      const message =
        username === USER && password === PASSWORD ? "Success" : "Failure";
      const packet = Buffer.from(message, "utf8");
      server.send(packet, 0, packet.length, rinfo.port, rinfo.address);
      break;
    case "LIST":
      fs.readdir(FILES_DIR, (err, files) => {
        if (err) {
          console.log("Error reading directory:", err);
          return;
        }
        const message = files.join(",");
        const packet = Buffer.from(message, "utf8");
        server.send(packet, 0, packet.length, rinfo.port, rinfo.address);
      });
      break;
    case "DOWNLOAD":
      const filename = payload; // The filename to download
      const filePath = path.join(FILES_DIR, filename);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.log("Error reading file for download:", err);
          const errorMsg = Buffer.from("DOWNLOAD_FAILED", "utf8");
          server.send(errorMsg, 0, errorMsg.length, rinfo.port, rinfo.address);
          return;
        }

        // Split the file data into packets and enqueue them for sending
        for (let i = 0; i < data.length; i += PACKET_SIZE) {
          const packetData = data.slice(i, i + PACKET_SIZE);

          const isLastPacket = i + PACKET_SIZE >= data.length;
          const packet = createPacket(
            i / PACKET_SIZE,
            packetData,
            isLastPacket
          );
          sendQueue.push([packet, i / PACKET_SIZE]);
        }

        // Start sending the packets if the window allows
        processSendQueue(rinfo);
      });
      break;
  }
}

server.bind(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
