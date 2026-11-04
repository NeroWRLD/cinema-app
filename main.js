// Cinema (app de PC) — abre o site do Cinema numa janela própria.
// O site continua sendo o mesmo: atualizou o site, o app já está atualizado.
const { app, BrowserWindow, session, desktopCapturer, ipcMain, shell, Menu } = require("electron");
const path = require("node:path");

const SITE = "https://cinema-juntos.vercel.app";
const SITES_PERMITIDOS = ["cinema-juntos.vercel.app", "telao-two.vercel.app"]; // o antigo é a ponte de contas
const EH_WINDOWS = process.platform === "win32";
let janela = null;

// Só um Cinema aberto por vez: abrir de novo traz a janela que já existe pra frente
if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => { if (janela) { if (janela.isMinimized()) janela.restore(); janela.focus(); } });

const ehDoCinema = (url) => { try { return SITES_PERMITIDOS.includes(new URL(url).hostname); } catch { return false; } };

function criarJanela() {
  janela = new BrowserWindow({
    width: 1280, height: 800, minWidth: 420, minHeight: 500,
    backgroundColor: "#160a0c", // vinho escuro do Cinema (sem piscar branco ao abrir)
    title: "Cinema",
    icon: path.join(__dirname, "build", "icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, sandbox: true, nodeIntegration: false,
      backgroundThrottling: false, // não engasga a tela enviada quando o Cinema fica atrás de outra janela
    },
  });
  janela.once("ready-to-show", () => janela.show());
  janela.loadURL(SITE);

  // Links de fora (YouTube, etc.) abrem no navegador normal da pessoa
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (!ehDoCinema(url) && /^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  janela.webContents.on("will-navigate", (e, url) => {
    if (!ehDoCinema(url)) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); }
  });

  // Sem internet: mostra um aviso com botão de tentar de novo
  janela.webContents.on("did-fail-load", (_e, codigo, _desc, url, principal) => {
    if (!principal || codigo === -3) return; // -3 = carregamento cancelado (normal)
    janela.loadFile(path.join(__dirname, "offline.html"), { query: { volta: ehDoCinema(url) ? url : SITE } });
  });

  // F11 = tela cheia, F5 = recarregar, Ctrl+Shift+I = ferramentas (pra investigar problema)
  janela.webContents.on("before-input-event", (_e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") janela.setFullScreen(!janela.isFullScreen());
    if (input.key === "F5") janela.webContents.reload();
    if (input.control && input.shift && input.key.toLowerCase() === "i") janela.webContents.toggleDevTools();
  });
  janela.on("closed", () => { janela = null; });
}

// ===================== SELETOR DE TELA =====================
// No Electron o getDisplayMedia não tem janelinha própria: a gente mostra a nossa.
function abrirSeletor(pedeSom) {
  return new Promise(async (resolver) => {
    const minhas = BrowserWindow.getAllWindows().map((w) => w.getMediaSourceId());
    const fontes = (await desktopCapturer.getSources({ types: ["screen", "window"], thumbnailSize: { width: 400, height: 225 }, fetchWindowIcons: true }))
      .filter((f) => !minhas.includes(f.id)) // não mostra o próprio Cinema
      .map((f) => ({ id: f.id, nome: f.name.replace(/^Entire screen$/i, "Tela inteira").replace(/^Screen (\d+)$/i, "Tela $1"), tipo: f.id.startsWith("screen") ? "tela" : "janela", miniatura: f.thumbnail.toDataURL(), icone: f.appIcon?.toDataURL() || null }));

    const seletor = new BrowserWindow({
      parent: janela, modal: true, width: 900, height: 640, minWidth: 600, minHeight: 420,
      backgroundColor: "#160a0c", title: "Escolha o que compartilhar", autoHideMenuBar: true, show: false,
      icon: path.join(__dirname, "build", "icon.png"),
      webPreferences: { preload: path.join(__dirname, "seletor-preload.js"), contextIsolation: true, sandbox: true },
    });
    let respondeu = false;
    const responder = (r) => { if (respondeu) return; respondeu = true; resolver(r); if (!seletor.isDestroyed()) seletor.close(); };
    const escolheu = (_e, r) => responder(r);
    ipcMain.once("seletor:escolha", escolheu);
    ipcMain.handleOnce("seletor:dados", () => ({ fontes, pedeSom, somDoPC: EH_WINDOWS }));
    seletor.on("closed", () => { ipcMain.removeListener("seletor:escolha", escolheu); ipcMain.removeHandler("seletor:dados"); responder(null); });
    seletor.once("ready-to-show", () => seletor.show());
    seletor.loadFile(path.join(__dirname, "seletor.html"));
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const ses = session.defaultSession;

  // Permissões (tela, microfone, notificações, tela cheia) só pro site do Cinema
  ses.setPermissionRequestHandler((wc, _perm, ok) => ok(ehDoCinema(wc.getURL())));
  ses.setPermissionCheckHandler((wc) => !wc || ehDoCinema(wc.getURL()));

  ses.setDisplayMediaRequestHandler(async (pedido, callback) => {
    if (!ehDoCinema(pedido.frame?.url || pedido.securityOrigin)) return callback({});
    const escolha = await abrirSeletor(pedido.audioRequested);
    if (!escolha) return callback({}); // cancelou
    const fonte = (await desktopCapturer.getSources({ types: ["screen", "window"] })).find((f) => f.id === escolha.id);
    if (!fonte) return callback({});
    const resposta = { video: fonte };
    // No Windows dá pra mandar o som do PC inteiro ("loopback"). Linux/Mac não deixam.
    if (pedido.audioRequested && escolha.som && EH_WINDOWS) resposta.audio = "loopback";
    callback(resposta);
  });

  criarJanela();
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) criarJanela(); });
});

app.on("window-all-closed", () => app.quit());
