// pages/api/download.js
import { specifyCommand } from "@/app/logic/helpers";
import dgram from "dgram";
import { NextRequest, NextResponse } from "next/server";

const SERVER_PORT = Number(process.env.SERVER_PORT ?? 1999);
const SERVER_ADDRESS = process.env.SERVER_ADDRESS;

function downloadFile(filename: string) {
  return new Promise<Buffer>((resolve, reject) => {
    let downloadedData = Buffer.alloc(0);
    let isLastPacketReceived = false;


    const handleMessage = (msg: Buffer, rinfo: dgram.RemoteInfo) => {
      const sequenceNumber = msg.readUInt32BE(0);
      const isLastPacket = msg.readUInt8(4) === 1;
      const data = msg.slice(6); // Assuming data starts at byte 6

      downloadedData = Buffer.concat([downloadedData, data]);

      // Acknowledge receipt of the packet
      const ackPacket = Buffer.alloc(6);
      ackPacket.writeUInt32BE(sequenceNumber, 0);
      console.log("packet received: ", sequenceNumber);

      ackPacket.writeUInt8(0, 5); // Message type 0 for ACK
      client.send(ackPacket, 0, ackPacket.length, SERVER_PORT, SERVER_ADDRESS);

      if (isLastPacket) {
        isLastPacketReceived = true;
        console.log("finished");
        setTimeout(() => {
          client.close(); // Close the client socket
        }, 200);
        resolve(downloadedData); // Resolve the promise with the collected data
      }
    };
    const client = dgram.createSocket("udp4");


    client.on("message", handleMessage);

    client.on("close", () => {
      client.removeListener("message", handleMessage);
      if (!isLastPacketReceived) {
        reject(new Error("Connection closed before receiving the last packet"));
      }
    });

    // Send the DOWNLOAD command to the UDP server
    const command = specifyCommand(`DOWNLOAD|${filename}`);
    client.send(command, 0, command.length, SERVER_PORT, SERVER_ADDRESS);
  });
}

export async function POST(req: NextRequest, res: NextResponse) {
  // Extract filename from request body
  const {
    filename,
  }: {
    filename: string;
  } = await req.json();

  if (!filename) {
    return NextResponse.json(
      { error: "Filename is required" },
      {
        status: 400,
      }
    );
  }

  try {
    // Placeholder for the downloaded data
    const downloadedData = await downloadFile(filename);
    // Send the downloaded data as a response
    // Note: This example assumes the entire file is received and fits in memory, which may not be practical
    return NextResponse.json(
      { data: downloadedData.toString() },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      {
        status: 500,
      }
    );
  }
}
