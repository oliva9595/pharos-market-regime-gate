const fs = require('node:fs');
const path = require('node:path');

const forbidden = [
  /PHAROS_(?:DEPLOYER|KEEPER)_PRIVATE_KEY=0x[0-9a-fA-F]{64}/,
  /\bprivateKey\s*[:=]\s*["']0x[0-9a-fA-F]{64}/
];
const excluded = new Set(['.git', 'node_modules', 'out', 'cache', 'dist', 'broadcast']);
function collect(dir = '.') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name)) return [];
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return collect(target);
    return /\.(?:js|cjs|ts|sol|md|json|example|toml)$/.test(entry.name) ? [target] : [];
  });
}
const files = collect();
const findings = files.flatMap(file => {
  const content = fs.readFileSync(file, 'utf8');
  return forbidden.filter(pattern => pattern.test(content)).map(pattern => `${file}: ${pattern}`);
});
if (findings.length) throw new Error(`Potential committed secrets:\n${findings.join('\n')}`);
console.log('Secret hygiene check passed.');
