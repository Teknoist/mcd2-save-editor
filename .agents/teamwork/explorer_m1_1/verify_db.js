import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const enchantsPath = path.join(repoRoot, 'src/data/enchants.json');
const effectsPath = path.join(repoRoot, 'src/data/effects.json');
const gearPath = path.join(repoRoot, 'src/data/gear.json');

function verifyFile(filePath, label, threshold = 95) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [${label}] File not found at ${filePath}`);
    return { label, pass: false, total: 0, valid: 0, pct: 0 };
  }

  let items;
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    items = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ [${label}] Failed to parse JSON: ${err.message}`);
    return { label, pass: false, total: 0, valid: 0, pct: 0 };
  }

  if (!Array.isArray(items)) {
    console.error(`❌ [${label}] Root JSON element is not an array`);
    return { label, pass: false, total: 0, valid: 0, pct: 0 };
  }

  const total = items.length;
  const valid = items.filter(
    item => typeof item.Description === 'string' && item.Description.trim().length > 0
  ).length;
  const pct = total === 0 ? 0 : (valid / total) * 100;
  const pass = pct > threshold;

  const status = pass ? 'PASSED ✅' : 'FAILED ❌';
  console.log(
    `[${label}] Total: ${total} | With Description: ${valid} | Missing: ${total - valid} | Coverage: ${pct.toFixed(2)}% | Threshold: >${threshold}% | Status: ${status}`
  );

  return { label, pass, total, valid, pct };
}

console.log('=== VERIFY DATABASE COVERAGE ===\n');
const resEnchants = verifyFile(enchantsPath, 'enchants.json', 95);
const resEffects = verifyFile(effectsPath, 'effects.json', 95);
const _resGear = verifyFile(gearPath, 'gear.json (informational)', 95);

console.log('\n=== SUMMARY ===');
const allPass = resEnchants.pass && resEffects.pass;
if (allPass) {
  console.log('✅ All required databases pass >95% description coverage criteria.');
  process.exit(0);
} else {
  console.error('❌ Database verification failed. Description coverage below target threshold.');
  process.exit(1);
}
