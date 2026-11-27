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
 // No default #about fragment. Existing shared tab links keep their fragment.
 history.replaceState(history.state, '', landing + location.search + location.hash);
})();
