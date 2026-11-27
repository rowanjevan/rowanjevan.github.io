'use strict';

// Keep asset URLs stable when the address changes to the clean landing path.
// The script location also supports GitHub Pages repository subdirectories.
(() => {
 const assets = new URL('.', document.currentScript.src);
 const base = document.createElement('base');
 base.href = assets.href;
 document.head.prepend(base);

 const directory = assets.pathname.replace(/\/$/, '');
 const landing = directory.endsWith('/PersonalSite')
  ? directory
  : directory + '/PersonalSite';
 const sections = ['about', 'projects', 'contact'];
 function selectedSection() {
  const path = location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
  const hash = location.hash.slice(1);
  // Previously shared fragment links continue to open the intended tab.
  if (sections.includes(hash)) return hash;
  if (hash.startsWith('project/')) return 'projects';
  return sections.find(section =>
   path === landing + '/' + section || path === directory + '/' + section
  ) || null;
 }
 function normalize() {
  const section = selectedSection();
  const hash = location.hash.slice(1);
  const anchor = sections.includes(hash) || hash.startsWith('project/') ? '' : location.hash;
  history.replaceState(history.state, '', landing + (section ? '/' + section : '') + location.search + anchor);
 }
 window.PortfolioNavigation = {
  read: () => selectedSection() || 'about',
  href: section => landing + '/' + section + location.search,
  normalize,
 };
 // The initial About page stays at /PersonalSite until a tab is clicked.
 normalize();
})();
