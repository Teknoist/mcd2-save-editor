import { useState } from 'react';
import { getIconUrl, getGear, getEnchant, getEffect } from '../core/gameData';

// ---- SVG fallback icons by item category ----
function svgPath(category: string, name: string): string {
  const t = name.toLowerCase();

  if (category === 'Melee' || category === 'Melee Weapon') {
    if (t.includes('scythe') || t.includes('glaive')) return `<path d="M8 2 L14 8 L12 10 L10 8 L6 12 L4 14 L2 12 L4 10 L6 8 L8 6 Z" fill="currentColor" opacity="0.9"/><line x1="4" y1="12" x2="2" y2="14" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.7"/>`;
    if (t.includes('pike') || t.includes('staff') || t.includes('polearm')) return `<rect x="7" y="1" width="2" height="14" rx="1" fill="currentColor" opacity="0.8"/><polygon points="8,0 6,4 10,4" fill="currentColor"/><rect x="6" y="9" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.5"/>`;
    if (t.includes('dagger') || t.includes('claw') || t.includes('sickle')) return `<path d="M9 2 L12 8 L10 9 L8 14 L6 9 L4 8 L7 2 Z" fill="currentColor"/>`;
    if (t.includes('pick')) return `<path d="M2 6 L6 2 L14 6 L12 8 L8 6 L6 8 L4 14 L2 12 Z" fill="currentColor" opacity="0.85"/>`;
    if (t.includes('hammer') || t.includes('mace') || t.includes('club')) return `<rect x="5" y="1" width="6" height="5" rx="1" fill="currentColor"/><rect x="7" y="6" width="2" height="9" rx="1" fill="currentColor" opacity="0.8"/>`;
    if (t.includes('axe')) return `<path d="M10 2 L14 6 L10 10 L8 8 L6 14 L4 14 L4 8 L6 6 Z" fill="currentColor"/>`;
    return `<rect x="7" y="1" width="2" height="11" rx="0.5" fill="currentColor"/><rect x="4" y="8" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.7"/><rect x="7" y="12" width="2" height="3" rx="1" fill="currentColor" opacity="0.5"/>`;
  }

  if (category === 'Ranged' || category === 'Ranged Weapon') {
    if (t.includes('crossbow')) return `<rect x="2" y="7" width="12" height="2" rx="0.5" fill="currentColor"/><rect x="7" y="3" width="2" height="10" rx="0.5" fill="currentColor" opacity="0.7"/><path d="M4 7 L7 5 M12 7 L9 5" stroke="currentColor" stroke-width="1.5" fill="none"/>`;
    return `<path d="M3 3 Q14 8 3 13" stroke="currentColor" stroke-width="2" fill="none"/><line x1="3" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1" opacity="0.6"/>`;
  }

  if (category === 'Armor') {
    if (t.includes('helmet') || t.includes('hat') || t.includes('cap') || t.includes('hood')) return `<path d="M3 10 L3 6 Q3 2 8 2 Q13 2 13 6 L13 10 Z" fill="currentColor" opacity="0.85"/><rect x="3" y="10" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.6"/><rect x="9" y="10" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>`;
    if (t.includes('boot') || t.includes('sandal') || t.includes('shoe')) return `<rect x="3" y="5" width="4" height="7" rx="1" fill="currentColor" opacity="0.85"/><rect x="9" y="5" width="4" height="7" rx="1" fill="currentColor" opacity="0.85"/><rect x="2" y="11" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.6"/><rect x="9" y="11" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>`;
    if (t.includes('legging') || t.includes('pant') || t.includes('trouser')) return `<rect x="3" y="2" width="10" height="5" rx="1" fill="currentColor" opacity="0.7"/><rect x="3" y="7" width="4" height="7" rx="1" fill="currentColor" opacity="0.85"/><rect x="9" y="7" width="4" height="7" rx="1" fill="currentColor" opacity="0.85"/>`;
    return `<path d="M2 5 L2 13 L14 13 L14 5 L11 3 L5 3 Z" fill="currentColor" opacity="0.85"/><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" stroke-width="0.75" opacity="0.4"/>`;
  }

  if (category === 'Artifact') {
    if (t.includes('beacon') || t.includes('staff') || t.includes('lute')) return `<rect x="7" y="2" width="2" height="10" rx="0.5" fill="currentColor"/><circle cx="8" cy="2" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="2" r="1" fill="currentColor" opacity="0.8"/>`;
    return `<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.9"/><circle cx="8" cy="8" r="2.5" fill="currentColor" opacity="0.7"/><path d="M8 2 L8 4 M8 12 L8 14 M2 8 L4 8 M12 8 L14 8" stroke="currentColor" stroke-width="1.5"/>`;
  }

  if (category === 'Talisman') return `<polygon points="8,1 15,8 8,15 1,8" fill="none" stroke="currentColor" stroke-width="1.5"/><polygon points="8,4 12,8 8,12 4,8" fill="currentColor" opacity="0.6"/><circle cx="8" cy="8" r="2" fill="currentColor"/>`;
  if (category === 'Enchantment' || t.includes('book')) return `<rect x="3" y="2" width="10" height="12" rx="1" fill="currentColor" opacity="0.85"/><rect x="5" y="4" width="6" height="1" rx="0.3" fill="white" opacity="0.4"/><rect x="5" y="6" width="6" height="1" rx="0.3" fill="white" opacity="0.4"/><rect x="5" y="8" width="4" height="1" rx="0.3" fill="white" opacity="0.4"/>`;
  if (category === 'Cape') return `<path d="M4 3 L12 3 L13 13 L8 11 L3 13 Z" fill="currentColor" opacity="0.8"/>`;
  if (category === 'Pet') return `<circle cx="8" cy="8" r="5" fill="currentColor" opacity="0.7"/><circle cx="6" cy="7" r="1" fill="white" opacity="0.8"/><circle cx="10" cy="7" r="1" fill="white" opacity="0.8"/><path d="M5 10 Q8 12 11 10" stroke="white" stroke-width="1" fill="none"/>`;

  return `<circle cx="8" cy="8" r="5" fill="currentColor" opacity="0.5"/><text x="8" y="12" text-anchor="middle" font-size="8" fill="currentColor">?</text>`;
}

function categoryColor(category: string): string {
  switch (category) {
    case 'Melee': return '#cc9955';
    case 'Ranged': return '#88cc66';
    case 'Armor': return '#6699cc';
    case 'Artifact': return '#dd66ff';
    case 'Talisman': return '#ffdd44';
    case 'Enchantment': return '#44aaff';
    case 'Cape': return '#ff7755';
    case 'Pet': return '#55ddaa';
    default: return '#888899';
  }
}

interface ItemIconProps {
  typeTag: string;
  size?: number;
  className?: string;
}

export function ItemIcon({ typeTag, size = 32, className = '' }: ItemIconProps) {
  const gear = getGear(typeTag);
  const iconUrl = gear?.IconUrl ?? getIconUrl(typeTag);
  const category = gear?.Category ?? 'Unknown';
  const name = gear?.Name ?? typeTag ?? '';
  const [imgFailed, setImgFailed] = useState(false);

  if (iconUrl && !imgFailed) {
    return (
      <img
        src={iconUrl}
        alt={name}
        width={size}
        height={size}
        className={className}
        style={{ display: 'block', imageRendering: 'pixelated', objectFit: 'contain' }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // SVG fallback
  const color = categoryColor(category);
  const path = svgPath(category, name + ' ' + typeTag);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color, display: 'block', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

// ---- Enchant icon ----
export function EnchantIcon({ effectTag, size = 16, className = '' }: { effectTag: string; size?: number; className?: string }) {
  const entry = getEnchant(effectTag) ?? getEffect(effectTag);
  const iconUrl: string | undefined = entry?.IconUrl;
  const [imgFailed, setImgFailed] = useState(false);

  if (iconUrl && !imgFailed) {
    return (
      <img
        src={iconUrl}
        alt={entry?.Name ?? effectTag}
        width={size}
        height={size}
        className={className}
        style={{ display: 'block', imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0 }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // SVG fallback
  const t = effectTag.toLowerCase();
  let path = '';
  let color = '#cc77ff';

  if (t.includes('fire')) { path = `<path d="M8 1 Q10 5 12 8 Q12 13 8 15 Q4 13 4 8 Q6 5 8 1Z" fill="currentColor"/>`; color = '#ff6633'; }
  else if (t.includes('frost') || t.includes('chill') || t.includes('ice')) { path = `<path d="M8 2 L8 14 M2 8 L14 8 M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="1.5" fill="none"/>`; color = '#55ddff'; }
  else if (t.includes('lightning') || t.includes('thunder') || t.includes('electric')) { path = `<path d="M10 1 L5 9 L9 9 L6 15 L13 7 L9 7 Z" fill="currentColor"/>`; color = '#ffff44'; }
  else if (t.includes('soul')) { path = `<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 6 Q8 4 11 6 Q11 10 8 12 Q5 10 5 6Z" fill="currentColor" opacity="0.8"/>`; color = '#44ffdd'; }
  else if (t.includes('poison') || t.includes('toxic')) { path = `<circle cx="8" cy="8" r="5" fill="currentColor" opacity="0.7"/><circle cx="6" cy="7" r="1.5" fill="white" opacity="0.5"/><circle cx="10" cy="7" r="1.5" fill="white" opacity="0.5"/>`; color = '#88cc22'; }
  else if (t.includes('health') || t.includes('vivify') || t.includes('reconstruct') || t.includes('heal')) { path = `<path d="M8 4 L8 12 M4 8 L12 8" stroke="currentColor" stroke-width="2.5" fill="none"/>`; color = '#ff4477'; }
  else if (t.includes('shield') || t.includes('deflect') || t.includes('protect')) { path = `<path d="M8 2 L13 5 L13 10 Q13 14 8 15 Q3 14 3 10 L3 5 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 5 L10 7 L8 11 L6 7 Z" fill="currentColor" opacity="0.7"/>`; color = '#4488cc'; }
  else if (t.includes('sharp') || t.includes('power') || t.includes('strength')) { path = `<path d="M4 12 L12 4 M9 3 L13 7" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="6" cy="10" r="1" fill="currentColor"/>`; color = '#ffcc44'; }
  else if (t.includes('critical')) { path = `<path d="M4 12 L12 4 M6 4 L12 4 L12 10" stroke="currentColor" stroke-width="2" fill="none"/>`; color = '#ff4444'; }
  else { path = `<circle cx="8" cy="8" r="3" fill="currentColor" opacity="0.8"/><path d="M8 2 L8 5 M8 11 L8 14 M2 8 L5 8 M11 8 L14 8 M4 4 L6 6 M10 10 L12 12 M12 4 L10 6 M4 12 L6 10" stroke="currentColor" stroke-width="1" fill="none" opacity="0.6"/>`; color = '#cc77ff'; }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color, display: 'block', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}
