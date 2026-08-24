const { spawnSync } = require('node:child_process');
const { dirname, join } = require('node:path');

let husky;
try {
  husky = require.resolve('husky');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    process.exit(0);
  }
  throw error;
}

const result = spawnSync(process.execPath, [join(dirname(husky), 'bin.js')], { stdio: 'inherit' });
process.exit(result.status ?? 1);
