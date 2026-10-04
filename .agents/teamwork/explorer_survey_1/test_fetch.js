import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function test() {
  const url = 'https://www.mcshuo.com/minecraft-dungeons-2/database/enchantments/soulinfusedpotion-69cefebde3/';
  console.log('Fetching', url);
  try {
    const res = await fetchUrl(url);
    console.log('Status:', res.status, 'Length:', res.data.length);
    console.log('First 500 chars:', res.data.slice(0, 500));
    
    // Look for description or paragraphs
    const jsonLdMatch = res.data.match(/"description"\s*:\s*"([^"]+)"/);
    if (jsonLdMatch) console.log('JSON-LD description:', jsonLdMatch[1]);

    const metaDesc = res.data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDesc) console.log('Meta description:', metaDesc[1]);

    const pMatches = res.data.match(/<p[^>]*>(.*?)<\/p>/gs);
    if (pMatches) {
      console.log('P tags found:', pMatches.length);
      pMatches.slice(0, 5).forEach((p, idx) => console.log(`P[${idx}]:`, p.replace(/<[^>]+>/g, '').trim()));
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

test();
