import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(scriptDirectory, '..');
const publicDirectory = path.join(frontendDirectory, 'public');
const imageDirectories = [
  { directory: path.join(publicDirectory, 'images', 'menu'), prefix: '/images/menu/' },
  { directory: path.join(publicDirectory, 'menu'), prefix: '/menu/' },
];
const generatedPhotosPath = path.join(frontendDirectory, 'src', 'data', 'menuPhotos.generated.json');
const outputFile = path.join(frontendDirectory, 'src', 'data', 'menuImageManifest.ts');
const supportedExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);

const pathsByDirectory = await Promise.all(imageDirectories.map(async ({ directory, prefix }) => {
  const files = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return files
    .filter((file) => file.isFile() && supportedExtensions.has(path.extname(file.name).toLowerCase()))
    .map((file) => `${prefix}${file.name}`);
}));
const generatedPhotos = JSON.parse(await readFile(generatedPhotosPath, 'utf8'));
const availablePaths = new Set(pathsByDirectory.flat());
const generatedPaths = Object.values(generatedPhotos)
  .map((photo) => photo.file)
  .filter((file) => availablePaths.has(file));
const imagePaths = [...new Set([...pathsByDirectory.flat(), ...generatedPaths])].sort();

const output = `export const menuImageManifest = new Set<string>(\n  ${JSON.stringify(imagePaths, null, 2).replace(/\n/g, '\n  ')}\n);\n`;
await writeFile(outputFile, output, 'utf8');
console.log(`Generated menu image manifest with ${imagePaths.length} image(s).`);
