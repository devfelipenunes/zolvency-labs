// Only externally sourced meshes are placed in the active scene. Dimensions in meters.
// Room shells remain intact except where a documented opening joins the corridor.
export const facility=[
 {id:'hangar',file:'hangar.glb',position:[0,0,0],scale:1},
 {id:'servers',file:'server-room.glb',position:[5.5,0,5.0],scale:1.12},
 {id:'corridor',file:'straight.glb',position:[-5.5,0,2.45],scale:1},
 {id:'portal',file:'corridor-door.glb',position:[-5.5,0,-1.55],scale:1},
 {id:'bridge',file:'bridge.glb',position:[-5.5,0,-6.43],scale:.72,openFront:true},
 {id:'projector',file:'hologram-projector.glb',position:[-2.25,.1,-6.7],size:1.7,hideHologram:true},
 {id:'pcb',file:'pcb/circuit_board.gltf',position:[-5.4,.13,9.0],size:4.4},
 {id:'gpu',file:'graphics-card.glb',position:[-5.6,.8,-6.9],size:1.35},
 {id:'quantum',file:'quantum-computer.glb',position:[4.7,.12,-8.6],size:5.8}
];
