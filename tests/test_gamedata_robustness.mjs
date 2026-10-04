import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const tempBundleDir = path.resolve(__dirname, '.temp_gamedata_test');
const tempBundleFile = path.resolve(tempBundleDir, 'gameData.bundle.mjs');

async function main() {
  console.log('======================================================================');
  console.log('   CHALLENGER ROBUSTNESS TEST SUITE: src/core/gameData.ts');
  console.log('======================================================================\n');

  console.log('[1/5] Bundling src/core/gameData.ts via Vite for direct empirical execution...');
  await build({
    root: projectRoot,
    build: {
      lib: {
        entry: path.resolve(projectRoot, 'src/core/gameData.ts'),
        formats: ['es'],
        fileName: () => 'gameData.bundle.mjs'
      },
      outDir: tempBundleDir,
      emptyOutDir: true,
      logLevel: 'warn'
    }
  });

  const gameData = await import(tempBundleFile);
  console.log('-> Bundle loaded successfully. Exported symbols:', Object.keys(gameData));

  let passedTests = 0;
  let failedTests = 0;
  const findings = [];

  function test(name, fn) {
    try {
      fn();
      passedTests++;
      console.log(`  [PASS] ${name}`);
    } catch (err) {
      failedTests++;
      console.error(`  [FAIL] ${name}: ${err.message}`);
      findings.push({ name, error: err.message, stack: err.stack });
    }
  }

  console.log('\n--- Test Section 1: TypeScript Models & Data Completeness ---');

  test('GEAR_LIST array and model contracts', () => {
    assert.ok(Array.isArray(gameData.GEAR_LIST), 'GEAR_LIST must be array');
    assert.equal(gameData.GEAR_LIST.length, 296, 'GEAR_LIST must contain 296 items');
    for (const item of gameData.GEAR_LIST) {
      assert.equal(typeof item.Name, 'string', `Item ${item.Tag} missing Name`);
      assert.equal(typeof item.Tag, 'string', `Item ${item.Name} missing Tag`);
      assert.equal(typeof item.Category, 'string', `Item ${item.Tag} missing Category`);
      assert.equal(typeof item.Unique, 'boolean', `Item ${item.Tag} missing Unique boolean`);
      assert.equal(typeof item.Icon, 'string', `Item ${item.Tag} missing Icon`);
      assert.equal(typeof item.IconUrl, 'string', `Item ${item.Tag} missing IconUrl`);
      assert.equal(typeof item.Source, 'string', `Item ${item.Tag} missing Source`);
      assert.equal(typeof item.Slot, 'string', `Item ${item.Tag} missing Slot`);
      assert.ok(Array.isArray(item.Effects), `Item ${item.Tag} Effects must be array`);
      assert.ok(Array.isArray(item.Levels), `Item ${item.Tag} Levels must be array`);
      assert.ok(Array.isArray(item.Pool), `Item ${item.Tag} Pool must be array`);
      // Description is optional in interface, but check coverage
      if (item.Description !== undefined) {
        assert.equal(typeof item.Description, 'string');
        assert.ok(item.Description.trim().length > 0);
      }
    }
  });

  test('Cinder Scepter description in GEAR_LIST', () => {
    const scepter = gameData.GEAR_LIST.find(g => g.Tag === 'SW.Item.Artifact.FlameSceptre');
    assert.ok(scepter, 'Cinder Scepter must exist in GEAR_LIST');
    assert.equal(scepter.Name, 'Cinder Scepter');
    assert.equal(typeof scepter.Description, 'string', 'Cinder Scepter must have Description string');
    assert.ok(scepter.Description.trim().length > 0, 'Cinder Scepter Description must not be empty');
  });

  test('ENCHANT_LIST array and model contracts', () => {
    assert.ok(Array.isArray(gameData.ENCHANT_LIST), 'ENCHANT_LIST must be array');
    assert.equal(gameData.ENCHANT_LIST.length, 32, 'ENCHANT_LIST must contain 32 enchants');
    let withDesc = 0;
    for (const e of gameData.ENCHANT_LIST) {
      assert.equal(typeof e.Name, 'string', `Enchant ${e.Tag} missing Name`);
      assert.equal(typeof e.Tag, 'string', `Enchant ${e.Name} missing Tag`);
      assert.ok(e.Tag.startsWith('SW.Enchantment.'), `Enchant tag must start with SW.Enchantment: ${e.Tag}`);
      assert.equal(typeof e.Icon, 'string', `Enchant ${e.Tag} missing Icon`);
      assert.equal(typeof e.IconUrl, 'string', `Enchant ${e.Tag} missing IconUrl`);
      assert.ok(Array.isArray(e.Slots), `Enchant ${e.Tag} Slots must be array`);
      assert.ok(Array.isArray(e.Tiers), `Enchant ${e.Tag} Tiers must be array`);
      assert.ok(e.Tiers.length > 0, `Enchant ${e.Tag} Tiers must not be empty`);
      for (const t of e.Tiers) {
        assert.equal(typeof t.Tier, 'string', `Enchant ${e.Tag} tier format`);
        assert.equal(typeof t.Value, 'number', `Enchant ${e.Tag} tier value`);
      }
      assert.equal(typeof e.Source, 'string', `Enchant ${e.Tag} missing Source`);
      assert.equal(typeof e.Description, 'string', `Enchant ${e.Tag} missing Description`);
      assert.ok(e.Description.trim().length > 0, `Enchant ${e.Tag} Description must not be empty`);
      withDesc++;
    }
    assert.equal(withDesc, 32, 'All 32 enchants must have valid descriptions');
  });

  test('EFFECT_LIST array and model contracts', () => {
    assert.ok(Array.isArray(gameData.EFFECT_LIST), 'EFFECT_LIST must be array');
    assert.equal(gameData.EFFECT_LIST.length, 196, 'EFFECT_LIST must contain 196 items');
    let withDesc = 0;
    for (const eff of gameData.EFFECT_LIST) {
      assert.equal(typeof eff.Name, 'string', `Effect ${eff.Tag} missing Name`);
      assert.equal(typeof eff.Tag, 'string', `Effect ${eff.Name} missing Tag`);
      assert.ok(eff.Tag.startsWith('SW.EffectTemplate.'), `Effect Tag must start with SW.EffectTemplate: ${eff.Tag}`);
      assert.equal(typeof eff.Effect, 'string', `Effect ${eff.Tag} missing Effect property`);
      assert.ok(eff.Effect.startsWith('SW.Effect.'), `Effect property must start with SW.Effect: ${eff.Effect}`);
      assert.equal(typeof eff.Tier, 'string', `Effect ${eff.Tag} missing Tier`);
      assert.equal(typeof eff.Value, 'number', `Effect ${eff.Tag} missing Value`);
      assert.equal(typeof eff.Description, 'string', `Effect ${eff.Tag} missing Description`);
      assert.ok(eff.Description.trim().length > 0, `Effect ${eff.Tag} Description must not be empty`);
      withDesc++;
    }
    assert.equal(withDesc, 196, 'All 196 effects must have valid descriptions');
  });

  console.log('\n--- Test Section 2: Lookups with Valid Tags ---');

  test('getGear with canonical tags', () => {
    const sword = gameData.getGear('SW.Item.Sword');
    assert.ok(sword, 'SW.Item.Sword must resolve');
    assert.equal(sword.Name, 'Sword');
    assert.equal(sword.Category, 'MeleeWeapon');

    const scepter = gameData.getGear('SW.Item.Artifact.FlameSceptre');
    assert.ok(scepter, 'Cinder Scepter must resolve');
    assert.equal(scepter.Name, 'Cinder Scepter');
  });

  test('getEnchant with canonical tags', () => {
    const thundering = gameData.getEnchant('SW.Enchantment.Thundering');
    assert.ok(thundering, 'SW.Enchantment.Thundering must resolve');
    assert.equal(thundering.Name, 'Thundering');
    assert.ok(thundering.Description.length > 0);
  });

  test('getEffect with template tags AND runtime effect tags', () => {
    // 1. Template tag
    const protectionTemplate = gameData.getEffect('SW.EffectTemplate.Protection.I');
    assert.ok(protectionTemplate, 'SW.EffectTemplate.Protection.I must resolve');
    assert.equal(protectionTemplate.Name, 'Protection');
    assert.equal(protectionTemplate.Tier, 'I');

    // 2. Runtime effect tag (SW.Effect.*)
    const protectionRuntime = gameData.getEffect('SW.Effect.Protection');
    assert.ok(protectionRuntime, 'SW.Effect.Protection must resolve runtime effect');
    assert.equal(protectionRuntime.Name, 'Protection');

    // 3. Sharpness template & runtime
    const sharpnessTemplate = gameData.getEffect('SW.EffectTemplate.Sharpness.II');
    assert.ok(sharpnessTemplate, 'SW.EffectTemplate.Sharpness.II must resolve');
    const sharpnessRuntime = gameData.getEffect('SW.Effect.Sharpness');
    assert.ok(sharpnessRuntime, 'SW.Effect.Sharpness must resolve runtime effect');
  });

  test('getGearName with valid tags', () => {
    assert.equal(gameData.getGearName('SW.Item.Sword'), 'Sword');
    assert.equal(gameData.getGearName('SW.Item.Artifact.FlameSceptre'), 'Cinder Scepter');
  });

  test('getEffectName with valid tags', () => {
    // Enchantment tag
    assert.equal(gameData.getEffectName('SW.Enchantment.Thundering'), 'Thundering');
    // Effect template tag
    assert.equal(gameData.getEffectName('SW.EffectTemplate.Protection.I'), 'Protection');
    // Effect runtime tag
    assert.equal(gameData.getEffectName('SW.Effect.Protection'), 'Protection');
  });

  test('getIconUrl with valid tags', () => {
    const swordIcon = gameData.getIconUrl('SW.Item.Sword');
    assert.ok(typeof swordIcon === 'string' && swordIcon.length > 0);

    const enchantIcon = gameData.getIconUrl('SW.Enchantment.Thundering');
    assert.ok(typeof enchantIcon === 'string' && enchantIcon.length > 0);
  });

  test('getItemEnchantPool with valid gear tags', () => {
    const pool = gameData.getItemEnchantPool('SW.Item.Sword');
    assert.ok(Array.isArray(pool), 'Pool must be array');
    assert.ok(pool.length > 0, 'Sword pool must not be empty');
  });

  test('getEnchantsForSlot with valid slot filters', () => {
    const all = gameData.getEnchantsForSlot('None');
    assert.equal(all.length, 32, 'None slot should return all enchants');

    const emptySlot = gameData.getEnchantsForSlot('');
    assert.equal(emptySlot.length, 32, 'Empty string slot should return all enchants');

    const meleeEnchants = gameData.getEnchantsForSlot('SW.ItemSlot.Equipment.MeleeWeapon');
    assert.ok(meleeEnchants.length > 0 && meleeEnchants.length <= 32);
    for (const e of meleeEnchants) {
      assert.ok(e.Slots.length === 0 || e.Slots.includes('SW.ItemSlot.Equipment.MeleeWeapon'));
    }
  });

  test('GEAR_CATEGORIES and getGearByCategory', () => {
    assert.ok(Array.isArray(gameData.GEAR_CATEGORIES));
    assert.ok(gameData.GEAR_CATEGORIES.length > 0);
    for (const cat of gameData.GEAR_CATEGORIES) {
      const items = gameData.getGearByCategory(cat);
      assert.ok(items.length > 0);
      assert.ok(items.every(i => i.Category === cat));
    }
  });

  console.log('\n--- Test Section 3: Lookups with Invalid & Boundary Tags ---');

  test('Lookups with non-existent tags return undefined or fallback', () => {
    assert.equal(gameData.getGear('SW.Item.NonExistentWeapon999'), undefined);
    assert.equal(gameData.getEnchant('SW.Enchantment.FakeMagic'), undefined);
    assert.equal(gameData.getEffect('SW.Effect.NoSuchEffect'), undefined);
    assert.equal(gameData.getIconUrl('SW.Item.NonExistent'), null);
    assert.deepEqual(gameData.getItemEnchantPool('SW.Item.FakeItem'), []);
  });

  test('Lookups with empty string and special characters', () => {
    assert.equal(gameData.getGear(''), undefined);
    assert.equal(gameData.getEnchant(''), undefined);
    assert.equal(gameData.getEffect(''), undefined);
    assert.equal(gameData.getIconUrl(''), null);
    assert.deepEqual(gameData.getItemEnchantPool(''), []);

    assert.equal(gameData.getGear('   '), undefined);
    assert.equal(gameData.getGear('!@#$%^&*()'), undefined);
    assert.equal(gameData.getGear('SW.Item.Sword<script>alert(1)</script>'), undefined);
  });

  test('Lookups with prototype pollution strings (__proto__, constructor, toString)', () => {
    assert.equal(gameData.getGear('__proto__'), undefined);
    assert.equal(gameData.getGear('constructor'), undefined);
    assert.equal(gameData.getGear('toString'), undefined);
    assert.equal(gameData.getEnchant('__proto__'), undefined);
    assert.equal(gameData.getEffect('__proto__'), undefined);
    assert.equal(gameData.getIconUrl('__proto__'), null);
  });

  test('getEnchantsForSlot with non-existent slot tag', () => {
    const res = gameData.getEnchantsForSlot('SW.ItemSlot.NonExistent');
    assert.ok(Array.isArray(res));
    // Should only contain enchants that have unrestricted slots (e.Slots.length === 0)
    for (const e of res) {
      assert.equal(e.Slots.length, 0);
    }
  });

  test('getGearName fallback on unregistered tags', () => {
    assert.equal(gameData.getGearName('SW.Item.CoolLaserBlaster'), 'Cool Laser Blaster');
    assert.equal(gameData.getGearName(''), 'Unknown');
    assert.equal(gameData.getGearName(null), 'Unknown');
    assert.equal(gameData.getGearName(undefined), 'Unknown');
  });

  test('getEffectName fallback on unregistered tags', () => {
    assert.equal(gameData.getEffectName('SW.Effect.SuperPunch'), 'Super Punch');
    assert.equal(gameData.getEffectName('SW.EffectTemplate.MegaArmor.II'), 'Mega Armor');
    assert.equal(gameData.getEffectName(''), 'Unknown');
    assert.equal(gameData.getEffectName(null), 'Unknown');
    assert.equal(gameData.getEffectName(undefined), 'Unknown');
  });

  console.log('\n--- Test Section 4: formatTag Verification ---');

  test('formatTag with standard canonical tags', () => {
    assert.equal(gameData.formatTag('SW.Item.Scythe'), 'Scythe');
    assert.equal(gameData.formatTag('SW.Enchantment.Thundering'), 'Thundering');
    assert.equal(gameData.formatTag('SW.Effect.CriticalEdge'), 'Critical Edge');
    assert.equal(gameData.formatTag('SW.Item.Artifact.DeathcapMushroom'), 'Deathcap Mushroom');
    assert.equal(gameData.formatTag('SW.Rarity.Rare'), 'Rare');
  });

  test('formatTag with template tiers and unique suffix', () => {
    assert.equal(gameData.formatTag('SW.EffectTemplate.Protection.I'), 'Protection');
    assert.equal(gameData.formatTag('SW.EffectTemplate.Protection.II'), 'Protection');
    assert.equal(gameData.formatTag('SW.EffectTemplate.Protection.III'), 'Protection');
    assert.equal(gameData.formatTag('SW.Item.Broadsword.Unique'), 'Broadsword');
  });

  test('formatTag with cosmetics and talismans', () => {
    assert.equal(gameData.formatTag('SW.Item.Cosmetic.Cape.HeroCape'), 'Cape: Hero Cape');
    assert.equal(gameData.formatTag('SW.Item.Cosmetic.Pet.BabyChicken'), 'Pet: Baby Chicken');
    assert.equal(gameData.formatTag('SW.Item.Talisman.Llama'), 'Talisman: Llama');
  });

  test('formatTag with empty and nullish values', () => {
    assert.equal(gameData.formatTag(''), 'Unknown');
    assert.equal(gameData.formatTag(null), 'Unknown');
    assert.equal(gameData.formatTag(undefined), 'Unknown');
  });

  test('formatTagToName legacy alias parity', () => {
    assert.equal(gameData.formatTagToName, gameData.formatTag);
    assert.equal(gameData.formatTagToName('SW.Item.Sword'), 'Sword');
  });

  test('formatTag edge cases: snake_case and multiple spaces', () => {
    assert.equal(gameData.formatTag('SW.Item.some_weapon_name'), 'some weapon name');
    assert.equal(gameData.formatTag('SW.Item.  Spacing  Test  '), 'Spacing Test');
  });

  console.log('\n--- Test Section 5: All Real Database Tags Through formatTag & Lookups ---');

  test('All 296 gear items resolve Name or clean formatTag', () => {
    for (const item of gameData.GEAR_LIST) {
      const name = gameData.getGearName(item.Tag);
      assert.equal(name, item.Name, `getGearName mismatch for ${item.Tag}`);
      const formatted = gameData.formatTag(item.Tag);
      assert.ok(typeof formatted === 'string' && formatted.length > 0, `formatTag empty for ${item.Tag}`);
    }
  });

  test('All 32 enchant items resolve Name or clean formatTag', () => {
    for (const e of gameData.ENCHANT_LIST) {
      const name = gameData.getEffectName(e.Tag);
      assert.equal(name, e.Name, `getEffectName mismatch for enchant ${e.Tag}`);
    }
  });

  test('All 196 effect items resolve Name via getEffectName (both Tag and Effect)', () => {
    for (const eff of gameData.EFFECT_LIST) {
      const nameFromTag = gameData.getEffectName(eff.Tag);
      assert.equal(nameFromTag, eff.Name, `getEffectName mismatch for template ${eff.Tag}`);

      const nameFromEffect = gameData.getEffectName(eff.Effect);
      assert.equal(nameFromEffect, eff.Name, `getEffectName mismatch for runtime ${eff.Effect}`);
    }
  });

  console.log('\n======================================================================');
  console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('======================================================================');

  // Clean up bundle
  try {
    fs.rmSync(tempBundleDir, { recursive: true, force: true });
  } catch {}

  if (failedTests > 0) {
    console.error(`\n❌ CHALLENGER FOUND ${failedTests} FAILURE(S).`);
    process.exit(1);
  } else {
    console.log('\n✅ ALL CHALLENGER ROBUSTNESS TESTS PASSED.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
