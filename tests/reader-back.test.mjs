import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
const dir='.sites-runtime/back-tests';fs.mkdirSync(dir,{recursive:true});
await build({entryPoints:['lib/back-navigation.ts'],outfile:dir+'/back.mjs',platform:'node',format:'esm',logLevel:'silent'});
const {createBackStack}=await import('../'+dir+'/back.mjs');
test('Android back closes only the top layer before navigating and reaching root',()=>{
 const stack=createBackStack(),actions=[];
 assert.equal(stack.back(),'loading');
 let article=true;
 stack.register(()=>{if(!article)return false;article=false;actions.push('list');return true;});
 const removeDialog=stack.register(()=>{actions.push('dialog');removeDialog();return true;},100);
 const removeSelect=stack.register(()=>{actions.push('select');removeSelect();return true;},110);
 assert.equal(stack.back(),'handled');assert.deepEqual(actions,['select']);
 assert.equal(stack.back(),'handled');assert.deepEqual(actions,['select','dialog']);
 assert.equal(stack.back(),'handled');assert.deepEqual(actions,['select','dialog','list']);
 assert.equal(stack.back(),'root');
});
test('nested dialogs unwind newest first and guarded notes prevent reaching exit',()=>{
 const stack=createBackStack(),actions=[];stack.register(()=>false);
 stack.register(()=>{actions.push('outer');return true;},100);
 const close=stack.register(()=>{actions.push('inner');close();return true;},100);
 stack.back();stack.back();assert.deepEqual(actions,['inner','outer']);
 const guarded=createBackStack();guarded.register(()=>false);const unblock=guarded.register(()=>true,30);
 assert.equal(guarded.back(),'handled');unblock();assert.equal(guarded.back(),'root');
});
test('native exit gate requires two root gestures, expires after three seconds and resets after navigation',()=>{
 fs.writeFileSync(dir+'/BackExitGateTest.java',`package app.yueliu.reader;
 public class BackExitGateTest {
  static void check(boolean value){if(!value)throw new AssertionError();}
  public static void main(String[] args){
   BackExitGate gate=new BackExitGate();
   check(!gate.shouldExit(1000));check(gate.shouldExit(2000));
   check(!gate.shouldExit(3000));check(!gate.shouldExit(6001));check(gate.shouldExit(7000));
   check(!gate.shouldExit(8000));gate.reset();check(!gate.shouldExit(8100));check(gate.shouldExit(8200));
  }
 }`);
 const compile=spawnSync('javac',['-d',dir,'native/android-src/BackExitGate.java',dir+'/BackExitGateTest.java'],{encoding:'utf8'});
 assert.equal(compile.status,0,compile.stderr||compile.error?.message);
 const run=spawnSync('java',['-cp',dir,'app.yueliu.reader.BackExitGateTest'],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr||run.error?.message);
});
