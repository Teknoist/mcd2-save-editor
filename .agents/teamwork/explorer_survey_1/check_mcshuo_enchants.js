import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enchantsPath = path.resolve(__dirname, '../../../src/data/enchants.json');
const enchants = JSON.parse(fs.readFileSync(enchantsPath, 'utf8').replace(/^\uFEFF/, ''));

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log(`Checking ${enchants.length} enchants on mcshuo...`);
  const results = [];
  for (let i = 0; i < 5; i++) {
    const e = enchants[i];
    try {
      const res = await fetchUrl(e.Source);
      const pMatches = res.data.match(/<p[^>]*>(.*?)<\/p>/gs) || [];
      const cleanP = pMatches.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(p => p.length > 5 && !p.includes('首页') && !p.includes('登录'));
      results.push({ name: e.Name, tag: e.Tag, source: e.Source, p: cleanP.slice(0, 4) });
    } catch (err) {
      results.push({ name: e.Name, error: err.message });
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

run();
