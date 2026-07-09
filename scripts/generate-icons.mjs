import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public/icons/icon.svg");
const outDir = path.join(root, "public/icons");

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const svg = await sharp(svgPath);

  for (const { name, size, maskable } of sizes) {
    let pipeline = svg.clone().resize(size, size, {
      fit: "contain",
      background: maskable ? "#0b1220" : { r: 0, g: 0, b: 0, alpha: 0 },
    });

    if (maskable) {
      const inset = Math.round(size * 0.12);
      pipeline = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: "#0b1220",
        },
      }).composite([
        {
          input: await svg
            .clone()
            .resize(size - inset * 2, size - inset * 2, {
              fit: "contain",
              background: "#0b1220",
            })
            .png()
            .toBuffer(),
          top: inset,
          left: inset,
        },
      ]);
    }

    await pipeline.png().toFile(path.join(outDir, name));
    console.log(`Wrote ${name}`);
  }

  await sharp(svgPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(outDir, "favicon.png"));

  console.log("Wrote favicon.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
