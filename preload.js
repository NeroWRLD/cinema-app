// Avisa o site que ele está rodando dentro do app de PC.
// No Windows o app já manda o som do PC inteiro, então o "+ Áudio" (somar som de outra aba) não faz sentido:
// somaria o mesmo som duas vezes (eco). Escondemos ele só dentro do app, sem mexer no site.
// aparelho(): devolve { hwid, nome, sistema } pro site ativar o código de acesso (1 código = até 2 PCs)
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("cinemaApp", {
  versao: "1.2.0",
  sistema: process.platform,
  aparelho: () => ipcRenderer.invoke("cinema:aparelho"),
});

window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("app-pc");
  if (process.platform === "win32") {
    const estilo = document.createElement("style");
    estilo.textContent = "#btn-audio-extra{display:none!important}";
    document.head.appendChild(estilo);
  }
});
