import {interiorLayout} from './extendedInteriors.js';
import refined from '../../assets/refinement-lock.json' with {type:'json'};
const approved=new Set(refined.map(r=>r.file));
const low=(file)=>approved.has(file)?file:undefined;
// All renderable geometry comes from external CC0 models; no substitute boxes, spheres or floor props.
export const facility=[
 {id:'hangar',file:'hangar.glb',lowFile:low('hangar-low.glb'),position:[0,0,0],scale:1,priority:0},
 {id:'servers',file:'server-room.glb',lowFile:low('server-room-low.glb'),position:[5.5,0,5.0],scale:1.12,priority:1},
 {id:'corridor',file:'straight.glb',lowFile:low('straight-low.glb'),position:[-5.5,0,2.45],scale:1,priority:2},
 {id:'portal',file:'corridor-door.glb',lowFile:low('corridor-door-low.glb'),position:[-5.5,0,-1.55],scale:1,priority:2},
 {id:'bridge',file:'bridge.glb',lowFile:low('bridge-low.glb'),position:[-5.5,0,-6.43],scale:.72,openFront:true,priority:3},
 {id:'quantum',file:'quantum-computer.glb',position:[4.7,.12,-8.6],size:5.8,priority:4},
 ... (approved.has('button-panel.glb')?[{id:'access-panel',file:'button-panel.glb',position:[-4.0,1.13,-1.2],size:.61,priority:2}]:[]),
 ... (approved.has('cable.glb')?[{id:'cable',file:'cable.glb',position:[5.5,3.15,7.3],size:1.88,priority:1}]:[])
];
export const facilityHDRI=approved.has('hangar.hdr')?'hangar.hdr':null;

const external=(id,position,extra={})=>({id,file:id+'-lod1.glb',lowFile:id+'-lod2.glb',position,scale:1,priority:4,...extra});
// The cleanroom's front/back doors lie on the actual central aisle, not next to the cryostat.
export function spatialFacility(mode){
 if(mode==='baseline')return facility;
 const base=[...facility.filter(s=>s.id!=='cable'),external('rooftop-cable-tray',[5.5,0,5],{mount:'server-roof',priority:1})];
 const connected=base.map(s=>s.id==='bridge'?{...s,openFront:false,aperture:{left:-6.9,right:-4.1,bottom:-.2,top:2.65}}:s);
 if(mode==='connected')return connected;
 if(mode==='production')return [...connected.map(s=>s.id==='bridge'?{...s,position:interiorLayout.roomCenter,scaleXYZ:interiorLayout.roomScale,aperture:interiorLayout.aperture}:s),{...base.find(s=>s.id==='corridor'),id:'corridor-extension',position:interiorLayout.corridorCenter,priority:2},external('cleanroom-airlock',[0,0,-2.20],{priority:3}),external('lab-drawer-bench',[7.7,0,-9.4],{priority:5})];
 if(mode==='lab')return [...base,external('cleanroom-airlock',[0,0,-2.20],{priority:3}),external('lab-drawer-bench',[7.7,0,-9.4],{priority:5})];
 return base;
}

export const expectedAssets=spatialFacility('production').length;
