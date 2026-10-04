import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const gear = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/data/gear.json'), 'utf8').replace(/^\uFEFF/, ''));

const cinder = gear.find(g => g.Tag === 'SW.Item.Artifact.FlameSceptre');
console.log('Cinder Scepter Object:');
console.log(JSON.stringify(cinder, null, 2));

const cinderIndex = gear.findIndex(g => g.Tag === 'SW.Item.Artifact.FlameSceptre');
console.log('Index in gear array:', cinderIndex);
