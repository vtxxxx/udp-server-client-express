"use client"
import { type FormEvent, useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const data = { username, password };
    console.log(data)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <form
        onSubmit={handleSubmit}
        className="w-[300px] flex flex-col items-center justify-start gap-4 bg-subtle border-default border-1 rounded-md p-4"
      >
        <div className="flex flex-col w-full">
          <label htmlFor="usernameInput" className="text-sm mb-2 w-full">
            Username
          </label>
          <input
            onInput={(e) => setUsername(e.currentTarget.value)}
            id="usernameInput"
            type="text"
            className="w-full shadow-input align-middle border-solid border border-default bg-default rounded-md px-3 py-1 text-sm h-8 text-white outline-none  focus-within:border-blue-500 "
          />
        </div>
        <div className="flex flex-col w-full">
          <label htmlFor="passwordInput" className="text-sm mb-2 w-full">
            Senha
          </label>
          <input
            onInput={(e) => setPassword(e.currentTarget.value)}
            id="passwordInput"
            type="password"
            className="w-full shadow-input align-middle border-solid border border-default bg-default rounded-md px-3 py-1 text-sm h-8 text-white outline-none  focus-within:border-blue-500 "
          />
        </div>
        <button
          type="submit"
          className="w-full h-8 bg-green-600 border border-transparent outline-none text-sm font-medium rounded-md px-3 py-1 flex items-center justify-center hover:bg-green-500 focus-within:border-blue-500"
        >
          Login
        </button>
      </form>
    </main>
  );
}
