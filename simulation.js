/* Browser implementation of Rowan's supplied Python GBM model. */
(function(root){
'use strict';
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const stdev=a=>{const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1));};
function parameters(training,method='original'){
 const p=training.map(r=>r.close);
 if(p.length<2||p.some(v=>!Number.isFinite(v)||v<=0))throw Error('Closing prices must be positive and finite.');
 const logs=p.slice(1).map((v,i)=>Math.log(v/p[i]));
 return {initial:p.at(-1),mu:p.at(-1)/p[0]-1,sigma:method==='returns'?stdev(logs)*Math.sqrt(252):stdev(p)/p[0]};
}
function normal(random=Math.random){let u=0;while(u===0)u=random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*random());}
function simulate(p,count=100,days=252,random=Math.random){
 if(!Number.isInteger(count)||count<1||!Number.isInteger(days)||days<1||!Number.isFinite(p.mu)||!Number.isFinite(p.sigma)||p.sigma<0||!(p.initial>0))throw Error('Invalid simulation inputs.');
 return Array.from({length:count},()=>{const path=[p.initial];for(let i=0;i<days;i++)path.push(path.at(-1)*Math.exp((p.mu-p.sigma**2/2)/252+p.sigma*normal(random)/Math.sqrt(252)));return path;});
}
function quantile(sorted,q){const x=(sorted.length-1)*q,i=Math.floor(x);return sorted[i]+(sorted[Math.min(i+1,sorted.length-1)]-sorted[i])*(x-i);}
function summarize(paths){return paths[0].map((_,i)=>{const a=paths.map(p=>p[i]).sort((a,b)=>a-b);return {low:quantile(a,.1),median:quantile(a,.5),high:quantile(a,.9)};});}
const money=x=>'$'+x.toFixed(2),pct=x=>(x>=0?'+':'')+(x*100).toFixed(2)+'%';
const fmtDate=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit',timeZone:'UTC'});
function markup(){return `<section class="sim-panel" aria-label="Apple stock simulation"><div id="sim-loading" role="status">Loading historical data…</div><div id="sim-ready" hidden><div class="sim-controls"><label for="sim-method">Volatility estimate<select id="sim-method"><option value="original">Original model</option><option value="returns">Daily-return volatility</option></select></label><button class="sim-run" id="sim-run" type="button">Run 100 simulations</button></div><p id="sim-parameters" class="sim-parameters"></p><div class="sim-legend"><span><i class="swatch paths"></i>100 paths</span><span><i class="swatch median"></i>Median</span><label class="sim-toggle"><input id="sim-actual" type="checkbox" checked><i class="swatch actual"></i>Actual AAPL</label></div><div id="sim-chart" class="sim-chart"></div><div class="sim-inspector"><label for="sim-day">Trading day</label><input id="sim-day" type="range" min="0" max="251" value="251"></div><output class="sim-inspect" id="sim-inspect" for="sim-day"></output><div id="sim-summary" class="sim-summary" aria-live="polite"></div><p class="sim-note">Prior-year estimates; fixed historical comparison. Original price dispersion or annualized daily-return volatility. Not a live forecast.</p><div class="sim-bottom"><p id="sim-status" role="status">Ready.</p><button id="sim-export" class="sim-export" type="button" disabled>Download paths ↓</button></div></div></section>`;}
let cleanup=()=>{};
function dispose(){cleanup();cleanup=()=>{};}
async function mount(){
 dispose();const host=document.getElementById('sim-chart');if(!host)return;
 let alive=true,paths=[],stats=[],data,params,drawInfo,days,run=0,busy=false;
 const abort=new AbortController();let observer;
 cleanup=()=>{alive=false;abort.abort();observer?.disconnect();};
 const el=id=>document.getElementById(id);
 try{const res=await fetch('aapl-data.json',{signal:abort.signal});if(!res.ok)throw Error('Data not available');data=await res.json();if(!alive)return;
 if(data.actual.length!==252||data.actual.at(-1).date!=='2026-10-29'||data.training.at(-1).date!==data.actual[0].date)throw Error('Historical dates do not align');
 }catch(e){if(alive)el('sim-loading').textContent='Historical data could not load. Please refresh to try again.';return;}
 days=data.actual.length-1;el('sim-day').max=days;el('sim-day').value=days;el('sim-loading').hidden=true;el('sim-ready').hidden=false;
 function updateParams(){params=parameters(data.training,el('sim-method').value);el('sim-parameters').textContent=`Starting price ${money(params.initial)} · Annual drift ${(params.mu*100).toFixed(2)}% · ${el('sim-method').value==='original'?'Price-dispersion σ':'Annualized return σ'} ${(params.sigma*100).toFixed(2)}%`;}
 function inspection(){const i=Number(el('sim-day').value),d=data.actual[i];el('sim-inspect').textContent=`${fmtDate(d.date)} · Actual ${el('sim-actual').checked?money(d.close):'hidden'}${stats.length?' · Median '+money(stats[i].median)+' · 10–90% '+money(stats[i].low)+' to '+money(stats[i].high):''}`;const line=host.querySelector('#sim-crosshair');if(line&&drawInfo){const x=drawInfo.x(i);line.setAttribute('x1',x);line.setAttribute('x2',x);}}
 function draw(){
 const W=Math.max(300,host.clientWidth||800),H=W<500?240:(window.matchMedia('(min-width:1100px) and (max-height:850px)').matches?145:170),left=52,right=20,top=25,bottom=40,show=el('sim-actual').checked;
 let values=[params.initial];for(const path of paths)values.push(...path);if(show)values.push(...data.actual.map(r=>r.close));let lo=Math.min(...values),hi=Math.max(...values);const pad=Math.max(3,(hi-lo)*.08);lo-=pad;hi+=pad;
 const x=i=>left+i/days*(W-left-right),y=v=>top+(hi-v)/(hi-lo)*(H-top-bottom);drawInfo={x};
 const pathD=a=>a.map((v,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(v).toFixed(2)).join(' ');
 let grid='';for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4,yy=y(v);grid+=`<path d="M${left} ${yy}H${W-right}" stroke="#e1e8e1"/><text x="${left-9}" y="${yy+4}" text-anchor="end">$${v.toFixed(0)}</text>`;}
 for(const i of (W<500?[0,Math.round(days/2),days]:[0,Math.round(days/4),Math.round(days/2),Math.round(days*3/4),days]))grid+=`<text x="${x(i)}" y="${H-12}" text-anchor="${i===0?'start':i===days?'end':'middle'}">${fmtDate(data.actual[i].date)}</text>`;
 const lines=paths.map((p,i)=>`<path d="${pathD(p)}" fill="none" stroke="${['#397f69','#5487ac','#727aaf','#678c65'][i%4]}" stroke-width="1.3" opacity=".48"/>`).join('');
 const med=stats.length?`<path d="${pathD(stats.map(s=>s.median))}" fill="none" stroke="#a75b13" stroke-width="2.8" stroke-dasharray="7 4"/>`:'';
 const actual=show?`<path d="${pathD(data.actual.map(r=>r.close))}" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="${pathD(data.actual.map(r=>r.close))}" fill="none" stroke="#101b25" stroke-width="3.5" stroke-linejoin="round"/><circle cx="${x(days)}" cy="${y(data.actual[days].close)}" r="4" fill="#101b25"/>`:'';
 host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="AAPL closing-price comparison, October 29, 2025 to October 29, 2026. ${paths.length} simulated paths; ${show?'bold actual price line shown':'actual price hidden'}. Use the trading-day slider below for exact values."><g class="sim-grid">${grid}</g><g class="sim-traces">${lines}${med}${actual}</g><line id="sim-crosshair" x1="${x(Number(el('sim-day').value))}" x2="${x(Number(el('sim-day').value))}" y1="${top}" y2="${H-bottom}" stroke="#82948a" stroke-dasharray="3 5" opacity=".5"/></svg>`;
 const svg=host.querySelector('svg');svg.addEventListener('pointermove',e=>{const box=svg.getBoundingClientRect();const px=(e.clientX-box.left)*W/box.width;el('sim-day').value=Math.max(0,Math.min(days,Math.round((px-left)/(W-left-right)*days)));inspection();});inspection();
 }
 function summary(){const last=data.actual.at(-1);el('sim-summary').innerHTML=`<div><span>Actual final close</span><strong>${el('sim-actual').checked?money(last.close):'Hidden'}</strong><small>${el('sim-actual').checked?pct(last.close/params.initial-1)+' over one year':'Enable the actual-price overlay'}</small></div><div><span>Simulated median</span><strong>${stats.length?money(stats.at(-1).median):'…'}</strong><small>${stats.length?pct(stats.at(-1).median/params.initial-1)+' in this batch':'Run to see the result'}</small></div><div><span>Simulated 10–90% range</span><strong class="sim-range">${stats.length?money(stats.at(-1).low)+' – '+money(stats.at(-1).high):'…'}</strong><small>Final prices across this batch</small></div>`;}
 el('sim-run').addEventListener('click',async()=>{if(busy)return;busy=true;const btn=el('sim-run');btn.disabled=true;btn.textContent='Simulating…';try{await new Promise(requestAnimationFrame);if(!alive)return;paths=simulate(params,100,days);stats=summarize(paths);run++;draw();summary();el('sim-export').disabled=false;el('sim-status').textContent=`Run ${run} · 100 paths · Historical prices unchanged`;}catch(e){if(alive)el('sim-status').textContent='The simulation could not complete. Please try again.';}finally{busy=false;if(alive){btn.disabled=false;btn.textContent='Simulate again';}}});
 el('sim-method').addEventListener('change',()=>{paths=[];stats=[];updateParams();draw();summary();el('sim-export').disabled=true;el('sim-run').textContent='Run 100 simulations';el('sim-status').textContent='Volatility estimate changed. Run a new batch to compare.';});
 el('sim-actual').addEventListener('change',()=>{draw();summary();});el('sim-day').addEventListener('input',inspection);
 el('sim-export').addEventListener('click',()=>{if(!paths.length)return;const rows=[['Date','Actual close',...paths.map((_,i)=>'Path '+(i+1))].join(',')];for(let i=0;i<data.actual.length;i++)rows.push([data.actual[i].date,data.actual[i].close,...paths.map(p=>p[i].toFixed(6))].join(','));const url=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download=`AAPL-100-paths-${el('sim-method').value}-run-${run}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 updateParams();draw();summary();observer=new ResizeObserver(()=>{if(alive)draw();});observer.observe(host);el('sim-run').click();
}
root.StockSim={parameters,simulate,summarize,normal,markup,mount,dispose};
})(typeof window==='undefined'?globalThis:window);
