const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("seletor", {
  dados: () => ipcRenderer.invoke("seletor:dados"),
  escolher: (id, som) => ipcRenderer.send("seletor:escolha", { id, som }),
});
