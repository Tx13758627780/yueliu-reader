import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const mode=process.argv[2];
if(!['dev','build','deploy'].includes(mode))throw new Error('Usage: node scripts/selfhost.mjs dev|build|deploy');
function run(file,args){const r=spawnSync(process.execPath,[resolve(file),...args],{stdio:'inherit',env:{...process.env,YUELIU_SELF_HOST:'1'}});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);}
run('node_modules/vinext/dist/cli.js',[mode==='dev'?'dev':'build']);
if(mode==='deploy')run('node_modules/wrangler/bin/wrangler.js',['deploy','--config','dist/server/wrangler.json']);
