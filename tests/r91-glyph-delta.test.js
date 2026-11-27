import test from 'node:test';
import assert from 'node:assert/strict';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {Quaternion} from 'three';
import {createGlyphRig} from '../src/graphics/glyphRig.js';
const font=new FontLoader().parse({familyName:'Synthetic',resolution:1000,boundingBox:{yMin:0,yMax:700},underlineThickness:0,glyphs:{A:{ha:600,x_min:0,x_max:500,o:'m 0 0 l 500 0 l 500 700 l 0 700 l 0 0'}}});
const create=deltaUpdates=>createGlyphRig({font,lines:['AAA'],size:.2,x:0,y:0,step:.24,depth:.1,bevel:0,color:0xffffff,role:'headline',finish:'mineral',ribbon:true,cinematic:true,presence:true,deltaUpdates});
test('R91 CPU delta path is byte-equivalent to full updates; identical holds avoid buffer uploads',()=>{
 const a=create(false),b=create(true),ra=a.userData.glyphRig,rb=b.userData.glyphRig,hold={index:0,kind:'hold',u:1};
 const run=(phase,w,h,seconds,handoff=null)=>{ra.update(0,phase,w,h,seconds,handoff);rb.update(0,phase,w,h,seconds,handoff);for(const k of ['position','normal'])assert.deepEqual(a.geometry.attributes[k].array,b.geometry.attributes[k].array);assert.deepEqual(ra.diagnostics(),rb.diagnostics());assert.deepEqual(ra.conservativeBounds(),rb.conservativeBounds());};
 run(hold,.5,.5,null);run(hold,.5,.5,.055);const before=b.geometry.attributes.position.version;run(hold,.6,.5,.055);assert.equal(b.geometry.attributes.position.version,before);assert.ok(rb.work().skipped>=3);
 const enter={index:0,kind:'enter',u:.4,direction:1,localFromCamera:new Quaternion()};run(hold,.5,.5,.02,enter);run(hold,.5,.5,.02,{...enter,localFromCamera:new Quaternion().setFromAxisAngle({x:0,y:1,z:0},.2)});run(hold,.5,.5,null);
 a.geometry.dispose();b.geometry.dispose();a.material.dispose();b.material.dispose();
});
