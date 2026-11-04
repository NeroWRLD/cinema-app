// Gera build/icon.png (512) e build/icon.ico (16..256) a partir da logo do Cinema
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { readFileSync, writeFileSync } from "node:fs";
const svg = readFileSync("build/logo.svg");
await sharp(svg, { density: 600 }).resize(512, 512).png().toFile("build/icon.png");
const tamanhos = [16, 24, 32, 48, 64, 128, 256];
const pngs = await Promise.all(tamanhos.map((t) => sharp(svg, { density: 600 }).resize(t, t).png().toBuffer()));
writeFileSync("build/icon.ico", await pngToIco(pngs));
console.log("ícones prontos");
