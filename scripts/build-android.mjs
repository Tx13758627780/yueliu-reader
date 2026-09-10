import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,rmSync,copyFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
if(!process.env.ANDROID_SIGNING_JSON)throw new Error('缺少固定 Android 签名。请先运行 node scripts/setup-android-signing.mjs 配置仓库密钥；已停止打包，避免发布无法覆盖更新的 APK。');
const gradleFile='native/android/app/build.gradle',original=readFileSync(gradleFile,'utf8');
const storePath=path.resolve('.sites-runtime/android-update-signing.keystore');
let env={...process.env},signed=false;
try {
 if(process.env.ANDROID_SIGNING_JSON){
  let settings;try{settings=JSON.parse(process.env.ANDROID_SIGNING_JSON);}catch{throw new Error('Android 签名配置不是有效 JSON');}
  if(!settings||typeof settings.keystore!=='string'||!settings.keystore.match(/^[A-Za-z0-9+/=\s]+$/)||typeof settings.alias!=='string'||!settings.alias||typeof settings.storePassword!=='string'||!settings.storePassword||typeof settings.keyPassword!=='string'||!settings.keyPassword)throw new Error('Android 签名配置缺少有效字段');
  const key=Buffer.from(settings.keystore,'base64');if(key.length<500||key.length>200000)throw new Error('Android 签名文件大小无效');
  mkdirSync(path.dirname(storePath),{recursive:true});writeFileSync(storePath,key,{mode:0o600});
  env={...env,YUELIU_SIGNING_STORE:storePath,YUELIU_SIGNING_STORE_PASSWORD:settings.storePassword,YUELIU_SIGNING_ALIAS:settings.alias,YUELIU_SIGNING_KEY_PASSWORD:settings.keyPassword};
  const signing=`android {
    signingConfigs { yueliuRelease {
      storeFile file(System.getenv('YUELIU_SIGNING_STORE'))
      storePassword System.getenv('YUELIU_SIGNING_STORE_PASSWORD')
      keyAlias System.getenv('YUELIU_SIGNING_ALIAS')
      keyPassword System.getenv('YUELIU_SIGNING_KEY_PASSWORD')
    } }
    buildTypes { release { signingConfig signingConfigs.yueliuRelease } }
  }`;
  writeFileSync(gradleFile,original+'\n'+signing+'\n');signed=true;
 }
 // Do not pass the combined signing secret to Gradle or its child processes.
 delete env.ANDROID_SIGNING_JSON;
 const windows=process.platform==='win32';
 if(!windows){const chmod=spawnSync('chmod',['+x','gradlew'],{cwd:'native/android'});if(chmod.status!==0)throw new Error('无法准备 Gradle');}
 const result=spawnSync(windows?'gradlew.bat':'./gradlew',[signed?'assembleRelease':'assembleDebug','--no-daemon'],{cwd:'native/android',env,stdio:'inherit',shell:windows});
 if(result.status!==0)throw new Error('Android 打包失败');
 const variant=signed?'release':'debug',dir=`native/android/app/build/outputs/apk/${variant}`;
 const apks=readdirSync(dir).filter(f=>f.endsWith('.apk')&&!f.includes('unsigned'));
 if(apks.length!==1)throw new Error('未找到唯一的已签名 APK');
 mkdirSync('native/releases',{recursive:true});copyFileSync(dir+'/'+apks[0],'native/releases/yueliu-android.apk');
 console.log(signed?'已生成使用固定签名的 APK':'未配置固定签名，已生成测试 APK；跨构建覆盖更新可能受限');
} finally {writeFileSync(gradleFile,original);rmSync(storePath,{force:true});}
