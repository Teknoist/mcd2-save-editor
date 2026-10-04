import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const enchantsPath = path.join(repoRoot, 'src/data/enchants.json');
const effectsPath = path.join(repoRoot, 'src/data/effects.json');
const gearPath = path.join(repoRoot, 'src/data/gear.json');
const dictPath = path.resolve(__dirname, '../explorer_survey_1/enrichment_dictionary.json');

const enchants = JSON.parse(fs.readFileSync(enchantsPath, 'utf8').replace(/^\uFEFF/, ''));
const effects = JSON.parse(fs.readFileSync(effectsPath, 'utf8').replace(/^\uFEFF/, ''));
const gear = JSON.parse(fs.readFileSync(gearPath, 'utf8').replace(/^\uFEFF/, ''));
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8').replace(/^\uFEFF/, ''));

// Test Enchants matching
let enchantsMatched = 0;
for (const e of enchants) {
  if (dict.enchants[e.Tag]) {
    enchantsMatched++;
  }
}

// Test Effects matching
let effectsMatchedByName = 0;
for (const eff of effects) {
  if (dict.effects[eff.Name]) {
    effectsMatchedByName++;
  }
}

// Test Gear matching & Cinder Scepter search
let gearWithDesc = 0;
for (const g of gear) {
  if (typeof g.Description === 'string' && g.Description.trim().length > 0) {
    gearWithDesc++;
  }
}

console.log(`Enchants: ${enchantsMatched}/${enchants.length}`);
console.log(`Effects: ${effectsMatchedByName}/${effects.length}`);
console.log(`Gear: ${gearWithDesc}/${gear.length}`);
