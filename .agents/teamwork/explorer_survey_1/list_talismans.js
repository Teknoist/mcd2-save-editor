import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gearPath = path.resolve(__dirname, '../../../src/data/gear.json');
const gear = JSON.parse(fs.readFileSync(gearPath, 'utf8').replace(/^\uFEFF/, ''));

const talismans = gear.filter(g => g.Category === 'Talisman');
console.log('Talismans count:', talismans.length);
talismans.forEach((t, i) => {
  console.log(`${i+1}. [${t.Name}] Tag: ${t.Tag} | Icon: ${t.Icon} | Desc: ${t.Description ? t.Description.slice(0, 40) + '...' : 'MISSING'}`);
});
