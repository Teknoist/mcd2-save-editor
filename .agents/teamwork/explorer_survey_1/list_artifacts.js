import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gearPath = path.resolve(__dirname, '../../../src/data/gear.json');
const gear = JSON.parse(fs.readFileSync(gearPath, 'utf8').replace(/^\uFEFF/, ''));

const artifacts = gear.filter(g => g.Category === 'Artifact');
console.log('Artifacts count:', artifacts.length);
artifacts.forEach((a, i) => {
  console.log(`${i+1}. [${a.Name}] Tag: ${a.Tag} | Icon: ${a.Icon} | Desc: ${a.Description ? a.Description.slice(0, 40) + '...' : 'MISSING'}`);
});
