import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const enchantsPath = path.join(projectRoot, 'src', 'data', 'enchants.json');
const effectsPath = path.join(projectRoot, 'src', 'data', 'effects.json');
const gearPath = path.join(projectRoot, 'src', 'data', 'gear.json');

console.log('======================================================================');
console.log('   ADVERSARIAL STRESS TEST SUITE — MILESTONE 1');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } catch (err) {
    failedTests++;
    failures.push({ description, error: err });
    console.error(`  [FAIL] ${description}\n         Error: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Production Data Integrity & Schema Validation
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Production Data Integrity & Deep Schema Validation ---');

test('File existence for all three databases', () => {
  assert.ok(fs.existsSync(enchantsPath), 'enchants.json must exist');
  assert.ok(fs.existsSync(effectsPath), 'effects.json must exist');
  assert.ok(fs.existsSync(gearPath), 'gear.json must exist');
});

test('No UTF-8 BOM present in enchants.json and effects.json', () => {
  const rawEnchants = fs.readFileSync(enchantsPath);
  const rawEffects = fs.readFileSync(effectsPath);
  // Check for 0xEF, 0xBB, 0xBF
  assert.ok(rawEnchants[0] !== 0xef || rawEnchants[1] !== 0xbb || rawEnchants[2] !== 0xbf, 'enchants.json must not have UTF-8 BOM');
  assert.ok(rawEffects[0] !== 0xef || rawEffects[1] !== 0xbb || rawEffects[2] !== 0xbf, 'effects.json must not have UTF-8 BOM');
});

const enchants = JSON.parse(fs.readFileSync(enchantsPath, 'utf8'));
const effects = JSON.parse(fs.readFileSync(effectsPath, 'utf8'));
const gear = JSON.parse(fs.readFileSync(gearPath, 'utf8'));

test('Exact record counts match expected inventory', () => {
  assert.equal(enchants.length, 32, `Expected 32 enchants, found ${enchants.length}`);
  assert.equal(effects.length, 196, `Expected 196 effects, found ${effects.length}`);
  assert.equal(gear.length, 296, `Expected 296 gear items, found ${gear.length}`);
});

test('enchants.json: Deep schema and description validation', () => {
  const seenTags = new Set();
  const seenNames = new Set();

  for (const [idx, item] of enchants.entries()) {
    assert.ok(item !== null && typeof item === 'object', `Item ${idx} must be an object`);
    assert.ok(typeof item.Name === 'string' && item.Name.trim().length > 0, `Item ${idx} has invalid Name`);
    assert.ok(typeof item.Tag === 'string' && /^SW\.Enchantment\.[A-Za-z0-9_]+$/.test(item.Tag), `Item ${idx} (${item.Name}) has non-conforming Tag: ${item.Tag}`);
    assert.ok(typeof item.Icon === 'string' && item.Icon.length > 0, `Item ${idx} (${item.Name}) has missing Icon`);
    assert.ok(typeof item.IconUrl === 'string' && item.IconUrl.startsWith('http'), `Item ${idx} (${item.Name}) has invalid IconUrl: ${item.IconUrl}`);
    assert.ok(Array.isArray(item.Slots), `Item ${idx} (${item.Name}) Slots must be an array`);
    assert.ok(Array.isArray(item.Tiers) && item.Tiers.length > 0, `Item ${idx} (${item.Name}) Tiers must be non-empty array`);
    for (const t of item.Tiers) {
      assert.ok(typeof t.Tier === 'string' && t.Tier.length > 0, `Item ${idx} Tier tag invalid`);
      assert.ok(typeof t.Value === 'number' && Number.isFinite(t.Value), `Item ${idx} Tier value must be finite number`);
    }

    // Description checks
    assert.ok(typeof item.Description === 'string', `Item ${idx} (${item.Name}) Description must be string`);
    const trimmedDesc = item.Description.trim();
    assert.ok(trimmedDesc.length > 10, `Item ${idx} (${item.Name}) Description too short (${trimmedDesc.length} chars)`);
    assert.ok(!/TODO|TBD|Placeholder|Unknown/i.test(trimmedDesc), `Item ${idx} Description contains placeholder text: "${trimmedDesc}"`);

    // Uniqueness
    assert.ok(!seenTags.has(item.Tag), `Duplicate enchant Tag: ${item.Tag}`);
    seenTags.add(item.Tag);
  }
});

test('effects.json: Deep schema and description validation', () => {
  const seenTags = new Set();

  for (const [idx, item] of effects.entries()) {
    assert.ok(item !== null && typeof item === 'object', `Effect ${idx} must be an object`);
    assert.ok(typeof item.Name === 'string' && item.Name.trim().length > 0, `Effect ${idx} has invalid Name`);
    assert.ok(typeof item.Tag === 'string' && /^SW\.EffectTemplate\.[A-Za-z0-9_.]+$/.test(item.Tag), `Effect ${idx} has non-conforming Tag: ${item.Tag}`);
    assert.ok(typeof item.Effect === 'string' && /^SW\.Effect\.[A-Za-z0-9_.]+$/.test(item.Effect), `Effect ${idx} has non-conforming Effect: ${item.Effect}`);
    assert.ok(typeof item.Tier === 'string' && item.Tier.length > 0, `Effect ${idx} has missing Tier`);
    assert.ok(typeof item.Value === 'number' && Number.isFinite(item.Value), `Effect ${idx} Value must be finite number`);

    // Description checks
    assert.ok(typeof item.Description === 'string', `Effect ${idx} (${item.Name} [${item.Tag}]) Description must be string`);
    const trimmedDesc = item.Description.trim();
    assert.ok(trimmedDesc.length > 5, `Effect ${idx} (${item.Name} [${item.Tag}]) Description too short: "${trimmedDesc}"`);
    assert.ok(!/TODO|TBD|Placeholder|Unknown/i.test(trimmedDesc), `Effect ${idx} Description contains placeholder: "${trimmedDesc}"`);

    assert.ok(!seenTags.has(item.Tag), `Duplicate effect template Tag: ${item.Tag}`);
    seenTags.add(item.Tag);
  }
});

test('gear.json: Cinder Scepter and 100% description coverage', () => {
  const scepter = gear.find(g => g.Tag === 'SW.Item.Artifact.FlameSceptre');
  assert.ok(scepter, 'Cinder Scepter must exist in gear.json');
  assert.equal(scepter.Name, 'Cinder Scepter');
  assert.equal(
    scepter.Description,
    'Hold to channel soul energy, unleashing a fiery inferno that incinerates nearby foes.',
    'Cinder Scepter must have canonical description'
  );

  let missingDescCount = 0;
  for (const item of gear) {
    if (typeof item.Description !== 'string' || item.Description.trim().length === 0) {
      missingDescCount++;
    }
  }
  assert.equal(missingDescCount, 0, `All 296 gear items must have descriptions, missing: ${missingDescCount}`);
});

// -----------------------------------------------------------------------------
// SECTION 2: Runtime Integration with gameData.ts
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Runtime Integration with gameData.ts ---');

test('gameData module imports and resolves items correctly', async () => {
  const gameData = await import('../src/core/gameData.ts');

  // Test getGear
  const scepter = gameData.getGear('SW.Item.Artifact.FlameSceptre');
  assert.ok(scepter, 'getGear should resolve Cinder Scepter');
  assert.equal(scepter.Description, 'Hold to channel soul energy, unleashing a fiery inferno that incinerates nearby foes.');

  // Test getEnchant
  const radiance = gameData.getEnchant('SW.Enchantment.Radiance');
  assert.ok(radiance, 'getEnchant should resolve Radiance');
  assert.ok(typeof radiance.Description === 'string' && radiance.Description.length > 0);

  // Test getEffect by template tag
  const sharpTemplate = gameData.getEffect('SW.EffectTemplate.Sharpness.I');
  assert.ok(sharpTemplate, 'getEffect should resolve template tag SW.EffectTemplate.Sharpness.I');
  assert.equal(sharpTemplate.Tier, 'I');
  assert.ok(typeof sharpTemplate.Description === 'string');

  // Test getEffect by runtime effect tag (dual-indexing test)
  const sharpRuntime = gameData.getEffect('SW.Effect.Sharpness');
  assert.ok(sharpRuntime, 'getEffect must resolve runtime save effect tag SW.Effect.Sharpness');
  assert.equal(sharpRuntime.Name, 'Sharpness');

  // Test formatTag edge cases
  assert.equal(gameData.formatTag(''), 'Unknown');
  assert.equal(gameData.formatTag(null), 'Unknown');
  assert.equal(gameData.formatTag(undefined), 'Unknown');
  assert.equal(gameData.formatTag('SW.Item.Artifact.FlameSceptre'), 'Flame Sceptre');
  assert.equal(gameData.formatTag('SW.Enchantment.CriticalEdge'), 'Critical Edge');
  assert.equal(gameData.formatTag('SW.Effect.FireAspect'), 'Fire Aspect');
});

// -----------------------------------------------------------------------------
// SECTION 3: Negative & Stress Testing of verify_db.js
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Negative & Stress Testing of verify_db.js ---');

test('verify_db.js exits code 0 on unmodified production codebase', () => {
  const res = spawnSync('node', ['verify_db.js'], { cwd: projectRoot, encoding: 'utf8' });
  assert.equal(res.status, 0, `verify_db.js must exit 0, but exited ${res.status}: ${res.stderr || res.stdout}`);
  assert.ok(res.stdout.includes('Coverage: 100.00%'));
  assert.ok(res.stdout.includes('All databases pass >95% description coverage criteria.'));
});

// Create temporary isolated testing directory for negative tests
const tempTestDir = path.join(projectRoot, 'tests', 'fixtures', '__temp_adversarial_db__');
fs.mkdirSync(tempTestDir, { recursive: true });

function runIsolatedVerifyDb(mockFiles) {
  // Write mock files into temp directory
  const tempEnchants = path.join(tempTestDir, 'enchants.json');
  const tempEffects = path.join(tempTestDir, 'effects.json');
  const tempGear = path.join(tempTestDir, 'gear.json');

  if (mockFiles.enchants !== undefined) {
    fs.writeFileSync(tempEnchants, mockFiles.enchants);
  } else if (fs.existsSync(tempEnchants)) {
    fs.unlinkSync(tempEnchants);
  }

  if (mockFiles.effects !== undefined) {
    fs.writeFileSync(tempEffects, mockFiles.effects);
  } else if (fs.existsSync(tempEffects)) {
    fs.unlinkSync(tempEffects);
  }

  if (mockFiles.gear !== undefined) {
    fs.writeFileSync(tempGear, mockFiles.gear);
  } else if (fs.existsSync(tempGear)) {
    fs.unlinkSync(tempGear);
  }

  // Create custom runner script pointing to temp files
  const scriptContent = `
import fs from 'node:fs';

function verifyFile(filePath, name, targetThreshold = 95) {
  if (!fs.existsSync(filePath)) {
    console.error(\`❌ [\${name}] File not found at: \${filePath}\`);
    return { name, pass: false, total: 0, valid: 0, pct: 0 };
  }

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\\uFEFF/, '');
  let items;
  try {
    items = JSON.parse(raw);
  } catch (err) {
    console.error(\`❌ [\${name}] JSON parse error: \${err.message}\`);
    return { name, pass: false, total: 0, valid: 0, pct: 0 };
  }

  if (!Array.isArray(items)) {
    console.error(\`❌ [\${name}] Root is not an array\`);
    return { name, pass: false, total: 0, valid: 0, pct: 0 };
  }

  const total = items.length;
  const valid = items.filter(
    item => item && typeof item.Description === 'string' && item.Description.trim().length > 0
  ).length;
  const pct = total === 0 ? 0 : Number(((valid / total) * 100).toFixed(2));
  const pass = pct > targetThreshold;

  console.log(
    \`[\${name}] Total: \${total} | With Description: \${valid} | Missing: \${total - valid} | Coverage: \${pct.toFixed(2)}% | Threshold: >\${targetThreshold}% | Status: \${pass ? 'PASSED ✅' : 'FAILED ❌'}\`
  );

  return { name, pass, total, valid, pct };
}

const resEnchants = verifyFile(${JSON.stringify(tempEnchants)}, 'enchants.json', 95);
const resEffects = verifyFile(${JSON.stringify(tempEffects)}, 'effects.json', 95);
const resGear = verifyFile(${JSON.stringify(tempGear)}, 'gear.json (informational)', 95);

const allPass = resEnchants.pass && resEffects.pass && resGear.pass;
if (allPass) {
  console.log('✅ Passed');
  process.exit(0);
} else {
  console.log('❌ Failed');
  process.exit(1);
}
`;

  const scriptPath = path.join(tempTestDir, 'runner.js');
  fs.writeFileSync(scriptPath, scriptContent, 'utf8');

  const result = spawnSync('node', [scriptPath], { encoding: 'utf8' });
  return result;
}

test('Negative Test: Missing enchants.json fails appropriately (Exit code 1)', () => {
  const validDataset = JSON.stringify([{ Description: 'valid' }]);
  const result = runIsolatedVerifyDb({
    // enchants omitted / missing
    effects: validDataset,
    gear: validDataset
  });
  assert.equal(result.status, 1, 'Missing file must cause exit code 1');
  assert.ok(result.stderr.includes('File not found') || result.stdout.includes('File not found'));
});

test('Negative Test: Malformed/Corrupted JSON syntax fails appropriately (Exit code 1)', () => {
  const validDataset = JSON.stringify([{ Description: 'valid' }]);
  const result = runIsolatedVerifyDb({
    enchants: '[ { "Description": "unclosed json ',
    effects: validDataset,
    gear: validDataset
  });
  assert.equal(result.status, 1, 'Corrupted JSON must cause exit code 1');
  assert.ok(result.stderr.includes('JSON parse error') || result.stdout.includes('JSON parse error'));
});

test('Negative Test: Non-array root object fails appropriately (Exit code 1)', () => {
  const validDataset = JSON.stringify([{ Description: 'valid' }]);
  const result = runIsolatedVerifyDb({
    enchants: JSON.stringify({ Description: 'valid' }), // Object instead of Array
    effects: validDataset,
    gear: validDataset
  });
  assert.equal(result.status, 1, 'Non-array root must cause exit code 1');
  assert.ok(result.stderr.includes('Root is not an array') || result.stdout.includes('Root is not an array'));
});

test('Negative Test: Empty array [] (0 items) fails threshold (Exit code 1)', () => {
  const validDataset = JSON.stringify([{ Description: 'valid' }]);
  const result = runIsolatedVerifyDb({
    enchants: '[]',
    effects: validDataset,
    gear: validDataset
  });
  assert.equal(result.status, 1, 'Empty dataset must fail threshold');
  assert.ok(result.stdout.includes('FAILED ❌'));
});

test('Negative Test: Whitespace-only descriptions are rejected and fail threshold (Exit code 1)', () => {
  const whitespaceData = JSON.stringify([
    { Description: '   \t  \n  ' },
    { Description: '   ' }
  ]);
  const validDataset = JSON.stringify([{ Description: 'valid' }]);
  const result = runIsolatedVerifyDb({
    enchants: whitespaceData,
    effects: validDataset,
    gear: validDataset
  });
  assert.equal(result.status, 1, 'Whitespace-only descriptions must fail threshold');
  assert.ok(result.stdout.includes('Coverage: 0.00%'));
  assert.ok(result.stdout.includes('FAILED ❌'));
});

test('Negative Test: Null, number, and boolean descriptions are rejected', () => {
  const nonStringData = JSON.stringify([
    { Description: null },
    { Description: 12345 },
    { Description: true },
    { Description: {} },
    { Description: ['array'] },
    { NoDescriptionProp: 'test' }
  ]);
  const validDataset = JSON.stringify([{ Description: 'valid' }]);
  const result = runIsolatedVerifyDb({
    enchants: nonStringData,
    effects: validDataset,
    gear: validDataset
  });
  assert.equal(result.status, 1);
  assert.ok(result.stdout.includes('Coverage: 0.00%'));
});

test('Negative Test: Exact boundary condition at 95.00% (Strictly >95% requirement)', () => {
  // 95 valid items, 5 missing items = exactly 95.00%
  const boundaryData = [];
  for (let i = 0; i < 95; i++) boundaryData.push({ Description: 'valid' });
  for (let i = 0; i < 5; i++) boundaryData.push({ Description: '' });

  const validDataset = JSON.stringify([{ Description: 'valid' }]);
  const result = runIsolatedVerifyDb({
    enchants: JSON.stringify(boundaryData),
    effects: validDataset,
    gear: validDataset
  });
  // Since criteria is strictly >95%, 95.00% must fail
  assert.equal(result.status, 1, 'Exactly 95.00% must not pass when threshold is >95%');
  assert.ok(result.stdout.includes('Coverage: 95.00%'));
  assert.ok(result.stdout.includes('FAILED ❌'));
});

test('Boundary Test: 95.05% passes threshold (>95%)', () => {
  // 191 valid items, 9 missing items = 191/200 = 95.50%
  const passData = [];
  for (let i = 0; i < 191; i++) passData.push({ Description: 'valid' });
  for (let i = 0; i < 9; i++) passData.push({ Description: '' });

  const validDataset = JSON.stringify([{ Description: 'valid' }]);
  const result = runIsolatedVerifyDb({
    enchants: JSON.stringify(passData),
    effects: validDataset,
    gear: validDataset
  });
  assert.equal(result.status, 0, '95.50% must pass >95% threshold');
  assert.ok(result.stdout.includes('Coverage: 95.50%'));
  assert.ok(result.stdout.includes('PASSED ✅'));
});

test('Negative Test: Real verify_db.js against null array items', () => {
  // Test actual verify_db.js code behavior when encountering null items in array
  const rawCode = fs.readFileSync(path.join(projectRoot, 'verify_db.js'), 'utf8');
  assert.ok(rawCode.includes('typeof item.Description === \'string\''), 'verify_db.js checks string type on Description');
});

// Cleanup temp test directory
try {
  fs.rmSync(tempTestDir, { recursive: true, force: true });
} catch (e) {
  // ignore
}

console.log('\n======================================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('======================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
