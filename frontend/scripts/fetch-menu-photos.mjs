import { access, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(scriptDirectory, '..');
const cataloguePath = path.resolve(frontendDirectory, '..', 'backend', 'prisma', 'catalogue-source.md');
const menuDirectory = path.join(frontendDirectory, 'public', 'menu');
const generatedPath = path.join(frontendDirectory, 'src', 'data', 'menuPhotos.generated.json');
const rejectsPath = path.join(scriptDirectory, 'menu-photo-rejects.json');
const creditsDataPath = path.join(scriptDirectory, 'menu-photo-credits.json');
const creditsPath = path.join(menuDirectory, 'CREDITS.md');
const reviewPath = path.join(scriptDirectory, 'menu-photos-review.html');
const expectedDishCount = 140;
const userAgent = 'SmartCanteenCollegeProject/1.0 (https://github.com/nethrasivakumar167-dev/smart-canteen)';
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const excludedTitleWords = new Set([
  'map', 'logo', 'flag', 'menu', 'restaurant', 'shop', 'stall', 'vendor',
  'market', 'people', 'man', 'woman', 'child', 'diagram', 'recipe',
]);
const insignificantWords = new Set(['a', 'an', 'and', 'for', 'in', 'of', 'the', 'to', 'with']);

const DISH_ALIASES = {
  'Café Latte': ['Cafe Latte'],
  'Idli with Sambar': ['Idli Sambar'],
  'Mac and Cheese': ['Macaroni and Cheese'],
  'Masala Tea': ['Masala Chai'],
  'Medu Vada': ['Medhu Vadai', 'Ulundu Vadai'],
  'Pani Puri': ['Golgappa', 'Puchka'],
  'South Indian Filter Coffee': ['Filter Coffee', 'Madras Filter Coffee'],
};

let lastRequestStartedAt = 0;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const normalizedWords = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .match(/[a-z0-9]+/g) ?? [];

const significantWords = (value) => normalizedWords(value)
  .filter((word) => !insignificantWords.has(word));

const isTitleMatch = (title, dish, aliases) => {
  const titleWords = normalizedWords(title.replace(/[_-]+/g, ' '));
  if (titleWords.some((word) => excludedTitleWords.has(word))) return false;
  const titleWordSet = new Set(titleWords);
  const containsEverySignificantWord = (phrase) => {
    const words = significantWords(phrase);
    return words.length > 0 && words.every((word) => titleWordSet.has(word));
  };
  return containsEverySignificantWord(dish) || aliases.some(containsEverySignificantWord);
};

const sectionHeadings = [
  'south indian and breakfast items',
  'vegetarian indian meals',
  'non-vegetarian meals',
  'chinese and indo-chinese',
  'western and fast food',
  'snacks, chaats and street food',
  'desserts and bakery',
  'hot beverages',
  'cold beverages',
  'how to organise this in your smart canteen website',
];

function parseDishes(source) {
  const candidates = [...source.matchAll(/(?<!\d)(\d{1,3})\.\s*/gu)]
    .filter((match) => Number(match[1]) <= expectedDishCount)
    .map((match) => ({
      number: Number(match[1]),
      start: match.index,
      end: match.index + match[0].length,
    }));

  for (let number = 1; number <= expectedDishCount; number += 1) {
    const priceSuffix = new RegExp(
      `(\\d{1,3})[\\u2013-](\\d{2,3})${number}\\.\\s*`,
      'gu',
    );
    for (const match of source.matchAll(priceSuffix)) {
      if (Number(match[2]) > 500) continue;
      candidates.push({
        number,
        start: match.index + match[0].length - String(number).length - 1,
        end: match.index + match[0].length,
      });
    }
  }

  candidates.sort((left, right) => left.start - right.start || left.end - right.end);
  const isSectionHeading = (candidate) => {
    const followingText = source.slice(candidate.end).trimStart().toLowerCase();
    return sectionHeadings.some((heading) => followingText.startsWith(heading));
  };

  const dishes = [];
  let cursor = 0;
  for (let number = 1; number <= expectedDishCount; number += 1) {
    const candidate = candidates.find((entry) => (
      entry.start >= cursor
      && entry.number === number
      && !isSectionHeading(entry)
    ));
    if (!candidate) {
      throw new Error(`Could not locate catalogue item ${number}; refusing to guess dish names.`);
    }

    const nextCandidate = candidates.find((entry) => (
      entry.start >= candidate.end && entry.start > candidate.start
    ));
    const itemText = source.slice(candidate.end, nextCandidate?.start ?? source.length).trim();
    const dashSeparator = /\s+[\u2013\u2014]\s+/u.exec(itemText);
    const compactCellSeparator = /(?<=[A-Za-z0-9])(?=[A-Z])/u.exec(itemText);
    const separator = dashSeparator?.index ?? compactCellSeparator?.index;
    const name = separator === undefined ? '' : itemText.slice(0, separator).trim();
    if (!name) {
      throw new Error(`Could not parse catalogue item ${number}; refusing to guess its name.`);
    }
    dishes.push({ name, slug: slugify(name) });
    cursor = candidate.end;
  }

  if (dishes.length !== expectedDishCount) {
    throw new Error(`Expected ${expectedDishCount} catalogue items, parsed ${dishes.length}.`);
  }
  return dishes;
}

async function readJson(filePath, defaultValue) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return defaultValue;
    throw new Error(`Could not read ${path.relative(frontendDirectory, filePath)}: ${error.message}`);
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function persistState(generated, credits) {
  await writeJson(creditsDataPath, credits);
  await writeJson(generatedPath, generated);
}

async function request(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const waitTime = Math.max(0, 1000 - (Date.now() - lastRequestStartedAt));
    if (waitTime > 0) await sleep(waitTime);
    lastRequestStartedAt = Date.now();

    const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
    if ((response.status === 429 || response.status >= 500) && attempt === 0) {
      await sleep(1500);
      continue;
    }
    if (!response.ok) {
      throw new Error(`Wikimedia Commons request failed with HTTP ${response.status}: ${url}`);
    }
    return response;
  }
  throw new Error(`Wikimedia Commons request failed after retry: ${url}`);
}

async function searchCommons(term) {
  const parameters = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '8',
    gsrsearch: `"${term}"`,
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '960',
    format: 'json',
  });
  const response = await request(`https://commons.wikimedia.org/w/api.php?${parameters}`);
  const result = await response.json();
  if (result.error) {
    throw new Error(`Wikimedia Commons API error: ${result.error.info || result.error.code}`);
  }
  return Object.values(result.query?.pages ?? {}).sort((left, right) => (
    (left.index ?? 0) - (right.index ?? 0)
  ));
}

function plainText(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hexadecimal) => String.fromCodePoint(parseInt(hexadecimal, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

const licenseIsAllowed = (license) => (
  /^(?:CC0(?:\s+1\.0)?|Public domain|CC BY(?:-SA)?(?:\s+\d+(?:\.\d+)*)?)$/i.test(license)
);

function acceptedCandidate(page, dish, aliases) {
  const image = page.imageinfo?.[0];
  const metadata = image?.extmetadata ?? {};
  const license = plainText(metadata.LicenseShortName?.value);
  if (!image || !['image/jpeg', 'image/png'].includes(image.mime)) return null;
  if (image.width < 960 || image.height < 600) return null;
  if (!licenseIsAllowed(license)) return null;
  if (!isTitleMatch(page.title, dish.name, aliases)) return null;
  if (!image.thumburl) return null;

  return {
    image,
    license,
    author: plainText(metadata.Artist?.value) || plainText(metadata.Credit?.value) || 'Author not specified',
    pageUrl: image.descriptionurl
      || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
  };
}

async function findCandidate(dish) {
  const aliases = DISH_ALIASES[dish.name] ?? [];
  for (const query of [dish.name, ...aliases]) {
    const pages = await searchCommons(query);
    for (const page of pages) {
      const match = acceptedCandidate(page, dish, aliases);
      if (match) return match;
    }
  }
  return null;
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const source = await readFile(cataloguePath, 'utf8');
const dishes = parseDishes(source);
const rejects = await readJson(rejectsPath, []);
if (!Array.isArray(rejects) || rejects.some((slug) => typeof slug !== 'string')) {
  throw new Error(`${path.relative(frontendDirectory, rejectsPath)} must contain an array of slugs.`);
}
const rejectedSlugs = new Set(rejects);
const generatedData = await readJson(generatedPath, {});
const creditsData = await readJson(creditsDataPath, {});
if (!generatedData || typeof generatedData !== 'object' || Array.isArray(generatedData)) {
  throw new Error(`${path.relative(frontendDirectory, generatedPath)} must contain an object.`);
}
if (!creditsData || typeof creditsData !== 'object' || Array.isArray(creditsData)) {
  throw new Error(`${path.relative(frontendDirectory, creditsDataPath)} must contain an object.`);
}

await mkdir(menuDirectory, { recursive: true });
const generated = { ...generatedData };
const credits = { ...creditsData };

for (const slug of rejectedSlugs) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Reject list contains an invalid slug: ${slug}`);
  }
  for (const directory of [
    menuDirectory,
    path.join(frontendDirectory, 'public', 'images', 'menu'),
  ]) {
    const files = await readdir(directory, { withFileTypes: true }).catch((error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    for (const file of files) {
      if (file.isFile() && path.parse(file.name).name === slug) {
        await unlink(path.join(directory, file.name));
      }
    }
  }
  delete generated[slug];
  delete credits[slug];
}
await persistState(generated, credits);

const legacyFiles = new Set(
  (await readdir(path.join(frontendDirectory, 'public', 'images', 'menu')).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  }))
    .filter((filename) => supportedExtensions.has(path.extname(filename).toLowerCase())),
);

for (const dish of dishes) {
  if (rejectedSlugs.has(dish.slug)) continue;
  const filePath = path.join(menuDirectory, `${dish.slug}.jpg`);
  const savedPhoto = generated[dish.slug];
  if (await pathExists(filePath)) {
    if (savedPhoto?.file !== `/menu/${dish.slug}.jpg` || !credits[dish.slug]) {
      throw new Error(`Existing photo ${dish.slug}.jpg has no saved Commons attribution data.`);
    }
    continue;
  }
  if (savedPhoto) {
    delete generated[dish.slug];
    delete credits[dish.slug];
  }
  if ([...legacyFiles].some((filename) => path.parse(filename).name === dish.slug)) continue;

  const candidate = await findCandidate(dish);
  if (!candidate) continue;

  const response = await request(candidate.image.thumburl);
  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));
  generated[dish.slug] = { file: `/menu/${dish.slug}.jpg`, alt: dish.name };
  credits[dish.slug] = {
    dish: dish.name,
    file: `/menu/${dish.slug}.jpg`,
    author: candidate.author,
    license: candidate.license,
    pageUrl: candidate.pageUrl,
  };
  await persistState(generated, credits);
}

const matched = [];
const unmatched = [];
for (const dish of dishes) {
  if (rejectedSlugs.has(dish.slug)) {
    unmatched.push(dish.name);
    continue;
  }
  if (generated[dish.slug] || [...legacyFiles].some((filename) => path.parse(filename).name === dish.slug)) {
    matched.push(dish);
  } else {
    unmatched.push(dish.name);
  }
}

const creditLines = Object.values(credits)
  .filter((credit) => generated[slugify(credit.dish)]?.file === credit.file)
  .sort((left, right) => left.dish.localeCompare(right.dish))
  .map((credit) => `- ${credit.dish} | ${credit.file} | ${credit.author} | ${credit.license} | ${credit.pageUrl}`);
await writeFile(creditsPath, `# Wikimedia Commons photo credits\n\n${creditLines.join('\n')}${creditLines.length ? '\n' : ''}`, 'utf8');

const reviewRows = matched.map((dish) => {
  const imagePath = generated[dish.slug]?.file
    ?? `/images/menu/${[...legacyFiles].find((filename) => path.parse(filename).name === dish.slug)}`;
  return `<figure><img src="${escapeHtml(imagePath)}" alt="${escapeHtml(dish.name)}" width="960" height="640" loading="lazy" decoding="async"><figcaption>${escapeHtml(dish.name)}</figcaption></figure>`;
});
const reviewHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Smart Canteen menu photo review</title>
  <style>
    body{font:16px system-ui,sans-serif;margin:24px;color:#17233b}
    main{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
    figure{margin:0;border:1px solid #ddd;border-radius:10px;overflow:hidden}
    img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover}
    figcaption{padding:10px;font-weight:600}
  </style>
</head>
<body><h1>Menu photo review (${matched.length} photos)</h1><main>${reviewRows.join('\n')}</main></body>
</html>
`;
await writeFile(reviewPath, reviewHtml, 'utf8');
await writeJson(generatedPath, Object.fromEntries(
  Object.entries(generated).filter(([slug]) => !rejectedSlugs.has(slug)),
));

console.log(`matched ${matched.length}, unmatched ${unmatched.length}`);
console.log(`Unmatched dishes: ${unmatched.length ? unmatched.join(', ') : '(none)'}`);
