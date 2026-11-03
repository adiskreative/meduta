import { mkdirSync, copyFileSync } from "fs";
import sharp from "sharp";

const SRC = "C:/Users/Aileen N.L/Downloads/landingPAGEdesign/new asset";
const ROOT = "F:/development/meduta/";
const outDir = ROOT + "designer/roman-new/sheets";
mkdirSync(outDir, { recursive: true });

async function main(args) {
  if (args.length < 2) {
    console.error("usage: node sheets.mjs <namesCSV> <sheetSuffix>");
    process.exit(1);
  }
  const label = args[0];
  const suffix = args[1];
  const CELL = 300;
  const COLS = 6;
  const items = label
    .split(",")
    .filter(Boolean)
    .map((n) => ({ name: n, path: suffix.startsWith("-allw") ? ROOT + "public/design/roman/" + n + ".webp" : SRC + "/" + n + ".png" }));
  const ROWS = Math.ceil(items.length / COLS);
  const comps = [];
  for (let i = 0; i < items.length; i++) {
    const thumb = await sharp(items[i].path)
      .resize(CELL - 24, CELL - 24, { fit: "inside", background: { r: 230, g: 30, b: 200, alpha: 1 } })
      .png({ palette: false })
      .toBuffer();
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    comps.push({ input: thumb, left: c * CELL + 12, top: r * CELL + 12 });
    comps.push({
      input: Buffer.from(
        `<svg width="${CELL}" height="34"><text x="8" y="26" font-size="24" font-family="sans-serif" font-weight="bold" fill="black" stroke="white" stroke-width="0.5">${items[i].name}</text></svg>`,
      ),
      left: c * CELL + 12,
      top: r * CELL + CELL - 38,
    });
  }
  const canvas = sharp({
    create: { width: COLS * CELL, height: ROWS * CELL, channels: 3, background: { r: 244, g: 244, b: 244 } },
  });
  await canvas
    .composite(comps)
    .png({ lossless: true })
    .toFile(`${outDir}/sheet-${suffix}.png`);
  console.log("sheet", suffix, items.length);
}

main(process.argv.slice(2));
