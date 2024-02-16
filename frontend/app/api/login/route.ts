// pages/api/download.js
import { specifyCommand } from "@/app/logic/helpers";
import dgram from "dgram";
import { NextRequest, NextResponse } from "next/server";

const client = dgram.createSocket("udp4");
const SERVER_PORT = Number(process.env.SERVER_PORT ?? 1999);
const SERVER_ADDRESS = process.env.SERVER_ADDRESS;

function loginUser(username: string, password: string) {
  return new Promise<Buffer>((resolve, reject) => {
    const command = specifyCommand(`LOGIN|${username}:${password}`);

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

export async function POST(req: NextRequest, res: NextResponse) {
  // Extract login data from request body
  const {
    username,
    password,
  }: {
    username: string;
    password: string;
  } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Dados não fornecidos" },
      {
        status: 400,
      }
    );
  }

  try {
    // Placeholder for the downloaded data
    const loginStatus = await loginUser(username, password);
    // Send the login status as a response
    return NextResponse.json(
      { loginStatus: loginStatus.toString() },
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
