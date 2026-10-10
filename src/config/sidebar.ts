export const sidebarStorageKey = "campusone-sidebar";
export const sidebarEvent = "campusone:sidebar";
// Trusted constant code; apply width before paint without putting request data in script.
export const sidebarInitScript = `(function(){var p='expanded';try{if(localStorage.getItem('${sidebarStorageKey}')==='compact')p='compact';}catch(e){}document.documentElement.dataset.sidebar=p;})();`;
