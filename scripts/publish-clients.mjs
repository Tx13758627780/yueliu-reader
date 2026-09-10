import {readFileSync,writeFileSync,readdirSync,renameSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const version=JSON.parse(readFileSync('native/package.json','utf8')).version;
if(!/^\d+\.\d+\.\d+$/.test(version))throw new Error('Invalid version');
const tag='v'+version;
const existing=spawnSync('gh',['release','view',tag,'--json','tagName'],{encoding:'utf8'});
if(existing.status===0){process.stdout.write(`Release ${tag} already exists; preserving its assets. Bump native/package.json to publish a new version.\n`);process.exit(0);}
const apk=readdirSync('installers').filter(f=>f.endsWith('.apk'));
if(apk.length!==1)throw new Error('Expected one Android APK');
const names=[`Yueliu-Reader-${version}-x64-setup.exe`,`Yueliu-Reader-${version}-x64-portable.exe`,`Yueliu-Reader-${version}-android.apk`];
renameSync('installers/'+apk[0],'installers/'+names[2]);
for(const name of names)if(!existsSync('installers/'+name))throw new Error('Missing installer '+name);
writeFileSync('installers/SHA256SUMS.txt',names.map(name=>createHash('sha256').update(readFileSync('installers/'+name)).digest('hex')+'  '+name).join('\n')+'\n');
const result=spawnSync('gh',['release','create',tag,...names.map(n=>'installers/'+n),'installers/SHA256SUMS.txt','--target',process.env.GITHUB_SHA,'--prerelease','--title',`阅流 ${version} · 客户端测试版`,'--notes-file','native/RELEASE_NOTES.md'],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
