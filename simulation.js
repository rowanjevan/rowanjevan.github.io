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
const fmtDate=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'2-digit',timeZone:'UTC'});
function csvRows(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell.trim());cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('CSV contains an unclosed quote.');row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
function parseHistory(text,ticker){
 ticker=ticker.trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9.^=-]{0,14}$/.test(ticker))throw Error('Enter a valid ticker, such as MSFT or BRK.B.');
 const rows=csvRows(text.replace(/^\uFEFF/,''));if(!rows.length)throw Error('The CSV is empty.');
 const head=rows[0].map(v=>v.toLowerCase());const ci=head.indexOf('close')>=0?head.indexOf('close'):head.indexOf('adj close');const di=head.indexOf('date')>=0?head.indexOf('date'):head[0]==='price'?0:-1;
 if(ci<0||di<0)throw Error('Use a CSV with Date and Close columns. Yahoo multi-row headers also work.');
 const seen=new Set(),all=[];for(const row of rows.slice(1)){if(row[0]?.toLowerCase()==='ticker'){const fileTicker=row[ci]?.toUpperCase();if(fileTicker&&fileTicker!==ticker)throw Error('The CSV ticker is '+fileTicker+'. Update the ticker field to match.');continue;}if(row[0]?.toLowerCase()==='date')continue;
 const date=row[di]?.slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Every price row needs a valid YYYY-MM-DD date.');
 const close=Number((row[ci]||'').replace(/,/g,''));if(!Number.isFinite(close)||close<=0)throw Error('Closing prices must be positive numbers.');if(seen.has(date))throw Error('The CSV contains duplicate dates.');seen.add(date);all.push({date,close});}
 all.sort((a,b)=>a.date.localeCompare(b.date));if(!all.length)throw Error('No price rows found.');const cutoff=new Date(all.at(-1).date+'T12:00:00Z');cutoff.setUTCFullYear(cutoff.getUTCFullYear()-1);const training=all.filter(r=>r.date>=cutoff.toISOString().slice(0,10));const span=(Date.parse(training.at(-1).date)-Date.parse(training[0].date))/86400000;
 if(training.length<200||span<300)throw Error('Upload about one year of daily prices (at least 200 rows spanning 300 days).');
 return {ticker,training,actual:Array.from({length:253},()=>({date:'',close:null})),custom:true};
}
function validateLookup(next, expected){
 if(!next||next.ticker!==expected||!Array.isArray(next.training)||!Array.isArray(next.actual)||next.training.length<200||next.actual.length<200||next.training.length>400||next.actual.length>400)throw Error('The data service returned incomplete history.');
 for(const series of [next.training,next.actual]){let previous='';for(const point of series){if(!/^\d{4}-\d{2}-\d{2}$/.test(point.date)||point.date<=previous||!Number.isFinite(point.close)||point.close<=0)throw Error('The data service returned invalid prices.');previous=point.date;}}
 if(next.training.at(-1).date!==next.actual[0].date||next.training.at(-1).close!==next.actual[0].close)throw Error('Training and comparison dates do not align.');
 if(!/^[A-Za-z]{3}$/.test(next.currency||''))throw Error('The price currency is unavailable.');
 return {ticker:expected,training:next.training,actual:next.actual,currency:next.currency,lookup:true,custom:false};
}
function controlsMarkup(){return `<form id="simulation-form" class="unified-controls"><label for="lookup-ticker">Stock Ticker<input id="lookup-ticker" value="AAPL" maxlength="15" autocomplete="off" spellcheck="false" required placeholder="MSFT"${root.STOCK_API_BASE?'':' readonly'}></label><label for="sim-method">Model<select id="sim-method"><option value="original">Original Model</option><option value="returns">Daily-Return Volatility</option></select></label><button id="sim-run" type="submit">Simulate</button></form>`;}
function markup(){return `<div id="sim-loading" class="project-toolbar" role="status">Loading historical data…</div><div id="sim-ready" hidden>
 <div class="sim-control-area project-toolbar">${controlsMarkup()}<p id="sim-parameters" class="sim-parameters"></p></div>
 <div class="sim-visual project-visual"><div class="sim-legend"><span><i class="swatch paths"></i>100 Paths</span><span><i class="swatch median"></i>Median</span><label class="sim-toggle"><input id="sim-actual" type="checkbox" checked><i class="swatch actual"></i><span id="actual-label">Actual AAPL</span></label></div><div id="sim-chart" class="sim-chart"></div><p id="lookup-status" role="status"></p></div>
 <div class="sim-result-area project-details"><div class="sim-inspector"><label for="sim-day">Trading Session</label><input id="sim-day" type="range" min="0" max="251" value="251"></div><output class="sim-inspect" id="sim-inspect" for="sim-day"></output><div id="sim-summary" class="sim-summary" aria-live="polite"></div><p id="sim-note" class="sim-note">Apple: Oct 29, 2025–Oct 29, 2026. Fixed historical comparison, not a live forecast.</p><div class="sim-bottom"><p id="sim-status" role="status">Ready.</p><button id="sim-export" class="sim-export" type="button" disabled>Download Paths</button></div><div class="project-methods"><strong>Methods</strong><p>Geometric Brownian motion · Monte Carlo simulation · Volatility estimation · Historical comparison</p></div></div>
 </div>`;}
let cleanup=()=>{};
function dispose(){cleanup();cleanup=()=>{};}
async function mount(){
 dispose();const host=document.getElementById('sim-chart');if(!host)return;
 let alive=true,paths=[],stats=[],data,params,drawInfo,days,run=0,busy=false;
 const abort=new AbortController();let observer,lookupAbort,lookupSerial=0;
 const money=x=>(data?.currency&&data.currency!=='USD'?data.currency+' ':'$')+x.toFixed(2);
 cleanup=()=>{alive=false;abort.abort();lookupAbort?.abort();observer?.disconnect();};
 const el=id=>document.getElementById(id);
 try{const res=await fetch('aapl-data.json',{signal:abort.signal});if(!res.ok)throw Error('Data not available');data=await res.json();if(!alive)return;
 if(data.actual.length!==252||data.actual.at(-1).date!=='2026-10-29'||data.training.at(-1).date!==data.actual[0].date)throw Error('Historical dates do not align');
 }catch(e){if(alive)el('sim-loading').textContent='Historical data could not load. Please refresh to try again.';return;}
 data.ticker='AAPL';days=data.actual.length-1;el('sim-day').max=days;el('sim-day').value=days;el('sim-loading').hidden=true;el('sim-ready').hidden=false;
 function updateParams(){params=parameters(data.training,el('sim-method').value);el('sim-parameters').textContent=`${data.ticker} · Starting price ${money(params.initial)} · Annual drift ${(params.mu*100).toFixed(2)}% · ${el('sim-method').value==='original'?'Price-dispersion σ':'Annualized return σ'} ${(params.sigma*100).toFixed(2)}%`;}
 const labelAt=i=>data.custom?(i===0?'Start':i===252?'1 Year':'Session '+i):fmtDate(data.actual[i].date);
 function inspection(){const i=Number(el('sim-day').value),d=data.actual[i];el('sim-inspect').textContent=`${labelAt(i)}${data.custom?'':(' · Actual '+(el('sim-actual').checked?money(d.close):'hidden'))}${stats.length?' · Median '+money(stats[i].median)+' · 10–90% '+money(stats[i].low)+' to '+money(stats[i].high):''}`;const line=host.querySelector('#sim-crosshair');if(line&&drawInfo){const x=drawInfo.x(i);line.setAttribute('x1',x);line.setAttribute('x2',x);}}
 function draw(){
 const W=Math.max(300,host.clientWidth||800),H=Math.max(130,host.clientHeight||230),left=data.currency&&data.currency!=='USD'?78:52,right=20,top=25,bottom=40,show=!data.custom&&el('sim-actual').checked;
 let values=[params.initial];for(const path of paths)values.push(...path);if(show)values.push(...data.actual.map(r=>r.close));let lo=Math.min(...values),hi=Math.max(...values);const pad=Math.max(3,(hi-lo)*.08);lo-=pad;hi+=pad;
 const x=i=>left+i/days*(W-left-right),y=v=>top+(hi-v)/(hi-lo)*(H-top-bottom);drawInfo={x};
 const pathD=a=>a.map((v,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(v).toFixed(2)).join(' ');
 let grid='';for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4,yy=y(v);grid+=`<path d="M${left} ${yy}H${W-right}" stroke="#e1e8e1"/><text x="${left-9}" y="${yy+4}" text-anchor="end">${data.currency&&data.currency!=='USD'?data.currency+' ':'$'}${v.toFixed(0)}</text>`;}
 for(const i of (W<500?[0,Math.round(days/2),days]:[0,Math.round(days/4),Math.round(days/2),Math.round(days*3/4),days]))grid+=`<text x="${x(i)}" y="${H-12}" text-anchor="${i===0?'start':i===days?'end':'middle'}">${labelAt(i)}</text>`;
 const lines=paths.map((p,i)=>`<path d="${pathD(p)}" fill="none" stroke="${['#397f69','#5487ac','#727aaf','#678c65'][i%4]}" stroke-width="1.3" opacity=".48"/>`).join('');
 const med=stats.length?`<path d="${pathD(stats.map(s=>s.median))}" fill="none" stroke="#a75b13" stroke-width="2.8" stroke-dasharray="7 4"/>`:'';
 const actual=show?`<path d="${pathD(data.actual.map(r=>r.close))}" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="${pathD(data.actual.map(r=>r.close))}" fill="none" stroke="#101b25" stroke-width="3.5" stroke-linejoin="round"/><circle cx="${x(days)}" cy="${y(data.actual[days].close)}" r="4" fill="#101b25"/>`:'';
 host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${data.ticker} ${data.custom?'one-year simulation from uploaded history':'historical comparison, '+data.actual[0].date+' to '+data.actual.at(-1).date}. ${paths.length} simulated paths; ${show?'bold actual price line shown':'actual price hidden'}. Use the trading-day slider below for exact values."><g class="sim-grid">${grid}</g><g class="sim-traces">${lines}${med}${actual}</g><line id="sim-crosshair" x1="${x(Number(el('sim-day').value))}" x2="${x(Number(el('sim-day').value))}" y1="${top}" y2="${H-bottom}" stroke="#82948a" stroke-dasharray="3 5" opacity=".5"/></svg>`;
 const svg=host.querySelector('svg');svg.addEventListener('pointermove',e=>{const box=svg.getBoundingClientRect();const px=(e.clientX-box.left)*W/box.width;el('sim-day').value=Math.max(0,Math.min(days,Math.round((px-left)/(W-left-right)*days)));inspection();});inspection();
 }
 function summary(){const last=data.actual.at(-1);el('sim-summary').innerHTML=`<div><span>${data.custom?'Starting Price':'Actual Final Close'}</span><strong>${data.custom?money(params.initial):el('sim-actual').checked?money(last.close):'Hidden'}</strong><small>${data.custom?'Last uploaded closing price':el('sim-actual').checked?pct(last.close/params.initial-1)+' over one year':'Enable the actual-price overlay'}</small></div><div><span>Simulated Median</span><strong>${stats.length?money(stats.at(-1).median):'…'}</strong><small>${stats.length?pct(stats.at(-1).median/params.initial-1)+' in this batch':'Run to see the result'}</small></div><div><span>Simulated 10–90% Range</span><strong class="sim-range">${stats.length?money(stats.at(-1).low)+' – '+money(stats.at(-1).high):'…'}</strong><small>Final prices across this batch</small></div>`;}
 async function runBatch(){
  updateParams();await new Promise(requestAnimationFrame);if(!alive)return;
  paths=simulate(params,100,days);stats=summarize(paths);run++;draw();summary();el('sim-export').disabled=false;el('sim-status').textContent=`Run ${run} · 100 paths · ${data.custom?'252 modeled sessions':'Historical prices unchanged'}`;
 }
 el('sim-method').addEventListener('change',()=>{el('lookup-status').textContent='Model changed. Click Simulate to apply it.';el('sim-export').disabled=true;});
 el('sim-actual').addEventListener('change',()=>{draw();summary();});el('sim-day').addEventListener('input',inspection);
 el('sim-export').addEventListener('click',()=>{if(!paths.length)return;const rows=[[data.custom?'Session':'Date','Actual Close',...paths.map((_,i)=>'Path '+(i+1))].join(',')];for(let i=0;i<data.actual.length;i++)rows.push([data.custom?i:data.actual[i].date,data.custom?'':data.actual[i].close,...paths.map(p=>p[i].toFixed(6))].join(','));const url=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download=`${data.ticker}-100-paths-${el('sim-method').value}-run-${run}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 function loadDataset(next){el('sim-export').disabled=true;data=next;days=data.actual.length-1;paths=[];stats=[];run=0;el('sim-day').max=days;el('sim-day').value=days;el('sim-actual').checked=!data.custom;el('sim-actual').disabled=!!data.custom;el('actual-label').textContent=data.custom?'No Actual Overlay':'Actual '+data.ticker;el('sim-note').textContent=data.custom?`${data.ticker}: ${data.training[0].date} to ${data.training.at(-1).date}. 252 modeled sessions (one year) ahead; no actual future prices supplied.`:data.lookup?`Training ${fmtDate(data.training[0].date)}–${fmtDate(data.training.at(-1).date)} · Comparison ${fmtDate(data.actual[0].date)}–${fmtDate(data.actual.at(-1).date)}. ${data.currency} daily Close, not dividend-adjusted, via yfinance / Yahoo Finance. Historical backtest, not a live forecast.`:'Apple: Oct 29, 2025–Oct 29, 2026. Fixed historical comparison, not a live forecast.';el('lookup-ticker').value=data.ticker;updateParams();draw();summary();}
 function setBusy(value){busy=value;el('sim-run').disabled=value;el('lookup-ticker').disabled=value;el('sim-method').disabled=value;el('sim-run').textContent=value?'Loading…':'Simulate';}
 async function submitSimulation(){
  if(busy)return;const ticker=el('lookup-ticker').value.trim().toUpperCase(),status=el('lookup-status');
  if(!/^[A-Z0-9][A-Z0-9.^=-]{0,14}$/.test(ticker)){status.textContent='Enter a valid Yahoo Finance ticker, such as MSFT or BRK-B.';return;}
  const serial=++lookupSerial;setBusy(true);let timeout;
  try{
   if(ticker!==data.ticker||(!data.lookup&&!data.custom&&root.STOCK_API_BASE)){
    if(!root.STOCK_API_BASE)throw Error('Ticker lookup is not connected.');
    status.textContent='Fetching prices. A sleeping service can take about a minute.';const controller=new AbortController();lookupAbort=controller;timeout=setTimeout(()=>controller.abort(),90000);
    const base=String(root.STOCK_API_BASE).replace(/\/$/,'');const response=await fetch(base+'/history?ticker='+encodeURIComponent(ticker),{signal:controller.signal});const body=await response.json();
    if(!response.ok)throw Error(typeof body.detail==='string'?body.detail:'Prices are temporarily unavailable.');
    const next=validateLookup(body,ticker);if(!alive||serial!==lookupSerial)return;loadDataset(next);
   }
   if(!alive||serial!==lookupSerial)return;el('sim-run').textContent='Simulating…';await runBatch();if(!alive||serial!==lookupSerial)return;
   status.textContent=data.lookup?`${data.ticker} · Model inputs end ${data.training.at(-1).date}.`:data.custom?`${data.ticker} · Simulating from your uploaded prices.`:'Apple historical example.';
  }catch(error){if(alive&&serial===lookupSerial)status.textContent=error.name==='AbortError'?'The lookup timed out. Please try again.':error instanceof SyntaxError?'The data service is unavailable. Please try again later.':error.message;}
  finally{clearTimeout(timeout);if(alive&&serial===lookupSerial)setBusy(false);}
 }
 el('simulation-form').addEventListener('submit',e=>{e.preventDefault();submitSimulation();});
 updateParams();draw();summary();observer=new ResizeObserver(()=>{if(alive)draw();});observer.observe(host);await runBatch();
}
root.StockSim={parameters,simulate,summarize,normal,parseHistory,csvRows,validateLookup,markup,mount,dispose};
})(typeof window==='undefined'?globalThis:window);
