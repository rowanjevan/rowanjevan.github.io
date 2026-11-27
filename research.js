/* Interactive reading of Results/Analysis, ResearchPaper.pdf, pp. 5–6.
   Positions encode reported direction, never invented observations or effect size. */
(function(root){
'use strict';
const factors=[
 {id:'market-return',summary:'Higher market returns were linked to higher buyer returns.',label:'Market Return',direction:'Positive',position:2,coefficient:'1.077',pValue:'Very Small',pDetail:'Exact Value Not Stated',title:'The buyer’s stock tended to move with the market.',explanation:'Higher S&P 500 returns were linked to higher buyer returns, after accounting for other factors.'},
 {id:'stock-volatility',summary:'Greater stock-price variation was linked to higher returns.',label:'Stock Volatility',direction:'Positive',position:2,coefficient:'0.0467',pValue:'0.011',pDetail:'Reported in the Paper',title:'More variable stocks had higher returns in this sample.',explanation:'Larger day-to-day swings in the buyer’s stock were associated with higher returns. This does not mean taking more risk guarantees a better outcome.'},
 {id:'market-volatility',summary:'Greater market variation was linked to higher buyer returns.',label:'Market Volatility',direction:'Positive',position:2,coefficient:'0.218',pValue:'0.0026',pDetail:'Reported in the Paper',title:'Market uncertainty also had a measurable relationship.',explanation:'Greater variation in market returns was associated with higher acquirer returns in this sample, holding the other included variables constant.'},
 {id:'interest-rates',summary:'Higher Treasury yields were linked to lower buyer returns.',label:'Interest Rates',direction:'Negative',position:0,coefficient:'−0.000017',pValue:'Very Small',pDetail:'Exact Value Not Stated',title:'Higher rates were associated with lower returns.',explanation:'Higher Treasury yields were linked to lower acquirer stock returns during the deal period. The analysis identifies an association, not a proven cause.'},
 {id:'deal-size',summary:'Deal size showed no clear relationship in this sample.',label:'Deal Size',direction:'No Clear Link',position:1,coefficient:'Not Stated',pValue:'High',pDetail:'Exact Value Not Stated',title:'A bigger deal did not show a clear return advantage.',explanation:'Among the US deals over $1 billion studied, transaction value did not show a clear relationship with acquirer returns. That does not establish that size never matters.'},
 {id:'sector',summary:'Sector showed no clear relationship in this sample.',label:'Sector',direction:'No Clear Link',position:1,coefficient:'Not Stated',pValue:'High',pDetail:'Exact Value Not Stated',title:'Industry alone did not explain a clear pattern.',explanation:'The sector variable did not show a clear relationship with acquirer returns in this sample. Industry can still matter in ways this model did not capture.'}
];
// Invisible alternatives reserve each text region's natural responsive height.
// They stay out of the accessibility tree and never duplicate interactive controls.
function sizedText(id,values){return `<span class="research-sized-text"><span id="${id}">${values[0]}</span>${[...new Set(values)].map(value=>`<span class="research-size-copy" aria-hidden="true">${value}</span>`).join('')}</span>`;}
function markup(){return `<header class="project-head"><div class="section-label">Empirical Research</div><h2 id="research-title">M&A and Stock Returns</h2><p class="project-question">What moves a buyer’s stock during a deal?</p></header>
 <div class="research-controls project-toolbar">
  <div class="research-input-row"><label for="research-factor">Explore a Factor<select id="research-factor">${factors.map(f=>`<option value="${f.id}">${f.label}</option>`).join('')}</select></label></div>
  <div class="research-help-row"><p class="research-control-hint">Choose a factor, or select a row in the chart.</p><button class="research-explain" id="research-explain" type="button">How I Studied It</button></div>
  <div class="research-selection"><strong>${sizedText('research-active',factors.map(f=>f.label))}</strong><span id="research-direction">${sizedText('research-direction-value',factors.map(f=>f.position===1?'No Clear Link':f.direction+' Association'))}</span></div>
  <p class="research-thesis">${sizedText('research-takeaway',factors.map(f=>f.summary))}</p>
 </div>
 <div class="research-evidence project-visual">
  <div class="research-fit-heading">Model Fit</div><div class="research-chart-heading">Relationship to Stock Returns</div>
  <figure class="research-fit-card"><div class="research-fit-number" role="img" aria-label="33.9 percent">33.9<span aria-hidden="true">%</span></div><div class="research-fit-track" aria-hidden="true"><span></span></div><figcaption>Return Variation Explained<span>R² = 0.339 · All Factors Together</span></figcaption></figure>
  <div class="research-factor-chart" role="group" aria-label="Explore reported factor relationships">
   <div class="research-factor-axes" aria-hidden="true"><span>Factor</span><span>Negative</span><span>Unclear</span><span>Positive</span></div>
   ${factors.map((f,i)=>`<button type="button" class="research-factor-row" data-factor="${f.id}" aria-pressed="${i===0}" aria-label="${f.label}: ${f.direction}"><span class="research-factor-label">${f.label}</span>${[0,1,2].map(p=>`<span class="research-dot-cell" aria-hidden="true">${p===f.position?'<i class="research-dot"></i>':''}</span>`).join('')}</button>`).join('')}
  </div>
  <p class="research-chart-caption">Reported associations, not individual deal data or proof of causation.</p>
 </div>
 <div class="research-reading project-details">
  <div id="research-insight" class="research-insight" aria-live="polite" aria-atomic="true"><div class="research-interpretation"><h3>${sizedText('research-insight-title',factors.map(f=>f.title))}</h3><p>${sizedText('research-insight-copy',factors.map(f=>f.explanation))}</p></div><dl class="research-estimates"><div><dt>Reported Coefficient</dt><dd>${sizedText('research-coefficient',factors.map(f=>f.coefficient))}</dd><small>Units Differ Across Factors</small></div><div><dt>Reported p-Value</dt><dd>${sizedText('research-p-value',factors.map(f=>f.pValue))}</dd><small>${sizedText('research-p-detail',factors.map(f=>f.pDetail))}</small></div></dl></div>
  <div class="research-footer"><p>US Acquisitions &gt;$1B · Announcement to Close</p><a href="ResearchPaper.pdf" download="RowanJevan_MA_Research.pdf">Download Research Paper <span aria-hidden="true">↓</span></a></div>
 </div>
 <dialog id="research-explanation" class="research-explanation sim-explanation" aria-labelledby="research-explanation-title"><div class="sim-dialog-heading"><h2 id="research-explanation-title">The Market Around the Deal</h2><button id="research-explanation-close" type="button" aria-label="Close Research Explanation">×</button></div>
  <p>I asked whether market conditions or deal characteristics were more closely related to the buyer’s stock returns during an acquisition.</p>
  <ol><li><strong>Build the dataset.</strong> Identify US deals over $1 billion and their announcement and completion dates from public company documents and news releases.</li><li><strong>Align the inputs.</strong> Use Python to clean stock and S&P 500 data from Yahoo Finance, then match Treasury yields and deal characteristics to the relevant dates.</li><li><strong>Compare the relationships.</strong> Run multiple linear regression in Excel, followed by repeated analysis using Python’s statsmodels. Study returns within each deal’s announcement-to-completion window.</li></ol>
  <h3>What Changes When You Select a Factor?</h3><p>The selected chart row, direction label, plain-language finding and reported numbers update together. The 33.9% model fit stays fixed because it describes all the factors combined. No new regression is run.</p>
  <h3>What Does 33.9% Mean?</h3><p>R-squared describes how much of the variation in the sample’s returns the model accounts for. Here that is 33.9%, leaving 66.1% unexplained by this model. It is not prediction accuracy or the probability of making money.</p>
  <h3>Reading the Reported Numbers</h3><dl><div><dt>Coefficient</dt><dd>The estimated change in the outcome for a one-unit increase in a factor, holding the other included variables constant. The factors use different units, so their coefficient sizes should not be ranked against each other.</dd></div><div><dt>p-Value</dt><dd>A measure of how incompatible the result is with a zero relationship under the model’s assumptions. Smaller values provide more evidence against that zero-relationship assumption; they do not establish causation or the size of a relationship.</dd></div><div><dt>No Clear Link</dt><dd>The paper describes high p-values for deal size and sector. This is a lack of clear evidence in this sample, not proof that these factors never matter.</dd></div></dl>
  <h3>What the Study Cannot Establish</h3><p>The sample covers large, recent US acquisitions. Smaller and international deals, financing structure, management quality and integration outcomes are outside this model. The analysis assumes linear relationships and does not isolate a causal acquisition effect.</p>
  <p class="sim-data-details">Source: Results/Analysis, pages 5–6 of the research paper. The chart summarizes the reported directions. Exact p-values and coefficients are displayed only where supplied; the paper does not include the raw observations or full regression output.</p>
 </dialog>`;}
let cleanup=()=>{};
function dispose(){cleanup();cleanup=()=>{};}
function mount(){
 dispose();const select=document.getElementById('research-factor');if(!select)return;
 const el=id=>document.getElementById(id),rows=[...document.querySelectorAll('.research-factor-row')];let active=factors[0].id,timer;
 const fit=document.querySelector('.research-fit-number'),fitValue=fit?.firstChild,fitBar=document.querySelector('.research-fit-track>span');
 let fitFrame=0,fitObserver,alive=true;
 function setFit(value){
  const percentage=value.toFixed(1);
  fitValue.nodeValue=percentage;
  if(fitBar)fitBar.style.width=percentage+'%';
 }
 function countFit(){
  fitObserver?.disconnect();
  const start=performance.now();
  const tick=now=>{
   if(!alive||!fit.isConnected)return;
   const progress=Math.max(0,Math.min(1,(now-start)/1200));
   setFit(33.9*(1-(1-progress)**3));
   if(progress<1)fitFrame=requestAnimationFrame(tick);
  };
  fitFrame=requestAnimationFrame(tick);
 }
 // Play once per Projects visit when visible, keeping factor changes independent.
 // The accessible label always reports the final research result.
 if(fitValue&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  setFit(0);
  if('IntersectionObserver' in root){
   fitObserver=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting))countFit();
   },{threshold:.25});
   fitObserver.observe(fit);
  }else countFit();
 }
 function show(id){
  const f=factors.find(f=>f.id===id);if(!f||id===active)return;active=id;select.value=id;
  rows.forEach(row=>row.setAttribute('aria-pressed',String(row.dataset.factor===id)));
  el('research-active').textContent=f.label;el('research-takeaway').textContent=f.summary;el('research-direction-value').textContent=f.position===1?'No Clear Link':f.direction+' Association';
  el('research-insight-title').textContent=f.title;el('research-insight-copy').textContent=f.explanation;el('research-coefficient').textContent=f.coefficient;el('research-p-value').textContent=f.pValue;el('research-p-detail').textContent=f.pDetail;
  const insight=el('research-insight');insight.classList.remove('research-updated');void insight.offsetWidth;insight.classList.add('research-updated');clearTimeout(timer);timer=setTimeout(()=>insight.classList.remove('research-updated'),700);
 }
 select.addEventListener('change',()=>show(select.value));rows.forEach(row=>row.addEventListener('click',()=>show(row.dataset.factor)));
 const dialog=el('research-explanation');el('research-explain').addEventListener('click',()=>dialog.showModal());el('research-explanation-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 cleanup=()=>{alive=false;cancelAnimationFrame(fitFrame);fitObserver?.disconnect();clearTimeout(timer);dialog.close();};
}
root.ResearchStudy={factors,markup,mount,dispose};
})(typeof window==='undefined'?globalThis:window);
