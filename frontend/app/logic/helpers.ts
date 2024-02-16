export function specifyCommand(command: string) {
  const buffer = Buffer.alloc(command.length + 6); // +6 to account for the message type and any preceding data
  buffer.writeUInt8(1, 5); // Set message type to 1 (Command) at position 5
  buffer.write(command, 6);

  return buffer;
}
