// Extract declarative route metadata only. Never execute upstream TypeScript.
import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
const [foloFile,routesRoot]=process.argv.slice(2);
if(!foloFile||!routesRoot)throw new Error('Usage: node scripts/import-discovery.mjs folo-sources.json RSSHub/lib/routes');
const deny=/porn|hentai|jav(bus|db|tiful|trailers)?|missav|spankbang|literotica|nhentai|netflav|myfans|coomer|kemono|iwara|hanime|wnacg|18comic|sis001|t66y|sehuatang|2048|xsijishe|playno1|xbookcn|jpxgmn|misskon|cool18|141ppv|cosplaytele|7mmtv|chikubi|agirls|asmr-200|everia|95mm|fuliba|4khd|4kup|性感|成人|色情|裸体|女优|里番|色图|情色|草榴|司机社|核基地|绅士|裸露|无码|有碼|無碼/i;
function literal(n){
 if(!n)return undefined;
 if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isNumericLiteral(n))return n.text;
 if(n.kind===ts.SyntaxKind.TrueKeyword)return true;
 if(n.kind===ts.SyntaxKind.FalseKeyword)return false;
 if(ts.isArrayLiteralExpression(n))return n.elements.map(literal).filter(x=>x!==undefined);
 if(ts.isObjectLiteralExpression(n))return Object.fromEntries(n.properties.filter(ts.isPropertyAssignment).map(p=>[p.name?.text,literal(p.initializer)]));
 if(ts.isAsExpression(n)||ts.isSatisfiesExpression(n))return literal(n.expression);
}
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(path.join(dir,d.name)):/\.tsx?$/.test(d.name)&&!(/\.(test|spec)\.tsx?$/.test(d.name))?[path.join(dir,d.name)]:[]);}
function clean(s,n=160){return String(s||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,n);}
const platforms=[];let excluded=0;
for(const p of JSON.parse(readFileSync(foloFile,'utf8'))){
 if(deny.test(p.key+' '+p.name+' '+p.host)){excluded++;continue;}
 const dir=path.join(routesRoot,p.key),routes=[];
 if(existsSync(dir))for(const file of files(dir)){
  const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  function visit(node){
   if(ts.isVariableDeclaration(node)&&node.name?.text==='route'){
    const r=literal(node.initializer);
    if(r&&typeof r.name==='string'&&!deny.test(r.name))for(const pattern of [r.path].flat()){
     if(typeof pattern!=='string'||!/^\/[\w/:?.-]*$/.test(pattern))continue;
     const params=[...pattern.matchAll(/:([\w]+)(\?)?/g)].map(m=>{const v=r.parameters?.[m[1]];return {key:m[1],optional:!!m[2],label:clean(typeof v==='string'?v:v?.description)||m[1],default:typeof v?.default==='string'?v.default:'',options:Array.isArray(v?.options)?v.options.filter(o=>typeof o.value==='string').slice(0,100).map(o=>({value:o.value,label:clean(o.label||o.value)})):[]};});
     const f=r.features||{},config=f.requireConfig;
     routes.push({name:r.name,path:'/'+p.key+pattern,example:typeof r.example==='string'&&!deny.test(r.example)?r.example:undefined,params,requirements:[...(config&&(!Array.isArray(config)||config.some(c=>!c.optional))?['需实例配置凭据']:[]),...(Array.isArray(config)&&config.some(c=>c.optional)?['可选登录配置']:[]),...(f.requirePuppeteer?['需浏览器支持']:[]),...(f.antiCrawler?['可能受反爬限制']:[])],source:path.relative(routesRoot,file).replaceAll('\\','/')});
    }
   }
   ts.forEachChild(node,visit);
  }visit(source);
 }
 platforms.push({key:p.key,name:p.name,host:p.host,categories:p.categories,routes:routes.filter((r,i,a)=>a.findIndex(x=>x.path===r.path)===i)});
}
const out={date:new Date().toISOString().slice(0,10),source:'https://github.com/RSSNext/Folo/blob/dev/apps/landing/public/discover-sources.json',platforms};
writeFileSync('lib/discovery-data.json',JSON.stringify(out));
console.log(JSON.stringify({platforms:platforms.length,routes:platforms.reduce((n,p)=>n+p.routes.length,0),excluded,withoutRoutes:platforms.filter(p=>!p.routes.length).length}));
