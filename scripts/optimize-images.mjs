import sharp from "sharp";
import { readdir, unlink } from "fs/promises";
import { join, parse } from "path";

const IMAGES_DIR = join(process.cwd(), "public", "images");
const QUALITY = 82;

const files = (await readdir(IMAGES_DIR)).filter((f) =>
  /\.(jpe?g|png)$/i.test(f),
);

for (const file of files) {
  const input = join(IMAGES_DIR, file);
  const { name } = parse(file);
  const output = join(IMAGES_DIR, `${name}.webp`);

  await sharp(input)
    .rotate()
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(output);

  const { size: inSize } = await import("fs/promises").then((fs) =>
    fs.stat(input),
  );
  const { size: outSize } = await import("fs/promises").then((fs) =>
    fs.stat(output),
  );

  console.log(
    `${file} → ${name}.webp (${(inSize / 1024 / 1024).toFixed(2)}MB → ${(outSize / 1024 / 1024).toFixed(2)}MB)`,
  );

  if (!/noise/i.test(file)) {
    await unlink(input);
  }
}

console.log("Done.");
