import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const enchants = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/data/enchants.json'), 'utf8').replace(/^\uFEFF/, ''));
const effects = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/data/effects.json'), 'utf8').replace(/^\uFEFF/, ''));

// Simulate enriched data
const simEnchants = enchants.map(e => ({ ...e, Description: 'Sample description for ' + e.Name }));
const simEffects = effects.map(e => ({ ...e, Description: 'Sample description for ' + e.Name }));

function verify(items, name, threshold = 95) {
  const total = items.length;
  const valid = items.filter(i => typeof i.Description === 'string' && i.Description.trim().length > 0).length;
  const pct = (valid / total) * 100;
  return { name, total, valid, pct, pass: pct > threshold };
}

console.log('Simulated verification:');
console.log(verify(simEnchants, 'enchants.json'));
console.log(verify(simEffects, 'effects.json'));
