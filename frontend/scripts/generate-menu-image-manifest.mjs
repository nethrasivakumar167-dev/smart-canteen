import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(scriptDirectory, '..');
const imageDirectory = path.join(frontendDirectory, 'public', 'images', 'menu');
const outputFile = path.join(frontendDirectory, 'src', 'data', 'menuImageManifest.ts');
const supportedExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);

const files = await readdir(imageDirectory, { withFileTypes: true });
const imagePaths = files
  .filter((file) => file.isFile() && supportedExtensions.has(path.extname(file.name).toLowerCase()))
  .map((file) => `/images/menu/${file.name}`)
  .sort();

const output = `export const menuImageManifest = new Set<string>(\n  ${JSON.stringify(imagePaths, null, 2).replace(/\n/g, '\n  ')}\n);\n`;
await writeFile(outputFile, output, 'utf8');
console.log(`Generated menu image manifest with ${imagePaths.length} image(s).`);
