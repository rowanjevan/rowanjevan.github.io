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
const money=x=>'$'+x.toFixed(2),pct=x=>{const value=Math.abs(x)<0.00005?0:x;return (value>=0?'+':'')+(value*100).toFixed(2)+'%';};
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
const modelName=method=>method==='returns'?'Daily Returns':'Original Model';
const modelHelp=method=>method==='returns'
 ?'Measures day-to-day returns to set the spread of the paths.'
 :'Uses the spread of past price levels to set the spread of the paths.';
function controlsMarkup(){return `<form id="simulation-form" class="unified-controls">
 <label for="lookup-ticker">Stock Ticker<input id="lookup-ticker" value="AAPL" maxlength="15" autocomplete="off" spellcheck="false" required aria-describedby="sim-feedback"${root.STOCK_API_BASE?'':' readonly'}></label>
 <label for="sim-method">Volatility Model<select id="sim-method" aria-describedby="sim-model-help"><option value="original">Original Model</option><option value="returns">Daily Returns</option></select></label>
 <button id="sim-run" type="submit">Run 100 Paths</button></form>`;}
function markup(){return `<div id="sim-loading" class="project-toolbar" role="status">Loading the Apple example…</div><div id="sim-ready" hidden>
 <div class="sim-control-area project-toolbar">
 ${controlsMarkup()}<div class="sim-help-row"><p id="sim-model-help" class="sim-model-help">${modelHelp('original')}</p><button id="sim-explain" class="sim-explain" type="button">How It Works</button></div>
 <div class="sim-run-context"><div><strong id="sim-result-ticker">AAPL</strong><span id="sim-result-model">Original Model</span><span id="sim-run-number" class="sim-run-badge">Run 1</span></div><span id="sim-period"></span></div>
 <p id="sim-feedback" class="sim-feedback" role="status" aria-live="polite"></p>
 </div>
 <div class="sim-visual project-visual">
 <div class="sim-legend"><span><i class="swatch paths"></i>100 Possible Paths</span><span title="The middle simulated price at each date"><i class="swatch median"></i>Median</span><label class="sim-toggle"><input id="sim-actual" type="checkbox" checked><i class="swatch actual"></i>Actual Price</label></div>
 <div id="sim-chart" class="sim-chart"></div><p class="sim-chart-caption">A historical replay, using only prices available at the starting date.</p>
 </div>
 <div class="sim-result-area project-details">
 <div class="sim-inspector"><div class="sim-inspector-heading"><label for="sim-day">Explore a Date</label><output id="sim-date" for="sim-day"></output></div><input id="sim-day" type="range" min="0" max="251" value="251" aria-describedby="sim-date-hint"><span id="sim-date-hint">Drag the slider or move across the chart.</span></div>
 <div id="sim-summary" class="sim-summary"></div>
 <p id="sim-comparison" class="sim-comparison"></p><div class="sim-footer"><button id="sim-export" class="sim-export" type="button" title="Download this run’s 100 paths as a CSV file" disabled>Download Paths <span aria-hidden="true">↓</span></button></div>
 </div>
 <dialog id="sim-explanation" class="sim-explanation" aria-labelledby="sim-explanation-title"><div class="sim-dialog-heading"><h2 id="sim-explanation-title">A Year of Possibilities</h2><button id="sim-explanation-close" type="button" aria-label="Close Explanation">×</button></div>
 <p>What could a stock have done, based on the year of prices available at the time?</p>
 <ol><li><strong>Learn from the past.</strong> Use a year of closing prices to estimate historical return and volatility.</li><li><strong>Generate 100 paths.</strong> Geometric Brownian motion combines those inputs with new random daily moves.</li><li><strong>Compare with reality.</strong> The bold line shows what actually happened over the following year. Those later prices are not used to build the model.</li></ol>
 <h3>What Your Inputs Change</h3><dl><div><dt>Stock Ticker</dt><dd>Loads that stock’s price history, starting price and comparison year.</dd></div><div><dt>Volatility Model</dt><dd>Original Model uses variation in price levels. Daily Returns uses the annualized variation in day-to-day log returns. Both use the same historical return for drift.</dd></div><div><dt>Simulate Again</dt><dd>Keeps the history and model fixed, but draws 100 new random paths. The median and range will vary; the actual price will not.</dd></div></dl>
 <h3>Reading the Results</h3><p>The median is the middle simulated price at each date. The middle 80% runs from the 10th to the 90th percentile of this batch. It is not an 80% guarantee about future prices.</p>
 <div id="sim-data-details" class="sim-data-details"></div><p class="sim-dialog-note">Historical illustration, not a live forecast. The model uses constant return and volatility assumptions and does not account for company news.</p></dialog>
 </div>`;}
let cleanup=()=>{};
function dispose(){cleanup();cleanup=()=>{};}
async function mount(){
 dispose();const host=document.getElementById('sim-chart');if(!host)return;
 let alive=true,paths=[],stats=[],data,params,drawInfo,days,run=0,busy=false,revealStarted=null,activeMethod='original',previousResult=null;
 const revealDuration=1800,datasets=new Map(),abort=new AbortController();let observer,lookupAbort,lookupSerial=0,resultFlashTimer;
 const el=id=>document.getElementById(id);
 const money=x=>(data?.currency&&data.currency!=='USD'?data.currency+' ':'$')+x.toFixed(2);
 cleanup=()=>{alive=false;clearTimeout(resultFlashTimer);abort.abort();lookupAbort?.abort();observer?.disconnect();el('sim-explanation')?.close();};
 function message(text,state='ready'){const node=el('sim-feedback');node.textContent=text;node.dataset.state=state;node.setAttribute('role',state==='error'?'alert':'status');}
 function pending(){return el('lookup-ticker').value.trim().toUpperCase()!==data.ticker||el('sim-method').value!==activeMethod;}
 function refreshControls(){
  el('sim-model-help').textContent=modelHelp(el('sim-method').value);
  el('sim-run').textContent=busy?'Loading…':pending()?'Run 100 Paths':'Simulate Again';
  el('sim-export').disabled=busy||pending()||!paths.length;
  el('simulation-form').classList.toggle('has-changes',pending());
 }
 function edited(){refreshControls();message(pending()?`Inputs changed. Run to update the ${data.ticker} chart below.`:'Same inputs. Run again for 100 new random paths.',pending()?'pending':'ready');}
 try{
  const res=await fetch('aapl-data.json',{signal:abort.signal});if(!res.ok)throw Error('Data not available');data=await res.json();if(!alive)return;
  if(data.actual.length!==252||data.actual.at(-1).date!=='2026-10-29'||data.training.at(-1).date!==data.actual[0].date)throw Error('Historical dates do not align');
 }catch(e){if(alive)el('sim-loading').textContent='The Apple example could not load. Refresh to try again.';return;}
 data.ticker='AAPL';data.currency='USD';datasets.set('AAPL',data);days=data.actual.length-1;
 el('sim-day').max=days;el('sim-day').value=days;el('sim-loading').hidden=true;el('sim-ready').hidden=false;
 const labelAt=i=>data.custom?(i===0?'Start':i===252?'1 Year':'Session '+i):fmtDate(data.actual[i].date);
 function updateContext(){
  el('sim-result-ticker').textContent=data.ticker;el('sim-result-model').textContent=modelName(activeMethod);el('sim-run-number').textContent='Run '+run;
  el('sim-period').textContent=data.custom?'One Year Ahead':fmtDate(data.actual[0].date)+' – '+fmtDate(data.actual.at(-1).date);
  el('sim-data-details').textContent=`Current Run: ${data.ticker}, ${modelName(activeMethod)}. History: ${fmtDate(data.training[0].date)}–${fmtDate(data.training.at(-1).date)}. Starting Price: ${money(params.initial)}. Historical Return: ${(params.mu*100).toFixed(2)}%. Volatility Estimate: ${(params.sigma*100).toFixed(2)}%. ${data.lookup?'Yahoo Finance via yfinance, daily Close, not dividend-adjusted.':'Fixed Apple historical example.'}`;
 }
 function inspection(){
  if(!stats.length)return;
  const i=Number(el('sim-day').value),s=stats[i],actual=data.actual[i]?.close;
  el('sim-date').textContent=labelAt(i)+(i===days?' · End of Year':i===0?' · Starting Point':'');
  el('sim-day').setAttribute('aria-valuetext',`${labelAt(i)}. Actual ${Number.isFinite(actual)?money(actual):'unavailable'}. Median ${money(s.median)}.`);
  el('sim-summary').innerHTML=`<div><span>Actual Price</span><strong>${Number.isFinite(actual)?money(actual):'Not Available'}</strong><small>${Number.isFinite(actual)?pct(actual/params.initial-1)+' From Start':'No Comparison Supplied'}</small></div><div><span>Median Simulation</span><strong>${money(s.median)}</strong><small>${pct(s.median/params.initial-1)} From Start</small></div><div><span>Middle 80% of Paths</span><strong class="sim-range">${money(s.low)} – ${money(s.high)}</strong><small>10th to 90th Percentile</small></div>`;
  const gap=Number.isFinite(actual)?actual/s.median-1:0;
  el('sim-comparison').textContent=i===0?'All 100 paths begin at the same historical closing price.':Number.isFinite(actual)?`Actual price ${i===days?'finished':'was'} ${(Math.abs(gap)*100).toFixed(1)}% ${gap>=0?'above':'below'} the median ${i===days?'at year-end':'on this date'}.`:'Explore how the possible prices spread over time.';
  const line=host.querySelector('#sim-crosshair');if(line&&drawInfo){const x=drawInfo.x(i);line.setAttribute('x1',x);line.setAttribute('x2',x);}
 }
 function draw(){
  const W=Math.max(300,host.clientWidth||800),H=Math.max(130,host.clientHeight||230),left=data.currency&&data.currency!=='USD'?78:52,right=20,top=18,bottom=36,show=!data.custom&&el('sim-actual').checked;
  let values=[params.initial];for(const path of paths)values.push(...path);if(show)values.push(...data.actual.map(r=>r.close));let lo=Math.min(...values),hi=Math.max(...values);const pad=Math.max(3,(hi-lo)*.08);lo-=pad;hi+=pad;
  const x=i=>left+i/days*(W-left-right),y=v=>top+(hi-v)/(hi-lo)*(H-top-bottom);drawInfo={x};
  const pathD=a=>a.map((v,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(v).toFixed(2)).join(' ');
  let grid='';for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4,yy=y(v);grid+=`<path d="M${left} ${yy}H${W-right}" stroke="var(--line)"/><text x="${left-9}" y="${yy+4}" text-anchor="end">${data.currency&&data.currency!=='USD'?data.currency+' ':'$'}${v.toFixed(0)}</text>`;}
  for(const i of (W<500?[0,Math.round(days/2),days]:[0,Math.round(days/4),Math.round(days/2),Math.round(days*3/4),days]))grid+=`<text x="${x(i)}" y="${H-10}" text-anchor="${i===0?'start':i===days?'end':'middle'}">${labelAt(i)}</text>`;
  const lines=paths.map(p=>`<path class="sim-path" d="${pathD(p)}" fill="none" stroke="var(--line)" stroke-width="1.1" opacity="1"/>`).join('');
  const med=stats.length?`<path class="sim-median-halo" d="${pathD(stats.map(s=>s.median))}" fill="none" stroke="var(--white)" stroke-width="5" stroke-dasharray="7 4"/><path class="sim-median-line" d="${pathD(stats.map(s=>s.median))}" fill="none" stroke="var(--muted)" stroke-width="2.4" stroke-dasharray="7 4"/>`:'';
  const actual=show?`<path class="sim-actual-halo" d="${pathD(data.actual.map(r=>r.close))}" fill="none" stroke="var(--white)" stroke-width="6" stroke-linejoin="round"/><path class="sim-actual-line" d="${pathD(data.actual.map(r=>r.close))}" fill="none" stroke="var(--navy)" stroke-width="3.5" stroke-linejoin="round"/><circle class="sim-actual-end" cx="${x(days)}" cy="${y(data.actual[days].close)}" r="4" fill="var(--navy)"/>`:'';
  const revealElapsed=revealStarted===null?revealDuration:performance.now()-revealStarted;
  const animateReveal=paths.length>0&&revealElapsed<revealDuration&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealMask=animateReveal?`<defs><clipPath id="sim-path-reveal" clipPathUnits="userSpaceOnUse"><rect class="sim-reveal-window" x="0" y="0" width="${W}" height="${H}" style="animation-duration:${revealDuration}ms;animation-delay:-${Math.max(0,revealElapsed)}ms"/></clipPath></defs>`:'';
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${data.ticker}, ${modelName(activeMethod)}, run ${run}. ${paths.length} possible paths. ${show?'Bold actual price shown.':'Actual price line hidden.'} Use Explore a Date below for exact values.">${revealMask}<g class="sim-grid">${grid}</g><g class="sim-traces"${animateReveal?' clip-path="url(#sim-path-reveal)"':''}>${lines}${med}${actual}</g><line id="sim-crosshair" x1="${x(Number(el('sim-day').value))}" x2="${x(Number(el('sim-day').value))}" y1="${top}" y2="${H-bottom}" stroke="var(--muted)" stroke-dasharray="3 5" opacity=".6"/></svg>`;
  const svg=host.querySelector('svg');svg.addEventListener('pointermove',e=>{const box=svg.getBoundingClientRect(),px=(e.clientX-box.left)*W/box.width;el('sim-day').value=Math.max(0,Math.min(days,Math.round((px-left)/(W-left-right)*days)));inspection();});inspection();
 }
 async function runBatch(){
  activeMethod=el('sim-method').value;params=parameters(data.training,activeMethod);await new Promise(requestAnimationFrame);if(!alive)return;
  paths=simulate(params,100,days);stats=summarize(paths);run++;el('sim-day').value=days;revealStarted=performance.now();updateContext();draw();
  const result={ticker:data.ticker,method:activeMethod,median:stats.at(-1).median,width:stats.at(-1).high-stats.at(-1).low};
  let text='Apple example. New tickers may take a minute to load.';
  if(previousResult){
   if(previousResult.ticker!==result.ticker)text=`${data.ticker} loaded. New history, starting price and 100 paths.`;
   else if(previousResult.method!==result.method)text=`${modelName(activeMethod)} applied. This run’s range is ${result.width>=previousResult.width?'wider':'narrower'}.`;
   else{const change=result.median-previousResult.median;text=`New random draw. Year-end median ${change>=0?'+':'−'}${money(Math.abs(change))} vs. the previous run.`;}
  }
  previousResult=result;message(text);
  const results=el('sim-summary');results.classList.remove('sim-result-updated');void results.offsetWidth;results.classList.add('sim-result-updated');clearTimeout(resultFlashTimer);resultFlashTimer=setTimeout(()=>{if(alive)results.classList.remove('sim-result-updated');},800);
 }
 function setBusy(value){busy=value;el('sim-run').disabled=value;el('lookup-ticker').disabled=value;el('sim-method').disabled=value;el('simulation-form').setAttribute('aria-busy',String(value));refreshControls();}
 async function submitSimulation(){
  if(busy)return;const ticker=el('lookup-ticker').value.trim().toUpperCase();
  if(!/^[A-Z0-9][A-Z0-9.^=-]{0,14}$/.test(ticker)){el('lookup-ticker').setAttribute('aria-invalid','true');message('Enter a valid stock ticker using letters, numbers or market-symbol punctuation.','error');return;}
  el('lookup-ticker').removeAttribute('aria-invalid');const serial=++lookupSerial;setBusy(true);let timeout;
  try{
   let next=data;
   if(ticker!==data.ticker){
    next=datasets.get(ticker);
    if(!next){
     if(!root.STOCK_API_BASE)throw Error('Ticker lookup is not connected.');
     message(`Fetching ${ticker} prices. The first lookup can take up to a minute.`,'loading');
     const controller=new AbortController();lookupAbort=controller;timeout=setTimeout(()=>controller.abort(),90000);
     const base=String(root.STOCK_API_BASE).replace(/\/$/,'');const response=await fetch(base+'/history?ticker='+encodeURIComponent(ticker),{signal:controller.signal});const body=await response.json();
     if(!response.ok)throw Error(typeof body.detail==='string'?body.detail:'Prices are temporarily unavailable.');
     next=validateLookup(body,ticker);datasets.set(ticker,next);
    }
   }
   if(!alive||serial!==lookupSerial)return;
   data=next;days=data.actual.length-1;el('sim-day').max=days;el('lookup-ticker').value=data.ticker;el('sim-actual').disabled=!!data.custom;
   el('sim-run').textContent='Simulating…';await runBatch();
  }catch(error){if(alive&&serial===lookupSerial){const detail=error.name==='AbortError'?'The lookup timed out. Try again.':error instanceof SyntaxError?'The data service is unavailable. Try again later.':error.message;message(`${detail} Showing the previous ${data.ticker} results.`,'error');}}
  finally{clearTimeout(timeout);if(alive&&serial===lookupSerial)setBusy(false);}
 }
 el('lookup-ticker').addEventListener('input',()=>{el('lookup-ticker').removeAttribute('aria-invalid');edited();});
 el('sim-method').addEventListener('change',edited);
 el('sim-actual').addEventListener('change',()=>{draw();message(el('sim-actual').checked?'Actual price line shown. The simulation is unchanged.':'Actual price line hidden. The simulation is unchanged.');});
 el('sim-day').addEventListener('input',inspection);
 el('sim-export').addEventListener('click',()=>{
  if(!paths.length||busy||pending())return;
  const rows=[['Date','Actual Close',...paths.map((_,i)=>'Path '+(i+1))].join(',')];
  for(let i=0;i<data.actual.length;i++)rows.push([data.actual[i].date,data.actual[i].close,...paths.map(p=>p[i].toFixed(6))].join(','));
  const url=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download=`${data.ticker}-100-paths-${activeMethod}-run-${run}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 el('sim-explain').addEventListener('click',()=>el('sim-explanation').showModal());
 el('sim-explanation-close').addEventListener('click',()=>el('sim-explanation').close());
 el('sim-explanation').addEventListener('click',e=>{if(e.target===el('sim-explanation')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
 el('simulation-form').addEventListener('submit',e=>{e.preventDefault();submitSimulation();});
 await runBatch();if(!alive)return;refreshControls();observer=new ResizeObserver(()=>{if(alive)draw();});observer.observe(host);
}
root.StockSim={parameters,simulate,summarize,normal,parseHistory,csvRows,validateLookup,markup,mount,dispose};
})(typeof window==='undefined'?globalThis:window);
