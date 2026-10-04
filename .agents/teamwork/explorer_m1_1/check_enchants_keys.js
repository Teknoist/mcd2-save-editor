import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const enchants = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/data/enchants.json'), 'utf8').replace(/^\uFEFF/, ''));

const keysDistribution = {};
for (const e of enchants) {
  const keys = Object.keys(e).join(',');
  keysDistribution[keys] = (keysDistribution[keys] || 0) + 1;
}
console.log('Keys distribution in enchants.json:', keysDistribution);
console.log('First enchant item:');
console.log(JSON.stringify(enchants[0], null, 2));
