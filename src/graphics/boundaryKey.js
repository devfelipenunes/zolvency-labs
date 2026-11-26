// Match native Home/End semantics only when the document owns keyboard focus.
// Never capture text inputs, sliders, links/buttons, or the loading dialog.
export function boundaryKey(e,active,locked=false){
 if(locked||e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['Home','End'].includes(e.key))return null;
 if(active?.closest?.('input,textarea,select,button,a[href],[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="textbox"]'))return null;
 return e.key==='Home'?0:1;
}
