import {copyFile} from 'node:fs/promises';
import {build} from 'esbuild';
import path from 'node:path';
await build({entryPoints:['native/src/api.ts'],outfile:'native/electron/api.cjs',bundle:true,platform:'node',format:'cjs',target:'node22',alias:{'@':process.cwd()},logLevel:'warning'});

await copyFile('LICENSE','native/LICENSE');await copyFile('THIRD_PARTY.md','native/THIRD_PARTY.md');
