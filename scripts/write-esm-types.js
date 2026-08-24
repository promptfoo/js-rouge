const { writeFileSync } = require('node:fs');

writeFileSync('dist/rouge.d.mts', "export * from './rouge.js';\n");
