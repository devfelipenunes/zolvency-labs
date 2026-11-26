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
export const expectedAssets=facility.length;
