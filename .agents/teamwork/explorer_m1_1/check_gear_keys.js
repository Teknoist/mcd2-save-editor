import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const gear = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/data/gear.json'), 'utf8').replace(/^\uFEFF/, ''));

const keysDistribution = {};
for (const g of gear) {
  const keys = Object.keys(g).join(',');
  keysDistribution[keys] = (keysDistribution[keys] || 0) + 1;
}
console.log('Keys distribution in gear.json:', keysDistribution);
