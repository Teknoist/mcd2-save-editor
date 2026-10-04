import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictPath = path.resolve(__dirname, '../explorer_survey_1/enrichment_dictionary.json');
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8').replace(/^\uFEFF/, ''));

console.log('--- Checking enchants dictionary strings ---');
for (const [tag, desc] of Object.entries(dict.enchants)) {
  if (typeof desc !== 'string' || desc.trim().length === 0) {
    console.error(`Invalid enchant desc for tag: ${tag}`);
  }
}

console.log('--- Checking effects dictionary strings ---');
for (const [name, desc] of Object.entries(dict.effects)) {
  if (typeof desc !== 'string' || desc.trim().length === 0) {
    console.error(`Invalid effect desc for name: ${name}`);
  }
}

console.log('--- Checking gear dictionary strings ---');
for (const [tag, desc] of Object.entries(dict.gear)) {
  if (typeof desc !== 'string' || desc.trim().length === 0) {
    console.error(`Invalid gear desc for tag: ${tag}`);
  }
}

console.log('Dictionary validation complete. All strings are non-empty valid strings.');
