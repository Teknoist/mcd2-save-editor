import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const gearPath = path.join(repoRoot, 'src/data/gear.json');
const enchantsPath = path.join(repoRoot, 'src/data/enchants.json');
const effectsPath = path.join(repoRoot, 'src/data/effects.json');

const gear = JSON.parse(fs.readFileSync(gearPath, 'utf8').replace(/^\uFEFF/, ''));
const enchants = JSON.parse(fs.readFileSync(enchantsPath, 'utf8').replace(/^\uFEFF/, ''));
const effects = JSON.parse(fs.readFileSync(effectsPath, 'utf8').replace(/^\uFEFF/, ''));

console.log('=== ENCHANTS LIST (Total: ' + enchants.length + ') ===');
enchants.forEach((e, i) => {
  console.log(`${i+1}. [${e.Name}] Tag: ${e.Tag} Source: ${e.Source}`);
});

console.log('\n=== SAMPLE EFFECTS (Total: ' + effects.length + ') ===');
const uniqueEffectNames = new Set();
effects.forEach(e => uniqueEffectNames.add(e.Name));
console.log('Unique effect names count:', uniqueEffectNames.size);
console.log('Unique effect names:', Array.from(uniqueEffectNames).sort());

console.log('\n=== FIRST 5 EFFECTS ===');
console.log(JSON.stringify(effects.slice(0, 5), null, 2));
