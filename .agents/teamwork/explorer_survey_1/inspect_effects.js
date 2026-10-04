import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const effectsPath = path.resolve(__dirname, '../../../src/data/effects.json');
const effects = JSON.parse(fs.readFileSync(effectsPath, 'utf8').replace(/^\uFEFF/, ''));

console.log('Total effects:', effects.length);
const groupByName = {};
effects.forEach(eff => {
  if (!groupByName[eff.Name]) groupByName[eff.Name] = [];
  groupByName[eff.Name].push(eff);
});

console.log('Total unique effect names:', Object.keys(groupByName).length);
for (const [name, list] of Object.entries(groupByName)) {
  const tiers = list.map(e => `${e.Tier}:${e.Value}`).join(', ');
  const tags = list.map(e => e.Tag).join(', ');
  console.log(`- ${name} (${list.length} tiers): ${tiers} | Tags: ${tags}`);
}
