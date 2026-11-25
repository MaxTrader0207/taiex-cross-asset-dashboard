// 台股 × 全球資產連動 — 手機版
// 資料：window.RAW（價格）、window.META（商品設定）、window.EVENTS（事件），由 index.html 載入
(function(){
'use strict';
var SHORT={SOX:'費半',TSMC:'2330',TSM:'ADR',TWD:'美/台',DXY:'美元',EUR:'歐元',TNX:'美債',GOLD:'黃金',BTC:'BTC'};
var BK=META.base.key,BN=META.base.name||'台股';
var A=META.assets.filter(function(x){return RAW[x.key]}).map(function(x){return {k:x.key,n:x.name,s:x.short||SHORT[x.key]||x.name.slice(0,3),us:+x.us||0,yld:+x.yld||0,c:x.color||'#94a3b8',m:x.desc||'',focus:+x.focus||0,hint:x.hint||''}});
var AK={};A.forEach(function(a){AK[a.k]=a});
var FOCUS=A.filter(function(a){return a.focus}).map(function(a){return a.k});if(!FOCUS.length)FOCUS=A.slice(0,4).map(function(a){return a.k});
var THEME=EVENTS.themes||{},EV=(EVENTS.points||[]),EC=(EVENTS.periods||[]);

// ---------- utils ----------
function $(id){return document.getElementById(id)}
function dn(i){return Date.UTC(Math.floor(i/1e4),Math.floor(i/100)%100-1,i%100)}
function ds(i){var s=String(i);return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6)}
function di(s){return +String(s).replace(/-/g,'')}
function wk(i){return Math.floor((dn(i)/864e5+3)/7)}
function fmt(x,d){return (x==null||!isFinite(x))?'—':x.toFixed(d==null?2:d)}
function sg(x,d){return (x==null||!isFinite(x))?'—':(x>0?'+':'')+x.toFixed(d==null?2:d)}
function pct(x,d){if(x==null||!isFinite(x))return '—';var v=x*100;return (v>0?'+':'')+(Math.abs(v)>=1000?Math.round(v).toLocaleString():v.toFixed(d==null?1:d))+'%'}
function cls(x){return x>0?'pos':(x<0?'neg':'')}
function pf(k,v,d){if(v==null||!isFinite(v))return '—';return (AK[k]&&AK[k].yld)?((v>0?'+':'')+v.toFixed(2)+'點'):pct(v,d)}
function rcol(r,a){if(r==null||!isFinite(r))return '#1e293b';var t=Math.min(1,Math.abs(r)/0.8)*(a||0.9);return r>0?'rgba(244,63,94,'+t+')':'rgba(16,185,129,'+t+')'}
function lvl(r){var a=Math.abs(r);if(a<0.2)return ['低度','tz'];return [(a>=0.6?'高度':a>=0.4?'中度':'溫和')+(r>0?'正':'負'),r>0?'tp':'tn']}
function idxLE(d,x,strict){var lo=0,hi=d.length-1,a=-1;while(lo<=hi){var m=(lo+hi)>>1;if(strict?d[m]<x:d[m]<=x){a=m;lo=m+1}else hi=m-1}return a}
function chg(a,v1,v0){return (a&&a.yld)?(v1-v0):(v1/v0-1)}
function el(t,a,x){var s='<'+t;for(var k in a)s+=' '+k+'="'+a[k]+'"';return s+(x!=null?'>'+x+'</'+t+'>':'/>')}
function nice(lo,hi,n){var sp=hi-lo||1,st=Math.pow(10,Math.floor(Math.log10(sp/n))),e=sp/n/st;st*=e>5?10:e>2?5:e>1?2:1;var t=[];for(var v=Math.ceil(lo/st)*st;v<=hi+1e-9;v+=st)t.push(+v.toFixed(10));return t}
function logTicks(lo,hi){var o=[];for(var e=Math.floor(Math.log10(lo));e<=Math.ceil(Math.log10(hi));e++)[1,2,5].forEach(function(x){var v=x*Math.pow(10,e);if(v>=lo&&v<=hi)o.push(v)});return o.length<3?nice(lo,hi,4):o}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},2200)}
function each(sel,fn,root){Array.prototype.forEach.call((root||document).querySelectorAll(sel),fn)}

// ---------- data core ----------
var TW=RAW[BK],N=TW.d.length,FIRST=TW.d[0],LAST=TW.d[N-1],Y0=Math.max(2006,Math.floor(FIRST/1e4)),Y1=Math.floor(LAST/1e4),YEARS=[],ALIGN={};
for(var y=Y0;y<=Y1;y++)YEARS.push(y);var ALLS=Y0*1e4+101;
var ST={mode:'range',s0:ALLS,s1:LAST,f:'W',asset:A[0].k,yr:Y1-1,hm:'r',sort:0,evv:'p',swv:'s',tab:'ov',norm:false,inv:false,logy:true,ann:true,pk:'all'};
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
function late(k,s){return RAW[k].d[0]>s}
function swings(th){var c=TW.c,piv=[],dir=0,ext=0,hiI=0,loI=0;
 for(var i=1;i<N;i++){if(dir===0){if(c[i]>c[hiI])hiI=i;if(c[i]<c[loI])loI=i;if(c[i]<=c[hiI]*(1-th)){piv.push({i:hiI,t:'H'});dir=-1;ext=i}else if(c[i]>=c[loI]*(1+th)){piv.push({i:loI,t:'L'});dir=1;ext=i}continue}
  if(dir>0){if(c[i]>c[ext])ext=i;else if(c[i]<=c[ext]*(1-th)){piv.push({i:ext,t:'H'});dir=-1;ext=i}}else{if(c[i]<c[ext])ext=i;else if(c[i]>=c[ext]*(1+th)){piv.push({i:ext,t:'L'});dir=1;ext=i}}}
 piv.push({i:ext,t:dir>0?'H*':'L*'});var out=[];for(var j=1;j<piv.length;j++)if(piv[j].i!==piv[j-1].i)out.push({s:piv[j-1].i,e:piv[j].i,up:c[piv[j].i]>c[piv[j-1].i],open:piv[j].t.indexOf('*')>=0});return {piv:piv,seg:out}}
var SW=swings(0.2),CUR={};
function compute(){var S=ser(),o={};A.forEach(function(a){o[a.k]={st:stats(S,a.k,ST.s0,ST.s1),all:stats(S,a.k,ALLS,LAST),ret:perf(a.k,ST.s0,ST.s1),late:late(a.k,ST.s0)}});o[BK]={ret:perf(BK,ST.s0,ST.s1)};CUR=o}
function rngLbl(){return ST.mode==='single'?(Math.floor(ST.s0/1e4)+' 年'+(Math.floor(ST.s0/1e4)===Y1?'（至今）':'')):(ds(ST.s0)+' ~ '+ds(ST.s1))}
function fLbl(){return {D:'日',W:'週',M:'月'}[ST.f]+'報酬'}

// ---------- mobile chart ----------
function mChart(o){// o:{id,w,h,xs,series:[{ys,c,name,axis,f}],logL,invR,marks,fix,zero,ro}
 var W0=o.w||360,H0=o.h||220,m={l:36,r:o.series.length>1&&o.series[1].axis==='R'?40:8,t:8,b:18},W=W0-m.l-m.r,H=H0-m.t-m.b,n=o.xs.length;
 var step=Math.max(1,Math.ceil(n/480)),idx=[];for(var i=0;i<n;i+=step)idx.push(i);if(idx[idx.length-1]!==n-1)idx.push(n-1);
 var x0=o.xs[0],x1=o.xs[n-1];function X(t){return m.l+(t-x0)/(x1-x0||1)*W}
 var ax={};o.series.forEach(function(s){var k=s.axis||'L',lo=Infinity,hi=-Infinity;s.ys.forEach(function(v){if(isFinite(v)){if(v<lo)lo=v;if(v>hi)hi=v}});
  if(ax[k]){ax[k].lo=Math.min(ax[k].lo,lo);ax[k].hi=Math.max(ax[k].hi,hi)}else ax[k]={lo:lo,hi:hi,log:k==='L'&&o.logL,inv:k==='R'&&o.invR}});
 if(o.fix){ax.L.lo=o.fix[0];ax.L.hi=o.fix[1]}
 Object.keys(ax).forEach(function(k){var a=ax[k];if(!isFinite(a.lo)){a.lo=0;a.hi=1}
  if(a.log&&a.lo>0){var l0=Math.log(a.lo),l1=Math.log(a.hi),pd=(l1-l0)*0.05||0.1;l0-=pd;l1+=pd;a.lo=Math.exp(l0);a.hi=Math.exp(l1);a.f=function(v){return m.t+(l1-Math.log(v))/(l1-l0)*H}}
  else{if(!(o.fix&&k==='L')){var p=(a.hi-a.lo)*0.06||1;a.lo-=p;a.hi+=p}a.log=false;a.f=a.inv?function(v){return m.t+(v-a.lo)/(a.hi-a.lo)*H}:function(v){return m.t+(a.hi-v)/(a.hi-a.lo)*H}}});
 var s=el('rect',{x:0,y:0,width:W0,height:H0,fill:'#111827',rx:8});
 var tl=ax.L.log?logTicks(ax.L.lo,ax.L.hi):nice(ax.L.lo,ax.L.hi,4);
 tl.forEach(function(t){var yy=ax.L.f(t);if(yy<m.t-1||yy>m.t+H+1)return;s+=el('line',{x1:m.l,x2:m.l+W,y1:yy,y2:yy,stroke:t===o.zero?'#64748b':'#1e293b'})+el('text',{x:m.l-4,y:yy+3,'text-anchor':'end',fill:o.series[0].c},o.fl?o.fl(t):t)});
 if(ax.R)nice(ax.R.lo,ax.R.hi,4).forEach(function(t){var yy=ax.R.f(t);if(yy<m.t-1||yy>m.t+H+1)return;s+=el('text',{x:m.l+W+3,y:yy+3,fill:o.series[1].c},Math.abs(t)>=10000?(t/1000).toFixed(0)+'k':+t.toPrecision(3))});
 var ya=new Date(x0).getUTCFullYear(),yb=new Date(x1).getUTCFullYear();
 if(yb-ya>=2){var stp=Math.max(1,Math.ceil((yb-ya+1)/6));for(var yy=ya+1;yy<=yb;yy+=stp){var xx=X(Date.UTC(yy,0,1));s+=el('line',{x1:xx,x2:xx,y1:m.t,y2:m.t+H,stroke:'#1e293b'})+el('text',{x:xx,y:H0-5,'text-anchor':'middle'},"'"+String(yy).slice(2))}}
 else{var d=new Date(Date.UTC(ya,new Date(x0).getUTCMonth(),1)),ms=(x1-x0)>1.5e10?3:(x1-x0)>6e9?2:1;while(d.getTime()<=x1){var x2=X(d.getTime());if(x2>=m.l)s+=el('line',{x1:x2,x2:x2,y1:m.t,y2:m.t+H,stroke:'#1e293b'})+el('text',{x:x2,y:H0-5,'text-anchor':'middle'},(d.getUTCMonth()+1)+'月');d.setUTCMonth(d.getUTCMonth()+ms)}}
 (o.marks||[]).forEach(function(mk){var xx=X(mk.t);if(xx<m.l||xx>m.l+W)return;if(mk.k==='ev')s+=el('line',{x1:xx,x2:xx,y1:m.t,y2:m.t+H,stroke:'#f43f5e','stroke-dasharray':'2,3',opacity:.55});
  else if(mk.y!=null){var y2=ax.L.f(mk.y);s+='<path d="M'+xx.toFixed(1)+','+(y2+(mk.up?-4:4)).toFixed(1)+' l-4,'+(mk.up?-6:6)+' l8,0z" fill="#eab308"/>'}});
 o.series.forEach(function(se){var f=ax[se.axis||'L'].f,p='',pen=false;idx.forEach(function(i){var v=se.ys[i];if(!isFinite(v)){pen=false;return}p+=(pen?'L':'M')+X(o.xs[i]).toFixed(1)+','+f(v).toFixed(1);pen=true});s+='<path d="'+p+'" fill="none" stroke="'+se.c+'" stroke-width="'+(se.w||1.3)+'" stroke-linejoin="round"/>'});
 s+='<line class="cr" x1="0" x2="0" y1="'+m.t+'" y2="'+(m.t+H)+'" stroke="#e2e8f0" stroke-width=".8" style="display:none"/><circle class="cd" r="3" fill="#f8fafc" style="display:none"/>';
 var html='<svg id="'+o.id+'" viewBox="0 0 '+W0+' '+H0+'" xmlns="http://www.w3.org/2000/svg">'+s+'</svg>';
 function bind(){var sv=$(o.id),cr=sv.querySelector('.cr'),cd=sv.querySelector('.cd'),ro=$(o.ro);
  function at(ev){var b=sv.getBoundingClientRect(),px=(ev.clientX-b.left)/b.width*W0;px=Math.max(m.l,Math.min(m.l+W,px));var t=x0+(px-m.l)/W*(x1-x0),lo=0,hi=n-1;while(lo<hi){var md=(lo+hi)>>1;if(o.xs[md]<t)lo=md+1;else hi=md}return lo}
  function show(i){var xx=X(o.xs[i]);cr.setAttribute('x1',xx);cr.setAttribute('x2',xx);cr.style.display='';var v0=o.series[0].ys[i];if(isFinite(v0)){cd.setAttribute('cx',xx);cd.setAttribute('cy',ax[o.series[0].axis||'L'].f(v0));cd.style.display=''}
   var h='<span class="d">'+new Date(o.xs[i]).toISOString().slice(0,10)+'</span>'+o.series.map(function(se){return '<span style="color:'+se.c+'">●</span> '+se.name+' <b>'+(isFinite(se.ys[i])?se.f(se.ys[i]):'—')+'</b>'}).join('　');
   var near=(o.marks||[]).filter(function(mk){return mk.k==='ev'&&Math.abs(mk.t-o.xs[i])<Math.max(Math.min((x1-x0)/W*3,10*864e5),2*864e5)});if(near.length)h+='<span class="e">◆ '+near.map(function(mk){return esc(mk.l)}).join('／')+'</span>';ro.innerHTML=h}
  function hide(){cr.style.display='none';cd.style.display='none';ro.innerHTML=o.def||''}
  sv.addEventListener('pointerdown',function(e){show(at(e))});sv.addEventListener('pointermove',function(e){if(e.pointerType==='mouse'||e.buttons||e.pressure>0)show(at(e))});
  sv.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')hide()});hide()}
 return {html:html,bind:bind}}

// ---------- tab: overview ----------
function rOv(){var C=CUR,tw=C[BK].ret,items=A.slice();if(ST.sort)items.sort(function(p,q){var a=C[p.k].st,b=C[q.k].st;return (b?b.r:-9)-(a?a.r:-9)});
 var h='<h2>相關性總覽 <small>'+rngLbl()+'・'+fLbl()+'</small></h2><div class="segline"><span class="seg" id="srt"><button data-s="0"'+(ST.sort?'':' class="on"')+'>預設順序</button><button data-s="1"'+(ST.sort?' class="on"':'')+'>依 r 排序</button></span></div>';
 items.forEach(function(a){var c=C[a.k],st=c.st,r=st?st.r:null,L=st?lvl(r):['無資料','tz'];var w=st?Math.abs(r)*50:0,left=st?(r>=0?50:50-w):50;
  h+='<div class="kr" style="--c:'+a.c+'" data-k="'+a.k+'"><div class="h"><div><span class="n" style="color:'+a.c+'">'+a.n+'</span> <span class="tag '+L[1]+'">'+L[0]+'</span></div><div class="v '+cls(r)+'">'+(st?sg(r):'—')+'</div></div>'+
  '<div class="rbar"><i style="left:'+left+'%;width:'+w+'%;background:'+(r>=0?'#f43f5e':'#10b981')+'"></i>'+(c.all?'<u style="left:calc('+(50+c.all.r*50)+'% - 1px)"></u>':'')+'</div>'+
  '<div class="s"><span>同向率 <b>'+(st?(st.same*100).toFixed(0)+'%':'—')+'</b></span><span>β <b>'+(st?fmt(st.beta,2):'—')+'</b></span><span>全期 r <b>'+(c.all?sg(c.all.r):'—')+'</b></span><span>'+(a.yld?'殖利率':'漲跌')+' <b class="'+cls(c.ret)+'">'+pf(a.k,c.ret)+(c.late?'*':'')+'</b></span></div>'+
  '<div class="more">'+esc(a.m)+'<div class="act"><button class="btn pr" data-go="'+a.k+'">看走勢圖 →</button></div></div></div>'});
 h+='<p class="note">長條＝區間 r（中線為 0，右紅正、左綠負）；白色刻線＝全期 r。點卡片展開說明。'+BN+'同期 <b class="'+cls(tw)+'">'+pct(tw)+'</b>。</p>';
 // returns
 var its=[{n:BN,k:BK,c:'#f1f5f9'}].concat(A.filter(function(a){return !a.yld}).map(function(a){return {n:a.n,k:a.k,c:a.c}})),mx=0.1;
 its.forEach(function(it){var v=C[it.k].ret;it.v=v;it.l=v!=null?Math.log10(1+v):null;if(it.l!=null)mx=Math.max(mx,Math.abs(it.l))});var lo=-Math.min(mx,1)-0.03,hi=mx+0.03,z=(0-lo)/(hi-lo)*100;
 h+='<h2>區間累積報酬 <small>對數刻度</small></h2><div class="card">';
 its.forEach(function(it){var p=it.l==null?null:(it.l-lo)/(hi-lo)*100;h+='<div class="rb"><span>'+it.n+'</span><span class="t" style="--z:'+z+'%">'+(p==null?'':'<i style="left:'+Math.min(z,p)+'%;width:'+Math.max(.8,Math.abs(p-z))+'%;background:'+it.c+'"></i>')+'</span><span class="p '+cls(it.v)+'">'+pct(it.v,0)+(C[it.k].late?'*':'')+'</span></div>'});
 A.filter(function(a){return a.yld}).forEach(function(a){h+='<div class="note" style="margin-top:6px">'+a.n+'變動 <b class="'+cls(C[a.k].ret)+'">'+pf(a.k,C[a.k].ret)+'</b></div>'});
 h+='<div class="note">* 該資產在區間起點後才有資料。</div></div><button class="btn" id="csv1" style="width:100%">⬇ 下載本頁數據 CSV</button>';
 var t=$('t-ov');t.innerHTML=h;
 each('.kr',function(k){k.onclick=function(e){if(e.target.dataset.go){ST.asset=e.target.dataset.go;goTab('ch');return}k.classList.toggle('open')}},t);
 each('#srt button',function(b){b.onclick=function(){ST.sort=+b.dataset.s;rOv()}},t);
 $('csv1').onclick=function(){var rows=[['區間','頻率','商品','r','全期r','同向率','beta','漲跌']];A.forEach(function(a){var c=CUR[a.k];rows.push([rngLbl(),fLbl(),a.n,fmt(c.st&&c.st.r,4),fmt(c.all&&c.all.r,4),fmt(c.st&&c.st.same,4),fmt(c.st&&c.st.beta,4),c.ret==null?'':c.ret.toFixed(4)])});
  rows.push([rngLbl(),'',BN,'','','','',CUR[BK].ret==null?'':CUR[BK].ret.toFixed(4)]);dlCsv(rows,'相關性總覽_'+rngLbl().replace(/[ ~（）]/g,'_')+'.csv')}}
function dlCsv(rows,name){var s='﻿'+rows.map(function(r){return r.map(function(v){v=String(v==null?'':v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')}).join('\r\n');
 var u=URL.createObjectURL(new Blob([s],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);toast('已下載 '+name)}

// ---------- tab: chart ----------
function rCh(){var a=AK[ST.asset],s=ST.s0,e=ST.s1,R=RAW[a.k],xs=[],yt=[],ya=[],b0=null,ba=null,norm=ST.norm;
 for(var i=0;i<N;i++){var d=TW.d[i];if(d<s||d>e)continue;var j=idxLE(R.d,d,false),va=j>=0?R.c[j]:NaN;xs.push(dn(d));
  if(norm){if(b0==null)b0=TW.c[i];if(ba==null&&isFinite(va))ba=va;yt.push(TW.c[i]/b0*100);ya.push(a.yld?va:(isFinite(va)&&ba?va/ba*100:NaN))}else{yt.push(TW.c[i]);ya.push(va)}}
 var h='<div class="ach">'+A.map(function(x){return '<button class="chip'+(x.k===a.k?' on':'')+'" style="--c:'+x.c+'" data-k="'+x.k+'">'+x.n+'</button>'}).join('')+'</div>';
 var c=CUR[a.k],st=c.st,one=norm&&!a.yld;
 h+='<div class="card" style="padding:8px"><div class="ro" id="ro1"></div><div id="c1"></div><div class="lg"><span><i style="background:#f1f5f9"></i>'+BN+'（左）</span><span><i style="background:'+a.c+'"></i>'+a.n+'（'+(one?'左，基期100':'右'+(ST.inv?'，反轉':''))+'）</span>'+(ST.ann?'<span style="color:#fb7185">┆ 事件</span><span style="color:#eab308">▲▼ 波段</span>':'')+'</div>'+
  '<div class="tg"><label><input type="checkbox" id="o-norm"'+(norm?' checked':'')+'>基期=100</label><label><input type="checkbox" id="o-inv"'+(ST.inv?' checked':'')+'>反轉右軸</label><label><input type="checkbox" id="o-log"'+(ST.logy?' checked':'')+'>對數</label><label><input type="checkbox" id="o-ann"'+(ST.ann?' checked':'')+'>事件</label></div></div>';
 h+='<h2>滾動相關 <small>'+({D:'60 日',W:'26 週',M:'12 月'})[ST.f]+'視窗</small></h2><div class="card" style="padding:8px"><div class="ro" id="ro2"></div><div id="c2"></div></div>';
 var dir=st?(st.r>0.2?'同向':st.r<-0.2?'反向':'關係不明顯'):'';
 h+='<div class="card ins" style="border-left:4px solid '+a.c+'"><b>回測診斷</b>：'+rngLbl()+'，'+fLbl()+'，'+a.n+' 與'+BN+' r = <b class="'+cls(st&&st.r)+'">'+(st?sg(st.r):'—')+'</b>（全期 '+(c.all?sg(c.all.r):'—')+'），同向率 '+(st?(st.same*100).toFixed(0)+'%':'—')+'，整體'+dir+'。區間內 '+a.n+' '+pf(a.k,c.ret)+'、'+BN+' '+pct(CUR[BK].ret)+'。'+
  (a.hint==='invert'?'<br>💡 勾「反轉右軸」看鏡像重疊。':'')+(a.hint==='norm'?'<br>💡 勾「基期=100」比較漲幅倍數。':'')+'<div class="note" style="margin-top:6px">'+esc(a.m)+'</div></div>';
 // compare A vs B
 var S=ser(),yA=ST.yr;h+='<h2>單一年度 vs 目前區間 <small><select id="cmpy" style="background:#0f172a;color:#e2e8f0;border:1px solid #475569;border-radius:8px;padding:3px 6px;font-size:13px">'+YEARS.slice().reverse().map(function(y){return '<option'+(y===yA?' selected':'')+'>'+y+'</option>'}).join('')+'</select></small></h2>';
 h+='<div class="card" style="padding:6px 10px"><table class="tb"><tr><th>商品</th><th>r('+yA+')</th><th>r(區間)</th><th>'+yA+'漲跌</th></tr>';
 A.forEach(function(x){var sa=stats(S,x.k,yA*1e4+101,yA*1e4+1231),sb=CUR[x.k].st,p=perf(x.k,yA*1e4+101,yA*1e4+1231);h+='<tr><td style="color:'+x.c+'">'+x.s+'</td><td style="background:'+rcol(sa&&sa.r,.45)+'">'+sg(sa&&sa.r)+'</td><td style="background:'+rcol(sb&&sb.r,.45)+'">'+sg(sb&&sb.r)+'</td><td class="'+cls(p)+'">'+pf(x.k,p,0)+'</td></tr>'});
 var pt=perf(BK,yA*1e4+101,yA*1e4+1231);h+='<tr><td>'+BN+'</td><td></td><td></td><td class="'+cls(pt)+'"><b>'+pct(pt,0)+'</b></td></tr></table></div>';
 var t=$('t-ch');t.innerHTML=h;
 if(xs.length<5){$('c1').innerHTML='<p class="note">區間資料不足</p>';}else{
  var marks=[];if(ST.ann){EV.forEach(function(v){var x=di(v.date);if(x>=s&&x<=e)marks.push({t:dn(x),l:v.date+' '+v.title,k:'ev'})});
   SW.piv.forEach(function(p){var d=TW.d[p.i];if(d>=s&&d<=e&&p.t.indexOf('*')<0)marks.push({t:dn(d),y:norm?TW.c[p.i]/b0*100:TW.c[p.i],up:p.t==='H',k:'sw'})})}
  var fA=function(v){return a.yld?v.toFixed(2)+'%':norm?v.toFixed(1):(+v.toPrecision(5)).toLocaleString()};
  var c1=mChart({id:'mc1',w:360,h:230,xs:xs,logL:ST.logy,invR:ST.inv,marks:marks,ro:'ro1',def:'<span class="note">👆 按住圖表左右滑動看數值與事件</span>',
   series:[{ys:yt,c:'#f1f5f9',name:BN,axis:'L',w:1.6,f:function(v){return norm?v.toFixed(1):Math.round(v).toLocaleString()}},{ys:ya,c:a.c,name:a.s,axis:one?'L':'R',f:fA}],
   fl:function(t){return norm?t:(t>=1000?(t/1000)+'k':t)}});$('c1').innerHTML=c1.html;c1.bind();
  var win=ST.f==='D'?60:ST.f==='W'?26:12,rx=[],ry=[],X=S.a[a.k],Y=S.tw;
  for(var i2=0;i2<S.dates.length;i2++){var d2=S.dates[i2];if(d2<s||d2>e)continue;var xa=[],yb=[];for(var k=Math.max(1,i2-win+1);k<=i2;k++)if(isFinite(X[k])&&isFinite(Y[k])){xa.push(X[k]);yb.push(Y[k])}
   var r=NaN;if(xa.length>=win*0.6){var nn=xa.length,mx=0,my=0,sxy=0,sxx=0,syy=0;for(k=0;k<nn;k++){mx+=xa[k];my+=yb[k]}mx/=nn;my/=nn;for(k=0;k<nn;k++){var p=xa[k]-mx,q=yb[k]-my;sxy+=p*q;sxx+=p*p;syy+=q*q}r=sxy/Math.sqrt(sxx*syy)}rx.push(dn(d2));ry.push(r)}
  if(rx.length>2){var c2=mChart({id:'mc2',w:360,h:150,xs:rx,fix:[-1,1],zero:0,marks:marks.filter(function(m){return m.k==='ev'}),ro:'ro2',def:'<span class="note">區間 r = <b>'+(st?sg(st.r):'—')+'</b>，滑動看各時點滾動 r</span>',
   series:[{ys:ry,c:a.c,name:'滾動 r',f:function(v){return v.toFixed(2)}}],fl:function(t){return t.toFixed(1)}});$('c2').innerHTML=c2.html;c2.bind()}else $('c2').innerHTML='<p class="note">區間太短，請改用日報酬或拉長區間</p>'}
 each('.ach .chip',function(b){b.onclick=function(){ST.asset=b.dataset.k;rCh();var on=t.querySelector('.ach .on');if(on)on.scrollIntoView({inline:'center',block:'nearest'})}},t);
 [['o-norm','norm'],['o-inv','inv'],['o-log','logy'],['o-ann','ann']].forEach(function(p){$(p[0]).onchange=function(){ST[p[1]]=this.checked;rCh()}});
 $('cmpy').onchange=function(){ST.yr=+this.value;rCh()}}

// ---------- tab: years ----------
function yrRet(y){var s=y*1e4+101,e=y*1e4+1231,o={tw:perf(BK,s,e)};A.forEach(function(a){o[a.k]=late(a.k,s)?null:perf(a.k,s,e)});return o}
function rYr(){var S=ser(),cols='34px'+(ST.hm==='ret'?' 1.1fr':'')+' repeat('+A.length+',1fr)';
 var h='<h2>逐年一覽 <small>點年份看細節</small></h2><div class="segline"><span class="seg" id="hmv"><button data-v="r"'+(ST.hm==='r'?' class="on"':'')+'>相關係數 r</button><button data-v="ret"'+(ST.hm==='ret'?' class="on"':'')+'>年度漲跌</button></span></div>';
 h+='<div class="card" style="padding:8px"><div class="hg" style="grid-template-columns:'+cols+'"><div class="hd">年</div>'+(ST.hm==='ret'?'<div class="hd">台股</div>':'')+A.map(function(a){return '<div class="hd" style="color:'+a.c+'">'+a.s+'</div>'}).join('');
 var agree={},cnt={};
 YEARS.slice().reverse().forEach(function(y){h+='<div class="y'+(y===ST.yr?' sel':'')+'" data-y="'+y+'">'+String(y).slice(2)+(y===Y1?'*':'')+'</div>';
  if(ST.hm==='r'){A.forEach(function(a){var st=stats(S,a.k,y*1e4+101,y*1e4+1231),r=st?st.r:null;h+='<div data-y="'+y+'" style="background:'+rcol(r)+'">'+(r==null?'':r.toFixed(2).replace('0.','.'))+'</div>'})}
  else{var o=yrRet(y);h+='<div data-y="'+y+'" style="background:'+(o.tw>0?'rgba(244,63,94,.35)':'rgba(16,185,129,.35)')+';font-weight:700">'+(o.tw==null?'':(o.tw*100).toFixed(0))+'</div>';
   A.forEach(function(a){var v=o[a.k],bg='#1e293b';if(v!=null&&o.tw!=null){var same=(v>0)===(o.tw>0);bg=same?'rgba(244,63,94,.22)':'rgba(16,185,129,.22)';cnt[a.k]=(cnt[a.k]||0)+1;agree[a.k]=(agree[a.k]||0)+(same?1:0)}
    h+='<div data-y="'+y+'" style="background:'+bg+'" class="'+cls(v)+'">'+(v==null?'':a.yld?(v>0?'+':'')+v.toFixed(1):(Math.abs(v)>=10?(v/10).toFixed(1)+'k':(v*100).toFixed(0)))+'</div>'})}});
 if(ST.hm==='ret'){h+='<div class="hd">一致</div><div></div>'+A.map(function(a){return '<div class="hd">'+(cnt[a.k]?Math.round(agree[a.k]/cnt[a.k]*100)+'%':'—')+'</div>'}).join('')}
 else{h+='<div class="hd">全期</div>'+A.map(function(a){var st=stats(S,a.k,ALLS,LAST);return '<div style="background:'+rcol(st&&st.r)+';font-weight:700">'+(st?st.r.toFixed(2).replace('0.','.'):'')+'</div>'}).join('')}
 h+='</div><p class="note" style="margin-top:6px">'+(ST.hm==='r'?'r 值（'+fLbl()+'），紅＝正相關、綠＝負相關。':'數字為 %（美債為殖利率變動點數）；底色紅＝與台股同向、綠＝反向；「一致」為方向一致率。')+' * 為今年至今。</p></div>';
 // detail
 var y=ST.yr,o=yrRet(y),th=THEME[y]||autoTheme(y,o);
 h+='<div class="card yd"><div style="display:flex;justify-content:space-between;align-items:center"><span class="ttl">'+y+(y===Y1?'（至今）':'')+'</span><span class="'+cls(o.tw)+'" style="font-size:18px;font-weight:800">'+BN+' '+pct(o.tw)+'</span></div><p class="note" style="margin-top:4px;color:#cbd5e1">'+esc(th)+'</p><div class="gr">';
 A.forEach(function(a){var st=stats(S,a.k,y*1e4+101,y*1e4+1231);h+='<span><em style="font-style:normal;color:'+a.c+'">'+a.s+'</em><b class="'+cls(o[a.k])+'">'+pf(a.k,o[a.k],0)+'</b><i style="font-style:normal;color:#94a3b8">r '+(st?sg(st.r):'—')+'</i></span>'});
 h+='</div><div class="act" style="display:flex;gap:8px;margin-top:10px"><button class="btn pr" id="ysel">把期間設為 '+y+' 年</button></div></div>';
 var t=$('t-yr');t.innerHTML=h;
 each('[data-y]',function(c){c.onclick=function(){ST.yr=+c.dataset.y;rYr()}},t);
 each('#hmv button',function(b){b.onclick=function(){ST.hm=b.dataset.v;rYr()}},t);
 $('ysel').onclick=function(){jumpYear(ST.yr)}}
function autoTheme(y,o){return '（資料至 '+ds(LAST)+'，依數據自動產生）'+A.slice(0,5).map(function(a){return a.n+' '+pf(a.k,o[a.k])}).join('、')}

// ---------- tab: events ----------
function evWin(ec){if(ec.type!=='auto')return [di(ec.start),Math.min(di(ec.end),LAST)];var g=SW.seg[SW.seg.length-1];return [TW.d[g.s],TW.d[g.e]]}
function rEv(){var h='<div class="segline"><span class="seg" id="evv"><button data-v="p"'+(ST.evv==='p'?' class="on"':'')+'>事件期間</button><button data-v="d"'+(ST.evv==='d'?' class="on"':'')+'>事件日表現</button></span></div>';
 if(ST.evv==='p'){var S=ser('W');h+='<p class="note" style="margin-bottom:8px">數字皆由實際數據計算。點卡片可把期間設為該事件並看走勢。</p>';
  EC.forEach(function(ec,ix){var w=evWin(ec),s=w[0],e=w[1];if(s>LAST)return;var tw=perf(BK,s,e),t=ec.type,ti=ec.title;
   if(t==='auto'){var g=SW.seg[SW.seg.length-1];t=g.up?'bull':'bear';ti='最近一段'+(g.up?'多頭':'空頭')+'波段'+(g.open?'（進行中）':'')}
   var i0=idxLE(TW.d,s,false),i1=idxLE(TW.d,e,false),hi=-1,lo=1e12;for(var i=Math.max(0,i0);i<=i1;i++){hi=Math.max(hi,TW.c[i]);lo=Math.min(lo,TW.c[i])}
   h+='<div class="card ec '+t+'" data-s="'+s+'" data-e="'+e+'"><div class="m"><span>'+ds(s)+' ~ '+ds(e)+'</span><span>'+esc(ec.tag||'')+'</span></div><div class="ti">'+(ix+1)+'. '+esc(ti)+'</div>'+
    '<span class="tag '+(tw>0?'tp':'tn')+'">'+BN+' '+pct(tw)+'　高 '+Math.round(hi).toLocaleString()+'／低 '+Math.round(lo).toLocaleString()+'</span><p>'+esc(ec.body||'')+'</p><div class="pills">'+
    A.map(function(a){var v=perf(a.k,s,e);return '<span class="pl">'+a.s+' <b class="'+cls(v)+'">'+pf(a.k,v,0)+'</b></span>'}).join('')+
    '<span class="pl">週 r：'+FOCUS.slice(0,3).map(function(k){var st=stats(S,k,s,e);return AK[k].s+' '+(st?sg(st.r):'—')}).join('／')+'</span></div></div>'})}
 else{h+='<p class="note" style="margin-bottom:6px">以事件日前一個台股交易日收盤為基準。點列展開各資產 20 日表現。</p><div class="card" style="padding:4px 10px">';
  EV.slice().reverse().forEach(function(ev){var x=di(ev.date);if(x<FIRST||x>LAST)return;var i=idxLE(TW.d,x,true)+1;if(i<1||i>=N)return;var b=TW.c[i-1];
   function f(n){return i+n-1<N?TW.c[i+n-1]/b-1:null}function ar(k,n){var R=RAW[k],j0=idxLE(R.d,TW.d[i-1],false),j1=idxLE(R.d,TW.d[Math.min(N-1,i+n-1)],false);return (j0>=0&&j1>j0)?chg(AK[k],R.c[j1],R.c[j0]):null}
   var v=[f(1),f(5),f(20),f(60)];
   h+='<div class="pt"><div class="h"><span>'+ev.date+'</span><b>'+esc(ev.title)+'</b></div><div class="r">'+['當日','5日','20日','60日'].map(function(l,j){return '<span>'+l+' <b class="'+cls(v[j])+'">'+pct(v[j])+'</b></span>'}).join('')+'</div>'+
    '<div class="x pills">'+A.map(function(a){var z=ar(a.k,20);return '<span class="pl">'+a.s+' 20日 <b class="'+cls(z)+'">'+pf(a.k,z)+'</b></span>'}).join('')+'</div></div>'});h+='</div>'}
 var t=$('t-ev');t.innerHTML=h;
 each('#evv button',function(b){b.onclick=function(){ST.evv=b.dataset.v;rEv()}},t);
 each('.ec',function(c){c.onclick=function(){setRange(+c.dataset.s,+c.dataset.e,'');goTab('ch')}},t);
 each('.pt',function(c){c.onclick=function(){c.classList.toggle('open')}},t)}

// ---------- tab: swings ----------
function rSw(){var h='<div class="segline"><span class="seg" id="swv"><button data-v="s"'+(ST.swv==='s'?' class="on"':'')+'>±20% 大行情</button><button data-v="b"'+(ST.swv==='b'?' class="on"':'')+'>單日最大漲跌</button></span></div>';
 if(ST.swv==='s'){h+='<p class="note" style="margin-bottom:8px">收盤價 ±20% 反轉定義波段。點卡片把期間設為該波段。</p>';
  SW.seg.slice().reverse().forEach(function(g){var s=TW.d[g.s],e=TW.d[g.e],r=TW.c[g.e]/TW.c[g.s]-1;
   h+='<div class="card sw ec '+(g.up?'bull':'bear')+'" data-s="'+s+'" data-e="'+e+'"><div class="h"><span class="tag '+(g.up?'tp':'tn')+'">'+(g.up?'多頭':'空頭')+(g.open?'（進行中）':'')+'</span><span class="big '+cls(r)+'">'+pct(r)+'</span></div>'+
    '<div class="d">'+ds(s)+' '+Math.round(TW.c[g.s]).toLocaleString()+' → '+ds(e)+' '+Math.round(TW.c[g.e]).toLocaleString()+'　'+Math.round((dn(e)-dn(s))/864e5)+' 天</div><div class="pills">'+
    A.map(function(a){var R=RAW[a.k],i0=idxLE(R.d,s,false),i1=idxLE(R.d,e,false),v=(i0>=0&&i1>i0)?chg(a,R.c[i1],R.c[i0]):null;return '<span class="pl">'+a.s+' <b class="'+cls(v)+'">'+pf(a.k,v,0)+'</b></span>'}).join('')+'</div></div>'})}
 else{var S=ser('D'),arr=[];for(var i=1;i<N;i++)arr.push(i);var ks=FOCUS.slice(0,4);
  var up=arr.slice().sort(function(a,b){return S.tw[b]-S.tw[a]}).slice(0,10),dn2=arr.slice().sort(function(a,b){return S.tw[a]-S.tw[b]}).slice(0,10);
  function list(ix,ttl,c){var o='<h2 class="'+c+'">'+ttl+'</h2><div class="card" style="padding:4px 10px">';ix.forEach(function(i,n){o+='<div class="pt" style="cursor:default"><div class="h"><span>'+(n+1)+'. '+ds(TW.d[i])+'</span><b class="'+cls(S.tw[i])+'" style="text-align:right;flex:0">'+pct(S.tw[i],2)+'</b></div><div class="r">'+ks.map(function(k){var v=S.a[k][i];return '<span>'+AK[k].s+' <b class="'+cls(v)+'">'+pf(k,v)+'</b></span>'}).join('')+'</div></div>'});return o+'</div>'}
  h+=list(up,'▲ 最大漲幅 Top 10','pos')+list(dn2,'▼ 最大跌幅 Top 10','neg')+'<p class="note">商品為對應日變動（美國盤取前一晚）。</p>'}
 var t=$('t-sw');t.innerHTML=h;
 each('#swv button',function(b){b.onclick=function(){ST.swv=b.dataset.v;rSw()}},t);
 each('.sw',function(c){c.onclick=function(){setRange(+c.dataset.s,+c.dataset.e,'');goTab('ch')}},t)}

// ---------- controls ----------
var R={ov:rOv,ch:rCh,yr:rYr,ev:rEv,sw:rSw},DIRTY={};
function render(){DIRTY={ov:1,ch:1,yr:1,ev:1,sw:1};$('rl').textContent=rngLbl();R[ST.tab]();DIRTY[ST.tab]=0}
function update(){compute();render()}
function goTab(t){ST.tab=t;each('.tab',function(s){s.classList.toggle('on',s.id==='t-'+t)});each('#nav button',function(b){b.classList.toggle('on',b.dataset.t===t)});if(DIRTY[t]!==0){R[t]();DIRTY[t]=0}window.scrollTo(0,0)}
var PRE=[['all','全期'],['y1','近1年'],['y3','近3年'],['y5','近5年'],['y10','近10年'],['gfc','金融海嘯','20070101','20091231'],['eu','歐債','20100101','20121231'],['qe','疫後QE','20200101','20211231'],['hike','升息2022','20220101','20221231'],['ai','AI週期','20230101','']];
function preset(k){var p=PRE.filter(function(x){return x[0]===k})[0],s,e=LAST;if(k==='all')s=ALLS;else if(/^y\d+$/.test(k))s=LAST-(+k.slice(1))*1e4;else{s=+p[2];e=p[3]?+p[3]:LAST}setRange(s,e,k)}
function setRange(s,e,pk){ST.mode='range';ST.s0=s;ST.s1=Math.min(e,LAST);ST.pk=pk;each('#pres .chip',function(b){b.classList.toggle('on',b.dataset.p===pk)});update()}
function jumpYear(y){ST.mode='single';ST.s0=y*1e4+101;ST.s1=Math.min(y*1e4+1231,LAST);ST.yr=y;ST.pk='';each('#pres .chip',function(b){b.classList.remove('on')});update();toast('期間已設為 '+y+' 年')}
$('pres').innerHTML=PRE.map(function(p){return '<button class="chip" data-p="'+p[0]+'">'+p[1]+'</button>'}).join('');
each('#pres .chip',function(b){b.onclick=function(){preset(b.dataset.p)}});
each('#fq button',function(b){b.onclick=function(){ST.f=b.dataset.f;each('#fq button',function(x){x.classList.toggle('on',x===b)});update()}});
each('#nav button',function(b){b.onclick=function(){goTab(b.dataset.t)}});
// sheet
var sm='range';function openSheet(){sm=ST.mode;$('s0').value=ds(ST.s0);$('s1').value=ds(ST.s1);$('yr').value=ST.mode==='single'?Math.floor(ST.s0/1e4):ST.yr;syncSheet();$('sheet').classList.add('on');$('sbg').classList.add('on')}
function closeSheet(){$('sheet').classList.remove('on');$('sbg').classList.remove('on')}
function syncSheet(){each('#mseg button',function(b){b.classList.toggle('on',b.dataset.m===sm)});$('s-range').hidden=sm!=='range';$('s-single').hidden=sm!=='single'}
$('rngbtn').onclick=openSheet;$('sbg').onclick=closeSheet;
each('#mseg button',function(b){b.onclick=function(){sm=b.dataset.m;syncSheet()}});
YEARS.slice().reverse().forEach(function(y){$('yr').insertAdjacentHTML('beforeend','<option value="'+y+'">'+y+(y===Y1?'（至今）':'')+'</option>')});
$('s0').min=$('s1').min=ds(FIRST);$('s0').max=$('s1').max=ds(LAST);
var lastMode=$('mode').value;
$('apply').onclick=function(){closeSheet();if($('mode').value!==lastMode){lastMode=$('mode').value;ALIGN={}}
 if(sm==='single'){jumpYear(+$('yr').value)}else{var s=di($('s0').value),e=di($('s1').value);if(!(s&&e)){toast('請選擇日期');return}if(s>e){var t=s;s=e;e=t}setRange(s,e,'')}};
// header
var rp=META.report||{},bad=Object.keys(rp).filter(function(k){return rp[k].status!=='ok'});
$('upd').innerHTML='資料 '+ds(FIRST).slice(0,4)+'～'+ds(LAST)+'・更新 '+esc(META.generated||'')+(bad.length?' <span style="color:#fbbf24">⚠ '+bad.map(function(k){return AK[k]?AK[k].s:k}).join('、')+' 沿用舊資料</span>':'');
preset('all');goTab('ov');
$('ld').style.display='none';
})();
