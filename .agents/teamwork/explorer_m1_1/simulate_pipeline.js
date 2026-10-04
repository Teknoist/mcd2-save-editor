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

// 1. Simulate enchants enrichment
const enrichedEnchants = enchants.map(item => {
  const desc = dict.enchants[item.Tag];
  return {
    ...item,
    Description: desc || item.Description || ''
  };
});

// 2. Simulate effects enrichment
const enrichedEffects = effects.map(item => {
  const desc = dict.effects[item.Name];
  return {
    ...item,
    Description: desc || item.Description || ''
  };
});

// 3. Simulate gear enrichment
const enrichedGear = gear.map(item => {
  if (dict.gear[item.Tag] && !item.Description) {
    return {
      ...item,
      Description: dict.gear[item.Tag]
    };
  }
  return item;
});

function verify(items, label) {
  const total = items.length;
  const valid = items.filter(i => typeof i.Description === 'string' && i.Description.trim().length > 0).length;
  const pct = (valid / total) * 100;
  console.log(`${label}: Total=${total}, Valid=${valid}, Missing=${total - valid}, Pct=${pct.toFixed(2)}%`);
  return pct > 95;
}

console.log('--- Post-Enrichment Simulation Verification ---');
const passEnchants = verify(enrichedEnchants, 'enchants.json');
const passEffects = verify(enrichedEffects, 'effects.json');
const passGear = verify(enrichedGear, 'gear.json');

console.log('All pass:', passEnchants && passEffects && passGear);
