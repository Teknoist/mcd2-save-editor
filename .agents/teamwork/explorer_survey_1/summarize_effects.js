import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const effectsPath = path.resolve(__dirname, '../../../src/data/effects.json');
const effects = JSON.parse(fs.readFileSync(effectsPath, 'utf8').replace(/^\uFEFF/, ''));

const summary = {};
effects.forEach(eff => {
  if (!summary[eff.Name]) {
    summary[eff.Name] = {
      Name: eff.Name,
      BaseEffect: eff.Effect,
      Icon: eff.Icon,
      IconUrl: eff.IconUrl,
      Tiers: []
    };
  }
  summary[eff.Name].Tiers.push({
    Tier: eff.Tier,
    Tag: eff.Tag,
    Value: eff.Value
  });
});

console.log('Count:', Object.keys(summary).length);
const keys = Object.keys(summary).sort();
keys.forEach((k, i) => {
  const item = summary[k];
  console.log(`${i+1}. ${item.Name} (${item.BaseEffect}) -> ${item.Tiers.map(t => `${t.Tier}:${t.Value}`).join(', ')}`);
});
