import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

const OUT_DIR = "public/icons";

const icon = await readFile("assets/icon.svg", "utf8");
const maskable = await readFile("assets/icon-maskable.svg", "utf8");

await mkdir(OUT_DIR, { recursive: true });

async function render(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`${OUT_DIR}/${name}`);
}

await render(icon, 192, "icon-192.png");
await render(icon, 512, "icon-512.png");
await render(maskable, 192, "icon-maskable-192.png");
await render(maskable, 512, "icon-maskable-512.png");
await render(maskable, 180, "apple-touch-icon.png");
await render(maskable, 72, "badge-72.png");

console.log("icons generated in", OUT_DIR);
