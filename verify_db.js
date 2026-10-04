import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const enchantsPath = path.join(__dirname, 'src', 'data', 'enchants.json');
const effectsPath = path.join(__dirname, 'src', 'data', 'effects.json');
const gearPath = path.join(__dirname, 'src', 'data', 'gear.json');

function verifyFile(filePath, name, targetThreshold = 95) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [${name}] File not found at: ${filePath}`);
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
  const valid = items.filter(
    item => typeof item.Description === 'string' && item.Description.trim().length > 0
  ).length;
  const pct = total === 0 ? 0 : Number(((valid / total) * 100).toFixed(2));
  const pass = pct > targetThreshold;

  console.log(
    `[${name}] Total: ${total} | With Description: ${valid} | Missing: ${total - valid} | Coverage: ${pct.toFixed(2)}% | Threshold: >${targetThreshold}% | Status: ${pass ? 'PASSED ✅' : 'FAILED ❌'}`
  );

  return { name, pass, total, valid, pct };
}

console.log('=== VERIFY DATABASE COVERAGE ===\n');
const resEnchants = verifyFile(enchantsPath, 'enchants.json', 95);
const resEffects = verifyFile(effectsPath, 'effects.json', 95);
const resGear = verifyFile(gearPath, 'gear.json (informational)', 95);

console.log('\n=== SUMMARY ===');
const allPass = resEnchants.pass && resEffects.pass && resGear.pass;
if (allPass) {
  console.log('✅ All databases pass >95% description coverage criteria.');
  process.exit(0);
} else {
  console.error('❌ Database verification failed. Coverage is below target threshold.');
  process.exit(1);
}
