// ===== 資料由 index.html 載入：window.RAW（價格）、window.META（商品設定）、window.EVENTS（事件） =====
var GEN=META.generated||'';
var BK=META.base.key,BN=META.base.name||'台股';
var A=META.assets.filter(function(x){return RAW[x.key]}).map(function(x){return {k:x.key,n:x.name,e:x.code||x.ticker,t:x.ticker,us:+x.us||0,yld:+x.yld||0,c:x.color||'#94a3b8',m:x.desc||'',focus:+x.focus||0,hint:x.hint||''}});
var AK={};A.forEach(function(a){AK[a.k]=a});
var FOCUS=A.filter(function(a){return a.focus}).map(function(a){return a.k});if(!FOCUS.length)FOCUS=A.slice(0,5).map(function(a){return a.k});
var THEME=EVENTS.themes||{};
var EV=(EVENTS.points||[]).map(function(p){return [p.date,p.title]});
var EC=(EVENTS.periods||[]).map(function(p){return {t:p.type,s:p.start,e:p.end,tag:p.tag||'',ti:p.title||'',b:p.body||''}});

function dn(i){return Date.UTC(Math.floor(i/1e4),Math.floor(i/100)%100-1,i%100)}
function ds(i){var s=String(i);return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6)}
function di(s){return +s.replace(/-/g,'')}
function wk(i){return Math.floor((dn(i)/864e5+3)/7)}
function $(id){return document.getElementById(id)}
function fmt(x,d){return (x==null||!isFinite(x))?'—':x.toFixed(d==null?2:d)}
function sg(x,d){return (x==null||!isFinite(x))?'—':(x>0?'+':'')+x.toFixed(d==null?2:d)}
function pct(x){if(x==null||!isFinite(x))return '—';var v=x*100;return (v>0?'+':'')+(Math.abs(v)>=1000?Math.round(v).toLocaleString():v.toFixed(1))+'%'}
function cls(x){return x>0?'pos':(x<0?'neg':'')}
function rcol(r,a){if(r==null||!isFinite(r))return 'transparent';var t=Math.min(1,Math.abs(r)/0.8)*(a||0.85);return r>0?'rgba(244,63,94,'+t+')':'rgba(16,185,129,'+t+')'}
function lvl(r){var a=Math.abs(r);if(a<0.2)return ['低度／獨立','tz'];return [(a>=0.6?'高度':a>=0.4?'中度':'溫和')+(r>0?'正相關':'負相關'),r>0?'tp':'tn']}
function idxLE(d,x,strict){var lo=0,hi=d.length-1,a=-1;while(lo<=hi){var m=(lo+hi)>>1;if(strict?d[m]<x:d[m]<=x){a=m;lo=m+1}else hi=m-1}return a}
function chg(a,v1,v0){return (a&&a.yld)?(v1-v0):(v1/v0-1)}
function pf(k,v){if(v==null||!isFinite(v))return '—';return (AK[k]&&AK[k].yld)?((v>0?'+':'')+v.toFixed(2)+' 點'):pct(v)}

var TW=RAW[BK],N=TW.d.length,FIRST=TW.d[0],LAST=TW.d[N-1],Y0=Math.max(2006,Math.floor(FIRST/1e4)),Y1=Math.floor(LAST/1e4),YEARS=[],ALIGN={};
for(var y=Y0;y<=Y1;y++)YEARS.push(y);var ALLS=Y0*1e4+101;
var ST={mode:'range',s0:ALLS,s1:LAST,f:'W',asset:A[0].k};

function buildDaily(mode){var o={dates:TW.d,tw:new Float64Array(N),a:{}};o.tw[0]=NaN;for(var i=1;i<N;i++)o.tw[i]=TW.c[i]/TW.c[i-1]-1;
 A.forEach(function(a){var R=RAW[a.k],arr=new Float64Array(N),strict=mode==='lead'||(mode==='smart'&&a.us);arr[0]=NaN;var p=idxLE(R.d,TW.d[0],strict);
  for(var i=1;i<N;i++){var c=idxLE(R.d,TW.d[i],strict);arr[i]=(c>p&&p>=0)?chg(a,R.c[c],R.c[p]):NaN;p=c}o.a[a.k]=arr});return o}
function buildPeriod(kf){var keys=[],last={};for(var i=0;i<N;i++){var k=kf(TW.d[i]);if(!keys.length||keys[keys.length-1]!==k)keys.push(k);last[k]=i}
 var M=keys.length,o={dates:[],tw:new Float64Array(M),a:{}};for(var j=0;j<M;j++){o.dates.push(TW.d[last[keys[j]]]);o.tw[j]=j?TW.c[last[keys[j]]]/TW.c[last[keys[j-1]]]-1:NaN}
 A.forEach(function(a){var R=RAW[a.k],lk={};for(var i=0;i<R.d.length;i++)lk[kf(R.d[i])]=R.c[i];var arr=new Float64Array(M);
  for(var j=0;j<M;j++){var v1=lk[keys[j]],v0=j?lk[keys[j-1]]:undefined;arr[j]=(v1!=null&&v0!=null)?chg(a,v1,v0):NaN}o.a[a.k]=arr});return o}
function ser(f){f=f||ST.f;var m=$('mode').value,key=f==='D'?'D'+m:f;if(!ALIGN[key])ALIGN[key]=f==='D'?buildDaily(m):buildPeriod(f==='W'?wk:function(i){return Math.floor(i/100)});return ALIGN[key]}
function stats(S,k,s,e){var x=S.a[k],y=S.tw,n=0,mx=0,my=0,i,i0=-1,i1=-1;
 for(i=0;i<S.dates.length;i++){if(S.dates[i]<s)continue;if(S.dates[i]>e)break;if(isFinite(x[i])&&isFinite(y[i])){n++;mx+=x[i];my+=y[i];if(i0<0)i0=i;i1=i}}
 if(n<8)return null;mx/=n;my/=n;var sxy=0,sxx=0,syy=0,same=0;
 for(i=i0;i<=i1;i++){if(!isFinite(x[i])||!isFinite(y[i]))continue;var a=x[i]-mx,b=y[i]-my;sxy+=a*b;sxx+=a*a;syy+=b*b;if((x[i]>0&&y[i]>0)||(x[i]<0&&y[i]<0))same++}
 return {r:sxy/Math.sqrt(sxx*syy),beta:sxy/sxx,same:same/n,n:n}}
function perf(k,s,e){var R=RAW[k];if(!R||R.d[0]>e)return null;var j0=idxLE(R.d,s,true);if(j0<0)j0=0;var j1=idxLE(R.d,e,false);if(j1<=j0)return null;return chg(AK[k],R.c[j1],R.c[j0])}
function lateStart(k,s){return RAW[k].d[0]>s}

// ---------- svg helpers ----------
function el(t,a,x){var s='<'+t;for(var k in a)s+=' '+k+'="'+a[k]+'"';return s+(x!=null?'>'+x+'</'+t+'>':'/>')}
function nice(lo,hi,n){var sp=hi-lo||1,st=Math.pow(10,Math.floor(Math.log10(sp/n))),e=sp/n/st;st*=e>5?10:e>2?5:e>1?2:1;var t=[];for(var v=Math.ceil(lo/st)*st;v<=hi+1e-9;v+=st)t.push(+v.toFixed(10));return t}
var tip=$('tip');function showTip(ev,h){tip.innerHTML=h;tip.style.display='block';var x=ev.clientX+14;if(x+350>innerWidth)x=ev.clientX-350;tip.style.left=x+'px';tip.style.top=(ev.clientY+14)+'px'}
function hideTip(){tip.style.display='none'}
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(function(){t.classList.remove('show')},2600)}


function lineSvg(o){var m={l:60,r:64,t:12,b:24},W=o.w-m.l-m.r,H=o.h-m.t-m.b,x0=o.xs[0],x1=o.xs[o.xs.length-1];
 function X(t){return m.l+(t-x0)/(x1-x0||1)*W}
 var ax={};o.series.forEach(function(s){var k=s.axis||'L',lo=Infinity,hi=-Infinity;s.ys.forEach(function(v){if(isFinite(v)){if(v<lo)lo=v;if(v>hi)hi=v}});
  if(ax[k]){ax[k].lo=Math.min(ax[k].lo,lo);ax[k].hi=Math.max(ax[k].hi,hi)}else ax[k]={lo:lo,hi:hi,log:k==='L'&&o.logL,inv:k==='R'&&o.invR}});
 if(o.fix){ax.L.lo=o.fix[0];ax.L.hi=o.fix[1]}
 for(var k in ax){(function(a,k){if(!isFinite(a.lo)){a.lo=0;a.hi=1}
  if(a.log&&a.lo>0){var l0=Math.log(a.lo),l1=Math.log(a.hi),pd=(l1-l0)*0.04||0.1;l0-=pd;l1+=pd;a.lo=Math.exp(l0);a.hi=Math.exp(l1);a.f=function(v){return m.t+(l1-Math.log(v))/(l1-l0)*H}}
  else{if(!(o.fix&&k==='L')){var p=(a.hi-a.lo)*0.05||1;a.lo-=p;a.hi+=p}a.log=false;a.f=a.inv?function(v){return m.t+(v-a.lo)/(a.hi-a.lo)*H}:function(v){return m.t+(a.hi-v)/(a.hi-a.lo)*H}}})(ax[k],k)}
 var s=el('rect',{x:0,y:0,width:o.w,height:o.h,fill:'#111827'});
 var tl=ax.L.log?logTicks(ax.L.lo,ax.L.hi):nice(ax.L.lo,ax.L.hi,6);
 tl.forEach(function(t){var y=ax.L.f(t);if(y<m.t-1||y>m.t+H+1)return;s+=el('line',{x1:m.l,x2:m.l+W,y1:y,y2:y,stroke:t===o.zero?'#64748b':'#1e293b'})+el('text',{x:m.l-6,y:y+4,'text-anchor':'end',fill:o.cL||'#94a3b8'},o.fmtL?o.fmtL(t):t)});
 if(ax.R){nice(ax.R.lo,ax.R.hi,6).forEach(function(t){var y=ax.R.f(t);if(y<m.t-1||y>m.t+H+1)return;s+=el('text',{x:m.l+W+6,y:y+4,fill:o.series[1].color},(Math.abs(t)>=1000?t.toFixed(0):+t.toPrecision(4)))})}
 var y0=new Date(x0).getUTCFullYear(),y1=new Date(x1).getUTCFullYear();
 if(y1-y0>=2){var stp=Math.max(1,Math.ceil((y1-y0+1)/15));for(var yy=y0+1;yy<=y1;yy+=stp){var xx=X(Date.UTC(yy,0,1));s+=el('line',{x1:xx,x2:xx,y1:m.t,y2:m.t+H,stroke:'#1e293b'})+el('text',{x:xx,y:o.h-7,'text-anchor':'middle'},yy)}}
 else{var d=new Date(Date.UTC(y0,new Date(x0).getUTCMonth(),1));var mstep=(x1-x0)>2e10?2:1;while(d.getTime()<=x1){var x2=X(d.getTime());if(x2>=m.l)s+=el('line',{x1:x2,x2:x2,y1:m.t,y2:m.t+H,stroke:'#1e293b'})+el('text',{x:x2,y:o.h-7,'text-anchor':'middle'},(d.getUTCFullYear()%100)+'/'+(d.getUTCMonth()+1));d.setUTCMonth(d.getUTCMonth()+mstep)}}
 (o.marks||[]).forEach(function(mk){var xx=X(mk.t);if(xx<m.l||xx>m.l+W)return;
  if(mk.kind==='ev')s+='<line x1="'+xx+'" x2="'+xx+'" y1="'+m.t+'" y2="'+(m.t+H)+'" stroke="#f43f5e" stroke-dasharray="3,3" opacity=".5"><title>'+mk.lbl+'</title></line>';
  else if(mk.y!=null){var yy2=ax.L.f(mk.y);s+='<path d="M'+xx+','+(yy2+(mk.up?-5:5))+' l-5,'+(mk.up?-8:8)+' l10,0z" fill="#eab308"><title>'+mk.lbl+'</title></path>'}});
 o.series.forEach(function(se){var f=ax[se.axis||'L'].f,p='',pen=false;for(var i=0;i<o.xs.length;i++){var v=se.ys[i];if(!isFinite(v)){pen=false;continue}p+=(pen?'L':'M')+X(o.xs[i]).toFixed(1)+','+f(v).toFixed(1);pen=true}
  s+='<path d="'+p+'" fill="none" stroke="'+se.color+'" stroke-width="'+(se.w||1.5)+'"/>'});
 if(o.title)s+=el('text',{x:m.l+4,y:m.t+12,fill:'#cbd5e1'},o.title);
 s+='<line id="'+o.id+'cr" x1="0" x2="0" y1="'+m.t+'" y2="'+(m.t+H)+'" stroke="#94a3b8" style="display:none"/>';
 var html='<svg id="'+o.id+'" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+o.w+' '+o.h+'" style="display:block">'+s+'<rect x="'+m.l+'" y="'+m.t+'" width="'+W+'" height="'+H+'" fill="transparent"/></svg>';
 return {html:html,bind:function(){var sv=$(o.id),cr=$(o.id+'cr');sv.onmouseleave=function(){hideTip();cr.style.display='none'};
  sv.onmousemove=function(ev){var b=sv.getBoundingClientRect(),px=(ev.clientX-b.left)/b.width*o.w;if(px<m.l||px>m.l+W){hideTip();return}var t=x0+(px-m.l)/W*(x1-x0);
   var lo=0,hi=o.xs.length-1;while(lo<hi){var md=(lo+hi)>>1;if(o.xs[md]<t)lo=md+1;else hi=md}cr.setAttribute('x1',X(o.xs[lo]));cr.setAttribute('x2',X(o.xs[lo]));cr.style.display='';
   var h='<b>'+new Date(o.xs[lo]).toISOString().slice(0,10)+'</b>';o.series.forEach(function(se){h+='<br><span style="color:'+se.color+'">●</span> '+se.name+'：'+(isFinite(se.ys[lo])?se.fmt(se.ys[lo]):'—')});
   (o.marks||[]).forEach(function(mk){if(Math.abs(mk.t-o.xs[lo])<(x1-x0)/W*4)h+='<br><span style="color:'+(mk.kind==='ev'?'#fb7185':'#eab308')+'">◆ '+mk.lbl+'</span>'});showTip(ev,h)}}}}
function logTicks(lo,hi){var out=[],b=[1,2,5];for(var e=Math.floor(Math.log10(lo));e<=Math.ceil(Math.log10(hi));e++)b.forEach(function(x){var v=x*Math.pow(10,e);if(v>=lo&&v<=hi)out.push(v)});
 if(out.length<4){out=nice(lo,hi,5)}return out}
function hbar(id,items,o){// items:{n,v,c,ghost,txt}
 var w=640,rh=30,m={l:118,r:70,t:22,b:26},h=m.t+m.b+items.length*rh,W=w-m.l-m.r;var lo=o.lo,hi=o.hi;function X(v){return m.l+(Math.max(lo,Math.min(hi,v))-lo)/(hi-lo)*W}
 var s=el('rect',{x:0,y:0,width:w,height:h,fill:'#111827'});
 o.ticks.forEach(function(t){var x=X(t[0]);s+=el('line',{x1:x,x2:x,y1:m.t-4,y2:h-m.b,stroke:t[0]===o.zero?'#64748b':'#1e293b'})+el('text',{x:x,y:h-8,'text-anchor':'middle'},t[1])});
 items.forEach(function(it,i){var y=m.t+i*rh+5,bh=rh-11;s+=el('text',{x:m.l-8,y:y+bh/2+4,'text-anchor':'end',fill:'#e2e8f0'},it.n);
  if(it.v!=null&&isFinite(it.v)){var x0=X(o.zero),x1=X(it.v);s+='<rect x="'+Math.min(x0,x1)+'" y="'+y+'" width="'+Math.max(1,Math.abs(x1-x0))+'" height="'+bh+'" rx="4" fill="'+it.c+'"><title>'+it.n+' '+it.txt+'</title></rect>';
   s+=el('text',{x:(it.v>=o.zero?Math.max(x0,x1)+5:Math.min(x0,x1)-5),y:y+bh/2+4,'text-anchor':it.v>=o.zero?'start':'end',fill:'#e2e8f0'},it.txt)}
  else s+=el('text',{x:X(o.zero)+5,y:y+bh/2+4},'無資料');
  if(it.ghost!=null&&isFinite(it.ghost)){var gx=X(it.ghost);s+=el('line',{x1:gx,x2:gx,y1:y-3,y2:y+bh+3,stroke:'#f8fafc','stroke-width':2.5})}});
 return '<svg id="'+id+'" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+w+' '+h+'">'+s+'</svg>'}
function gbar(id,groups,labels,colors){var w=640,hg=360,m={l:40,r:10,t:12,b:74},W=w-m.l-m.r,H=hg-m.t-m.b,mx=0.3;
 groups.forEach(function(g){g.v.forEach(function(v){if(v!=null&&isFinite(v))mx=Math.max(mx,Math.abs(v))})});mx=Math.ceil(mx*10+0.5)/10;var lo=-mx,hi=mx;
 function Y(v){return m.t+(hi-v)/(hi-lo)*H}var s=el('rect',{x:0,y:0,width:w,height:hg,fill:'#111827'});
 nice(lo,hi,6).forEach(function(t){s+=el('line',{x1:m.l,x2:w-m.r,y1:Y(t),y2:Y(t),stroke:t===0?'#64748b':'#1e293b'})+el('text',{x:m.l-5,y:Y(t)+4,'text-anchor':'end'},t.toFixed(1))});
 var gw=W/groups.length,bw=gw*0.8/labels.length;groups.forEach(function(g,i){g.v.forEach(function(v,j){if(v==null||!isFinite(v))return;var x=m.l+i*gw+gw*0.1+j*bw;
  s+='<rect x="'+x+'" y="'+Math.min(Y(v),Y(0))+'" width="'+(bw-1)+'" height="'+Math.max(1,Math.abs(Y(v)-Y(0)))+'" fill="'+colors[j]+'"><title>'+g.n+' '+labels[j]+' r='+v.toFixed(3)+'</title></rect>'});
  s+='<text transform="translate('+(m.l+i*gw+gw/2-4)+','+(hg-m.b+14)+') rotate(35)">'+g.n+'</text>'});
 labels.forEach(function(l,j){s+=el('rect',{x:m.l+8+j*230,y:2,width:10,height:10,fill:colors[j]})+el('text',{x:m.l+22+j*230,y:11,fill:'#e2e8f0'},l)});
 return '<svg id="'+id+'" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+w+' '+hg+'" style="padding-top:4px">'+s+'</svg>'}


function rngLbl(){return ST.mode==='single'?(Math.floor(ST.s0/1e4)+' 單一年度'):(ds(ST.s0)+' ~ '+ds(ST.s1))}
function slug(){return ST.mode==='single'?Math.floor(ST.s0/1e4)+'年':ds(ST.s0)+'_'+ds(ST.s1)}
function fLbl(){return {D:'日',W:'週',M:'月'}[ST.f]+'報酬'}
var CUR={};
function compute(){var S=ser(),out={};A.forEach(function(a){out[a.k]={st:stats(S,a.k,ST.s0,ST.s1),all:stats(S,a.k,ALLS,LAST),ret:perf(a.k,ST.s0,ST.s1),late:lateStart(a.k,ST.s0)}});out[BK]={ret:perf(BK,ST.s0,ST.s1)};CUR=out;return out}
function renderKpi(){var C=CUR,tw=C[BK].ret,h='';$('rl').textContent=rngLbl()+'，'+fLbl();
 A.forEach(function(a){var c=C[a.k],st=c.st,r=st?st.r:null,L=st?lvl(r):['無資料','tz'];
  h+='<div class="kpi'+(ST.asset===a.k?' on':'')+'" data-k="'+a.k+'"><div><div class="kh"><span class="kn" style="color:'+a.c+'">'+a.n+'</span><span class="tag '+L[1]+'">'+L[0]+'</span></div>'+
  '<div class="kr '+cls(r)+'">'+(st?'r = '+sg(r):'N/A')+'</div>'+
  '<div class="ks">同向率 '+(st?(st.same*100).toFixed(0)+'%':'—')+'　β '+(st?fmt(st.beta,3):'—')+'　n='+(st?st.n:0)+'</div>'+
  '<div class="ks">'+(a.yld?'殖利率變動 ':'區間漲跌 ')+'<b class="'+cls(c.ret)+'">'+pf(a.k,c.ret)+'</b>'+(c.late?'*':'')+'　台股 <b class="'+cls(tw)+'">'+pct(tw)+'</b></div>'+
  '<div class="ks">全期 r '+(c.all?sg(c.all.r):'—')+'</div></div><div class="kd">'+a.m+'</div></div>'});
 $('kpis').innerHTML=h;Array.prototype.forEach.call(document.querySelectorAll('.kpi'),function(c){c.onclick=function(){selAsset(c.dataset.k)}})}
var LASTCH={};
function renderChart(){var a=AK[ST.asset],s=ST.s0,e=ST.s1,R=RAW[a.k],xs=[],yt=[],ya=[],norm=$('norm').checked,b0=null,ba=null;
 for(var i=0;i<N;i++){var d=TW.d[i];if(d<s||d>e)continue;var j=idxLE(R.d,d,false),va=(j>=0)?R.c[j]:NaN;xs.push(dn(d));
  if(norm){if(b0==null)b0=TW.c[i];if(ba==null&&isFinite(va))ba=va;yt.push(TW.c[i]/b0*100);ya.push(a.yld?va:(isFinite(va)&&ba?va/ba*100:NaN))}else{yt.push(TW.c[i]);ya.push(va)}}
 LASTCH={xs:xs,yt:yt,ya:ya,norm:norm};
 if(xs.length<5){$('px').innerHTML='<div class="note">區間資料不足</div>';$('roll').innerHTML='';return}
 var marks=[];if($('ann').checked){EV.forEach(function(v){var x=di(v[0]);if(x>=s&&x<=e)marks.push({t:dn(x),lbl:v[0]+' '+v[1],kind:'ev'})});
  SW.piv.forEach(function(p){var d=TW.d[p.i];if(d>=s&&d<=e&&p.t.indexOf('*')<0)marks.push({t:dn(d),y:norm?TW.c[p.i]/b0*100:TW.c[p.i],up:p.t==='H',lbl:(p.t==='H'?'波段高點 ':'波段低點 ')+TW.c[p.i].toFixed(0)+'（'+ds(d)+'）',kind:'sw'})})}
 var oneAxis=norm&&!a.yld;
 var c1=lineSvg({id:'pxs',w:1440,h:400,xs:xs,logL:$('logy').checked,invR:$('inv').checked,marks:marks,cL:'#e2e8f0',
  series:[{ys:yt,color:'#f1f5f9',name:norm?'台股（基期=100）':'台股加權',axis:'L',w:2,fmt:function(v){return norm?v.toFixed(1):v.toFixed(0)}},
   {ys:ya,color:a.c,name:a.n+(norm&&!a.yld?'（基期=100）':''),axis:oneAxis?'L':'R',fmt:function(v){return a.yld?v.toFixed(3)+'%':norm?v.toFixed(1):(+v.toPrecision(6))+''}}],
  fmtL:function(t){return norm?t:(t>=1000?(t/1000)+'k':t)}});
 $('px').innerHTML=c1.html;c1.bind();
 $('lg').innerHTML='<span><i style="background:#f1f5f9"></i>台股加權指數（左軸'+(norm?'，基期=100':'')+'）</span><span><i style="background:'+a.c+'"></i>'+a.n+'（'+(oneAxis?'左軸，基期=100':'右軸'+(a.yld?'，殖利率 %':''))+($('inv').checked&&!oneAxis?'，已反轉':'')+'）</span><span><i style="background:#f43f5e;height:1px"></i>重大事件</span><span style="color:#eab308">▲▼ 台股波段高低點</span>';
 var S=ser(),win=ST.f==='D'?60:ST.f==='W'?26:12,rx=[],ry=[],X=S.a[a.k],Y=S.tw;
 for(var i2=0;i2<S.dates.length;i2++){var d2=S.dates[i2];if(d2<s||d2>e)continue;var xa=[],ya2=[];for(var k=Math.max(1,i2-win+1);k<=i2;k++)if(isFinite(X[k])&&isFinite(Y[k])){xa.push(X[k]);ya2.push(Y[k])}
  var r=NaN;if(xa.length>=win*0.6){var n=xa.length,mx=0,my=0,sxy=0,sxx=0,syy=0;for(k=0;k<n;k++){mx+=xa[k];my+=ya2[k]}mx/=n;my/=n;for(k=0;k<n;k++){var p=xa[k]-mx,q=ya2[k]-my;sxy+=p*q;sxx+=p*p;syy+=q*q}r=sxy/Math.sqrt(sxx*syy)}rx.push(dn(d2));ry.push(r)}
 if(rx.length>2){var c2=lineSvg({id:'rls',w:1440,h:210,xs:rx,fix:[-1,1],zero:0,title:'滾動 '+win+({D:' 日',W:' 週',M:' 月'})[ST.f]+'相關係數（'+a.n+' vs 台股）',marks:marks.filter(function(m){return m.kind==='ev'}),
  series:[{ys:ry,color:a.c,name:'滾動 r',fmt:function(v){return v.toFixed(2)}}],fmtL:function(t){return t.toFixed(1)}});$('roll').innerHTML=c2.html;c2.bind()}else $('roll').innerHTML='<div class="note">區間太短，無法計算滾動相關（請改用日報酬或拉長區間）</div>';
 var c=CUR[a.k],st=c.st;var dir=st?(st.r>0.2?'同向':st.r<-0.2?'反向':'關係不明顯'):'';
 $('ins').style.borderLeftColor=a.c;
 $('ins').innerHTML='<b>回測診斷（'+a.n+' vs 台股，'+rngLbl()+'，'+fLbl()+'）</b>：相關係數 <b class="'+cls(st&&st.r)+'">r = '+(st?sg(st.r):'—')+'</b>（全期 '+(c.all?sg(c.all.r):'—')+'），同向率 '+(st?(st.same*100).toFixed(0)+'%':'—')+'，整體'+dir+'。區間內 '+a.n+' '+pf(a.k,c.ret)+'、台股 '+pct(CUR[BK].ret)+'。'+
  (a.hint==='invert'?'　提示：勾選「反轉右軸」可看鏡像重疊程度。':'')+(a.hint==='norm'?'　提示：勾選「基期=100」比較兩者漲幅倍數。':'')}
function renderBars(){var C=CUR,items=A.map(function(a){var st=C[a.k].st;return {n:a.n,v:st?st.r:null,c:st&&st.r>=0?'rgba(244,63,94,.85)':'rgba(16,185,129,.85)',ghost:C[a.k].all?C[a.k].all.r:null,txt:st?sg(st.r):''}});
 items.sort(function(p,q){return (q.v==null?-9:q.v)-(p.v==null?-9:p.v)});
 $('cb').innerHTML=hbar('cbs',items,{lo:-1,hi:1,zero:0,ticks:[[-1,'-1'],[-0.5,'-0.5'],[0,'0'],[0.5,'0.5'],[1,'1']]});
 var its=[{n:BN,k:BK,c:'#f1f5f9'}].concat(A.filter(function(a){return !a.yld}).map(function(a){return {n:a.n,k:a.k,c:a.c}})).map(function(it){var v=C[it.k].ret;return {n:it.n,v:v!=null?Math.log10(1+v):null,c:it.c,txt:pct(v)+(C[it.k].late?'*':'')}});
 var mx=0.1;its.forEach(function(i){if(i.v!=null)mx=Math.max(mx,Math.abs(i.v))});var lo=-Math.min(mx,1)-0.05,hi=mx+0.05;var tk=[];[0.1,0.25,0.5,1,2,5,10,100,1000].forEach(function(m){var l=Math.log10(m);if(l>=lo&&l<=hi)tk.push([l,m+'x'])});
 $('rb').innerHTML=hbar('rbs',its,{lo:lo,hi:hi,zero:0,ticks:tk})+'<div class="note">'+A.filter(function(a){return a.yld}).map(function(a){return a.n+'變動：<b class="'+cls(C[a.k].ret)+'">'+pf(a.k,C[a.k].ret)+'</b>'}).join('　')+'　* 表示該資產在區間起點後才有資料，從第一筆起算。</div>'}
function renderCmp(){var S=ser(),ya=+$('yA').value,aS=ya*1e4+101,aE=ya*1e4+1231,g=[],t='<table><tr><th>商品</th><th>r(A)</th><th>r(B)</th><th>差 A−B</th><th>同向率A</th><th>同向率B</th><th>β(A)</th><th>β(B)</th><th>漲跌 A</th><th>漲跌 B</th></tr>';
 A.forEach(function(a){var sa=stats(S,a.k,aS,aE),sb=CUR[a.k].st,pa=perf(a.k,aS,aE);g.push({n:a.n,v:[sa&&sa.r,sb&&sb.r]});
  t+='<tr><td>'+a.n+'</td><td style="background:'+rcol(sa&&sa.r,.5)+'">'+sg(sa&&sa.r)+'</td><td style="background:'+rcol(sb&&sb.r,.5)+'">'+sg(sb&&sb.r)+'</td><td>'+(sa&&sb?sg(sa.r-sb.r):'—')+'</td><td>'+(sa?(sa.same*100).toFixed(0)+'%':'—')+'</td><td>'+(sb?(sb.same*100).toFixed(0)+'%':'—')+'</td><td>'+fmt(sa&&sa.beta,3)+'</td><td>'+fmt(sb&&sb.beta,3)+'</td><td class="'+cls(pa)+'">'+pf(a.k,pa)+'</td><td class="'+cls(CUR[a.k].ret)+'">'+pf(a.k,CUR[a.k].ret)+'</td></tr>'});
 var p1=perf(BK,aS,aE);t+='<tr><td style="color:#f1f5f9;font-weight:700">台股加權</td><td colspan="7"></td><td class="'+cls(p1)+'">'+pct(p1)+'</td><td class="'+cls(CUR[BK].ret)+'">'+pct(CUR[BK].ret)+'</td></tr></table><div class="note" style="margin-top:6px">A＝'+ya+' 年；B＝上方選定區間（'+rngLbl()+'），'+fLbl()+'。</div>';
 $('cpc').innerHTML=gbar('cps',g,['A：'+ya+' 年','B：'+rngLbl()],['#eab308','#38bdf8']);$('cpt').innerHTML=t}
function renderHM(){var S=ser(),h='<tr><th>商品＼年度</th>';YEARS.forEach(function(y){h+='<th style="text-align:center">'+y+'</th>'});h+='<th style="text-align:center">全期</th></tr>';
 A.forEach(function(a){h+='<tr><td style="color:'+a.c+'">'+a.n+'</td>';YEARS.concat(['ALL']).forEach(function(y){var st=y==='ALL'?stats(S,a.k,ALLS,LAST):stats(S,a.k,y*1e4+101,y*1e4+1231),r=st?st.r:NaN;
  var sel=ST.mode==='single'&&Math.floor(ST.s0/1e4)===y;h+='<td data-y="'+y+'" data-k="'+a.k+'" style="background:'+rcol(r)+(sel?';outline:2px solid #eab308':'')+'" title="'+a.n+' '+y+' r='+fmt(r)+(st?' 同向率 '+(st.same*100).toFixed(0)+'% n='+st.n:'')+'">'+(st?r.toFixed(2):'')+'</td>'});h+='</tr>'});
 h+='<tr><td>台股年報酬</td>';YEARS.forEach(function(y){var p=perf(BK,y*1e4+101,y*1e4+1231);h+='<td style="color:'+(p>0?'#fb7185':'#34d399')+'">'+(p==null?'':(p*100).toFixed(0)+'%')+'</td>'});h+='<td></td></tr>';
 $('hm').innerHTML=h;Array.prototype.forEach.call($('hm').querySelectorAll('td[data-y]'),function(td){td.onclick=function(){ST.asset=td.dataset.k;if(td.dataset.y==='ALL'){applyPreset('all')}else jumpYear(+td.dataset.y)}})}


function yrRows(){var out=[];YEARS.slice().reverse().forEach(function(y){var s=y*1e4+101,e=y*1e4+1231,r={y:y,tw:perf(BK,s,e)};A.forEach(function(a){r[a.k]=lateStart(a.k,s)?null:perf(a.k,s,e)});
 r.theme=THEME[y]||autoTheme(y,r);out.push(r)});return out}
function autoTheme(y,r){return '（資料至 '+ds(LAST)+'，依數據自動產生）'+BN+' '+pct(r.tw)+'、'+A.slice(0,6).map(function(a){return a.n+' '+pf(a.k,r[a.k])}).join('、')}
function renderYr(){var rows=yrRows(),agree={},cnt={},t='<table><tr><th>年度</th><th>台股</th>';A.forEach(function(a){t+='<th style="color:'+a.c+'">'+a.n+'</th>'});t+='<th style="text-align:left">年度總經主軸</th></tr>';
 rows.forEach(function(r){t+='<tr data-y="'+r.y+'" style="cursor:pointer"><td><b style="color:var(--ac)">'+r.y+(r.y===Y1?' YTD':'')+'</b></td><td class="num '+cls(r.tw)+'" style="font-weight:700">'+pct(r.tw)+'</td>';
  A.forEach(function(a){var v=r[a.k],bg='';if(v!=null&&r.tw!=null){var same=(v>0)===(r.tw>0);bg=same?'background:rgba(244,63,94,.12)':'background:rgba(16,185,129,.12)';cnt[a.k]=(cnt[a.k]||0)+1;agree[a.k]=(agree[a.k]||0)+(same?1:0)}
   t+='<td class="num '+cls(v)+'" style="'+bg+'">'+pf(a.k,v)+'</td>'});t+='<td style="text-align:left;color:#cbd5e1;white-space:normal;min-width:260px">'+r.theme+'</td></tr>'});
 t+='<tr><td><b>方向一致率</b></td><td></td>';A.forEach(function(a){t+='<td><b>'+(cnt[a.k]?Math.round(agree[a.k]/cnt[a.k]*100)+'%':'—')+'</b> <span class="note">('+(agree[a.k]||0)+'/'+(cnt[a.k]||0)+')</span></td>'});t+='<td class="note" style="text-align:left">底色：與台股同向＝淡紅、反向＝淡綠。美債為殖利率變動（點）。</td></tr></table>';
 $('yt').innerHTML=t;Array.prototype.forEach.call($('yt').querySelectorAll('tr[data-y]'),function(tr){tr.onclick=function(){jumpYear(+tr.dataset.y)}})}
function evWin(ec){if(ec.t!=='auto')return [di(ec.s),Math.min(di(ec.e),LAST)];var g=SW.seg[SW.seg.length-1];return [TW.d[g.s],TW.d[g.e]]}
function evMetrics(s,e){var S=ser('W'),o={tw:perf(BK,s,e)};A.forEach(function(a){o[a.k]=perf(a.k,s,e);var st=stats(S,a.k,s,e);o['r_'+a.k]=st?st.r:null});
 var i0=idxLE(TW.d,s,false),i1=idxLE(TW.d,e,false),hi=-1,lo=1e9;for(var i=Math.max(0,i0);i<=i1;i++){hi=Math.max(hi,TW.c[i]);lo=Math.min(lo,TW.c[i])}o.hi=hi;o.lo=lo;return o}
var EVR=[];
function renderEvc(){EVR=[];var h='';EC.forEach(function(ec,ix){var w=evWin(ec),s=w[0],e=w[1];if(s>LAST)return;var m=evMetrics(s,e),t=ec.t;
  if(t==='auto'){var g=SW.seg[SW.seg.length-1];t=g.up?'bull':'bear';ec.ti='最近一段'+(g.up?'多頭':'空頭')+'波段'+(g.open?'（進行中）':'')}
  var row={期間:ds(s)+' ~ '+ds(e),主題:ec.tag,事件:ec.ti,說明:ec.b};row[BN]=pct(m.tw);A.forEach(function(a){row[a.n]=pf(a.k,m[a.k])});FOCUS.slice(0,3).forEach(function(k){row[AK[k].n+'週r']=fmt(m['r_'+k])});EVR.push(row);
  h+='<div class="evc '+t+'" data-s="'+s+'" data-e="'+e+'"><div><div class="em"><span>'+ds(s)+' ~ '+ds(e)+'</span><span>'+ec.tag+'</span></div><div class="et">'+(ix+1)+'. '+ec.ti+'</div>'+
  '<div class="tag '+(m.tw>0?'tp':'tn')+'" style="display:inline-block;margin-bottom:7px">'+BN+' '+pct(m.tw)+'（區間高 '+m.hi.toFixed(0)+'／低 '+m.lo.toFixed(0)+'）</div><p class="eb">'+ec.b+'</p></div><div class="ems">'+
  A.map(function(a){return a.k}).map(function(k){return '<span class="pill">'+AK[k].n+' <b class="'+cls(m[k])+'">'+pf(k,m[k])+'</b></span>'}).join('')+
  '<span class="pill">週 r：'+FOCUS.slice(0,3).map(function(k){return AK[k].n+' '+fmt(m['r_'+k])}).join('／')+'</span></div></div>'});
 $('evg').innerHTML=h;Array.prototype.forEach.call(document.querySelectorAll('.evc'),function(c){c.title='點擊將上方區間設為此事件期間';c.onclick=function(){setRange(+c.dataset.s,+c.dataset.e);scrollTo({top:0,behavior:'smooth'})}})}
function swings(th){var c=TW.c,piv=[],dir=0,ext=0,hiI=0,loI=0;
 for(var i=1;i<N;i++){if(dir===0){if(c[i]>c[hiI])hiI=i;if(c[i]<c[loI])loI=i;if(c[i]<=c[hiI]*(1-th)){piv.push({i:hiI,t:'H'});dir=-1;ext=i}else if(c[i]>=c[loI]*(1+th)){piv.push({i:loI,t:'L'});dir=1;ext=i}continue}
  if(dir>0){if(c[i]>c[ext])ext=i;else if(c[i]<=c[ext]*(1-th)){piv.push({i:ext,t:'H'});dir=-1;ext=i}}else{if(c[i]<c[ext])ext=i;else if(c[i]>=c[ext]*(1+th)){piv.push({i:ext,t:'L'});dir=1;ext=i}}}
 piv.push({i:ext,t:dir>0?'H*':'L*'});var out=[];for(var j=1;j<piv.length;j++)if(piv[j].i!==piv[j-1].i)out.push({s:piv[j-1].i,e:piv[j].i,up:TW.c[piv[j].i]>TW.c[piv[j-1].i],open:piv[j].t.indexOf('*')>=0});return {piv:piv,seg:out}}
var SW=swings(0.2),SWR=[],BIGR=[],EVTR=[];
function renderSw(){SWR=[];var t='<table><tr><th>波段</th><th>起 → 迄</th><th>天數</th><th>台股</th>';A.forEach(function(a){t+='<th>'+a.n+'</th>'});t+='</tr>';
 SW.seg.slice().reverse().forEach(function(g){var s=TW.d[g.s],e=TW.d[g.e],r=TW.c[g.e]/TW.c[g.s]-1,row={波段:(g.up?'多頭':'空頭')+(g.open?'(進行中)':''),起:ds(s),迄:ds(e),起點:Math.round(TW.c[g.s]),迄點:Math.round(TW.c[g.e]),台股:pct(r)};
  t+='<tr data-s="'+s+'" data-e="'+e+'" style="cursor:pointer"><td><span class="tag '+(g.up?'tp':'tn')+'">'+row.波段+'</span></td><td>'+ds(s)+' '+row.起點+'<br>'+ds(e)+' '+row.迄點+'</td><td>'+Math.round((dn(e)-dn(s))/864e5)+'</td><td class="'+cls(r)+'"><b>'+pct(r)+'</b></td>';
  A.forEach(function(a){var R=RAW[a.k],i0=idxLE(R.d,s,false),i1=idxLE(R.d,e,false),v=(i0>=0&&i1>i0)?chg(a,R.c[i1],R.c[i0]):null;row[a.n]=pf(a.k,v);t+='<td class="'+cls(v)+'">'+pf(a.k,v)+'</td>'});SWR.push(row);t+='</tr>'});
 $('sw').innerHTML=t+'</table><div class="note">收盤價 ±20% 反轉定義波段。點列可把上方區間設為該波段。</div>';
 Array.prototype.forEach.call($('sw').querySelectorAll('tr[data-s]'),function(tr){tr.onclick=function(){setRange(+tr.dataset.s,+tr.dataset.e);scrollTo({top:0,behavior:'smooth'})}})}
function renderBig(){BIGR=[];var S=ser('D'),arr=[];for(var i=1;i<N;i++)arr.push(i);var ks=FOCUS.slice(0,6);
 var ups=arr.slice().sort(function(a,b){return S.tw[b]-S.tw[a]}).slice(0,10),dns=arr.slice().sort(function(a,b){return S.tw[a]-S.tw[b]}).slice(0,10);
 var t='<table><tr><th>日期</th><th>台股</th>';ks.forEach(function(k){t+='<th>'+AK[k].n+'</th>'});t+='</tr>';
 function row(i,lb){var o={類別:lb,日期:ds(TW.d[i])};o[BN]=pct(S.tw[i]),r='<tr><td>'+ds(TW.d[i])+'</td><td class="'+cls(S.tw[i])+'"><b>'+pct(S.tw[i])+'</b></td>';ks.forEach(function(k){var v=S.a[k][i];o[AK[k].n]=pf(k,v);r+='<td class="'+cls(v)+'">'+pf(k,v)+'</td>'});BIGR.push(o);return r+'</tr>'}
 t+='<tr><td colspan="'+(ks.length+2)+'" class="pos">▲ 最大漲幅</td></tr>';ups.forEach(function(i){t+=row(i,'最大漲幅')});t+='<tr><td colspan="'+(ks.length+2)+'" class="neg">▼ 最大跌幅</td></tr>';dns.forEach(function(i){t+=row(i,'最大跌幅')});
 $('big').innerHTML=t+'</table><div class="note">商品欄為對應日變動（智慧對齊：美國盤為前一晚）。</div>'}
function renderEvt(){EVTR=[];var ak=ST.asset,cols=FOCUS.slice();if(cols.indexOf(ak)<0)cols.push(ak);
 var t='<table><tr><th>日期</th><th style="text-align:left">事件</th><th>'+BN+'當日</th><th>5 日</th><th>20 日</th><th>60 日</th>'+cols.map(function(k){return '<th style="color:'+AK[k].c+'">'+AK[k].n+' 20 日</th>'}).join('')+'</tr>';
 EV.slice().reverse().forEach(function(e){var x=di(e[0]);if(x<FIRST||x>LAST)return;var i=idxLE(TW.d,x,true)+1;if(i<1||i>=N)return;var b=TW.c[i-1];
  function f(n){return i+n-1<N?TW.c[i+n-1]/b-1:null}function ar(k,n){var R=RAW[k],j0=idxLE(R.d,TW.d[i-1],false),j1=idxLE(R.d,TW.d[Math.min(N-1,i+n-1)],false);return (j0>=0&&j1>j0)?chg(AK[k],R.c[j1],R.c[j0]):null}
  var v=[f(1),f(5),f(20),f(60)],o={日期:e[0],事件:e[1]};o[BN+'當日']=pct(v[0]);o[BN+'5日']=pct(v[1]);o[BN+'20日']=pct(v[2]);o[BN+'60日']=pct(v[3]);
  t+='<tr><td>'+e[0]+'</td><td style="text-align:left">'+e[1]+'</td>';v.forEach(function(z){t+='<td class="'+cls(z)+'">'+pct(z)+'</td>'});
  cols.forEach(function(k){var z=ar(k,20);o[AK[k].n+'20日']=pf(k,z);t+='<td class="'+cls(z)+'">'+pf(k,z)+'</td>'});EVTR.push(o);t+='</tr>'});
 $('evt').innerHTML=t+'</table><div class="note">以事件日前一個台股交易日收盤為基準。最後一欄隨主圖商品切換。</div>'}


// ---------- exports ----------
function dl(content,name,mime){var b=new Blob([content],{type:mime}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(u)},4000);toast('已匯出：'+name)}
function csv(rows){if(!rows.length)return '';var h=Object.keys(rows[0]);function esc(v){var s=v==null?'':String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
 return '﻿'+[h.map(esc).join(',')].concat(rows.map(function(r){return h.map(function(k){return esc(r[k])}).join(',')})).join('\r\n')}
function out(rows,name,f){if(f==='json')dl(JSON.stringify(rows,null,2),name+'.json','application/json;charset=utf-8');else dl(csv(rows),name+'.csv','text/csv;charset=utf-8')}
function r4(x){return (x==null||!isFinite(x))?null:Math.round(x*1e4)/1e4}
function ex1(f){out(A.map(function(a){var c=CUR[a.k];return {區間:rngLbl(),頻率:fLbl(),商品:a.n,代號:a.e,相關係數r:r4(c.st&&c.st.r),全期r:r4(c.all&&c.all.r),同向率:r4(c.st&&c.st.same),beta:r4(c.st&&c.st.beta),樣本數:c.st?c.st.n:0,區間漲跌:a.yld?r4(c.ret)+'點':r4(c.ret),基準漲跌:r4(CUR[BK].ret),連動機制:a.m}}),'區塊一_相關性總覽_'+slug(),f)}
function ex2(f){var a=AK[ST.asset],L=LASTCH,rows=L.xs.map(function(t,i){var o={日期:new Date(t).toISOString().slice(0,10)};o[L.norm?'台股_基期100':'台股加權']=r4(L.yt[i]);o[a.n+(L.norm&&!a.yld?'_基期100':'')]=r4(L.ya[i]);return o});out(rows,'區塊二_走勢序列_'+a.n+'_'+slug(),f)}
function ex3(f){out(A.map(function(a){var c=CUR[a.k];return {商品:a.n,區間r:r4(c.st&&c.st.r),全期r:r4(c.all&&c.all.r)}}).sort(function(p,q){return (q.區間r==null?-9:q.區間r)-(p.區間r==null?-9:p.區間r)}).map(function(o,i){o.排名=i+1;return o}),'區塊三_相關係數排行_'+slug(),f)}
function ex4(f){var rows=[{資產:BN,區間漲跌:r4(CUR[BK].ret)}].concat(A.map(function(a){return {資產:a.n,區間漲跌:r4(CUR[a.k].ret),單位:a.yld?'殖利率點':'報酬率',資料晚於起點:CUR[a.k].late?'是':''}}));out(rows,'區塊四_累積報酬_'+slug(),f)}
function ex5(f){var S=ser(),ya=+$('yA').value;out(A.map(function(a){var sa=stats(S,a.k,ya*1e4+101,ya*1e4+1231),sb=CUR[a.k].st;return {商品:a.n,A年度:ya,rA:r4(sa&&sa.r),B區間:rngLbl(),rB:r4(sb&&sb.r),同向率A:r4(sa&&sa.same),同向率B:r4(sb&&sb.same),漲跌A:r4(perf(a.k,ya*1e4+101,ya*1e4+1231)),漲跌B:r4(CUR[a.k].ret)}}),'區塊五_年度對區間_'+ya+'_vs_'+slug(),f)}
function ex6(f){var S=ser();out(A.map(function(a){var o={商品:a.n,頻率:fLbl()};YEARS.forEach(function(y){var st=stats(S,a.k,y*1e4+101,y*1e4+1231);o[y]=r4(st&&st.r)});var al=stats(S,a.k,ALLS,LAST);o.全期=r4(al&&al.r);return o}),'區塊六_逐年相關熱力圖_'+fLbl(),f)}
function ex7(f){out(yrRows().map(function(r){var o={年度:r.y};o[BN]=r4(r.tw);A.forEach(function(a){o[a.n]=r4(r[a.k])});o.總經主軸=r.theme;return o}),'區塊七_逐年報酬',f)}
function ex8(f){out(EVR,'區塊八_重大事件連動',f)}
function ex9(f){out(SWR,'區塊九_台股大行情波段',f)}
function ex10(f){out(BIGR,'區塊十_台股單日最大漲跌',f)}
function ex11(f){out(EVTR,'區塊十一_事件後表現',f)}
function exportAll(){var rows=TW.d.map(function(d,i){var o={日期:ds(d)};o[META.base.ticker||BK]=TW.c[i];A.forEach(function(a){var R=RAW[a.k],j=idxLE(R.d,d,false);o[a.t]=(j>=0&&dn(d)-dn(R.d[j])<10*864e5)?R.c[j]:null});return o});
 dl(csv(rows),'全期日收盤_'+BK+'_'+A.length+'資產_'+ds(FIRST)+'_'+ds(LAST)+'.csv','text/csv;charset=utf-8');
 setTimeout(function(){dl(JSON.stringify({產生時間:GEN,目前選取:rngLbl(),頻率:fLbl(),目前統計:A.map(function(a){var c=CUR[a.k];return {商品:a.n,r:r4(c.st&&c.st.r),全期r:r4(c.all&&c.all.r),漲跌:r4(c.ret)}}),逐年報酬:yrRows(),重大事件:EVR,大行情:SWR},null,2),'儀表板完整快照_'+slug()+'.json','application/json;charset=utf-8')},300)}
function exPng(id,name){var sv=$(id);if(!sv)return;var vb=sv.getAttribute('viewBox').split(' '),w=+vb[2],h=+vb[3],cl=sv.cloneNode(true);cl.setAttribute('width',w);cl.setAttribute('height',h);
 var st=document.createElementNS('http://www.w3.org/2000/svg','style');st.textContent='text{font:11px -apple-system,"Noto Sans TC","Microsoft JhengHei",sans-serif}text:not([fill]){fill:#94a3b8}';cl.insertBefore(st,cl.firstChild);
 var x=new XMLSerializer().serializeToString(cl),img=new Image();img.onload=function(){var c=document.createElement('canvas');c.width=w*2;c.height=h*2;var g=c.getContext('2d');g.fillStyle='#111827';g.fillRect(0,0,c.width,c.height);g.scale(2,2);g.drawImage(img,0,0);
  c.toBlob(function(b){dl(b,'TAIEX_'+name+'_'+(id==='pxs'||id==='rls'?AK[ST.asset].n+'_':'')+slug()+'.png','image/png')},'image/png')};img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(x)}
// ---------- controls ----------
var PRE=[['all','全期'],['y1','近1年'],['y3','近3年'],['y5','近5年'],['y10','近10年'],['gfc','金融海嘯 07–09','20070101','20091231'],['eu','歐債 10–12','20100101','20121231'],['qe','疫後 QE 20–21','20200101','20211231'],['hike','升息年 2022','20220101','20221231'],['ai','AI 週期 23–今','20230101','']];
function applyPreset(k){var p=PRE.filter(function(x){return x[0]===k})[0],s,e=LAST;if(k==='all')s=ALLS;else if(k[0]==='y'&&k.length<=3){s=LAST-(+k.slice(1))*1e4}else{s=+p[2];e=p[3]?+p[3]:LAST}
 setRange(s,e,k)}
function setRange(s,e,pk){ST.mode='range';ST.s0=s;ST.s1=e;$('s0').value=ds(s);$('s1').value=ds(e);syncMode();Array.prototype.forEach.call(document.querySelectorAll('#pres .btn'),function(b){b.classList.toggle('on',b.dataset.p===pk)});update()}
function jumpYear(y){ST.mode='single';$('yr').value=y;ST.s0=y*1e4+101;ST.s1=Math.min(y*1e4+1231,LAST);syncMode();update();scrollTo({top:0,behavior:'smooth'})}
function setMode(m){if(m==='single')jumpYear(+$('yr').value);else setRange(di($('s0').value),di($('s1').value))}
function syncMode(){$('mR').classList.toggle('on',ST.mode==='range');$('mS').classList.toggle('on',ST.mode==='single');$('rc').style.display=ST.mode==='range'?'flex':'none';$('sc').style.display=ST.mode==='single'?'flex':'none'}
function selAsset(k){ST.asset=k;Array.prototype.forEach.call(document.querySelectorAll('#abtn .btn'),function(b){b.classList.toggle('on',b.dataset.k===k)});
 Array.prototype.forEach.call(document.querySelectorAll('.kpi'),function(c){c.classList.toggle('on',c.dataset.k===k)});renderChart();renderEvt()}
function update(){compute();renderKpi();renderChart();renderBars();renderCmp();renderHM();renderEvt();Array.prototype.forEach.call(document.querySelectorAll('#abtn .btn'),function(b){b.classList.toggle('on',b.dataset.k===ST.asset)})}
function full(){ALIGN={};update();renderYr();renderEvc()}
$('span').textContent=ds(FIRST)+' ~ '+ds(LAST);$('gen').textContent=GEN;
Array.prototype.forEach.call(document.querySelectorAll('.nA'),function(x){x.textContent=A.length});
(function(){var rp=META.report||{},bad=Object.keys(rp).filter(function(k){return rp[k].status!=='ok'});
 $('dst').innerHTML=bad.length?'<span style="color:#fbbf24">⚠ 未更新：'+bad.map(function(k){return (AK[k]?AK[k].n:k)+'（'+(rp[k].status==='stale'?'沿用 '+rp[k].last:'缺資料')+'）'}).join('、')+'</span>':'<span style="color:#34d399">● 全部商品已更新</span>';
 $('method-tk').textContent=[META.base.ticker].concat(A.map(function(a){return a.t})).join('、');
 $('method-us').textContent=A.filter(function(a){return a.us}).map(function(a){return a.n}).join('、')||'無';
 $('method-tw').textContent=A.filter(function(a){return !a.us}).map(function(a){return a.n}).join('、')||'無';
 var late=A.filter(function(a){return RAW[a.k].d[0]>FIRST+10000}).map(function(a){return a.n+' 自 '+ds(RAW[a.k].d[0]).slice(0,7)});$('method-late').textContent=late.length?late.join('、')+' 才有資料。':'';})();
$('ld').style.display='none';
YEARS.slice().reverse().forEach(function(y){$('yr').insertAdjacentHTML('beforeend','<option value="'+y+'">'+y+(y===Y1?'（YTD）':'')+'</option>');$('yA').insertAdjacentHTML('beforeend','<option value="'+y+'">'+y+'</option>')});
$('yr').value=Y1-1;$('yA').value=Y1-1;
PRE.forEach(function(p){$('pres').insertAdjacentHTML('beforeend','<button class="btn pre" data-p="'+p[0]+'">'+p[1]+'</button>')});
Array.prototype.forEach.call(document.querySelectorAll('#pres .btn'),function(b){b.onclick=function(){applyPreset(b.dataset.p)}});
A.forEach(function(a){$('abtn').insertAdjacentHTML('beforeend','<button class="btn" data-k="'+a.k+'" style="border-left:3px solid '+a.c+'">'+a.n+'</button>')});
Array.prototype.forEach.call(document.querySelectorAll('#abtn .btn'),function(b){b.onclick=function(){selAsset(b.dataset.k)}});
Array.prototype.forEach.call(document.querySelectorAll('#fq .btn'),function(b){b.onclick=function(){ST.f=b.dataset.f;Array.prototype.forEach.call(document.querySelectorAll('#fq .btn'),function(x){x.classList.toggle('on',x===b)});full()}});
$('mode').onchange=full;$('yr').onchange=function(){jumpYear(+this.value)};$('yA').onchange=renderCmp;
$('s0').onchange=$('s1').onchange=function(){var s=di($('s0').value),e=di($('s1').value);if(!(s&&e))return;if(s>e){var t=s;s=e;e=t}setRange(s,e)};
['norm','inv','logy','ann'].forEach(function(id){$(id).onchange=renderChart});
$('s0').value=ds(ALLS);$('s1').value=ds(LAST);$('s0').min=$('s1').min=ds(FIRST);$('s0').max=$('s1').max=ds(LAST);
renderSw();renderBig();applyPreset('all');renderYr();renderEvc();

// ---------- 下載離線單檔版 ----------
function exportStandalone(){var esc=function(t){return t.replace(/<\/script/gi,'<\\/script')};
 Promise.all(['index.html','css/style.css','js/app.js'].map(function(u){return fetch(u).then(function(r){if(!r.ok)throw new Error(u);return r.text()})})).then(function(f){
  var h=f[0],a=h.indexOf('<!--LOADER-->'),b=h.indexOf('<!--/LOADER-->')+14;
  var inl='<script>window.RAW='+esc(JSON.stringify(RAW))+';window.META='+esc(JSON.stringify(META))+';window.EVENTS='+esc(JSON.stringify(EVENTS))+';<\/script>\n<script>'+esc(f[2])+'<\/script>';
  h=h.slice(0,a)+inl+h.slice(b);h=h.replace('<link rel="stylesheet" href="css/style.css">','<style>'+f[1]+'</style>').replace('id="sa-btn"','id="sa-btn" style="display:none"');
  dl(h,'TAIEX_Dashboard_offline_'+ds(LAST)+'.html','text/html;charset=utf-8')}).catch(function(e){toast('離線版產生失敗：'+e.message)})}
