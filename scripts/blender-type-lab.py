"""R62 isolated typography research. Real Blender meshes/renders; no production changes."""
import bpy,sys,json,math,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view
args=sys.argv[sys.argv.index('--')+1:];mode=args[0];out=Path(args[1]);out.mkdir(parents=True,exist_ok=True)
spec=json.loads(Path('docs/text-motion-bible.v1.json').read_text())
tracks=json.loads(Path('artifacts/type-tracks.json').read_text())['scenes'] if Path('artifacts/type-tracks.json').exists() else {}
def B(v):return Vector((v[0],-v[2],v[1]))
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=12;s.cycles.use_denoising=False;s.render.resolution_x=390;s.render.resolution_y=844;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.fps=30;s.frame_start=1;s.frame_end=121
    s.world=bpy.data.worlds.new('Ambient');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.13,.18,.20,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.5
    return s
def mat(name,color,metal,rough):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
def camera(s,pos,direction,fov):
    c=bpy.data.objects.new('Matched camera',bpy.data.cameras.new('Lens'));s.collection.objects.link(c);s.camera=c;c.data.sensor_fit='VERTICAL';c.data.sensor_height=32;c.data.lens=16/math.tan(math.radians(fov)/2);c.data.clip_start=.075;c.data.clip_end=65;c.location=pos;c.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();return c
def light(s,n,pos,target,power,color,size):
    d=bpy.data.lights.new(n,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size;o=bpy.data.objects.new(n,d);s.collection.objects.link(o);o.location=pos;o.rotation_euler=(target-pos).to_track_quat('-Z','Y').to_euler()
def setup_lights(s,c,anchor):
    r=c.rotation_euler.to_matrix()@Vector((1,0,0));u=c.rotation_euler.to_matrix()@Vector((0,1,0));d=max(.5,(anchor-c.location).length)
    light(s,'Key',c.location+r*d*.5+u*d*.4,anchor,90*d*d,(.88,.96,1),max(.35,d*.65));light(s,'Rim',anchor-r*d*.7+u*d*.25,anchor,35*d*d,(.38,.85,.68),max(.2,d*.35))
def text_obj(s,name,body,font,size,depth,bevel,material):
    cv=bpy.data.curves.new(name,'FONT');cv.body=body;cv.font=font;cv.size=size;cv.align_x='LEFT';cv.align_y='TOP_BASELINE';cv.resolution_u=4;cv.extrude=depth*size/2;cv.bevel_depth=bevel*size;cv.bevel_resolution=1;cv.materials.append(material)
    o=bpy.data.objects.new(name,cv);s.collection.objects.link(o);bpy.context.view_layer.update();return o
def mesh_stats(o):
    e=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=e.to_mesh();m.calc_loop_triangles();r={'vertices':len(m.vertices),'triangles':len(m.loop_triangles)};e.to_mesh_clear();return r
def bounds(o):
    v=[Vector(x) for x in o.bound_box];return tuple(min(x[k] for x in v) for k in range(3)),tuple(max(x[k] for x in v) for k in range(3))
def render(s,path):
    s.render.filepath=str(path);bpy.ops.render.render(write_still=True)
def report(name,rows): (out/name).write_text(json.dumps(rows,indent=2))
def font(name,weight):return bpy.data.fonts.load(str(Path('artifacts/type-fonts')/(name+'-'+str(weight)+'.ttf')))
styles={'titanium':((.62,.68,.69),.72,.42),'mineral':((.82,.87,.85),.05,.48),'green':((.16,.55,.38),.48,.4)}
def style_lab():
    rows=[]
    for name in ['SpaceGrotesk','Manrope','Inter']:
      for depth,bevel in [(.06,.005),(.08,.01),(.10,.015)]:
       for material,(col,metal,rough) in styles.items():
        s=reset();c=camera(s,Vector((0,0,4)),Vector((0,0,-1)),42);m=mat(material,col,metal,rough);o=text_obj(s,'Title','Trust by design.',font(name,600),1,depth,bevel,m)
        lo,hi=bounds(o);w=hi[0]-lo[0];scale=(2*4*math.tan(math.radians(42)/2)*(390/844)*.82)/max(w,.001);o.scale=(scale,)*3;o.location=Vector((-(lo[0]+hi[0])*scale/2,-(lo[1]+hi[1])*scale/2,0));setup_lights(s,c,Vector((0,0,0)));bpy.context.view_layer.update();tag=f'{name}-{depth}-{bevel}-{material}';r={'font':name,'extrusion':depth,'bevel':bevel,'material':material,**mesh_stats(o),'bounds':list(o.dimensions)};rows.append(r);report('styles.json',rows);render(s,out/(tag+'.png'))
    assert len(rows)==27
def motion_lab():
    rows=[]
    for restitution in [.0,.15,.35]:
      for damping in [.15,.5,.8]:
        s=reset();s.frame_end=90
        def cube(name,xyz,scale,active=True):
            bpy.ops.mesh.primitive_cube_add(size=1,location=xyz);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);bpy.ops.rigidbody.object_add();r=o.rigid_body;r.type='ACTIVE' if active else 'PASSIVE';r.collision_shape='BOX';r.friction=.45;r.restitution=restitution;r.linear_damping=damping;r.angular_damping=damping;return o
        ground=cube('floor',(0,0,-.16),(12,5,.3),False);ground.rigid_body.restitution=restitution
        pusher=cube('animated pusher',(-2,0,.34),(.5,1,.7));pusher.rigid_body.kinematic=True;pusher.keyframe_insert(data_path='location',frame=1);pusher.location.x=1.1;pusher.keyframe_insert(data_path='location',frame=30);pusher.location.x=-2;pusher.keyframe_insert(data_path='location',frame=45)
        blocks=[cube('glyph proxy '+str(i),(-.6+i*.68,0,.34),(.58,.6,.65)) for i in range(3)]
        s.rigidbody_world.substeps_per_frame=10;s.rigidbody_world.solver_iterations=30;s.rigidbody_world.point_cache.frame_end=90
        samples=[]
        for f in range(1,91):
            s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get();samples.append({'frame':f,'positions':[list(o.evaluated_get(dg).matrix_world.translation) for o in blocks]})
        displacement=samples[-1]['positions'][-1][0]-samples[0]['positions'][-1][0];tail=max((Vector(a)-Vector(b)).length for a,b in zip(samples[-1]['positions'],samples[-6]['positions']))
        rows.append({'restitution':restitution,'damping':damping,'lastBlockDisplacement':displacement,'tailMotionOver5Frames':tail,'samples':samples});report('physics.json',rows)
    assert len(rows)==9 and all(math.isfinite(r['tailMotionOver5Frames']) for r in rows)
def load_geometry(s,d):
    allv=[];allf=[];cache={}
    for row in d['meshes']:
      verts=[B(row['positions'][j:j+3]) for j in range(0,len(row['positions']),3)];faces=[];mi=[];idx=row['indices']
      groups=row['groups'] if len(row['materials'])>1 else [{'start':0,'count':len(idx),'materialIndex':0}]
      for g in groups:
        m=row['materials'][g['materialIndex']]
        if m['transmission']>.2 or m['opacity']<.4:continue
        for j in range(g['start'],min(len(idx),g['start']+g['count'])-2,3):
          tri=tuple(idx[j:j+3])
          if len(set(tri))==3:faces.append(tri);mi.append(g['materialIndex'])
      if not faces:continue
      mesh=bpy.data.meshes.new(row['name']);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(row['name'],mesh);s.collection.objects.link(o)
      for m in row['materials']:
        k=json.dumps(m,sort_keys=True)
        if k not in cache:cache[k]=mat(m['name'] or 'facility',tuple(min(1,max(0,x)) for x in m['color']),max(0,min(1,m['metalness'])),max(.1,min(1,m['roughness'])))
        mesh.materials.append(cache[k])
      for p,i in zip(mesh.polygons,mi):p.material_index=i
      start=len(allv);allv.extend(verts);allf.extend(tuple(start+j for j in f) for f in faces)
    assert allf
    return BVHTree.FromPolygons(allv,allf,all_triangles=True)
def convert(o):
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');return bpy.context.object
def scene_lab(id):
    d=json.loads((Path('artifacts/type-scene-input')/(id+'.json')).read_text());act=next(x for x in spec['scenes'] if x['id']==id);s=reset();bvh=load_geometry(s,d);cd=d['camera'];C=B(cd['position']);F=B(cd['direction']).normalized();c=camera(s,C,F,cd['fov']);bpy.context.view_layer.update();R=c.rotation_euler.to_matrix()@Vector((1,0,0));U=c.rotation_euler.to_matrix()@Vector((0,1,0));N=-F
    root=bpy.data.objects.new('TYPE_ROOT_'+id,None);s.collection.objects.link(root);root.rotation_euler=Matrix((R,U,N)).transposed().to_euler()
    font_title=font('SpaceGrotesk',600);font_body=font('SpaceGrotesk',400);m=mat('Mineral white',(.82,.87,.85),.05,.48);bm=mat('Muted white',(.66,.76,.72),.05,.55)
    objs=[];y=0
    # Wrap by measured glyph widths, preserve word group animation and line spacing.
    for role,words,size,ft,ma in [('title',act['title'].split(),1,font_title,m),('body',act['body'].split(),.58,font_body,bm)]:
      x=0;line=[]
      for word in words:
        o=text_obj(s,role+'-'+word,word,ft,size,.08,.01,ma);lo,hi=bounds(o);w=hi[0]-lo[0]
        if x+w>8.2 and line:x=0;y-=size*1.2;line=[]
        o=convert(o);o.parent=root;o.location=Vector((x-lo[0],y,0));objs.append((role,o));line.append(o);x+=w+size*.24
      y-=size*1.6
    # All body words share one transform; merge without changing their visible geometry.
    bpy.context.view_layer.update()
    local=[o.location+Vector(v) for _,o in objs for v in o.bound_box];lo=Vector(tuple(min(v[k] for v in local) for k in range(3)));hi=Vector(tuple(max(v[k] for v in local) for k in range(3)));center=(lo+hi)/2
    for _,o in objs:o.location-=center
    raw_counts=[mesh_stats(o) for _,o in objs];raw_mesh_count=len(objs)
    title=[o for role,o in objs if role=='title'];body=[o for role,o in objs if role=='body']
    if len(body)>1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in body:o.select_set(True)
        bpy.context.view_layer.objects.active=body[0];bpy.ops.object.join();merged=bpy.context.object;merged.name='body-merged'
        body=[merged];objs=[('title',o) for o in title]+[('body',merged)]
    bpy.context.view_layer.update()
    rest={o.name:o.location.copy() for _,o in objs}
    # Seven candidate depths, fixed world location after choosing, no camera parenting.
    candidates=[];fov=math.radians(cd['fov']);aspect=cd['aspect'];tan=math.tan(fov/2)
    def measure():
        bpy.context.view_layer.update();count=inside=visible=0;xs=[];ys=[];heights={'title':[],'body':[]}
        for role,o in objs:
            points=[o.matrix_world@Vector(v) for v in o.bound_box];ndcs=[world_to_camera_view(s,c,q) for q in points];heights[role].append((max(q.y for q in ndcs)-min(q.y for q in ndcs))*s.render.resolution_y)
            for q,ndc in zip(points,ndcs):
                count+=1;xs.append(ndc.x);ys.append(ndc.y)
                if ndc.z>0 and .06<=ndc.x<=.94 and .06<=ndc.y<=.94:
                    inside+=1;dv=q-c.location;hit=bvh.ray_cast(c.location,dv.normalized(),max(.001,dv.length-.012))
                    if hit[0] is None:visible+=1
        return {'inside':inside/max(1,count),'visibleCornerProxy':visible/max(1,count),'screenBounds':[min(xs),min(ys),max(xs),max(ys)],'minTitlePx':min(heights['title']),'minBodyPx':min(heights['body'])}
    for depth in [.48,.72,1,1.5,2.2,3.2,4.5]:
      halfH=depth*tan;halfW=halfH*aspect;scale=min(2*halfW*.82/(hi.x-lo.x),2*halfH*.30/(hi.y-lo.y))
      root.scale=(scale,)*3;root.location=C+F*depth+U*(-.48*halfH);metric=measure();candidates.append({'depth':depth,'scale':scale,'location':list(root.location),**metric})
    best=max(candidates,key=lambda r:(r['visibleCornerProxy'],r['inside'],r['minBodyPx'],r['depth']))
    root.location=best['location'];root.scale=(best['scale'],)*3;setup_lights(s,c,root.location);rows=[]
    # Word groups only; body moves as a single offset shared across its words.
    def phase_at(p):
      a,b=act['enter'];ex=act['exit']
      if p<b:return min(1,max(0,(p-a)/max(1e-8,b-a)))
      if ex and p>ex[0]:return min(1,max(0,(ex[1]-p)/max(1e-8,ex[1]-ex[0])))
      return 1
    start,end=act['range'];frames=241;s.frame_end=frames
    for f in range(1,frames+1):
      progress=start+(end-start)*(f-1)/(frames-1)
      for group in [title,body]:
        n=len(group) if group is title else 1
        assert n<=12
        for i,o in enumerate(group):
          j=i if group is title else 0;u=phase_at(progress)
          samples=tracks[id][str(n)][j];k=min(59,int(u*60));q=u*60-k;v=[samples[k][a]*(1-q)+samples[k+1][a]*q for a in range(4)]
          o.location=rest[o.name]+Vector(v[:3]);o.rotation_euler.z=v[3];o.keyframe_insert(data_path='location',frame=f);o.keyframe_insert(data_path='rotation_euler',frame=f)
    # Actual R60 sampled camera poses, hold geometry is static (not dynamic collision proof).
    for sample in d['samples']:
      p=sample['p'];a,b=act['range'];phase=max(0,min(1,(p-a)/(b-a)))
      f=1+round(phase*(frames-1));s.frame_set(f);pose=sample['pose'];c.location=B(pose['position']);c.rotation_euler=(B(pose['target'])-c.location).to_track_quat('-Z','Y').to_euler();c.data.lens=16/math.tan(math.radians(pose['fov'])/2);metric=measure();rows.append({'p':p,'frame':f,'mask':sample['mask'],**metric});render(s,out/(id+'-'+str(p)+'.png'))
    hold_frame=1+round((act['hold']-start)/(end-start)*(frames-1));s.frame_set(hold_frame);c.location=C;c.rotation_euler=F.to_track_quat('-Z','Y').to_euler();c.data.lens=16/math.tan(fov/2);bpy.context.view_layer.update()
    counts=[mesh_stats(o) for _,o in objs];bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
    for _,o in objs:o.select_set(True)
    glb=out/(id+'.glb');bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_animations=True,export_force_sampling=True)
    # Keep editable text source as copy metadata plus baked mesh/animation project. No font binaries exported as files.
    bpy.ops.wm.save_as_mainfile(filepath=str(out/(id+'.blend')))
    raw=glb.read_bytes();assert raw[:4]==b'glTF';length=int.from_bytes(raw[12:16],'little');gltf=json.loads(raw[20:20+length]);assert gltf.get('animations') and gltf.get('meshes')
    report(id+'.json',{'scene':id,'candidatePlacements':candidates,'chosen':best,'samples':rows,'trianglesBeforeMerge':sum(x['triangles'] for x in raw_counts),'meshesBeforeMerge':raw_mesh_count,'triangles':sum(x['triangles'] for x in counts),'wordMeshes':len(objs),'clipFrames':frames,'clipProgressRange':act['range'],'glbBytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'animations':len(gltf['animations']),'limitations':'Fixed world plane, not wall-mounted. Static hold geometry, omitted transparent materials and instancing, simplified lighting; sampled corner visibility only. No runtime integration or phone measurement.'})
if mode=='styles':style_lab()
elif mode=='physics':motion_lab()
elif mode=='scene':scene_lab(args[2])
else:raise ValueError(mode)
