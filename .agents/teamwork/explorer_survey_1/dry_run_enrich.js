import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const enchants = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/data/enchants.json'), 'utf8').replace(/^\uFEFF/, ''));
const effects = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/data/effects.json'), 'utf8').replace(/^\uFEFF/, ''));

const EFFECT_DESCRIPTIONS = {
  "Acrobat": "Reduces roll cooldown time, allowing more frequent dodges.",
  "Aim": "Improves projectile zoom, velocity, and aiming accuracy.",
  "Alchemist": "Each soul absorbed restores a portion of your maximum health.",
  "Ally": "Emits an empowering aura that boosts damage and defense for you and nearby allies.",
  "Assassin": "Increases the likelihood of landing lethal critical strikes.",
  "Bounty Hunter": "Deals increased damage against enemies that have already taken damage.",
  "Bowyer": "Rolling discharges a burst of arrows in all directions.",
  "Brawler": "Widens the reach and damage of sweeping melee attacks against groups of mobs.",
  "Bully": "Deals bonus damage against enemies that are stunned, frozen, or slowed.",
  "Cooldown": "Reduces the cooldown time of all equipped artifacts.",
  "Critical Edge": "Increases critical hit damage multiplier.",
  "Critical Hit": "Increases the chance of landing a critical hit on attack.",
  "Cryomancer": "Increases frost damage dealt and prolongs chill and freeze durations.",
  "Deflection": "Grants a chance to deflect incoming projectile attacks back at enemies.",
  "Duelist": "Deals extra damage when engaging a single isolated enemy.",
  "Electromancer": "Increases lightning damage dealt by attacks, enchantments, and artifacts.",
  "Elemental Protection": "Reduces incoming damage taken from fire, lightning, poison, and frost.",
  "Evasion": "Grants a chance to completely dodge and evade incoming enemy attacks.",
  "Finesse": "Increases melee attack accuracy and combo attack speed.",
  "Fletcher": "Grants a chance to replenish arrows upon hitting enemies.",
  "Healer": "Increases all healing received and given to allies.",
  "Impact": "Increases base attack impact and staggering force against enemies.",
  "Knockback": "Increases the distance enemies are pushed back when struck.",
  "Looter": "Increases the drop rate of consumables, potions, and items from defeated enemies.",
  "Luck": "Increases luck, improving the chances of finding rare and unique equipment.",
  "Marksman": "Increases ranged weapon damage and arrow flight velocity.",
  "Momentum": "Consecutive attacks build momentum, increasing your attack speed with each strike.",
  "Pack Leader": "Increases the damage, movement speed, and resilience of summoned companions.",
  "Persistence": "Increases attack damage when health falls below 50%.",
  "Point Blank": "Arrows and ranged attacks deal significantly more damage to enemies at close range.",
  "Potion Maker": "Decreases the cooldown period between health potion uses.",
  "Precision": "Increases critical strike chance on ranged attacks.",
  "Prickly": "Reflects a portion of damage taken back to the attacker.",
  "Projectile Protection": "Reduces damage taken from enemy ranged projectiles and arrows.",
  "Prospector": "Increases the chance of finding emeralds when defeating mobs.",
  "Protection": "Reduces all incoming damage by a flat percentage.",
  "Prowler": "Increases movement speed while sneaking or in stealth mode.",
  "Pyromancer": "Increases fire damage dealt and extends burn effect duration.",
  "Quiver": "Expands maximum quiver capacity, allowing you to carry more arrows.",
  "Raider": "Increases emerald collection yield from chests and fallen enemies.",
  "Ranger": "Grants a chance to fire multiple arrows simultaneously with each shot.",
  "Reaper": "Increases soul gathering rate when defeating enemies.",
  "Recovery": "Reduces delay before health regeneration begins after taking damage.",
  "Regeneration": "Continuously regenerates a percentage of health every second.",
  "Reload": "Increases bow drawing speed and crossbow reload rate.",
  "Resilience": "Reduces the duration of harmful status effects inflicted on you.",
  "Shackler": "Attacks have a chance to chain groups of enemies together, locking them in place.",
  "Sharpness": "Increases base melee weapon attack damage.",
  "Sharpshooter": "Fully charged ranged shots deal bonus damage and knock back targets.",
  "Shepherd": "Increases health and defense of sheep, llamas, and other pasture companions.",
  "Sniper": "Ranged attacks deal exponentially more damage the further the target is.",
  "Sorcerer": "Empowers magic artifacts, increasing damage and area of effect.",
  "Soulmancer": "Increases damage dealt by soul artifacts and soul abilities.",
  "Speed": "Increases base movement speed.",
  "Spiritual": "Increases maximum soul storage capacity.",
  "Stealth": "Rolling or sprinting briefly shrouds you in shadows, making you harder to detect.",
  "Strength": "Boosts physical attack power and melee stagger.",
  "Swiftness": "Increases melee attack speed.",
  "Tainted": "Defeated enemies explode in a toxic burst, damaging nearby adversaries.",
  "Totem Radius": "Expands the radius and effective area of all deployed totems.",
  "Vanguard": "Increases attack power and armor when surrounded by multiple enemies.",
  "Venomancer": "Increases poison damage dealt and extends poison duration on afflicted enemies.",
  "Veterinarian": "Healing you receive is partially shared with all active companions."
};

let effectsCovered = 0;
effects.forEach(eff => {
  if (EFFECT_DESCRIPTIONS[eff.Name]) {
    effectsCovered++;
  }
});

console.log(`Effects covered: ${effectsCovered} / ${effects.length} (${(effectsCovered/effects.length*100).toFixed(1)}%)`);
