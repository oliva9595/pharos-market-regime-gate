const fs = require('node:fs');

const manifest = JSON.parse(fs.readFileSync('deployments/atlantic-v2.json', 'utf8'));
if (manifest.chainId !== 688689) throw new Error('Atlantic manifest has wrong chain ID.');
if (manifest.status !== 'deployed') {
  console.log('Atlantic V2 is not deployed. Tooling is ready; live acceptance remains pending credentials and funding.');
  process.exit(2);
}
console.log('Atlantic V2 manifest reports deployed status.');
