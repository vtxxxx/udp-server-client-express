/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect } from "react";

export default function Download() {
  type LoadingFilenamesMap = {
    [key: string]: boolean;
  };

  const [filenames, setFilenames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<LoadingFilenamesMap>({});
  const [errorMsg, setErrorMsg] = useState("");

  async function listFilenames() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/list", {
        method: "GET",
      });

      const { data }: { data: string } = await response.json();
      const filenamesList = data.split(",");
      const loadingFilenames: LoadingFilenamesMap = {};

      filenamesList.forEach((filename) => {
        loadingFilenames[filename] = false;
      });

      setFilenames(filenamesList);
      setIsDownloading(loadingFilenames);
    } catch (error) {
      setFilenames([]);
      setIsDownloading({});
    } finally {
      setIsLoading(false);
    }
  }

  function createBlobFile(filename: string, content: string) {
    // Supondo que "content" é a concatenação dos buffers recebidos
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Criar um elemento de link temporário para iniciar o download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // Nome do arquivo para download
    document.body.appendChild(a); // Adicionar o link ao documento
    a.click(); // Simular um clique no link para iniciar o download

    // Limpeza: remover o link e liberar o objeto URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function downloadFile(filename: string) {
    try {
      const isDownloadingCopy = { ...isDownloading };
      isDownloadingCopy[filename] = true;
      setIsDownloading(isDownloadingCopy);

      const response = await fetch("/api/download", {
        method: "POST",
        body: JSON.stringify({ filename }),
      });

      const {
        data,
      }: {
        data: string;
      } = await response.json();

      createBlobFile(filename, data);
    } catch (error) {
      setErrorMsg(`Error ao fazer o download do arquivo ${filename}`);
    } finally {
      const isDownloadingCopy = { ...isDownloading };
      isDownloadingCopy[filename] = false;
      setIsDownloading(isDownloadingCopy);
    }
  }

  useEffect(() => {
    listFilenames();
  }, []);

  const DownloadIconButton = ({
    width = "24px",
    height = "24px",
    filename,
    action,
  }: {
    width?: string;
    height?: string;
    filename: string;
    action: () => void;
  }) => (
    <button
      type="button"
      disabled={isDownloading[filename]}
      onClick={action}
      className="w-[150px] h-10 text-sm bg-blue-500 hover:bg-blue-400 outline-none flex items-center justify-between px-3 py-1 border-blue-800 fill-white rounded-md"
    >
      {isDownloading[filename] ? "Downloading..." : "Download"}
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
    </button>
  );

  return (
    <main className="bg-default min-h-screen flex flex-col items-center p-4 pt-10">
      <div className="flex flex-col max-w-[800px] w-full gap-8">
        <h3 className="text-white text-2xl">Download Files</h3>
        <div className="flex flex-col gap-2 w-full">
          {isLoading ? (
            <span className="text-white text-sm">Carregando...</span>
          ) : (
            filenames.map((filename, index) => (
              <div
                key={`file-${index + 1}`}
                className="w-full flex items-center gap-4 justify-between bg-subtle border-default border-1 rounded-md p-4"
              >
                <span className="text-white">{filename}</span>
                <DownloadIconButton
                  filename={filename}
                  action={() => downloadFile(filename)}
                />
              </div>
            ))
          )}
        </div>
        {errorMsg ? <div className="text-red-500 text-sm">{errorMsg}</div> : ""}
      </div>
    </main>
  );
}
