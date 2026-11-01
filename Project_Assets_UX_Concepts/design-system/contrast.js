const t = require('./tokens.json');
const lum = h => { const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)); return .2126*c[0]+.7152*c[1]+.0722*c[2]; };
const cr = (a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05);};
const pairs = {
  light: [['text-primary','bg'],['text-secondary','bg'],['text-secondary','surface'],['on-brand','brand'],['link','bg'],['focus-ring','bg'],['success','bg'],['warning','bg'],['error','bg'],['control-border','bg']],
  dark: [['text-primary','bg'],['text-secondary','bg'],['text-secondary','surface'],['on-brand','brand'],['link','bg'],['focus-ring','bg'],['success','bg'],['warning','bg'],['error','bg'],['control-border','bg']]
};
const out=[]; let fails=0;
for (const th of ['light','dark']) for (const [fg,bg] of pairs[th]) {
  const r=cr(t.color[th][fg],t.color[th][bg]);
  const need = fg==='control-border'||fg==='focus-ring'?3:4.5;
  const ok=r>=need; if(!ok) fails++;
  out.push({theme:th,fg,bg,fgHex:t.color[th][fg],bgHex:t.color[th][bg],ratio:+r.toFixed(2),need,ok});
}
for (const [k,v] of Object.entries(t.color.dataviz)) { const r=cr(v,'#FFFFFF'); out.push({theme:'dataviz-on-white',fg:k,bg:'bg',fgHex:v,bgHex:'#FFFFFF',ratio:+r.toFixed(2),need:3,ok:r>=3}); if(r<3) fails++; }
require('fs').writeFileSync('contrast-report.json',JSON.stringify(out,null,1));
out.forEach(o=>console.log(`${o.ok?'PASS':'FAIL'} ${o.theme.padEnd(16)} ${o.fg.padEnd(15)} on ${o.bg.padEnd(8)} ${o.ratio}  (need ${o.need})`));
console.log('fails:',fails);
