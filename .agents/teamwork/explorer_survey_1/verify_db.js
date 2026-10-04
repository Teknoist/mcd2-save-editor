import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const enchantsPath = path.join(repoRoot, 'src/data/enchants.json');
const effectsPath = path.join(repoRoot, 'src/data/effects.json');
const gearPath = path.join(repoRoot, 'src/data/gear.json');

function verifyFile(filePath, name, targetThreshold = 95) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [${name}] File not found: ${filePath}`);
    return { name, pass: false, total: 0, valid: 0, pct: 0 };
  }

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  let items;
  try {
    items = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ [${name}] JSON parse error: ${err.message}`);
    return { name, pass: false, total: 0, valid: 0, pct: 0 };
  }

  if (!Array.isArray(items)) {
    console.error(`❌ [${name}] Root is not an array`);
    return { name, pass: false, total: 0, valid: 0, pct: 0 };
  }

  const total = items.length;
  const valid = items.filter(item => typeof item.Description === 'string' && item.Description.trim().length > 0).length;
  const pct = total === 0 ? 0 : (valid / total) * 100;
  const pass = pct > targetThreshold;

  console.log(`[${name}] Total: ${total} | With Description: ${valid} | Missing: ${total - valid} | Coverage: ${pct.toFixed(2)}% | Threshold: >${targetThreshold}% | Status: ${pass ? 'PASSED ✅' : 'FAILED ❌'}`);

  return { name, pass, total, valid, pct };
}

console.log('=== VERIFY DATABASE COVERAGE ===\n');
const resEnchants = verifyFile(enchantsPath, 'enchants.json', 95);
const resEffects = verifyFile(effectsPath, 'effects.json', 95);
const resGear = verifyFile(gearPath, 'gear.json (informational)', 95);

console.log('\n=== SUMMARY ===');
const allPass = resEnchants.pass && resEffects.pass;
if (allPass) {
  console.log('✅ All required databases pass >95% description coverage criteria.');
  process.exit(0);
} else {
  console.error('❌ Database verification failed. Coverage is below target threshold.');
  process.exit(1);
}
