// Cinema (app de PC) — abre o site do Cinema numa janela própria.
// O site continua sendo o mesmo: atualizou o site, o app já está atualizado.
const { app, BrowserWindow, session, desktopCapturer, ipcMain, shell, Menu } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

// Testes: rodando do código-fonte (npm start), CINEMA_SITE=http://localhost:8765 abre o site local.
// O app empacotado (o que os amigos baixam) ignora isso e sempre abre o site oficial.
const SITE_TESTE = process.defaultApp && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(process.env.CINEMA_SITE || "") ? process.env.CINEMA_SITE : null;
const SITE = SITE_TESTE || "https://cinema-juntos.vercel.app";
const SITES_PERMITIDOS = ["cinema-juntos.vercel.app", "telao-two.vercel.app", ...(SITE_TESTE ? [new URL(SITE_TESTE).hostname] : [])]; // o antigo é a ponte de contas
const EH_WINDOWS = process.platform === "win32";
let janela = null;

// ===================== CONVITES: cinema://abrir?sala=...&exp=... =====================
// O site mostra "Abrir no app" pra quem abriu o convite no navegador: o link cinema:// cai aqui.
// No Windows "portátil" o app roda de uma pasta temporária, então registramos o .exe de verdade.
if (process.env.PORTABLE_EXECUTABLE_FILE) app.setAsDefaultProtocolClient("cinema", process.env.PORTABLE_EXECUTABLE_FILE, []);
else if (process.defaultApp) app.setAsDefaultProtocolClient("cinema", process.execPath, [path.resolve(process.argv[1] || ".")]);
else app.setAsDefaultProtocolClient("cinema");

// Transforma cinema://abrir?sala=X&exp=Y no endereço da sala (só aceita id e validade, nada mais)
function enderecoDoConvite(argv) {
  const link = (argv || []).find((a) => typeof a === "string" && a.startsWith("cinema://"));
  if (!link) return null;
  try {
    const q = new URL(link).searchParams;
    const sala = q.get("sala") || "", exp = q.get("exp") || "0";
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(sala) || !/^\d{0,15}$/.test(exp)) return null;
    return `${SITE}/sala?sala=${sala}${Number(exp) ? "&exp=" + exp : ""}`;
  } catch { return null; }
}

// Só um Cinema aberto por vez: abrir de novo traz a janela que já existe pra frente (e abre o convite, se veio um)
if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", (_e, argv) => {
  if (!janela) return;
  if (janela.isMinimized()) janela.restore();
  janela.focus();
  const convite = enderecoDoConvite(argv);
  if (convite) janela.loadURL(convite);
});
app.on("open-url", (e, url) => { e.preventDefault(); const c = enderecoDoConvite([url]); if (c && janela) janela.loadURL(c); }); // Mac

// ===================== HWID: o "RG" deste computador =====================
// Usado pra que cada código de acesso valha em no máximo 2 PCs. Pega o ID que o próprio sistema
// dá pra máquina (Windows: MachineGuid; Linux: machine-id; Mac: IOPlatformUUID) e embaralha com SHA-256,
// então o ID verdadeiro nunca sai do PC. Não muda ao reinstalar o Cinema.
function idDaMaquina() {
  try {
    if (process.platform === "win32") {
      const saida = execFileSync("reg", ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"], { encoding: "utf8", windowsHide: true, timeout: 5000 });
      const m = saida.match(/MachineGuid\s+REG_SZ\s+([\w-]+)/i);
      if (m) return m[1];
    } else if (process.platform === "linux") {
      for (const f of ["/etc/machine-id", "/var/lib/dbus/machine-id"]) {
        try { const t = fs.readFileSync(f, "utf8").trim(); if (t) return t; } catch {}
      }
    } else if (process.platform === "darwin") {
      const m = execFileSync("ioreg", ["-rd1", "-c", "IOPlatformExpertDevice"], { encoding: "utf8", timeout: 5000 }).match(/"IOPlatformUUID" = "([^"]+)"/);
      if (m) return m[1];
    }
  } catch (e) { console.warn("hwid", e.message); }
  // Reserva (quase nunca usada): um ID aleatório guardado na pasta do app
  const arq = path.join(app.getPath("userData"), "aparelho-id");
  try { return fs.readFileSync(arq, "utf8").trim(); } catch {}
  const novo = crypto.randomUUID();
  try { fs.mkdirSync(path.dirname(arq), { recursive: true }); fs.writeFileSync(arq, novo); } catch {}
  return novo;
}
let hwid = null;
const aparelho = () => ({
  hwid: (hwid ||= crypto.createHash("sha256").update("cinema-hwid-v1:" + idDaMaquina()).digest("hex")),
  nome: os.hostname().slice(0, 40),
  sistema: process.platform,
});

const ehDoCinema = (url) => { try { return SITES_PERMITIDOS.includes(new URL(url).hostname); } catch { return false; } };

function criarJanela() {
  janela = new BrowserWindow({
    width: 1280, height: 800, minWidth: 420, minHeight: 500,
    backgroundColor: "#0e0d0c", // vinho escuro do Cinema (sem piscar branco ao abrir)
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
  janela.loadURL(enderecoDoConvite(process.argv) || SITE);

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
      backgroundColor: "#0e0d0c", title: "Escolha o que compartilhar", autoHideMenuBar: true, show: false,
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
  // O site pede o HWID pra ativar o código de acesso (só o site do Cinema recebe)
  ipcMain.handle("cinema:aparelho", (e) => (ehDoCinema(e.senderFrame?.url || "") ? aparelho() : null));
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
