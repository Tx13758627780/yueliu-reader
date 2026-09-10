import {existsSync,readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const cmd=process.platform==='win32'?'npx.cmd':'npx';
function run(args){const r=spawnSync(cmd,args,{cwd:'native',stdio:'inherit',shell:process.platform==='win32'});if(r.status!==0)process.exit(r.status||1);}
if(!existsSync('native/android'))run(['cap','add','android']);
const java='native/android/app/src/main/java/app/yueliu/reader';
mkdirSync(java,{recursive:true});
for(const file of ['MainActivity.java','YueliuFilesPlugin.java','BackExitGate.java'])copyFileSync('native/android-src/'+file,java+'/'+file);
const gradle='native/android/app/build.gradle',version=JSON.parse(readFileSync('native/package.json','utf8')).version;
const [major,minor,patch]=version.split('.').map(Number),code=major*1000000+minor*1000+patch;
if(!/^\d+\.\d+\.\d+$/.test(version)||code<1||code>2100000000)throw new Error('无效客户端版本');
writeFileSync(gradle,readFileSync(gradle,'utf8').replace(/versionCode \d+/,`versionCode ${code}`).replace(/versionName "[^"]+"/,`versionName "${version}"`));
const manifest='native/android/app/src/main/AndroidManifest.xml';let s=readFileSync(manifest,'utf8');if(!s.includes('android.permission.RECORD_AUDIO'))s=s.replace('</manifest>','    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n</manifest>');if(!s.includes('android:networkSecurityConfig'))s=s.replace('<application','<application android:networkSecurityConfig="@xml/network_security_config"');writeFileSync(manifest,s);mkdirSync('native/android/app/src/main/res/xml',{recursive:true});writeFileSync('native/android/app/src/main/res/xml/network_security_config.xml','<?xml version="1.0" encoding="utf-8"?><network-security-config><base-config cleartextTrafficPermitted="false"/><domain-config cleartextTrafficPermitted="true"><domain>localhost</domain><domain>127.0.0.1</domain></domain-config></network-security-config>');run(['cap','sync','android']);
