// Run on the maintainer's own computer. Never commit the generated key or JSON.
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';

const repo='Tx13758627780/yueliu-reader';
const folder=path.join(homedir(),'.yueliu-signing');
const file=path.join(folder,'android-signing.json');
function run(command,args,options={}) {
 const r=spawnSync(command,args,{stdio:'inherit',...options});
 if(r.error||r.status!==0)throw new Error(`${command} 执行失败。请安装 Java JDK 和 GitHub CLI，并先运行 gh auth login。`);
 return r;
}
try {
 run('gh',['auth','status']);
 // Refuse to replace an existing repository signing identity.
 const result=run('gh',['secret','list','--repo',repo,'--json','name'],{stdio:['ignore','pipe','pipe'],encoding:'utf8'});
 if(JSON.parse(result.stdout).some(s=>s.name==='ANDROID_SIGNING_JSON'))throw new Error('仓库已有固定签名，停止操作以免换掉签名。请使用原密钥备份，不要生成新密钥。');
 mkdirSync(folder,{recursive:true,mode:0o700});
 let settings;
 if(existsSync(file))settings=JSON.parse(readFileSync(file,'utf8'));
 else {
  const keystore=path.join(folder,'yueliu-release.p12');
  if(existsSync(keystore))throw new Error('已有密钥文件但缺少配置备份，请恢复 android-signing.json；不会覆盖原密钥。');
  const password=randomBytes(32).toString('hex');
  run('keytool',['-genkeypair','-keystore',keystore,'-storetype','PKCS12','-alias','yueliu','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Yueliu Reader','-storepass:env','YUELIU_SETUP_PASSWORD','-keypass:env','YUELIU_SETUP_PASSWORD'],{env:{...process.env,YUELIU_SETUP_PASSWORD:password}});
  settings={keystore:readFileSync(keystore).toString('base64'),alias:'yueliu',storePassword:password,keyPassword:password};
  writeFileSync(file,JSON.stringify(settings),{mode:0o600,flag:'wx'});
 }
 if(!settings?.keystore||!settings.alias||!settings.storePassword||!settings.keyPassword)throw new Error('本地签名备份格式不完整，请恢复原备份。');
 run('gh',['secret','set','ANDROID_SIGNING_JSON','--repo',repo],{input:JSON.stringify(settings),stdio:['pipe','inherit','inherit']});
 console.log('固定签名已配置。后续构建将使用同一个密钥。');
 console.log(`请将整个目录备份到你自己的安全位置：${folder}`);
 console.log('不要将密钥、JSON 或密码上传到公开仓库或聊天。新签名不能直接覆盖之前随机签名的测试版；先保留旧版并导出笔记备份。');
} catch(e) {console.error(e.message);process.exitCode=1;}
