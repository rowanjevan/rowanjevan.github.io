'use strict';
const roles=[
 {
  company:'Minerva Valuations',logo:'minerva.png',cls:'minerva',
  title:'Business Valuations & M&A Analyst Intern',city:'Los Angeles, CA',dates:'Jun 2026–Aug 2026',
  background:'Boutique Advisory Firm · Business Valuation & Sell-Side M&A',
  achievements:[
   {lead:'Built valuation datasets',detail:'from company financials and ownership research'},
   {lead:'Benchmarked lenders and competitors',detail:'for client materials'}
  ],
  focus:['Business Valuation','Sell-Side Advisory','Financial Research','Market Research']
 },
 {
  company:'Dotmatics',logo:'dotmatics.svg',cls:'dotmatics',
  title:'M&A Analyst Intern',city:'Los Angeles, CA',dates:'Jun 2025–Apr 2026',
  background:'Life Sciences Software Company · Acquired by Siemens in July 2025',
  achievements:[
   {lead:'Screened software targets',detail:'for strategic fit using ARR growth and EBITDA'},
   {lead:'Mapped laboratory markets',detail:'to identify growth opportunities for an AI product'}
  ],
  focus:['Software M&A','Target Screening','Financial Analysis','Due Diligence']
 },
 {
  company:'Wakefield Legacy Capital',logo:'wakefield-linkedin.png',cls:'wakefield',
  title:'Private Equity Analyst Intern',city:'Boston, MA',dates:'Aug 2024–May 2025',
  background:'Private Equity Search Fund · Service-Business Acquisitions',
  achievements:[
   {lead:'Ranked markets',detail:'by fragmentation and acquisition potential'},
   {lead:'Analyzed revenue quality and margins',detail:'for partner-level investment briefs'}
  ],
  focus:['Deal Sourcing','Market Research','Financial Analysis','Due Diligence']
 }
];
function companyBrand(r){
 if(r.cls==='minerva')return `<span class="minerva-logo-frame"><img class="company-logo minerva" src="assets/${r.logo}" alt="${r.company}"></span>`;
 if(r.cls==='wakefield')return `<span class="wakefield-brand"><img src="assets/wakefield-linkedin.png" alt="" class="wakefield-profile"><span>Wakefield Legacy Capital</span></span>`;
 return `<img class="company-logo ${r.cls}" src="assets/${r.logo}" alt="${r.company}">`;
}
function journey(){return `<section class="journey" aria-labelledby="journey-title"><div class="section-label"><h2 id="journey-title">Path</h2></div><ol class="journey-list">
 <li><div class="journey-meta"><span>2008</span><span>Birth</span></div><div class="journey-body"><h3>Shanghai</h3><h4>Lujiazui (陆家嘴)</h4><p>My story began the year a global financial crisis forced the world to rethink risk and rebuild trust.</p></div></li>
 <li><div class="journey-meta"><span>Jul 2023</span><span>Age 15</span></div><div class="journey-body"><h3>New York City</h3><h4>Columbia University · Summer Program</h4><p>I explored AI’s impact and used data to study how product features relate to pricing. The project gave me a way to test my own questions.</p></div></li>
 <li><div class="journey-meta"><span>Jun–Aug 2024</span><span>Age 16</span></div><div class="journey-body"><h3>Cambridge</h3><h4>Harvard University · Summer Courses</h4><p>That curiosity led me deeper into Python and algorithms. I began to understand how the tools behind the analysis are built.</p></div></li>
 <li><div class="journey-meta"><span>2024–2026</span><span>Ages 16–18</span></div><div class="journey-body"><h3>Los Angeles</h3><h4>Wakefield → Dotmatics → Minerva</h4><p>Three internships took me from deal sourcing to M&A and valuation. Now I want to learn how experienced investors turn research into decisions.</p></div></li>
 </ol></section>`;}
function about(){return `<div class="about-page page-enter">
 <div class="personal-column">
  <section class="personal-intro"><h1 class="long-slogan">I’ll start with a wider view.<br>Then take a closer look.</h1><p class="positioning"><span>Sell-Side Advisory</span> · <span>Software M&A</span> · <span>Private Equity Fund</span></p></section>
  ${journey()}
  <section class="education" aria-labelledby="education-title">
   <div class="section-label"><span id="education-title">Education</span><span>Class of 2030</span></div>
   <h2>University of Southern California</h2>
   <div class="degree"><span>Dornsife College of Letters, Arts and Sciences</span><strong>B.S. in Applied and Computational Mathematics</strong></div>
   <div class="degree"><span>Marshall School of Business</span><strong>Minor in Business Finance</strong></div>
   <div class="campus-life"><span class="minor-label">On Campus</span><div class="campus-groups">
    <section class="campus-group" aria-labelledby="clubs-finance"><h3 id="clubs-finance">Finance & Investing</h3><ul class="club-list"><li>Global Investment Society</li><li>Trojan Investing Society</li><li>Trojan Venture Partners</li></ul></section>
    <section class="campus-group" aria-labelledby="clubs-cultural"><h3 id="clubs-cultural">Cultural</h3><ul class="club-list"><li>Chinese American Student Association</li><li>Korean American Student Association</li></ul></section>
    <section class="campus-group" aria-labelledby="clubs-recreation"><h3 id="clubs-recreation">Recreation</h3><ul class="club-list"><li>Golf Club</li><li>Ski & Snowboard Club</li><li>Trojan Poker Club</li></ul></section>
   </div></div>
  </section>
  <div class="outside"><span class="minor-label">Countries Explored</span><p class="travel">China · South Korea · Japan · Spain · Portugal · United Kingdom</p></div>
 </div>
 <div class="experience-column">
  <section class="metrics" aria-label="Experience in Numbers"><div><strong data-count="20" data-prefix="$" data-suffix="M+" aria-label="$20 million plus">$20M+</strong><span>Target Deal Size</span></div><div><strong data-count="5000" data-suffix="+" aria-label="5,000 plus">5,000+</strong><span>Companies Researched</span></div><div><strong data-count="8" aria-label="8">8</strong><span>Industry Markets Researched</span></div></section>
  <section class="experience" aria-labelledby="experience-title"><div class="section-label experience-label"><h2 id="experience-title">Experience</h2><a class="resume-link" href="Resume_RowanJevan.pdf" download="Resume_RowanJevan.pdf">Download Resume</a></div>
  ${roles.map(r=>`<article class="experience-row"><div class="company-line"><h3>${companyBrand(r)}</h3><span class="dates"><span>${r.city}</span><span>${r.dates}</span></span></div><p class="company-background">${r.background.split(' · ').map(part=>`<span class="company-description-part">${part}</span>`).join('<span class="company-description-separator"> · </span>')}</p><h4>${r.title}</h4><div class="focus-tags">${r.focus.map(f=>`<span>${f}</span>`).join('')}</div><ul>${r.achievements.map(a=>`<li><strong>${a.lead}</strong> ${a.detail}</li>`).join('')}</ul></article>`).join('')}
  </section>
 </div>
</div>`;}
function projectPage(){return `<div class="projects-page page-enter"><div class="page-heading"><h1>Projects</h1></div><div class="project-columns">
 <article class="research-project" aria-labelledby="research-title">${ResearchStudy.markup()}</article>
 <article class="simulation-project" aria-labelledby="simulation-title"><header class="project-head"><div class="section-label">Interactive Model</div><h2 id="simulation-title">Stock Price Simulation</h2><p class="project-question">100 possible paths. How did reality compare?</p></header>${StockSim.markup()}</article>
 </div><section class="shared-toolkit" aria-labelledby="toolkit-title"><h2 id="toolkit-title">Technical Toolkit</h2><dl class="toolkit-groups"><div><dt>Data Preparation</dt><dd>Python · NumPy · pandas · yfinance</dd></div><div><dt>Statistical Analysis</dt><dd>Microsoft Excel · statsmodels</dd></div><div><dt>Data Visualization</dt><dd>Matplotlib · Plotly · SVG</dd></div><div><dt>Web Development</dt><dd>HTML · CSS · JavaScript · TypeScript · React · Tailwind CSS · Vite</dd></div></dl></section></div>`;}
const icons={email:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7"/></svg>',linkedin:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95ZM6.46 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.29 10.85H15.8V14.1c0-1.1-.02-2.52-1.54-2.52-1.54 0-1.78 1.2-1.78 2.44v4.73H9.53V9.2h2.83v1.3h.04c.4-.76 1.36-1.56 2.8-1.56 3 0 3.55 1.97 3.55 4.53Z"/></svg>',github:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .8a11.3 11.3 0 0 0-3.57 22.02c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.26-1.65-1.26-1.65-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.02 1.74 2.66 1.24 3.31.95.1-.74.4-1.25.72-1.54-2.5-.28-5.14-1.26-5.14-5.58 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.99 0 0 .95-.3 3.1 1.16a10.8 10.8 0 0 1 5.64 0c2.15-1.46 3.1-1.16 3.1-1.16.61 1.56.23 2.71.11 2.99.72.79 1.16 1.8 1.16 3.03 0 4.33-2.64 5.3-5.15 5.57.4.35.76 1.04.76 2.1v3.1c0 .3.2.65.78.54A11.3 11.3 0 0 0 12 .8Z"/></svg>'};
function contact(){const c=[['Email','email','rowanjevan@gmail.com','mailto:rowanjevan@gmail.com'],['LinkedIn','linkedin','in/rowanjevan','https://www.linkedin.com/in/rowanjevan'],['GitHub','github','rowanjevan','https://github.com/rowanjevan']];return `<div class="contact-page page-enter"><section class="contact-column"><div class="section-label">Say Hello</div><h1>Contact</h1><div class="contact-links">${c.map(([label,icon,text,url])=>`<a href="${url}"${icon!=='email'?' target="_blank" rel="noopener"':''} class="contact-link"><span class="contact-icon" aria-hidden="true">${icons[icon]}</span><span class="contact-copy"><span>${label}</span><strong>${text}</strong></span></a>`).join('')}</div></section><section class="connect-column"><div class="section-label">Start a Conversation</div><h2>Connect</h2><form class="connect-form" action="https://formsubmit.co/rowanjevan@gmail.com" method="POST"><input type="hidden" name="_subject" value="New connection from Rowan Jevan’s portfolio"><input type="hidden" name="_template" value="table"><input class="honeypot" name="_honey" type="text" tabindex="-1" autocomplete="off" aria-hidden="true"><label class="name-field">Name<input name="name" autocomplete="name" maxlength="100"></label><label>Email<input type="email" name="email" autocomplete="email" maxlength="254"></label><label>Mobile<input type="tel" name="phone" autocomplete="tel" inputmode="tel" maxlength="30"></label><label class="school-field">School / Company<input name="school_or_company" autocomplete="organization" maxlength="150"></label><label class="message-field" for="contact-message"><span class="message-heading" id="contact-message-label">Message</span><span class="message-box"><textarea id="contact-message" name="message" rows="5" maxlength="300" aria-labelledby="contact-message-label" aria-describedby="message-limit"></textarea><span id="message-limit"><span id="message-count">0</span> / 300</span></span></label><div class="form-footer"><button class="connect-button" type="submit">Connect</button></div></form></section></div>`;}
let countFrame=0,journeyObserver;
let aboutHasLoaded=false;
function animateJourney(){
 if(aboutHasLoaded){
  document.querySelector('.about-page')?.classList.remove('page-enter');
  return;
 }
 aboutHasLoaded=true;
 const list=document.querySelector('.journey-list');
 const education=document.querySelector('.education');
 const metrics=document.querySelector('.metrics');
 const experience=document.querySelector('.experience');
 if(!list||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(!('IntersectionObserver' in window)){animateCounts();return;}
 const sections=[list,education,metrics,experience].filter(Boolean);
 sections.forEach(section=>section.classList.add('is-waiting'));
 metrics?.addEventListener('animationstart',animateCounts,{once:true});
 journeyObserver=new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting)){
   sections.forEach(section=>{section.classList.remove('is-waiting');section.classList.add('is-revealing');});
   journeyObserver.disconnect();
  }
 },{threshold:.1});
 journeyObserver.observe(list.firstElementChild);
}
function animateCounts(){cancelAnimationFrame(countFrame);const nodes=[...document.querySelectorAll('[data-count]')];if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const start=performance.now();const tick=now=>{const progress=Math.max(0,Math.min(1,(now-start)/850)),ease=1-(1-progress)**3;for(const node of nodes){if(!node.isConnected)return;const n=Math.round(Number(node.dataset.count)*ease);node.textContent=(node.dataset.prefix||'')+n.toLocaleString('en-US')+(node.dataset.suffix||'');}if(progress<1)countFrame=requestAnimationFrame(tick);};countFrame=requestAnimationFrame(tick);}
function render(){journeyObserver?.disconnect();cancelAnimationFrame(countFrame);StockSim.dispose();ResearchStudy.dispose();const route=PortfolioNavigation.read();document.getElementById('main').innerHTML=({about,projects:projectPage,contact}[route])();document.body.dataset.page=route;document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.title='Rowan Jevan | USC';window.scrollTo(0,0);if(route==='projects'){StockSim.mount();ResearchStudy.mount();}if(route==='about')animateJourney();if(route==='contact'){const message=document.getElementById('contact-message');message.addEventListener('input',()=>{if(message.value.length>message.maxLength)message.value=message.value.slice(0,message.maxLength);document.getElementById('message-count').textContent=message.value.length.toLocaleString('en-US');});}}
// Switch tabs without a reload, preserving the first-visit animation state.
document.querySelectorAll('[data-nav]').forEach(link=>{
 link.href=PortfolioNavigation.href(link.dataset.nav);
 link.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  const target=PortfolioNavigation.href(link.dataset.nav);
  if(location.pathname+location.search===target&&!location.hash)return;
  history.pushState(null,'',target);
  render();
 });
});
document.querySelector('.skip').addEventListener('click',event=>{
 event.preventDefault();
 document.getElementById('main').focus();
});
window.addEventListener('popstate',render);
window.addEventListener('hashchange',()=>{PortfolioNavigation.normalize();render();});
render();
