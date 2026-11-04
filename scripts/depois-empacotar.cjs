// Depois de empacotar pro Windows: coloca o ícone e o nome "Cinema" dentro do Cinema.exe.
// (O electron-builder faria isso com o Wine; aqui fazemos em JavaScript puro, sem Wine.)
const fs = require("node:fs");
const path = require("node:path");

exports.default = async function (ctx) {
  if (ctx.electronPlatformName !== "win32") return;
  const ResEdit = await import("resedit").then((m) => m.default || m);
  const exe = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.exe`);
  const versao = ctx.packager.appInfo.version;

  const programa = ResEdit.NtExecutable.from(fs.readFileSync(exe), { ignoreCert: true });
  const recursos = ResEdit.NtExecutableResource.from(programa);

  // Ícone: troca todos os grupos de ícone do Electron pelo do Cinema
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, "..", "build", "icon.ico")));
  const grupos = ResEdit.Resource.IconGroupEntry.fromEntries(recursos.entries);
  const alvos = grupos.length ? grupos : [{ id: 1, lang: 1033 }];
  for (const g of alvos) {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(recursos.entries, g.id, g.lang, ico.icons.map((i) => i.data));
  }

  // Nome e versão (aparecem nas Propriedades do arquivo e no Gerenciador de Tarefas)
  const [info] = ResEdit.Resource.VersionInfo.fromEntries(recursos.entries);
  const [a, b, c] = versao.split(".").map(Number);
  info.setFileVersion(a, b, c, 0);
  info.setProductVersion(a, b, c, 0);
  const lang = info.getAllLanguagesForStringValues()[0] || { lang: 1033, codepage: 1200 };
  info.setStringValues(lang, {
    ProductName: "Cinema", FileDescription: "Cinema", CompanyName: "José Guilherme Peron",
    InternalName: "Cinema", OriginalFilename: "Cinema.exe", LegalCopyright: "© 2026 José Guilherme Peron",
    FileVersion: versao, ProductVersion: versao,
  });
  info.outputToResourceEntries(recursos.entries);

  recursos.outputResource(programa);
  fs.writeFileSync(exe, Buffer.from(programa.generate()));
  console.log("  • ícone e nome do Cinema colocados no", path.basename(exe));
};
