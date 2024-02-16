"use client";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(event: FormEvent) {
    try {
      event.preventDefault();
      const response = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if(response.status >= 400 ){
        throw new Error('Login falhou!')
      }

      const data: {
        loginStatus: "Success" | "Failure";
      } = await response.json();

      if (data.loginStatus === "Failure") {
        setErrorMsg("Usuário/Senha inválidos");
        return;
      }

      router.push("/download");
    } catch (error) {
      setErrorMsg("Usuário/Senha inválidos");
    }
  }

  const DownloadIcon = ({ width = "48", height = "48" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width}
      height={height}
    >
      <g>
        <rect fill="none" height="24" width="24" />
      </g>
      <g>
        <path d="M5,20h14v-2H5V20z M19,9h-4V3H9v6H5l7,7L19,9z" />
      </g>
    </svg>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 pt-12">
      <form
        onSubmit={handleSubmit}
        className="w-[300px] flex flex-col items-center justify-start gap-4 bg-subtle border-default border-1 rounded-md p-4"
      >
        <div className="flex flex-col items-center fill-white text-white">
          <DownloadIcon />
          <span className="font-semibold text-lg">Entre no Downloader</span>
        </div>
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
          {errorMsg ? <span className="text-red-400 text-sm mt-2">{errorMsg}</span> : ""}
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
