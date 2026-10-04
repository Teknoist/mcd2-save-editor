import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const effects = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/data/effects.json'), 'utf8').replace(/^\uFEFF/, ''));

const keysDistribution = {};
for (const e of effects) {
  const keys = Object.keys(e).join(',');
  keysDistribution[keys] = (keysDistribution[keys] || 0) + 1;
}
console.log('Keys distribution in effects.json:', keysDistribution);
console.log('First effect item:');
console.log(JSON.stringify(effects[0], null, 2));
