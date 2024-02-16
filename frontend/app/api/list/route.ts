import { specifyCommand } from "@/app/logic/helpers";
import dgram from "dgram";
const client = dgram.createSocket("udp4");
const serverAddress = "localhost";
const serverPort = 2000;

function listFiles() {
  return new Promise<BufferSource>((resolve, reject) => {
    const command = specifyCommand("LIST");

    // Create a one-time listener for the response
    const handleMessage = (msg: BufferSource, rinfo: any) => {
      client.removeListener("message", handleMessage); // Remove listener to avoid memory leak
      resolve(msg);
    };

    client.on("message", handleMessage);

    client.send(
      command,
      0,
      command.length,
      serverPort,
      serverAddress,
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
    const message = await listFiles();
    return new Response(JSON.stringify({ message: message.toString() }), {
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
