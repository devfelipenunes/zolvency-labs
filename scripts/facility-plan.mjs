// Diagnostic floor plan from decoded, transformed mesh AABBs and sampled camera positions.
export function facilityPlan(bounds,route){
 const width=760,height=820,s=21,x=v=>width/2+v*s,y=v=>height/2+v*s;
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const rects=bounds.filter(b=>[...b.min,...b.max].every(Number.isFinite)).map(b=>'<rect x="'+x(b.min[0])+'" y="'+y(b.min[2])+'" width="'+Math.max(2,(b.max[0]-b.min[0])*s)+'" height="'+Math.max(2,(b.max[2]-b.min[2])*s)+'" fill="'+(b.id==='hangar'?'none':'#39514b55')+'" stroke="#91b5ac"/><text x="'+x(b.min[0]+.12)+'" y="'+(y(b.min[2])+13)+'" fill="#e7f2e9" font-size="12">'+esc(b.id)+'</text>').join('');
 const points=route.map(r=>x(r.position[0])+','+y(r.position[2])).join(' ');
 const close=route.filter(r=>r.distance<.18).map(r=>'<circle cx="'+x(r.position[0])+'" cy="'+y(r.position[2])+'" r="3" fill="#f7aa76"/>').join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="#101b20"/><g font-family="monospace"><text x="24" y="32" font-size="20" fill="#f0f5ef">ZOLVENCY FACILITY / ROUTE QA</text><text x="24" y="56" font-size="12" fill="#a9c9bd">Decoded mesh AABBs · X/Z top view · orange: &lt;0.18m surface distance</text>'+rects+'<polyline points="'+points+'" fill="none" stroke="#75e5ae" stroke-width="2.5"/>'+close+'<text x="24" y="795" font-size="12" fill="#a9c9bd">Sampling, not a continuous swept-volume proof. 1m = 21px.</text></g></svg>';
}
