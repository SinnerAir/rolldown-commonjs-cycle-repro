import { writeFileSync } from 'node:fs';

// Each snippet uses APIs whose core-js polyfills (injected per-file by
// babel-plugin-polyfill-corejs3 usage-global) transitively pull the
// array-buffer / typed-array / uint8-array orphan family + Set/Map/Iterator helpers.
const snippets = [
  `export const a=(o)=>Object.hasOwn(o,'x');`,
  `export const a=(arr)=>arr.at(-1);`,
  `export const a=(arr)=>arr.findLast(x=>x>0);`,
  `export const a=(s1,s2)=>new Set(s1).union(new Set(s2));`,
  `export const a=(s1,s2)=>new Set(s1).difference(new Set(s2));`,
  `export const a=(s1,s2)=>new Set(s1).isSubsetOf(new Set(s2));`,
  `export const a=(m,k)=>(m.getOrInsert?m.getOrInsert(k,0):0);`,
  `export const a=(buf)=>buf.transfer();`,
  `export const a=(buf)=>buf.detached;`,
  `export const a=(ta)=>ta.at(0);`,
  `export const a=(ta,v)=>ta.fill(v);`,
  `export const a=(str)=>Uint8Array.fromBase64(str);`,
  `export const a=(u8)=>u8.toBase64();`,
  `export const a=(it)=>Iterator.from(it).map(x=>x*2).take(3).toArray();`,
  `export const a=(s)=>s.replaceAll('x','y');`,
  `export const a=()=>Promise.withResolvers();`,
  `export const a=(arr)=>arr.flatMap(x=>[x,x]);`,
  `export const a=(arr)=>arr.toReversed();`,
  `export const a=(arr)=>arr.toSorted();`,
  `export const a=(arr,i,v)=>arr.with(i,v);`,
];

const inputs = {};
snippets.forEach((snip, i) => {
  const n = i + 1;
  const entryBody =
    "import './src/shim.js';\n" +
    "import { a as helper } from './src/api" + n + ".js';\n" +
    "export const v" + n + " = typeof helper;\n";
  writeFileSync(new URL('./src/api' + n + '.js', import.meta.url), snip + '\n');
  writeFileSync(new URL('./entry' + n + '.js', import.meta.url), entryBody);
  inputs['entry' + n] = './entry' + n + '.js';
});
writeFileSync(new URL('./inputs.json', import.meta.url), JSON.stringify(inputs, null, 2));
console.log('generated', snippets.length, 'entries + api modules');
