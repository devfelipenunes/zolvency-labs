import * as THREE from 'three';
const params=new URLSearchParams(location.search),mode=params.get('mode')??'html',ratio=Number(params.get('ratio')??1),size=Number(params.get('size')??20),lines=['Engineering the future of finance.','Payments, tokenized assets and authorization.'];
const label=document.querySelector('#label');label.textContent=mode.toUpperCase()+' / '+size+' CSS px / render scale '+ratio;
if(mode==='html'){
 const host=document.querySelector('#native');host.style.fontSize=size+'px';host.style.lineHeight='1.6';for(const text of lines){const row=document.createElement('div');row.textContent=text;host.append(row);}await document.fonts.ready;window.audit={mode,size,ratio,dom:true,drawCalls:0};document.body.dataset.ready='true';
}else{
 if(!['sdf','msdf'].includes(mode))throw Error('invalid type');
 const started=performance.now(),base='/models/type-audition/';
 const font=await (await fetch(base+mode+'.json')).json(),atlas=await new THREE.TextureLoader().loadAsync(base+mode+'.png');
 atlas.flipY=false;atlas.colorSpace=THREE.NoColorSpace;atlas.generateMipmaps=false;atlas.minFilter=THREE.LinearFilter;atlas.magFilter=THREE.LinearFilter;
 const glyphs=new Map(font.chars.map(c=>[c.id,c])),kern=new Map((font.kernings??[]).map(k=>[k.first+':'+k.second,k.amount]));
 const scale=size/Math.abs(font.info.size),positions=[],uv=[],indices=[];
 for(let line=0;line<lines.length;line++){
  let x=24,last=null;for(const char of lines[line]){const c=glyphs.get(char.codePointAt(0));if(!c)throw Error('missing '+char);if(last!==null)x+=(kern.get(last+':'+c.id)??0)*scale;
   const left=x+c.xoffset*scale,top=64+line*size*1.6+c.yoffset*scale,right=left+c.width*scale,bottom=top+c.height*scale,i=positions.length/3;
   const u0=c.x/font.common.scaleW,u1=(c.x+c.width)/font.common.scaleW,v0=c.y/font.common.scaleH,v1=(c.y+c.height)/font.common.scaleH;
   if(c.width&&c.height){positions.push(left,-top,0,right,-top,0,right,-bottom,0,left,-bottom,0);uv.push(u0,v0,u1,v0,u1,v1,u0,v1);indices.push(i,i+2,i+1,i,i+3,i+2);}
   x+=c.xadvance*scale;last=c.id;
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
 const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,uniforms:{atlas:{value:atlas},multi:{value:mode==='msdf'},ink:{value:new THREE.Color(0xe2f0e9)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D atlas;uniform bool multi;uniform vec3 ink;varying vec2 vUv;float med(vec3 c){return max(min(c.r,c.g),min(max(c.r,c.g),c.b));}void main(){vec3 s=texture2D(atlas,vUv).rgb;float d=(multi?med(s):s.r)-.5;float a=smoothstep(-max(.001,fwidth(d))*.5,max(.001,fwidth(d))*.5,d);gl_FragColor=vec4(ink,a);\n#include <colorspace_fragment>\n}'});
 const renderer=new THREE.WebGLRenderer({alpha:false,antialias:false});renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x111c23);scene.add(new THREE.Mesh(geometry,material));const camera=new THREE.OrthographicCamera(0,innerWidth,0,-innerHeight,.1,10);camera.position.z=1;renderer.render(scene,camera);
 window.audit={mode,size,ratio,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,atlas:[font.common.scaleW,font.common.scaleH],setupMs:performance.now()-started};document.body.dataset.ready='true';
}
