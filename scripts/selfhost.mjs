import {spawnSync} from 'node:child_process';
import {cpSync} from 'node:fs';
import {resolve} from 'node:path';
const mode=process.argv[2];
if(!['dev','build','deploy'].includes(mode))throw new Error('Usage: node scripts/selfhost.mjs dev|build|deploy');
function run(file,args){const r=spawnSync(process.execPath,[resolve(file),...args],{stdio:'inherit',env:{...process.env,YUELIU_SELF_HOST:'1'}});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);}
if(mode==='deploy'&&!process.env.YUELIU_D1_ID)throw new Error('Set YUELIU_D1_ID to your Cloudflare D1 database ID; see README for notebook setup.');
if(mode!=='dev')run('scripts/build-offline.mjs',['--web']);
run('node_modules/vinext/dist/cli.js',[mode==='dev'?'dev':'build']);
if(mode==='deploy')cpSync('drizzle','dist/server/drizzle',{recursive:true});
if(mode==='deploy')run('node_modules/wrangler/bin/wrangler.js',['d1','migrations','apply','DB','--remote','--config','dist/server/wrangler.json']);
if(mode==='deploy')run('node_modules/wrangler/bin/wrangler.js',['deploy','--config','dist/server/wrangler.json']);
