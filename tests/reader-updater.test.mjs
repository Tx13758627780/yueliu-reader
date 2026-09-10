import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
const dir='.sites-runtime/updater-tests';fs.mkdirSync(dir,{recursive:true});
await build({entryPoints:['lib/releases.ts'],outfile:dir+'/releases.mjs',platform:'node',format:'esm',logLevel:'silent'});
const {isNewerVersion,selectClientRelease}=await import('../'+dir+'/releases.mjs');
test('update comparison uses numeric versions and never offers the same version or a downgrade',()=>{
 assert.equal(isNewerVersion('0.2.10','0.2.9'),true);
 assert.equal(isNewerVersion('1.0.0','0.99.99'),true);
 assert.equal(isNewerVersion('0.2.4','0.2.4'),false);
 assert.equal(isNewerVersion('0.2.3','0.2.4'),false);
 assert.equal(isNewerVersion('invalid','0.2.4'),false);
});
test('release metadata preserves verified asset digests and renders update notes as plain text',()=>{
 const version='0.2.4',digest='a'.repeat(64),names=[`Yueliu-Reader-${version}-x64-setup.exe`,`Yueliu-Reader-${version}-x64-portable.exe`,`Yueliu-Reader-${version}-android.apk`];
 const release={tag_name:'v'+version,body:'Update notes <script>text only</script>',assets:names.map(name=>({name,state:'uploaded',size:5000,digest:'sha256:'+digest,browser_download_url:`https://github.com/Tx13758627780/yueliu-reader/releases/download/v${version}/${name}`}))};
 const selected=selectClientRelease([release]);assert.equal(selected.files[2].sha256,digest);assert.equal(selected.notes,release.body);
 assert.equal(selectClientRelease([{...release,assets:release.assets.map(a=>({...a,browser_download_url:'https://attacker.example/app.apk'}))}]),null);
});
test('native update policy accepts only official newer packages with bounded sizes and valid checksums',()=>{
 fs.writeFileSync(dir+'/UpdatePolicyTest.java',`package app.yueliu.reader;
 public class UpdatePolicyTest {
  static void reject(Runnable action){try{action.run();throw new AssertionError();}catch(IllegalArgumentException expected){}}
  public static void main(String[] args){
   if(UpdatePolicy.versionCode("0.2.4")!=2004)throw new AssertionError();
   UpdatePolicy.validate("0.2.4",UpdatePolicy.downloadUrl("0.2.4"),"",4436000,2003);
   reject(()->UpdatePolicy.validate("0.2.4",UpdatePolicy.downloadUrl("0.2.4"),"",4436000,2004));
   reject(()->UpdatePolicy.validate("0.2.4","https://attacker.example/app.apk","",4436000,2003));
   reject(()->UpdatePolicy.validate("0.2.4",UpdatePolicy.downloadUrl("0.2.4"),"invalid",4436000,2003));
   reject(()->UpdatePolicy.validate("0.2.4",UpdatePolicy.downloadUrl("0.2.4"),"",200000001,2003));
   reject(()->UpdatePolicy.versionCode("../../anything"));
  }
 }`);
 const compile=spawnSync('javac',['-d',dir,'native/android-src/UpdatePolicy.java',dir+'/UpdatePolicyTest.java'],{encoding:'utf8'});
 assert.equal(compile.status,0,compile.stderr||compile.error?.message);
 const run=spawnSync('java',['-cp',dir,'app.yueliu.reader.UpdatePolicyTest'],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr||run.error?.message);
});
