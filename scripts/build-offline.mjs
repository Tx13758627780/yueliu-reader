import {createHash} from 'node:crypto';
import {build} from 'vite';
import {readdir,writeFile,mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
const web=process.argv.includes('--web');
await build({configFile:'vite.offline.config.ts',base:web?'/offline/':'./',build:{outDir:web?'../public/offline':'www',emptyOutDir:true}});
if(!web)await cp('public/install','native/www/install',{recursive:true});
if(web){const assets=(await readdir('public/offline/assets')).sort();await writeFile('public/offline/sw-version.js',`self.YUELIU_BUILD='${createHash('sha256').update(assets.join('')).digest('hex').slice(0,16)}';`);await writeFile('public/offline/assets.json',JSON.stringify(['/offline/index.html',...assets.map(f=>'/offline/assets/'+f)]));}
