import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createMechanicalAudit} from '../src/graphics/mechanicalAudit.js';
test('mechanical audit uses actual triangles and world transforms without mutating originals',()=>{
 const root=new THREE.Group(),moving=new THREE.Group(),g=new THREE.BoxGeometry(2,2,2),m=new THREE.Mesh(g),n=new THREE.Mesh(g);
 m.name='crane';n.name='structure';moving.add(m);root.add(moving,n);root.position.set(8,2,1);
 const index=Array.from(g.index.array),audit=createMechanicalAudit();
 n.position.x=3;assert.equal(audit.inspect(root,moving).hits.length,0);
 n.position.x=1;assert.deepEqual(audit.inspect(root,moving).hits,[{moving:'crane',other:'structure'}]);
 n.position.x=3;assert.equal(audit.inspect(root,moving).hits.length,0);assert.deepEqual(Array.from(g.index.array),index);
 audit.dispose();g.dispose();
});
