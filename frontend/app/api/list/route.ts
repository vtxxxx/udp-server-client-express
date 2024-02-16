import { specifyCommand } from "@/app/logic/helpers";
import dgram from "dgram";

const client = dgram.createSocket("udp4");

const SERVER_PORT = Number(process.env.SERVER_PORT ?? 1999);
const SERVER_ADDRESS = process.env.SERVER_ADDRESS;

function listFiles() {
  return new Promise<Buffer>((resolve, reject) => {
    const command = specifyCommand("LIST");

    // Create a one-time listener for the response
    const handleMessage = (msg: Buffer, rinfo: any) => {
      client.removeListener("message", handleMessage); // Remove listener to avoid memory leak
      resolve(msg);
    };

    client.on("message", handleMessage);

    client.send(
      command,
      0,
      command.length,
      SERVER_PORT,
      SERVER_ADDRESS,
      (err) => {
        if (err) {
          client.removeListener("message", handleMessage); // Ensure listener is removed on error
          reject(err);
        }
        console.log("File list request sent to the server");
      }
    );
  });
}

export async function GET() {
  try {
    const files = await listFiles();
    return new Response(JSON.stringify({ data: files.toString() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to list files" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
